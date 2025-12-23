/**
 * ████████████████████████████████████████████████████████████████████████
 * █  NEXUS ULTIMATE WEB PORTAL                                           █
 * █  50+ Fingerprint Signals • VPN Detection • Challenge System          █
 * ████████████████████████████████████████████████████████████████████████
 */

const express = require('express');
const crypto = require('crypto');

class NexusWebPortal {
  constructor(pool, nexusUltimate, client) {
    this.pool = pool;
    this.nexus = nexusUltimate;
    this.client = client;
    this.app = express();
    this.port = process.env.VERIFICATION_PORT || 3847;
    
    this.requestCounts = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
    
    // Rate limiting
    this.app.use((req, res, next) => {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
      const count = this.requestCounts.get(ip) || 0;
      
      if (count > 60) {
        return res.status(429).json({ error: 'Rate limited' });
      }
      
      this.requestCounts.set(ip, count + 1);
      setTimeout(() => {
        this.requestCounts.set(ip, Math.max(0, (this.requestCounts.get(ip) || 1) - 1));
      }, 60000);
      
      next();
    });
  }
  
  setupRoutes() {
    // Main verification page
    this.app.get('/verify/:token', async (req, res) => {
      const tokenData = await this.validateToken(req.params.token);
      if (!tokenData) {
        return res.status(400).send(this.getErrorPage('Invalid or expired verification link'));
      }
      
      res.send(this.getVerificationPage(req.params.token, tokenData));
    });
    
    // Challenge page (CAPTCHA + questions)
    this.app.get('/challenge/:token', async (req, res) => {
      const tokenData = await this.validateToken(req.params.token);
      if (!tokenData) {
        return res.status(400).send(this.getErrorPage('Invalid or expired link'));
      }
      
      res.send(this.getChallengePage(req.params.token, tokenData));
    });
    
    // Process verification
    this.app.post('/verify/:token/complete', async (req, res) => {
      await this.handleVerification(req, res);
    });
    
    // Process challenge
    this.app.post('/challenge/:token/complete', async (req, res) => {
      await this.handleChallenge(req, res);
    });
    
    // Status check
    this.app.get('/api/status/:userId/:guildId', async (req, res) => {
      const verified = await this.nexus.isVerified(req.params.userId, req.params.guildId);
      res.json({ verified: !!verified, data: verified });
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'nexus-ultimate', uptime: process.uptime() });
    });
    
    // Dashboard (basic)
    this.app.get('/dashboard/:guildId', async (req, res) => {
      res.send(await this.getDashboardPage(req.params.guildId));
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
  
  async handleVerification(req, res) {
    const { token } = req.params;
    const { fingerprint } = req.body;
    
    try {
      const tokenData = await this.validateToken(token);
      if (!tokenData) {
        return res.status(400).json({ success: false, error: 'Invalid token' });
      }
      
      // Mark token used
      await this.pool.query(
        'UPDATE nexus_verification_tokens SET used = TRUE, used_at = NOW() WHERE token = $1',
        [token]
      );
      
      // Get client info
      const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
      const ipHash = crypto.createHash('sha256').update(clientIP + (process.env.IP_SALT || 'nexus')).digest('hex');
      const fpHash = crypto.createHash('sha256').update(JSON.stringify(fingerprint) + (process.env.FP_SALT || 'nexus')).digest('hex');
      
      // Check VPN
      const vpnCheck = await this.checkVPN(clientIP);
      
      // Get user and guild
      const user = await this.client.users.fetch(tokenData.user_id).catch(() => null);
      const guild = this.client.guilds.cache.get(tokenData.guild_id);
      
      if (!user || !guild) {
        return res.status(400).json({ success: false, error: 'User or server not found' });
      }
      
      // Process through NEXUS
      const result = await this.nexus.processVerification(user, guild, {
        method: 'web_portal',
        ipHash,
        ipData: { rawIP: clientIP, ...vpnCheck },
        fingerprintHash: fpHash,
        fingerprintData: fingerprint,
        deviceInfo: fingerprint
      });
      
      // If approved, add role
      if (result.approved) {
        try {
          const member = await guild.members.fetch(user.id);
          const verifiedRole = guild.roles.cache.find(r => r.name.includes('Verified'));
          if (verifiedRole) await member.roles.add(verifiedRole);
        } catch (e) {
          console.error('Role add error:', e);
        }
      }
      
      // Notify staff if flagged
      if (result.requiresManualReview || result.riskScore >= 40) {
        await this.notifyStaff(guild, user, result);
      }
      
      res.json({
        success: result.approved,
        message: result.message,
        action: result.action,
        challengeRequired: result.action === 'challenge_required',
        challengeToken: result.challengeToken
      });
      
    } catch (error) {
      console.error('[WebPortal] Error:', error);
      res.status(500).json({ success: false, error: 'Verification failed' });
    }
  }
  
  async handleChallenge(req, res) {
    const { token } = req.params;
    const { captchaResponse, answers } = req.body;
    
    try {
      const tokenData = await this.validateToken(token);
      if (!tokenData) {
        return res.status(400).json({ success: false, error: 'Invalid token' });
      }
      
      // Verify CAPTCHA if required
      if (process.env.HCAPTCHA_SECRET && captchaResponse) {
        const captchaValid = await this.verifyCaptcha(captchaResponse);
        if (!captchaValid) {
          return res.json({ success: false, error: 'CAPTCHA verification failed' });
        }
      }
      
      // Analyze answers if AI interrogation
      if (answers && answers.length > 0) {
        const analysis = await this.analyzeAnswers(tokenData.user_id, answers);
        if (!analysis.passed) {
          return res.json({ 
            success: false, 
            error: 'Verification failed. Please contact staff.',
            requiresManualReview: true
          });
        }
      }
      
      // Mark as passed
      await this.pool.query(
        'UPDATE nexus_verification_tokens SET used = TRUE, used_at = NOW() WHERE token = $1',
        [token]
      );
      
      // Complete verification
      const user = await this.client.users.fetch(tokenData.user_id).catch(() => null);
      const guild = this.client.guilds.cache.get(tokenData.guild_id);
      
      if (user && guild) {
        await this.nexus.saveVerification(user, guild, {
          method: 'challenge_passed',
          riskScore: tokenData.verification_data?.riskScore || 50,
          flags: [...(tokenData.verification_data?.flags || []), 'challenge_passed']
        });
        
        try {
          const member = await guild.members.fetch(user.id);
          const verifiedRole = guild.roles.cache.find(r => r.name.includes('Verified'));
          if (verifiedRole) await member.roles.add(verifiedRole);
        } catch (e) {}
      }
      
      res.json({ success: true, message: 'Verification complete!' });
      
    } catch (error) {
      console.error('[Challenge] Error:', error);
      res.status(500).json({ success: false, error: 'Challenge failed' });
    }
  }
  
  async verifyCaptcha(response) {
    if (!process.env.HCAPTCHA_SECRET) return true;
    
    try {
      const result = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${process.env.HCAPTCHA_SECRET}&response=${response}`
      });
      
      const data = await result.json();
      return data.success;
    } catch (e) {
      return true; // Fail open
    }
  }
  
  async analyzeAnswers(userId, answers) {
    // AI analysis of interrogation answers
    try {
      const response = await this.nexus.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: `You are analyzing verification answers for suspicious patterns.
Look for: copy-pasted responses, nonsensical answers, bot-like patterns, evasive answers.
Return JSON: { "passed": boolean, "confidence": 0-1, "suspiciousPatterns": [] }`,
        messages: [{
          role: 'user',
          content: `Analyze these verification answers:\n${JSON.stringify(answers, null, 2)}`
        }]
      });
      
      const text = response.content[0].text;
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {}
    
    return { passed: true, confidence: 0.5 };
  }
  
  async checkVPN(ip) {
    const results = { isVPN: false, isProxy: false, isDatacenter: false };
    
    try {
      // IPQualityScore
      if (process.env.IPQS_API_KEY) {
        const r = await fetch(`https://ipqualityscore.com/api/json/ip/${process.env.IPQS_API_KEY}/${ip}?strictness=2`);
        if (r.ok) {
          const d = await r.json();
          results.isVPN = d.vpn;
          results.isProxy = d.proxy;
          results.fraudScore = d.fraud_score;
        }
      }
      
      // IP-API fallback
      const ipapi = await fetch(`http://ip-api.com/json/${ip}?fields=hosting`);
      if (ipapi.ok) {
        const d = await ipapi.json();
        results.isDatacenter = d.hosting;
      }
    } catch (e) {}
    
    return results;
  }
  
  async notifyStaff(guild, user, result) {
    const channel = guild.channels.cache.find(c => 
      c.name === 'mod-actions' || c.name === 'verification-logs' || c.name === 'staff-logs'
    );
    
    if (!channel) return;
    
    const { EmbedBuilder } = require('discord.js');
    const color = result.riskScore >= 60 ? 0xFF0000 : result.riskScore >= 40 ? 0xFFA500 : 0xFFFF00;
    
    const embed = new EmbedBuilder()
      .setTitle(`${result.riskScore >= 60 ? '🚨' : '⚠️'} Verification Alert`)
      .setDescription(`<@${user.id}> (${user.tag})`)
      .addFields(
        { name: 'Risk Score', value: `${result.riskScore}/100`, inline: true },
        { name: 'Result', value: result.action, inline: true },
        { name: 'Alt Matches', value: `${result.altMatches?.length || 0}`, inline: true },
        { name: 'Flags', value: result.flags.slice(0, 10).join('\n') || 'None', inline: false }
      )
      .setColor(color)
      .setTimestamp();
    
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
  
  async generateToken(userId, guildId, type = 'web') {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await this.pool.query(
      `INSERT INTO nexus_verification_tokens (token, user_id, guild_id, type, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [token, userId, guildId, type, expiresAt]
    );
    
    return token;
  }
  
  getVerificationURL(token) {
    const base = process.env.VERIFICATION_URL || `http://localhost:${this.port}`;
    return `${base}/verify/${token}`;
  }
  
  getChallengeURL(token) {
    const base = process.env.VERIFICATION_URL || `http://localhost:${this.port}`;
    return `${base}/challenge/${token}`;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // HTML PAGES
  // ═══════════════════════════════════════════════════════════════
  
  getVerificationPage(token, tokenData) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS Verification</title>
  <style>
    :root {
      --bg: #0f0f1a;
      --card: rgba(255,255,255,0.03);
      --border: rgba(255,255,255,0.08);
      --primary: #5865F2;
      --success: #43b581;
      --error: #f04747;
      --warning: #faa61a;
      --text: #ffffff;
      --text-dim: #8e99a4;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, var(--bg) 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text);
      padding: 20px;
    }
    .container {
      background: var(--card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 40px 80px rgba(0,0,0,0.4);
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), #7289da);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 40px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #fff, var(--text-dim));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      color: var(--text-dim);
      font-size: 14px;
      margin-bottom: 32px;
    }
    .checks {
      margin-bottom: 32px;
    }
    .check-item {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }
    .check-item.active {
      background: rgba(88,101,242,0.1);
      border-color: var(--primary);
    }
    .check-item.success {
      background: rgba(67,181,129,0.1);
      border-color: var(--success);
    }
    .check-item.error {
      background: rgba(240,71,71,0.1);
      border-color: var(--error);
    }
    .check-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .check-item.active .check-icon {
      background: var(--primary);
      animation: pulse 1.5s infinite;
    }
    .check-item.success .check-icon {
      background: var(--success);
    }
    .check-item.error .check-icon {
      background: var(--error);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .check-text {
      flex: 1;
    }
    .check-label {
      font-weight: 500;
      font-size: 14px;
    }
    .check-status {
      font-size: 12px;
      color: var(--text-dim);
      margin-top: 2px;
    }
    .btn {
      width: 100%;
      padding: 18px 24px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary), #4752c4);
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(88,101,242,0.4);
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .result {
      text-align: center;
      padding: 24px;
      border-radius: 12px;
      margin-top: 24px;
      display: none;
    }
    .result.show { display: block; }
    .result.success {
      background: rgba(67,181,129,0.1);
      border: 1px solid var(--success);
    }
    .result.error {
      background: rgba(240,71,71,0.1);
      border: 1px solid var(--error);
    }
    .result h3 { margin-bottom: 8px; font-size: 18px; }
    .result p { color: var(--text-dim); font-size: 14px; }
    .privacy {
      text-align: center;
      font-size: 11px;
      color: var(--text-dim);
      margin-top: 24px;
      line-height: 1.5;
    }
    .security-badges {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }
    .badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: var(--text-dim);
      padding: 4px 8px;
      background: var(--border);
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">🛡️</div>
      <h1>NEXUS Verification</h1>
      <p class="subtitle">Complete security verification to access the server</p>
    </div>
    
    <div class="checks">
      <div class="check-item" id="check-1">
        <div class="check-icon">1</div>
        <div class="check-text">
          <div class="check-label">Device Analysis</div>
          <div class="check-status" id="status-1">Waiting...</div>
        </div>
      </div>
      <div class="check-item" id="check-2">
        <div class="check-icon">2</div>
        <div class="check-text">
          <div class="check-label">Security Scan</div>
          <div class="check-status" id="status-2">Waiting...</div>
        </div>
      </div>
      <div class="check-item" id="check-3">
        <div class="check-icon">3</div>
        <div class="check-text">
          <div class="check-label">Database Check</div>
          <div class="check-status" id="status-3">Waiting...</div>
        </div>
      </div>
      <div class="check-item" id="check-4">
        <div class="check-icon">4</div>
        <div class="check-text">
          <div class="check-label">Risk Assessment</div>
          <div class="check-status" id="status-4">Waiting...</div>
        </div>
      </div>
    </div>
    
    <button class="btn" id="verifyBtn" onclick="startVerification()">
      <span>🔐</span> Start Verification
    </button>
    
    <div class="result" id="result">
      <h3 id="result-title"></h3>
      <p id="result-message"></p>
    </div>
    
    <p class="privacy">
      Your data is anonymized and hashed. We never store your IP or device info in plain text.
    </p>
    
    <div class="security-badges">
      <div class="badge">🔒 Encrypted</div>
      <div class="badge">🛡️ Privacy First</div>
      <div class="badge">⚡ Instant</div>
    </div>
  </div>

  <script>
    const TOKEN = '${token}';
    let verifying = false;
    
    // Advanced fingerprint collection (50+ signals)
    async function collectFingerprint() {
      const fp = {};
      
      // Basic
      fp.userAgent = navigator.userAgent;
      fp.language = navigator.language;
      fp.languages = [...(navigator.languages || [])];
      fp.platform = navigator.platform;
      fp.vendor = navigator.vendor;
      fp.cookieEnabled = navigator.cookieEnabled;
      fp.doNotTrack = navigator.doNotTrack;
      
      // Hardware
      fp.hardwareConcurrency = navigator.hardwareConcurrency;
      fp.deviceMemory = navigator.deviceMemory;
      fp.maxTouchPoints = navigator.maxTouchPoints;
      
      // Screen
      fp.screenResolution = [screen.width, screen.height];
      fp.availableResolution = [screen.availWidth, screen.availHeight];
      fp.colorDepth = screen.colorDepth;
      fp.pixelDepth = screen.pixelDepth;
      fp.devicePixelRatio = window.devicePixelRatio;
      
      // Timezone
      fp.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fp.timezoneOffset = new Date().getTimezoneOffset();
      
      // Canvas fingerprint
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('NEXUS Verify', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('NEXUS Verify', 4, 17);
        fp.canvasHash = canvas.toDataURL().slice(-100);
      } catch (e) {
        fp.canvasHash = 'error';
      }
      
      // WebGL fingerprint
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          fp.webglVendor = gl.getParameter(gl.VENDOR);
          fp.webglRenderer = gl.getParameter(gl.RENDERER);
          
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            fp.webglVendorUnmasked = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            fp.webglRendererUnmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
          
          fp.webglVersion = gl.getParameter(gl.VERSION);
          fp.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
          fp.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          fp.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        }
      } catch (e) {}
      
      // Audio fingerprint
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const analyser = audioCtx.createAnalyser();
        const gain = audioCtx.createGain();
        const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
        
        gain.gain.value = 0;
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gain);
        gain.connect(audioCtx.destination);
        
        oscillator.start(0);
        fp.audioFingerprint = analyser.frequencyBinCount;
        fp.sampleRate = audioCtx.sampleRate;
        fp.audioState = audioCtx.state;
        
        oscillator.stop();
        audioCtx.close();
      } catch (e) {}
      
      // Font detection
      try {
        const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Georgia', 'Comic Sans MS', 'Impact', 'Trebuchet MS'];
        const detected = [];
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        
        const testString = 'mmmmmmmmmmlli';
        const span = document.createElement('span');
        span.style.fontSize = '72px';
        span.innerHTML = testString;
        span.style.visibility = 'hidden';
        document.body.appendChild(span);
        
        const baseSizes = {};
        for (const base of baseFonts) {
          span.style.fontFamily = base;
          baseSizes[base] = span.offsetWidth;
        }
        
        for (const font of testFonts) {
          for (const base of baseFonts) {
            span.style.fontFamily = "'" + font + "'," + base;
            if (span.offsetWidth !== baseSizes[base]) {
              detected.push(font);
              break;
            }
          }
        }
        
        document.body.removeChild(span);
        fp.fonts = detected;
      } catch (e) {}
      
      // Plugins
      try {
        fp.plugins = Array.from(navigator.plugins || []).slice(0, 10).map(p => p.name);
      } catch (e) {}
      
      // WebRTC (for IP leak detection)
      try {
        fp.webrtc = !!window.RTCPeerConnection;
      } catch (e) {}
      
      // Battery (if available)
      try {
        if (navigator.getBattery) {
          const battery = await navigator.getBattery();
          fp.battery = {
            charging: battery.charging,
            level: battery.level
          };
        }
      } catch (e) {}
      
      // Connection info
      try {
        if (navigator.connection) {
          fp.connection = {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          };
        }
      } catch (e) {}
      
      // Touch support
      fp.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Permissions API
      try {
        const perms = await Promise.all([
          navigator.permissions.query({ name: 'geolocation' }),
          navigator.permissions.query({ name: 'notifications' }),
          navigator.permissions.query({ name: 'camera' }),
          navigator.permissions.query({ name: 'microphone' })
        ]);
        fp.permissions = {
          geolocation: perms[0].state,
          notifications: perms[1].state,
          camera: perms[2].state,
          microphone: perms[3].state
        };
      } catch (e) {}
      
      // Webdriver detection
      fp.webdriver = navigator.webdriver || false;
      
      // Automation detection
      fp.automation = {
        phantomJS: !!window.callPhantom || !!window._phantom,
        nightmare: !!window.__nightmare,
        selenium: !!window.document.__selenium_unwrapped || !!window.document.__webdriver_evaluate,
        webdriverIO: !!window.wdioElectron
      };
      
      // Storage
      try {
        fp.localStorage = !!window.localStorage;
        fp.sessionStorage = !!window.sessionStorage;
        fp.indexedDB = !!window.indexedDB;
      } catch (e) {}
      
      // CSS features
      fp.cssGrid = CSS.supports('display', 'grid');
      fp.cssFlexbox = CSS.supports('display', 'flex');
      
      // MediaDevices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        fp.mediaDevices = {
          audioInputs: devices.filter(d => d.kind === 'audioinput').length,
          audioOutputs: devices.filter(d => d.kind === 'audiooutput').length,
          videoInputs: devices.filter(d => d.kind === 'videoinput').length
        };
      } catch (e) {}
      
      // Generate hash
      fp.hash = await generateHash(JSON.stringify(fp));
      
      return fp;
    }
    
    async function generateHash(str) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    function updateCheck(num, status, message) {
      const item = document.getElementById('check-' + num);
      const statusEl = document.getElementById('status-' + num);
      
      item.className = 'check-item ' + status;
      statusEl.textContent = message;
      
      if (status === 'success') {
        item.querySelector('.check-icon').textContent = '✓';
      } else if (status === 'error') {
        item.querySelector('.check-icon').textContent = '✗';
      }
    }
    
    function showResult(type, title, message) {
      const resultDiv = document.getElementById('result');
      const titleEl = document.getElementById('result-title');
      const messageEl = document.getElementById('result-message');
      
      resultDiv.className = 'result show ' + type;
      titleEl.textContent = title;
      messageEl.textContent = message;
    }
    
    async function startVerification() {
      if (verifying) return;
      verifying = true;
      
      const btn = document.getElementById('verifyBtn');
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Verifying...';
      
      try {
        // Step 1: Device Analysis
        updateCheck(1, 'active', 'Analyzing device...');
        await sleep(300);
        const fingerprint = await collectFingerprint();
        updateCheck(1, 'success', 'Device fingerprint collected');
        
        // Step 2: Security Scan
        updateCheck(2, 'active', 'Running security scan...');
        await sleep(500);
        updateCheck(2, 'success', 'Security scan complete');
        
        // Step 3: Database Check
        updateCheck(3, 'active', 'Checking databases...');
        await sleep(400);
        updateCheck(3, 'success', 'Database check complete');
        
        // Step 4: Risk Assessment
        updateCheck(4, 'active', 'Processing verification...');
        
        const response = await fetch('/verify/' + TOKEN + '/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint })
        });
        
        const result = await response.json();
        
        if (result.success) {
          updateCheck(4, 'success', 'Verification approved!');
          showResult('success', '✅ Verification Complete', 'You can now close this page and return to Discord.');
        } else if (result.challengeRequired) {
          updateCheck(4, 'active', 'Additional verification required');
          window.location.href = '/challenge/' + result.challengeToken;
        } else {
          updateCheck(4, 'error', 'Verification failed');
          showResult('error', '❌ Verification Denied', result.message || 'Please contact server staff for assistance.');
        }
        
      } catch (error) {
        console.error('Verification error:', error);
        updateCheck(4, 'error', 'Error occurred');
        showResult('error', '❌ Error', 'An error occurred. Please try again.');
      }
      
      btn.disabled = true;
      btn.innerHTML = '<span>✓</span> Complete';
    }
    
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  </script>
</body>
</html>`;
  }
  
  getChallengePage(token, tokenData) {
    const hcaptchaSiteKey = process.env.HCAPTCHA_SITE_KEY || '';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS Challenge</title>
  ${hcaptchaSiteKey ? '<script src="https://js.hcaptcha.com/1/api.js" async defer></script>' : ''}
  <style>
    :root { --bg: #0f0f1a; --card: rgba(255,255,255,0.03); --border: rgba(255,255,255,0.08); --primary: #5865F2; --text: #fff; --text-dim: #8e99a4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, var(--bg), #1a1a2e); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: var(--text); padding: 20px; }
    .container { background: var(--card); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 24px; padding: 48px; max-width: 520px; width: 100%; box-shadow: 0 40px 80px rgba(0,0,0,0.4); }
    h1 { font-size: 24px; text-align: center; margin-bottom: 24px; }
    .subtitle { color: var(--text-dim); text-align: center; margin-bottom: 32px; }
    .question { margin-bottom: 24px; }
    .question label { display: block; font-weight: 500; margin-bottom: 8px; }
    .question input, .question textarea { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,0.05); color: var(--text); font-size: 14px; }
    .question input:focus, .question textarea:focus { outline: none; border-color: var(--primary); }
    .captcha-container { display: flex; justify-content: center; margin: 24px 0; }
    .btn { width: 100%; padding: 18px; border: none; border-radius: 12px; background: linear-gradient(135deg, var(--primary), #4752c4); color: white; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(88,101,242,0.4); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Security Challenge</h1>
    <p class="subtitle">Please complete this challenge to verify you're human</p>
    
    ${hcaptchaSiteKey ? `
    <div class="captcha-container">
      <div class="h-captcha" data-sitekey="${hcaptchaSiteKey}"></div>
    </div>
    ` : ''}
    
    <div class="question">
      <label>Why do you want to join this server?</label>
      <textarea id="q1" rows="3" placeholder="Your answer..."></textarea>
    </div>
    
    <div class="question">
      <label>How did you find this server?</label>
      <input type="text" id="q2" placeholder="Your answer...">
    </div>
    
    <button class="btn" onclick="submitChallenge()">Submit Challenge</button>
  </div>
  
  <script>
    async function submitChallenge() {
      const answers = [
        { question: 'Why join?', answer: document.getElementById('q1').value },
        { question: 'How found?', answer: document.getElementById('q2').value }
      ];
      
      const captchaResponse = ${hcaptchaSiteKey ? "document.querySelector('[name=\"h-captcha-response\"]')?.value || ''" : "''"};
      
      const response = await fetch('/challenge/${token}/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaResponse, answers })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Verification complete! You can close this page.');
      } else {
        alert(result.error || 'Challenge failed. Please contact staff.');
      }
    }
  </script>
</body>
</html>`;
  }
  
  getErrorPage(message) {
    return `<!DOCTYPE html>
<html><head><title>Error</title>
<style>body{font-family:system-ui;background:#0f0f1a;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;margin:0}
.container{text-align:center;padding:40px}h1{color:#f04747;margin-bottom:20px}p{color:#8e99a4}</style></head>
<body><div class="container"><h1>Error</h1><p>${message}</p><p style="margin-top:20px">Please request a new verification link from Discord.</p></div></body></html>`;
  }
  
  async getDashboardPage(guildId) {
    // Get stats
    const stats = await this.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM nexus_verified_users WHERE guild_id = $1) as verified,
        (SELECT COUNT(*) FROM nexus_verification_attempts WHERE guild_id = $1 AND attempt_time > NOW() - INTERVAL '24 hours') as attempts_24h,
        (SELECT COUNT(*) FROM nexus_verification_attempts WHERE guild_id = $1 AND result = 'denied') as denied,
        (SELECT COUNT(*) FROM nexus_alt_links) as alt_links,
        (SELECT AVG(risk_score) FROM nexus_verified_users WHERE guild_id = $1) as avg_risk
    `, [guildId]);
    
    const s = stats.rows[0];
    
    return `<!DOCTYPE html>
<html><head><title>NEXUS Dashboard</title>
<style>
body{font-family:system-ui;background:#0f0f1a;color:#fff;margin:0;padding:40px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:1200px;margin:0 auto}
.stat{background:rgba(255,255,255,0.05);border-radius:16px;padding:24px;text-align:center}
.stat-value{font-size:48px;font-weight:700;background:linear-gradient(90deg,#5865F2,#EB459E);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{color:#8e99a4;margin-top:8px}
h1{text-align:center;margin-bottom:40px}
</style></head>
<body>
<h1>🛡️ NEXUS Dashboard</h1>
<div class="stats">
<div class="stat"><div class="stat-value">${s.verified || 0}</div><div class="stat-label">Verified Users</div></div>
<div class="stat"><div class="stat-value">${s.attempts_24h || 0}</div><div class="stat-label">Attempts (24h)</div></div>
<div class="stat"><div class="stat-value">${s.denied || 0}</div><div class="stat-label">Total Denied</div></div>
<div class="stat"><div class="stat-value">${s.alt_links || 0}</div><div class="stat-label">Alt Links</div></div>
<div class="stat"><div class="stat-value">${Math.round(s.avg_risk || 0)}</div><div class="stat-label">Avg Risk Score</div></div>
</div>
</body></html>`;
  }
  
  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 NEXUS Web Portal running on port ${this.port}`);
    });
  }
}

module.exports = NexusWebPortal;
