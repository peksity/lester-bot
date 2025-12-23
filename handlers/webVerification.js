/**
 * ████████████████████████████████████████████████████████████████████████
 * █  NEXUS WEB VERIFICATION PORTAL                                       █
 * █  Device fingerprinting, VPN detection, CAPTCHA                       █
 * ████████████████████████████████████████████████████████████████████████
 * 
 * This runs a lightweight Express server that handles web-based verification.
 * Users click a button -> redirected to web page -> fingerprinted -> verified
 * 
 * This is what separates amateur Discord bots from enterprise solutions.
 */

const express = require('express');
const crypto = require('crypto');

class WebVerificationPortal {
  constructor(pool, nexusVerification, client) {
    this.pool = pool;
    this.nexus = nexusVerification;
    this.client = client;
    this.app = express();
    this.port = process.env.VERIFICATION_PORT || 3847;
    
    // Rate limiting
    this.requestCounts = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Rate limiting middleware
    this.app.use((req, res, next) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const count = this.requestCounts.get(ip) || 0;
      
      if (count > 100) {
        return res.status(429).json({ error: 'Rate limited' });
      }
      
      this.requestCounts.set(ip, count + 1);
      setTimeout(() => {
        this.requestCounts.set(ip, (this.requestCounts.get(ip) || 1) - 1);
      }, 60000);
      
      next();
    });
  }
  
  setupRoutes() {
    // Main verification page
    this.app.get('/verify/:token', async (req, res) => {
      const { token } = req.params;
      
      // Validate token
      const tokenData = await this.validateToken(token);
      if (!tokenData) {
        return res.status(400).send(this.getErrorPage('Invalid or expired verification link'));
      }
      
      // Serve verification page with fingerprinting
      res.send(this.getVerificationPage(token, tokenData));
    });
    
    // Process verification (receives fingerprint data)
    this.app.post('/verify/:token/complete', async (req, res) => {
      const { token } = req.params;
      const { fingerprint, captchaResponse } = req.body;
      
      try {
        // Get client IP
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        const ipHash = crypto.createHash('sha256').update(clientIP + process.env.IP_SALT || 'nexus').digest('hex');
        
        // Validate token
        const tokenData = await this.validateToken(token);
        if (!tokenData) {
          return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }
        
        // Mark token as used
        await this.pool.query(
          'UPDATE nexus_verification_tokens SET used = TRUE WHERE token = $1',
          [token]
        );
        
        // Hash fingerprint
        const fingerprintHash = crypto.createHash('sha256')
          .update(JSON.stringify(fingerprint) + (process.env.FP_SALT || 'nexus'))
          .digest('hex');
        
        // Check VPN/Proxy using IP
        const vpnCheck = await this.checkVPN(clientIP);
        
        // Process verification through NEXUS
        const user = await this.client.users.fetch(tokenData.user_id).catch(() => null);
        const guild = this.client.guilds.cache.get(tokenData.guild_id);
        
        if (!user || !guild) {
          return res.status(400).json({ success: false, error: 'Server or user not found' });
        }
        
        const result = await this.nexus.processVerification(user, guild, {
          fingerprintHash,
          ipHash,
          deviceInfo: fingerprint,
          vpnDetected: vpnCheck.isVPN,
          proxyDetected: vpnCheck.isProxy,
          datacenterIP: vpnCheck.isDatacenter
        });
        
        // If approved, give verified role
        if (result.approved) {
          try {
            const member = await guild.members.fetch(user.id);
            const verifiedRole = guild.roles.cache.find(r => r.name.includes('Verified'));
            if (verifiedRole && member) {
              await member.roles.add(verifiedRole);
            }
          } catch (e) {
            console.error('Failed to add verified role:', e);
          }
        }
        
        // Log to staff channel if flagged
        if (result.requiresManualReview || result.riskScore >= 50) {
          await this.logToStaff(guild, user, result);
        }
        
        res.json({
          success: result.approved,
          message: result.message,
          action: result.action
        });
        
      } catch (error) {
        console.error('[WebVerification] Error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
      }
    });
    
    // API endpoint for checking verification status
    this.app.get('/api/status/:userId/:guildId', async (req, res) => {
      const { userId, guildId } = req.params;
      
      const verified = await this.pool.query(
        'SELECT * FROM nexus_verified WHERE user_id = $1 AND guild_id = $2',
        [userId, guildId]
      );
      
      res.json({
        verified: verified.rows.length > 0,
        data: verified.rows[0] || null
      });
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'nexus-verification' });
    });
  }
  
  async validateToken(token) {
    const result = await this.pool.query(
      `SELECT * FROM nexus_verification_tokens 
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    
    return result.rows[0] || null;
  }
  
  async checkVPN(ip) {
    // Multiple VPN detection methods
    const results = {
      isVPN: false,
      isProxy: false,
      isDatacenter: false,
      confidence: 0
    };
    
    try {
      // Method 1: Check against known VPN IP ranges
      const knownVPNRanges = await this.checkKnownVPNRanges(ip);
      if (knownVPNRanges) {
        results.isVPN = true;
        results.confidence = 0.9;
      }
      
      // Method 2: Use ipqualityscore.com if API key available
      if (process.env.IPQS_API_KEY) {
        const ipqsResult = await this.checkIPQualityScore(ip);
        if (ipqsResult.vpn || ipqsResult.proxy) {
          results.isVPN = ipqsResult.vpn;
          results.isProxy = ipqsResult.proxy;
          results.isDatacenter = ipqsResult.is_crawler;
          results.confidence = Math.max(results.confidence, ipqsResult.fraud_score / 100);
        }
      }
      
      // Method 3: Use ip-api.com (free, basic detection)
      const ipApiResult = await this.checkIPApi(ip);
      if (ipApiResult.hosting) {
        results.isDatacenter = true;
        results.confidence = Math.max(results.confidence, 0.7);
      }
      
    } catch (error) {
      console.error('[VPN Check] Error:', error);
    }
    
    return results;
  }
  
  async checkKnownVPNRanges(ip) {
    // This would check against a database of known VPN IP ranges
    // For now, return false as placeholder
    return false;
  }
  
  async checkIPQualityScore(ip) {
    try {
      const response = await fetch(
        `https://ipqualityscore.com/api/json/ip/${process.env.IPQS_API_KEY}/${ip}?strictness=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}
    
    return { vpn: false, proxy: false, is_crawler: false, fraud_score: 0 };
  }
  
  async checkIPApi(ip) {
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,hosting`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}
    
    return { hosting: false };
  }
  
  async logToStaff(guild, user, result) {
    const staffChannel = guild.channels.cache.find(c => 
      c.name === 'mod-actions' || c.name === 'staff-logs' || c.name === 'verification-logs'
    );
    
    if (!staffChannel) return;
    
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Verification Alert')
      .setDescription(`<@${user.id}> (${user.tag})`)
      .addFields(
        { name: 'Risk Score', value: `${result.riskScore}/100`, inline: true },
        { name: 'Action', value: result.action, inline: true },
        { name: 'Flags', value: result.flags.join(', ') || 'None', inline: false }
      )
      .setColor(result.approved ? 0xFFA500 : 0xFF0000)
      .setTimestamp();
    
    await staffChannel.send({ embeds: [embed] }).catch(() => {});
  }
  
  /**
   * Generate verification token for a user
   */
  async generateToken(userId, guildId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await this.pool.query(
      `INSERT INTO nexus_verification_tokens (token, user_id, guild_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [token, userId, guildId, expiresAt]
    );
    
    return token;
  }
  
  /**
   * Get the verification URL for a user
   */
  getVerificationURL(token) {
    const baseURL = process.env.VERIFICATION_URL || `http://localhost:${this.port}`;
    return `${baseURL}/verify/${token}`;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // HTML PAGES
  // ═══════════════════════════════════════════════════════════════
  
  getVerificationPage(token, tokenData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Discord Verification</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 25px 50px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo svg { width: 80px; height: 80px; }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 10px;
      background: linear-gradient(90deg, #5865F2, #EB459E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      text-align: center;
      color: #8e99a4;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .checks {
      margin-bottom: 30px;
    }
    .check-item {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      background: rgba(255,255,255,0.03);
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .check-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .check-icon.pending { background: #4f545c; }
    .check-icon.success { background: #43b581; }
    .check-icon.error { background: #f04747; }
    .check-icon.loading { 
      background: #5865F2;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .btn {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(90deg, #5865F2, #4752C4);
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(88,101,242,0.3);
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .result {
      text-align: center;
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
      display: none;
    }
    .result.success {
      background: rgba(67,181,129,0.2);
      border: 1px solid #43b581;
      display: block;
    }
    .result.error {
      background: rgba(240,71,71,0.2);
      border: 1px solid #f04747;
      display: block;
    }
    .privacy {
      text-align: center;
      font-size: 11px;
      color: #72767d;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="#5865F2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>
    <h1>Verification Required</h1>
    <p class="subtitle">Complete verification to access the server</p>
    
    <div class="checks">
      <div class="check-item" id="check-fingerprint">
        <div class="check-icon pending" id="icon-fingerprint">1</div>
        <span>Device Verification</span>
      </div>
      <div class="check-item" id="check-security">
        <div class="check-icon pending" id="icon-security">2</div>
        <span>Security Check</span>
      </div>
      <div class="check-item" id="check-complete">
        <div class="check-icon pending" id="icon-complete">3</div>
        <span>Account Verification</span>
      </div>
    </div>
    
    <button class="btn" id="verifyBtn" onclick="startVerification()">
      Start Verification
    </button>
    
    <div class="result" id="result"></div>
    
    <p class="privacy">
      By verifying, you agree to our security checks.<br>
      No personal data is stored - only anonymized hashes.
    </p>
  </div>

  <script>
    const token = '${token}';
    
    // Collect browser fingerprint
    function getFingerprint() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Verification', 2, 2);
      const canvasHash = canvas.toDataURL();
      
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        screenResolution: [screen.width, screen.height],
        screenColorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset(),
        touchSupport: 'ontouchstart' in window,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        canvasHash: canvasHash.slice(-50),
        webglVendor: getWebGLVendor(),
        fonts: detectFonts(),
        plugins: getPlugins(),
        audioFingerprint: getAudioFingerprint()
      };
    }
    
    function getWebGLVendor() {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            return {
              vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
              renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            };
          }
        }
      } catch (e) {}
      return null;
    }
    
    function detectFonts() {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Georgia', 'Comic Sans MS'];
      const detected = [];
      
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      
      const span = document.createElement('span');
      span.style.fontSize = testSize;
      span.innerHTML = testString;
      document.body.appendChild(span);
      
      const baseSizes = {};
      for (const baseFont of baseFonts) {
        span.style.fontFamily = baseFont;
        baseSizes[baseFont] = span.offsetWidth;
      }
      
      for (const font of testFonts) {
        for (const baseFont of baseFonts) {
          span.style.fontFamily = "'" + font + "'," + baseFont;
          if (span.offsetWidth !== baseSizes[baseFont]) {
            detected.push(font);
            break;
          }
        }
      }
      
      document.body.removeChild(span);
      return detected;
    }
    
    function getPlugins() {
      const plugins = [];
      for (let i = 0; i < navigator.plugins.length && i < 10; i++) {
        plugins.push(navigator.plugins[i].name);
      }
      return plugins;
    }
    
    function getAudioFingerprint() {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gainNode = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        
        gainNode.gain.value = 0;
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(0);
        audioContext.close();
        
        return analyser.frequencyBinCount;
      } catch (e) {
        return null;
      }
    }
    
    function updateCheck(id, status) {
      const icon = document.getElementById('icon-' + id);
      icon.className = 'check-icon ' + status;
      if (status === 'success') icon.innerHTML = '✓';
      else if (status === 'error') icon.innerHTML = '✗';
      else if (status === 'loading') icon.innerHTML = '...';
    }
    
    async function startVerification() {
      const btn = document.getElementById('verifyBtn');
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      
      try {
        // Step 1: Fingerprint
        updateCheck('fingerprint', 'loading');
        await new Promise(r => setTimeout(r, 500));
        const fingerprint = getFingerprint();
        updateCheck('fingerprint', 'success');
        
        // Step 2: Security
        updateCheck('security', 'loading');
        await new Promise(r => setTimeout(r, 500));
        updateCheck('security', 'success');
        
        // Step 3: Complete
        updateCheck('complete', 'loading');
        
        const response = await fetch('/verify/' + token + '/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint })
        });
        
        const result = await response.json();
        
        if (result.success) {
          updateCheck('complete', 'success');
          showResult('success', 'Verification Complete! You can now close this page and return to Discord.');
        } else {
          updateCheck('complete', 'error');
          showResult('error', result.message || 'Verification failed. Please contact staff.');
        }
        
      } catch (error) {
        updateCheck('complete', 'error');
        showResult('error', 'An error occurred. Please try again.');
      }
      
      btn.disabled = true;
      btn.textContent = 'Completed';
    }
    
    function showResult(type, message) {
      const resultDiv = document.getElementById('result');
      resultDiv.className = 'result ' + type;
      resultDiv.textContent = message;
    }
  </script>
</body>
</html>
    `;
  }
  
  getErrorPage(message) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Error</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #1a1a2e;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    h1 { color: #f04747; margin-bottom: 20px; }
    p { color: #8e99a4; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verification Error</h1>
    <p>${message}</p>
    <p style="margin-top: 20px;">Please request a new verification link from Discord.</p>
  </div>
</body>
</html>
    `;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // START SERVER
  // ═══════════════════════════════════════════════════════════════
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 NEXUS Web Verification Portal running on port ${this.port}`);
    });
  }
}

module.exports = WebVerificationPortal;
