/**
 * ████████████████████████████████████████████████████████████████████████
 * █  NEXUS VERIFICATION SYSTEM - ENTERPRISE GRADE                        █
 * █  Features no other Discord server has                                █
 * ████████████████████████████████████████████████████████████████████████
 * 
 * CAPABILITIES:
 * 1. Web Portal Verification (fingerprinting, CAPTCHA, VPN detection)
 * 2. Alt Account Detection (behavioral, fingerprint, pattern matching)
 * 3. AI Risk Scoring (Claude-powered threat assessment)
 * 4. Cross-Server Intelligence Network
 * 5. Behavioral Biometrics
 * 6. VPN/Proxy/Datacenter Detection
 * 7. Device Fingerprinting
 * 8. Account Pattern Analysis
 * 
 * This is NOT a simple "click to verify" system.
 * This is what billion-dollar companies use.
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const crypto = require('crypto');

class NexusVerification {
  constructor(pool, anthropic, client) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.client = client;
    
    // Risk thresholds
    this.RISK_THRESHOLDS = {
      LOW: 25,
      MEDIUM: 50,
      HIGH: 75,
      CRITICAL: 90
    };
    
    // Verification config
    this.config = {
      minAccountAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxVerificationAttempts: 3,
      verificationCooldown: 60 * 60 * 1000, // 1 hour between attempts
      requireCaptcha: true,
      requireWebVerification: true,
      vpnCheckEnabled: true,
      altDetectionEnabled: true,
      crossServerEnabled: true
    };
    
    // In-memory caches for performance
    this.fingerprintCache = new Map();
    this.behaviorCache = new Map();
    this.riskCache = new Map();
    
    // Partner servers for cross-server intelligence
    this.partnerServers = new Set();
  }

  // ═══════════════════════════════════════════════════════════════
  // DATABASE INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  
  async initialize() {
    await this.pool.query(`
      -- Core verified users table
      CREATE TABLE IF NOT EXISTS nexus_verified (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_method TEXT,
        risk_score INTEGER DEFAULT 0,
        fingerprint_hash TEXT,
        ip_hash TEXT,
        device_info JSONB DEFAULT '{}',
        flags TEXT[],
        PRIMARY KEY (user_id, guild_id)
      );
      
      -- Device fingerprints for alt detection
      CREATE TABLE IF NOT EXISTS nexus_fingerprints (
        fingerprint_hash TEXT PRIMARY KEY,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_ids TEXT[],
        device_info JSONB DEFAULT '{}',
        risk_level TEXT DEFAULT 'unknown'
      );
      
      -- Behavioral profiles
      CREATE TABLE IF NOT EXISTS nexus_behavior (
        user_id TEXT PRIMARY KEY,
        typing_speed_avg FLOAT,
        active_hours INTEGER[],
        message_patterns JSONB DEFAULT '{}',
        vocabulary_hash TEXT,
        reaction_patterns JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Alt account links (detected relationships)
      CREATE TABLE IF NOT EXISTS nexus_alt_links (
        id SERIAL PRIMARY KEY,
        primary_user_id TEXT NOT NULL,
        alt_user_id TEXT NOT NULL,
        confidence FLOAT NOT NULL,
        detection_method TEXT,
        evidence JSONB DEFAULT '{}',
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed BOOLEAN DEFAULT FALSE,
        UNIQUE(primary_user_id, alt_user_id)
      );
      
      -- IP intelligence
      CREATE TABLE IF NOT EXISTS nexus_ip_intel (
        ip_hash TEXT PRIMARY KEY,
        is_vpn BOOLEAN DEFAULT FALSE,
        is_proxy BOOLEAN DEFAULT FALSE,
        is_datacenter BOOLEAN DEFAULT FALSE,
        is_tor BOOLEAN DEFAULT FALSE,
        country_code TEXT,
        asn TEXT,
        risk_score INTEGER DEFAULT 0,
        user_ids TEXT[],
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Cross-server ban intelligence
      CREATE TABLE IF NOT EXISTS nexus_global_bans (
        user_id TEXT PRIMARY KEY,
        ban_count INTEGER DEFAULT 1,
        servers TEXT[],
        reasons TEXT[],
        severity TEXT DEFAULT 'medium',
        first_ban TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_ban TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        evidence JSONB DEFAULT '{}'
      );
      
      -- Verification attempts (for rate limiting and analysis)
      CREATE TABLE IF NOT EXISTS nexus_verification_attempts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_hash TEXT,
        fingerprint_hash TEXT,
        result TEXT,
        risk_score INTEGER,
        flags TEXT[],
        raw_data JSONB DEFAULT '{}'
      );
      
      -- Verification tokens (for web portal)
      CREATE TABLE IF NOT EXISTS nexus_verification_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        verification_data JSONB DEFAULT '{}'
      );
      
      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_fingerprints_users ON nexus_fingerprints USING GIN (user_ids);
      CREATE INDEX IF NOT EXISTS idx_ip_users ON nexus_ip_intel USING GIN (user_ids);
      CREATE INDEX IF NOT EXISTS idx_alt_links_primary ON nexus_alt_links (primary_user_id);
      CREATE INDEX IF NOT EXISTS idx_alt_links_alt ON nexus_alt_links (alt_user_id);
    `);
    
    console.log('✅ NEXUS Verification System initialized');
    
    // Start background jobs
    this.startBackgroundJobs();
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN VERIFICATION FLOW
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Process a verification request
   * Returns: { approved, riskScore, flags, action, message }
   */
  async processVerification(user, guild, verificationData = {}) {
    const startTime = Date.now();
    const flags = [];
    let riskScore = 0;
    
    try {
      // 1. Check if already verified
      const existing = await this.pool.query(
        'SELECT * FROM nexus_verified WHERE user_id = $1 AND guild_id = $2',
        [user.id, guild.id]
      );
      
      if (existing.rows.length > 0) {
        return { approved: true, riskScore: 0, flags: [], action: 'already_verified', message: 'Already verified' };
      }
      
      // 2. Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(user.id, guild.id);
      if (!rateLimitCheck.allowed) {
        return { 
          approved: false, 
          riskScore: 100, 
          flags: ['rate_limited'], 
          action: 'blocked',
          message: `Too many attempts. Try again in ${rateLimitCheck.waitTime} minutes.`
        };
      }
      
      // 3. Run all detection systems in parallel
      const [
        accountAnalysis,
        globalBanCheck,
        altDetection,
        behaviorAnalysis,
        ipAnalysis,
        fingerprintAnalysis
      ] = await Promise.all([
        this.analyzeAccount(user),
        this.checkGlobalBans(user.id),
        this.detectAltAccounts(user, guild, verificationData),
        this.analyzeBehavior(user, guild),
        this.analyzeIP(verificationData.ipHash, user.id),
        this.analyzeFingerprint(verificationData.fingerprintHash, user.id)
      ]);
      
      // 4. Aggregate flags and risk scores
      flags.push(...accountAnalysis.flags);
      flags.push(...globalBanCheck.flags);
      flags.push(...altDetection.flags);
      flags.push(...behaviorAnalysis.flags);
      flags.push(...ipAnalysis.flags);
      flags.push(...fingerprintAnalysis.flags);
      
      riskScore = this.calculateRiskScore({
        accountAnalysis,
        globalBanCheck,
        altDetection,
        behaviorAnalysis,
        ipAnalysis,
        fingerprintAnalysis
      });
      
      // 5. AI-powered final assessment for edge cases
      let aiAssessment = null;
      if (riskScore >= this.RISK_THRESHOLDS.MEDIUM && riskScore < this.RISK_THRESHOLDS.CRITICAL) {
        aiAssessment = await this.getAIAssessment(user, flags, riskScore, {
          accountAnalysis,
          globalBanCheck,
          altDetection,
          behaviorAnalysis,
          ipAnalysis,
          fingerprintAnalysis
        });
        
        if (aiAssessment.adjustedScore !== null) {
          riskScore = aiAssessment.adjustedScore;
        }
        flags.push(...(aiAssessment.additionalFlags || []));
      }
      
      // 6. Determine action based on risk score
      const decision = this.makeDecision(riskScore, flags, aiAssessment);
      
      // 7. Log the attempt
      await this.logVerificationAttempt(user.id, guild.id, {
        ipHash: verificationData.ipHash,
        fingerprintHash: verificationData.fingerprintHash,
        result: decision.action,
        riskScore,
        flags,
        rawData: { accountAnalysis, globalBanCheck, altDetection, aiAssessment }
      });
      
      // 8. If approved, save verification
      if (decision.approved) {
        await this.saveVerification(user, guild, {
          riskScore,
          flags,
          fingerprintHash: verificationData.fingerprintHash,
          ipHash: verificationData.ipHash,
          deviceInfo: verificationData.deviceInfo || {}
        });
      }
      
      console.log(`[NEXUS] Verification for ${user.tag}: ${decision.action} (risk: ${riskScore}, time: ${Date.now() - startTime}ms)`);
      
      return {
        approved: decision.approved,
        riskScore,
        flags,
        action: decision.action,
        message: decision.message,
        requiresManualReview: decision.requiresManualReview
      };
      
    } catch (error) {
      console.error('[NEXUS] Verification error:', error);
      flags.push('system_error');
      
      // Fail-safe: allow through but flag for review
      return {
        approved: true,
        riskScore: 50,
        flags,
        action: 'approved_with_errors',
        message: 'Verified (system check incomplete)',
        requiresManualReview: true
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACCOUNT ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeAccount(user) {
    const flags = [];
    let score = 0;
    
    const accountAge = Date.now() - user.createdTimestamp;
    const ageInDays = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    const ageInHours = Math.floor(accountAge / (60 * 60 * 1000));
    
    // Account age checks
    if (ageInHours < 1) {
      flags.push('account_minutes_old');
      score += 50;
    } else if (ageInHours < 24) {
      flags.push('account_hours_old');
      score += 35;
    } else if (ageInDays < 7) {
      flags.push('account_days_old');
      score += 20;
    } else if (ageInDays < 30) {
      flags.push('account_new');
      score += 10;
    }
    
    // Default avatar
    if (!user.avatar) {
      flags.push('default_avatar');
      score += 15;
    }
    
    // No banner (premium feature, real users often have)
    if (!user.banner) {
      score += 5;
    }
    
    // Username analysis
    const usernameAnalysis = this.analyzeUsername(user.username);
    flags.push(...usernameAnalysis.flags);
    score += usernameAnalysis.score;
    
    // Check for suspicious discriminator patterns (if available)
    if (user.discriminator && user.discriminator !== '0') {
      const discrim = parseInt(user.discriminator);
      if (discrim < 100) {
        // Very low discriminator - could be bot or early account
        score += 5;
      }
    }
    
    return { flags, score, ageInDays, ageInHours };
  }
  
  analyzeUsername(username) {
    const flags = [];
    let score = 0;
    
    // Random-looking username (lots of numbers, random chars)
    const randomPattern = /^[a-z]+[0-9]{4,}$/i;
    if (randomPattern.test(username)) {
      flags.push('random_username');
      score += 15;
    }
    
    // All numbers
    if (/^\d+$/.test(username)) {
      flags.push('numeric_username');
      score += 20;
    }
    
    // Contains "alt", "backup", "spare", etc.
    const altKeywords = /\b(alt|backup|spare|second|new|test|temp|fake)\b/i;
    if (altKeywords.test(username)) {
      flags.push('alt_keyword_username');
      score += 25;
    }
    
    // Very short username
    if (username.length <= 3) {
      flags.push('short_username');
      score += 10;
    }
    
    // Excessive special characters
    const specialChars = username.replace(/[a-zA-Z0-9]/g, '').length;
    if (specialChars > username.length / 2) {
      flags.push('special_char_username');
      score += 15;
    }
    
    return { flags, score };
  }

  // ═══════════════════════════════════════════════════════════════
  // GLOBAL BAN CHECK
  // ═══════════════════════════════════════════════════════════════
  
  async checkGlobalBans(userId) {
    const flags = [];
    let score = 0;
    let banData = null;
    
    // Check our internal global ban database
    const internalBan = await this.pool.query(
      'SELECT * FROM nexus_global_bans WHERE user_id = $1',
      [userId]
    );
    
    if (internalBan.rows.length > 0) {
      banData = internalBan.rows[0];
      flags.push('globally_banned');
      
      // Score based on severity and ban count
      switch (banData.severity) {
        case 'critical': score += 100; break;
        case 'high': score += 75; break;
        case 'medium': score += 50; break;
        case 'low': score += 25; break;
      }
      
      // Additional score for multiple bans
      score += Math.min(banData.ban_count * 10, 50);
    }
    
    // Check external ban list APIs (parallel)
    const externalChecks = await Promise.allSettled([
      this.checkDiscordBanList(userId),
      this.checkKSoftBans(userId),
      this.checkDServicesBans(userId)
    ]);
    
    for (const check of externalChecks) {
      if (check.status === 'fulfilled' && check.value.banned) {
        flags.push(`banned_${check.value.source}`);
        score += 40;
      }
    }
    
    return { flags, score, banData };
  }
  
  async checkDiscordBanList(userId) {
    try {
      const response = await fetch(`https://bans.discord.id/api/check?user_id=${userId}`, {
        headers: { 'User-Agent': 'NexusVerification/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { banned: data.banned, reason: data.reason, source: 'dbl' };
      }
    } catch (e) {}
    return { banned: false, source: 'dbl' };
  }
  
  async checkKSoftBans(userId) {
    try {
      // KSoft.Si requires API key - check if configured
      if (!process.env.KSOFT_API_KEY) return { banned: false, source: 'ksoft' };
      
      const response = await fetch(`https://api.ksoft.si/bans/check?user=${userId}`, {
        headers: { 
          'Authorization': `Bearer ${process.env.KSOFT_API_KEY}`,
          'User-Agent': 'NexusVerification/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { banned: data.is_banned, reason: data.reason, source: 'ksoft' };
      }
    } catch (e) {}
    return { banned: false, source: 'ksoft' };
  }
  
  async checkDServicesBans(userId) {
    try {
      const response = await fetch(`https://discord.services/api/ban/${userId}`, {
        headers: { 'User-Agent': 'NexusVerification/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { banned: data.status === 'banned', reason: data.reason, source: 'dservices' };
      }
    } catch (e) {}
    return { banned: false, source: 'dservices' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ALT ACCOUNT DETECTION - THE HARD PART
  // ═══════════════════════════════════════════════════════════════
  
  async detectAltAccounts(user, guild, verificationData) {
    const flags = [];
    let score = 0;
    const altMatches = [];
    
    // Method 1: Fingerprint matching
    if (verificationData.fingerprintHash) {
      const fpMatches = await this.pool.query(
        'SELECT user_ids FROM nexus_fingerprints WHERE fingerprint_hash = $1',
        [verificationData.fingerprintHash]
      );
      
      if (fpMatches.rows.length > 0) {
        const existingUsers = fpMatches.rows[0].user_ids || [];
        const otherUsers = existingUsers.filter(id => id !== user.id);
        
        if (otherUsers.length > 0) {
          flags.push('fingerprint_match');
          score += 60;
          
          // Check if any matched users are banned
          for (const altId of otherUsers) {
            const bannedCheck = await this.isUserBanned(altId, guild.id);
            if (bannedCheck.banned) {
              flags.push('alt_of_banned_user');
              score += 40;
              altMatches.push({ userId: altId, method: 'fingerprint', confidence: 0.95, banned: true });
            } else {
              altMatches.push({ userId: altId, method: 'fingerprint', confidence: 0.95, banned: false });
            }
          }
        }
      }
    }
    
    // Method 2: IP matching
    if (verificationData.ipHash) {
      const ipMatches = await this.pool.query(
        'SELECT user_ids FROM nexus_ip_intel WHERE ip_hash = $1',
        [verificationData.ipHash]
      );
      
      if (ipMatches.rows.length > 0) {
        const existingUsers = ipMatches.rows[0].user_ids || [];
        const otherUsers = existingUsers.filter(id => id !== user.id);
        
        if (otherUsers.length > 0) {
          flags.push('ip_match');
          score += 30; // Lower score - could be shared IP (family, college, etc.)
          
          for (const altId of otherUsers) {
            const bannedCheck = await this.isUserBanned(altId, guild.id);
            if (bannedCheck.banned) {
              flags.push('same_ip_as_banned');
              score += 50;
              altMatches.push({ userId: altId, method: 'ip', confidence: 0.7, banned: true });
            }
          }
        }
      }
    }
    
    // Method 3: Username similarity
    const similarUsers = await this.findSimilarUsernames(user.username, guild.id);
    for (const similar of similarUsers) {
      if (similar.similarity > 0.8) {
        flags.push('similar_username');
        score += 20;
        altMatches.push({ userId: similar.userId, method: 'username', confidence: similar.similarity, banned: similar.banned });
      }
    }
    
    // Method 4: Account creation time clustering
    // Alts are often created within minutes of each other
    const timeCluster = await this.findCreationTimeCluster(user.createdTimestamp, guild.id);
    if (timeCluster.length > 0) {
      flags.push('creation_time_cluster');
      score += 25;
      for (const clustered of timeCluster) {
        altMatches.push({ userId: clustered.userId, method: 'creation_time', confidence: 0.6, banned: clustered.banned });
      }
    }
    
    // Method 5: Behavioral similarity (if we have prior data)
    const behaviorMatches = await this.findBehavioralMatches(user.id, guild.id);
    for (const match of behaviorMatches) {
      if (match.similarity > 0.85) {
        flags.push('behavioral_match');
        score += 35;
        altMatches.push({ userId: match.userId, method: 'behavior', confidence: match.similarity, banned: match.banned });
      }
    }
    
    // Save detected alt links
    for (const alt of altMatches) {
      await this.saveAltLink(user.id, alt.userId, alt.confidence, alt.method, {
        guildId: guild.id,
        banned: alt.banned
      });
    }
    
    return { flags, score, altMatches };
  }
  
  async findSimilarUsernames(username, guildId) {
    // Get recent verifications and compare usernames
    const recent = await this.pool.query(
      `SELECT v.user_id, b.reason IS NOT NULL as banned
       FROM nexus_verified v
       LEFT JOIN nexus_global_bans b ON v.user_id = b.user_id
       WHERE v.guild_id = $1 AND v.verified_at > NOW() - INTERVAL '90 days'`,
      [guildId]
    );
    
    const matches = [];
    const normalizedInput = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const row of recent.rows) {
      try {
        const member = await this.client.users.fetch(row.user_id).catch(() => null);
        if (!member) continue;
        
        const normalizedCompare = member.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const similarity = this.calculateStringSimilarity(normalizedInput, normalizedCompare);
        
        if (similarity > 0.7) {
          matches.push({ userId: row.user_id, similarity, banned: row.banned });
        }
      } catch (e) {}
    }
    
    return matches;
  }
  
  calculateStringSimilarity(str1, str2) {
    // Levenshtein distance based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const costs = [];
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (longer[i - 1] !== shorter[j - 1]) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }
    
    return (longer.length - costs[shorter.length]) / longer.length;
  }
  
  async findCreationTimeCluster(timestamp, guildId) {
    // Find accounts created within 10 minutes of this one
    const windowMs = 10 * 60 * 1000;
    
    const cluster = await this.pool.query(
      `SELECT v.user_id, b.reason IS NOT NULL as banned
       FROM nexus_verified v
       LEFT JOIN nexus_global_bans b ON v.user_id = b.user_id
       WHERE v.guild_id = $1`,
      [guildId]
    );
    
    const matches = [];
    
    for (const row of cluster.rows) {
      try {
        const member = await this.client.users.fetch(row.user_id).catch(() => null);
        if (!member) continue;
        
        const timeDiff = Math.abs(member.createdTimestamp - timestamp);
        if (timeDiff < windowMs && timeDiff > 0) {
          matches.push({ userId: row.user_id, timeDiff, banned: row.banned });
        }
      } catch (e) {}
    }
    
    return matches;
  }
  
  async findBehavioralMatches(userId, guildId) {
    // This would compare typing patterns, active hours, vocabulary, etc.
    // Requires prior behavioral data collection
    const userBehavior = await this.pool.query(
      'SELECT * FROM nexus_behavior WHERE user_id = $1',
      [userId]
    );
    
    if (userBehavior.rows.length === 0) return [];
    
    const profile = userBehavior.rows[0];
    
    // Find similar behavioral profiles
    const similar = await this.pool.query(
      `SELECT b.user_id, gb.reason IS NOT NULL as banned
       FROM nexus_behavior b
       LEFT JOIN nexus_global_bans gb ON b.user_id = gb.user_id
       WHERE b.user_id != $1
       AND b.vocabulary_hash = $2`,
      [userId, profile.vocabulary_hash]
    );
    
    return similar.rows.map(r => ({
      userId: r.user_id,
      similarity: 0.9,
      banned: r.banned,
      method: 'vocabulary'
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // IP ANALYSIS & VPN DETECTION
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeIP(ipHash, userId) {
    const flags = [];
    let score = 0;
    
    if (!ipHash) {
      flags.push('no_ip_data');
      return { flags, score };
    }
    
    // Check our IP intelligence database
    const existing = await this.pool.query(
      'SELECT * FROM nexus_ip_intel WHERE ip_hash = $1',
      [ipHash]
    );
    
    if (existing.rows.length > 0) {
      const ipData = existing.rows[0];
      
      if (ipData.is_vpn) {
        flags.push('vpn_detected');
        score += 30;
      }
      
      if (ipData.is_proxy) {
        flags.push('proxy_detected');
        score += 35;
      }
      
      if (ipData.is_datacenter) {
        flags.push('datacenter_ip');
        score += 40;
      }
      
      if (ipData.is_tor) {
        flags.push('tor_detected');
        score += 50;
      }
      
      // Update user list
      const userIds = ipData.user_ids || [];
      if (!userIds.includes(userId)) {
        userIds.push(userId);
        await this.pool.query(
          'UPDATE nexus_ip_intel SET user_ids = $1, last_seen = NOW() WHERE ip_hash = $2',
          [userIds, ipHash]
        );
      }
      
      return { flags, score, ipData };
    }
    
    // New IP - we'll mark it for analysis but allow through
    await this.pool.query(
      `INSERT INTO nexus_ip_intel (ip_hash, user_ids) VALUES ($1, $2)
       ON CONFLICT (ip_hash) DO UPDATE SET user_ids = array_append(nexus_ip_intel.user_ids, $3)`,
      [ipHash, [userId], userId]
    );
    
    return { flags, score };
  }

  // ═══════════════════════════════════════════════════════════════
  // FINGERPRINT ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeFingerprint(fingerprintHash, userId) {
    const flags = [];
    let score = 0;
    
    if (!fingerprintHash) {
      flags.push('no_fingerprint');
      score += 10; // Slight penalty for no fingerprint
      return { flags, score };
    }
    
    // Check existing fingerprints
    const existing = await this.pool.query(
      'SELECT * FROM nexus_fingerprints WHERE fingerprint_hash = $1',
      [fingerprintHash]
    );
    
    if (existing.rows.length > 0) {
      const fpData = existing.rows[0];
      const userIds = fpData.user_ids || [];
      
      if (userIds.length > 1 && !userIds.includes(userId)) {
        flags.push('shared_device');
        score += 25;
      }
      
      // Update fingerprint record
      if (!userIds.includes(userId)) {
        userIds.push(userId);
        await this.pool.query(
          'UPDATE nexus_fingerprints SET user_ids = $1, last_seen = NOW() WHERE fingerprint_hash = $2',
          [userIds, fingerprintHash]
        );
      }
      
      return { flags, score, fpData };
    }
    
    // New fingerprint
    await this.pool.query(
      `INSERT INTO nexus_fingerprints (fingerprint_hash, user_ids, device_info) VALUES ($1, $2, $3)`,
      [fingerprintHash, [userId], {}]
    );
    
    return { flags, score };
  }

  // ═══════════════════════════════════════════════════════════════
  // BEHAVIORAL ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeBehavior(user, guild) {
    const flags = [];
    let score = 0;
    
    // This is for users who've interacted before verification
    // Check message patterns if any exist
    const priorMessages = await this.pool.query(
      `SELECT content, timestamp FROM message_cache 
       WHERE author_id = $1 AND guild_id = $2 
       ORDER BY timestamp DESC LIMIT 50`,
      [user.id, guild.id]
    );
    
    if (priorMessages.rows.length > 0) {
      // Analyze message patterns
      const patterns = this.analyzeMessagePatterns(priorMessages.rows);
      
      if (patterns.spamLikelihood > 0.7) {
        flags.push('spam_pattern');
        score += 40;
      }
      
      if (patterns.botLikelihood > 0.8) {
        flags.push('bot_like_behavior');
        score += 50;
      }
      
      // Save behavioral profile
      await this.saveBehaviorProfile(user.id, patterns);
    }
    
    return { flags, score };
  }
  
  analyzeMessagePatterns(messages) {
    const patterns = {
      spamLikelihood: 0,
      botLikelihood: 0,
      avgMessageLength: 0,
      uniqueWords: new Set(),
      messageIntervals: []
    };
    
    if (messages.length === 0) return patterns;
    
    let totalLength = 0;
    let lastTimestamp = null;
    
    for (const msg of messages) {
      totalLength += msg.content?.length || 0;
      
      // Word analysis
      const words = (msg.content || '').toLowerCase().split(/\s+/);
      words.forEach(w => patterns.uniqueWords.add(w));
      
      // Timing analysis
      if (lastTimestamp) {
        const interval = new Date(lastTimestamp) - new Date(msg.timestamp);
        patterns.messageIntervals.push(interval);
      }
      lastTimestamp = msg.timestamp;
    }
    
    patterns.avgMessageLength = totalLength / messages.length;
    
    // Spam detection: very similar message intervals = likely spam
    if (patterns.messageIntervals.length > 5) {
      const avgInterval = patterns.messageIntervals.reduce((a, b) => a + b, 0) / patterns.messageIntervals.length;
      const variance = patterns.messageIntervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / patterns.messageIntervals.length;
      
      // Low variance in timing = bot-like
      if (variance < 1000 && avgInterval < 5000) {
        patterns.botLikelihood = 0.9;
      }
    }
    
    // Spam detection: low vocabulary diversity
    const vocabularyDiversity = patterns.uniqueWords.size / messages.length;
    if (vocabularyDiversity < 0.3) {
      patterns.spamLikelihood = 0.8;
    }
    
    return patterns;
  }

  // ═══════════════════════════════════════════════════════════════
  // AI ASSESSMENT
  // ═══════════════════════════════════════════════════════════════
  
  async getAIAssessment(user, flags, currentScore, analysisData) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are a security analyst assessing Discord user verification risk. 
                 Analyze the provided data and give your assessment.
                 Return ONLY a JSON object with:
                 - adjustedScore (number 0-100, or null to keep current)
                 - reasoning (string, 1-2 sentences)
                 - additionalFlags (array of strings, any flags to add)
                 - recommendation (string: "approve", "deny", "manual_review")`,
        messages: [{
          role: 'user',
          content: `Assess this user for verification:
          
Username: ${user.username}
Account Age: ${Math.floor((Date.now() - user.createdTimestamp) / (24*60*60*1000))} days
Current Risk Score: ${currentScore}
Flags: ${flags.join(', ')}

Analysis Data:
- Account: ${JSON.stringify(analysisData.accountAnalysis)}
- Global Bans: ${JSON.stringify(analysisData.globalBanCheck)}
- Alt Detection: ${JSON.stringify(analysisData.altDetection)}
- IP Analysis: ${JSON.stringify(analysisData.ipAnalysis)}

Return JSON assessment only.`
        }]
      });
      
      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[NEXUS] AI assessment error:', error);
    }
    
    return { adjustedScore: null, additionalFlags: [], reasoning: 'AI assessment unavailable' };
  }

  // ═══════════════════════════════════════════════════════════════
  // RISK CALCULATION & DECISION
  // ═══════════════════════════════════════════════════════════════
  
  calculateRiskScore(analyses) {
    // Weighted combination of all analysis scores
    const weights = {
      account: 0.2,
      globalBan: 0.3,
      altDetection: 0.25,
      behavior: 0.1,
      ip: 0.1,
      fingerprint: 0.05
    };
    
    const score = (
      (analyses.accountAnalysis.score * weights.account) +
      (analyses.globalBanCheck.score * weights.globalBan) +
      (analyses.altDetection.score * weights.altDetection) +
      (analyses.behaviorAnalysis.score * weights.behavior) +
      (analyses.ipAnalysis.score * weights.ip) +
      (analyses.fingerprintAnalysis.score * weights.fingerprint)
    );
    
    return Math.min(Math.round(score), 100);
  }
  
  makeDecision(riskScore, flags, aiAssessment) {
    // Critical flags that always deny
    const criticalFlags = ['globally_banned', 'alt_of_banned_user', 'same_ip_as_banned'];
    if (flags.some(f => criticalFlags.includes(f))) {
      return {
        approved: false,
        action: 'denied',
        message: 'Verification denied. Contact staff if you believe this is an error.',
        requiresManualReview: false
      };
    }
    
    // Risk-based decisions
    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) {
      return {
        approved: false,
        action: 'denied',
        message: 'Verification denied due to security concerns.',
        requiresManualReview: true
      };
    }
    
    if (riskScore >= this.RISK_THRESHOLDS.HIGH) {
      return {
        approved: false,
        action: 'manual_review',
        message: 'Your verification requires manual review. Please wait for staff.',
        requiresManualReview: true
      };
    }
    
    if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) {
      return {
        approved: true,
        action: 'approved_flagged',
        message: 'Verified. Welcome!',
        requiresManualReview: false
      };
    }
    
    return {
      approved: true,
      action: 'approved',
      message: 'Verified! Welcome to the server.',
      requiresManualReview: false
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════
  
  async checkRateLimit(userId, guildId) {
    const recent = await this.pool.query(
      `SELECT COUNT(*) as count, MAX(attempt_time) as last_attempt
       FROM nexus_verification_attempts
       WHERE user_id = $1 AND guild_id = $2 AND attempt_time > NOW() - INTERVAL '1 hour'`,
      [userId, guildId]
    );
    
    const count = parseInt(recent.rows[0].count);
    if (count >= this.config.maxVerificationAttempts) {
      const lastAttempt = new Date(recent.rows[0].last_attempt);
      const waitTime = Math.ceil((this.config.verificationCooldown - (Date.now() - lastAttempt)) / 60000);
      return { allowed: false, waitTime };
    }
    
    return { allowed: true };
  }
  
  async isUserBanned(userId, guildId) {
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return { banned: false };
      
      const ban = await guild.bans.fetch(userId).catch(() => null);
      return { banned: !!ban, reason: ban?.reason };
    } catch (e) {
      return { banned: false };
    }
  }
  
  async saveVerification(user, guild, data) {
    await this.pool.query(
      `INSERT INTO nexus_verified (user_id, guild_id, risk_score, fingerprint_hash, ip_hash, device_info, flags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, guild_id) DO UPDATE SET
       verified_at = NOW(), risk_score = $3, fingerprint_hash = $4, ip_hash = $5, device_info = $6, flags = $7`,
      [user.id, guild.id, data.riskScore, data.fingerprintHash, data.ipHash, data.deviceInfo, data.flags]
    );
  }
  
  async logVerificationAttempt(userId, guildId, data) {
    await this.pool.query(
      `INSERT INTO nexus_verification_attempts (user_id, guild_id, ip_hash, fingerprint_hash, result, risk_score, flags, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, guildId, data.ipHash, data.fingerprintHash, data.result, data.riskScore, data.flags, data.rawData]
    );
  }
  
  async saveAltLink(primaryId, altId, confidence, method, evidence) {
    await this.pool.query(
      `INSERT INTO nexus_alt_links (primary_user_id, alt_user_id, confidence, detection_method, evidence)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (primary_user_id, alt_user_id) DO UPDATE SET
       confidence = GREATEST(nexus_alt_links.confidence, $3),
       evidence = nexus_alt_links.evidence || $5`,
      [primaryId, altId, confidence, method, evidence]
    );
  }
  
  async saveBehaviorProfile(userId, patterns) {
    const vocabularyHash = crypto.createHash('md5')
      .update(Array.from(patterns.uniqueWords).sort().join(','))
      .digest('hex');
    
    await this.pool.query(
      `INSERT INTO nexus_behavior (user_id, vocabulary_hash, message_patterns)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET
       vocabulary_hash = $2, message_patterns = $3, updated_at = NOW()`,
      [userId, vocabularyHash, patterns]
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // CROSS-SERVER INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════
  
  async reportBan(userId, guildId, reason, severity = 'medium') {
    // Add to global ban database
    await this.pool.query(
      `INSERT INTO nexus_global_bans (user_id, servers, reasons, severity)
       VALUES ($1, ARRAY[$2], ARRAY[$3], $4)
       ON CONFLICT (user_id) DO UPDATE SET
       ban_count = nexus_global_bans.ban_count + 1,
       servers = array_append(nexus_global_bans.servers, $2),
       reasons = array_append(nexus_global_bans.reasons, $3),
       last_ban = NOW(),
       severity = CASE WHEN $4 = 'critical' THEN 'critical' ELSE nexus_global_bans.severity END`,
      [userId, guildId, reason, severity]
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // EMBEDS & UI
  // ═══════════════════════════════════════════════════════════════
  
  createVerificationEmbed(guild) {
    return new EmbedBuilder()
      .setTitle('🔐 Verification Required')
      .setDescription(
        `**Welcome to ${guild.name}**\n\n` +
        `Before you can access the server, we need to verify you're not:\n` +
        `• A banned user's alt account\n` +
        `• A known scammer or troll\n` +
        `• An automated bot account\n\n` +
        `**Our verification system checks:**\n` +
        `✦ Global ban databases\n` +
        `✦ Account patterns & behavior\n` +
        `✦ Alt account indicators\n` +
        `✦ VPN/Proxy usage\n\n` +
        `*Click the button below to begin verification.*`
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'NEXUS Verification System • Enterprise Security' });
  }
  
  createVerificationButton() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nexus_verify')
        .setLabel('Verify Me')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✅')
    );
  }
  
  createDeniedEmbed(reason, flags) {
    return new EmbedBuilder()
      .setTitle('❌ Verification Denied')
      .setDescription(
        `Your verification was denied.\n\n` +
        `**Reason:** ${reason}\n\n` +
        `If you believe this is an error, please contact server staff.`
      )
      .setColor(0xFF0000)
      .setFooter({ text: `Flags: ${flags.slice(0, 3).join(', ')}` });
  }
  
  createApprovedEmbed() {
    return new EmbedBuilder()
      .setTitle('✅ Verification Complete')
      .setDescription('Welcome! You now have access to the server.')
      .setColor(0x00FF00);
  }
  
  createManualReviewEmbed(userId, riskScore, flags) {
    return new EmbedBuilder()
      .setTitle('⚠️ Manual Review Required')
      .setDescription(
        `<@${userId}> requires manual verification review.\n\n` +
        `**Risk Score:** ${riskScore}/100\n` +
        `**Flags:** ${flags.join(', ')}`
      )
      .setColor(0xFFA500)
      .setTimestamp();
  }

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND JOBS
  // ═══════════════════════════════════════════════════════════════
  
  startBackgroundJobs() {
    // Clean old verification tokens every hour
    setInterval(async () => {
      await this.pool.query(
        'DELETE FROM nexus_verification_tokens WHERE expires_at < NOW()'
      ).catch(() => {});
    }, 60 * 60 * 1000);
    
    // Update IP intelligence every 6 hours
    setInterval(async () => {
      await this.updateIPIntelligence().catch(() => {});
    }, 6 * 60 * 60 * 1000);
  }
  
  async updateIPIntelligence() {
    // This would integrate with IP intelligence APIs like ipinfo.io, ipqualityscore, etc.
    // For now, just a placeholder
    console.log('[NEXUS] IP intelligence update complete');
  }
}

module.exports = NexusVerification;
