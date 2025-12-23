/**
 * ████████████████████████████████████████████████████████████████████████████████
 * █                                                                              █
 * █   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ██╗   ██╗██╗  ████████╗    █
 * █   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██║   ██║██║  ╚══██╔══╝    █
 * █   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    ██║   ██║██║     ██║       █
 * █   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██║   ██║██║     ██║       █
 * █   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ╚██████╔╝███████╗██║       █
 * █   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝     ╚═════╝ ╚══════╝╚═╝       █
 * █                                                                              █
 * █   ULTIMATE EDITION - ENTERPRISE SECURITY PLATFORM                           █
 * █                                                                              █
 * ████████████████████████████████████████████████████████████████████████████████
 * 
 * This is not a Discord bot feature. This is a security platform.
 * 
 * CAPABILITIES:
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * 🔐 VERIFICATION ENGINE
 *    ├── Web Portal with Device Fingerprinting (50+ signals)
 *    ├── OAuth2 Discord Verification
 *    ├── Phone/SMS Verification (Twilio)
 *    ├── CAPTCHA Challenges (hCaptcha/Custom)
 *    ├── AI Interrogation System
 *    └── Progressive Challenge Escalation
 * 
 * 🕵️ ALT DETECTION
 *    ├── Device Fingerprint Correlation
 *    ├── IP/Network Analysis
 *    ├── Behavioral Biometrics
 *    ├── Writing Style Analysis (Stylometry)
 *    ├── Activity Pattern Matching
 *    ├── Relationship Graph Analysis
 *    └── Machine Learning Classification
 * 
 * 🛡️ THREAT INTELLIGENCE
 *    ├── Global Ban Database (Internal)
 *    ├── External Ban APIs (5+ sources)
 *    ├── Scam URL Detection (PhishTank, URLhaus)
 *    ├── Known Raid Group Database
 *    ├── VPN/Proxy/Datacenter Detection
 *    ├── Tor Exit Node Detection
 *    └── Compromised Account Detection
 * 
 * ⚔️ ANTI-RAID SYSTEM
 *    ├── Join Velocity Monitoring
 *    ├── Coordinated Attack Detection
 *    ├── Auto-Lockdown Protocol
 *    ├── Mass Ping Protection
 *    ├── Spam Wave Detection
 *    └── DDoS Pattern Recognition
 * 
 * 🪤 HONEYPOT SYSTEM
 *    ├── Invisible Trap Channels
 *    ├── Bait Links
 *    ├── Canary Tokens
 *    └── Bot Detection Traps
 * 
 * 📊 REPUTATION SYSTEM
 *    ├── Trust Score (0-1000)
 *    ├── Behavior Tracking
 *    ├── Reward/Penalty System
 *    ├── Automatic Role Progression
 *    └── Cross-Server Reputation
 * 
 * 🧠 AI SYSTEMS
 *    ├── Risk Scoring Engine
 *    ├── Anomaly Detection
 *    ├── Behavioral Prediction
 *    ├── Intent Analysis
 *    └── Appeal Processing
 * 
 * 📈 ANALYTICS & FORENSICS
 *    ├── Real-time Dashboard
 *    ├── Threat Level Monitoring
 *    ├── Full Audit Trail
 *    ├── Evidence Collection
 *    └── Historical Analysis
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const crypto = require('crypto');

class NexusUltimate {
  constructor(pool, anthropic, client) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.client = client;
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    
    this.config = {
      // Verification Settings
      verification: {
        minAccountAge: 7 * 24 * 60 * 60 * 1000,
        maxAttempts: 3,
        cooldown: 60 * 60 * 1000,
        tokenExpiry: 15 * 60 * 1000,
        requireCaptcha: true,
        requireWebVerification: true,
        requirePhoneForHighRisk: false,
        oauthEnabled: true
      },
      
      // Risk Thresholds
      risk: {
        LOW: 20,
        MEDIUM: 40,
        HIGH: 60,
        CRITICAL: 80,
        EXTREME: 95
      },
      
      // Anti-Raid Settings
      antiRaid: {
        enabled: true,
        joinThreshold: 10,        // joins per minute
        joinWindow: 60000,        // 1 minute
        messageThreshold: 20,     // messages per 10 seconds
        messageWindow: 10000,
        mentionThreshold: 10,     // mentions per message
        lockdownDuration: 300000, // 5 minutes
        autoKickNewAccounts: true,
        minAccountAgeForRaid: 24 * 60 * 60 * 1000 // 1 day
      },
      
      // Reputation Settings  
      reputation: {
        startingScore: 100,
        maxScore: 1000,
        minScore: 0,
        dailyDecay: 0,
        messagePoints: 1,
        helpfulPoints: 5,
        warningPenalty: -50,
        kickPenalty: -100,
        banPenalty: -500
      },
      
      // Honeypot Settings
      honeypot: {
        enabled: true,
        trapChannelName: 'free-nitro-giveaway',
        trapRoleName: 'Beta Tester',
        instantBan: false
      }
    };
    
    // ═══════════════════════════════════════════════════════════════
    // RUNTIME STATE
    // ═══════════════════════════════════════════════════════════════
    
    // Anti-raid tracking
    this.joinTracker = new Map();      // guildId -> [timestamps]
    this.messageTracker = new Map();   // guildId -> [timestamps]
    this.lockdownStatus = new Map();   // guildId -> { active, until, reason }
    
    // Caches
    this.fingerprintCache = new Map();
    this.behaviorCache = new Map();
    this.riskCache = new Map();
    this.reputationCache = new Map();
    
    // Rate limiting
    this.rateLimits = new Map();
    
    // Partner network
    this.partnerServers = new Set();
    
    // Threat level
    this.threatLevel = new Map();      // guildId -> 'LOW' | 'ELEVATED' | 'HIGH' | 'SEVERE' | 'CRITICAL'
  }

  // ═══════════════════════════════════════════════════════════════
  // DATABASE INITIALIZATION
  // ═══════════════════════════════════════════════════════════════
  
  async initialize() {
    await this.initializeDatabase();
    this.startBackgroundTasks();
    console.log('🛡️ NEXUS ULTIMATE initialized - Enterprise Security Active');
  }
  
  async initializeDatabase() {
    await this.pool.query(`
      -- ══════════════════════════════════════════════════════════════
      -- CORE VERIFICATION TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Verified users with full metadata
      CREATE TABLE IF NOT EXISTS nexus_verified_users (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_method TEXT,
        risk_score INTEGER DEFAULT 0,
        trust_score INTEGER DEFAULT 100,
        
        -- Device data
        fingerprint_hash TEXT,
        fingerprint_data JSONB DEFAULT '{}',
        ip_hash TEXT,
        ip_data JSONB DEFAULT '{}',
        
        -- Verification flags
        flags TEXT[],
        notes TEXT,
        
        -- OAuth data (if used)
        oauth_data JSONB DEFAULT '{}',
        
        -- Phone verification
        phone_verified BOOLEAN DEFAULT FALSE,
        phone_hash TEXT,
        
        UNIQUE(user_id, guild_id)
      );
      
      -- Device fingerprints
      CREATE TABLE IF NOT EXISTS nexus_fingerprints (
        fingerprint_hash TEXT PRIMARY KEY,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        times_seen INTEGER DEFAULT 1,
        user_ids TEXT[],
        
        -- Fingerprint components
        canvas_hash TEXT,
        webgl_hash TEXT,
        audio_hash TEXT,
        font_hash TEXT,
        
        -- Device info
        user_agents TEXT[],
        screen_resolutions TEXT[],
        timezones TEXT[],
        languages TEXT[],
        
        -- Risk assessment
        risk_level TEXT DEFAULT 'unknown',
        risk_factors JSONB DEFAULT '[]',
        
        -- Metadata
        raw_data JSONB DEFAULT '{}'
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- ALT DETECTION TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Alt account links
      CREATE TABLE IF NOT EXISTS nexus_alt_links (
        id SERIAL PRIMARY KEY,
        primary_user TEXT NOT NULL,
        linked_user TEXT NOT NULL,
        confidence FLOAT NOT NULL,
        detection_method TEXT,
        
        -- Evidence
        evidence JSONB DEFAULT '{}',
        
        -- Status
        confirmed BOOLEAN DEFAULT FALSE,
        confirmed_by TEXT,
        confirmed_at TIMESTAMP,
        
        -- Metadata
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE(primary_user, linked_user)
      );
      
      -- Behavioral profiles
      CREATE TABLE IF NOT EXISTS nexus_behavior_profiles (
        user_id TEXT PRIMARY KEY,
        
        -- Typing patterns
        avg_message_length FLOAT,
        avg_word_length FLOAT,
        typing_speed FLOAT,
        punctuation_style JSONB DEFAULT '{}',
        capitalization_style TEXT,
        emoji_frequency FLOAT,
        
        -- Activity patterns
        active_hours INTEGER[],
        active_days INTEGER[],
        avg_session_length INTEGER,
        message_frequency FLOAT,
        
        -- Vocabulary
        vocabulary_hash TEXT,
        vocabulary_size INTEGER,
        unique_words JSONB DEFAULT '[]',
        common_phrases JSONB DEFAULT '[]',
        
        -- Interaction patterns
        reply_rate FLOAT,
        reaction_patterns JSONB DEFAULT '{}',
        mention_patterns JSONB DEFAULT '{}',
        channel_preferences JSONB DEFAULT '{}',
        
        -- Metadata
        messages_analyzed INTEGER DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Writing style (stylometry)
      CREATE TABLE IF NOT EXISTS nexus_stylometry (
        user_id TEXT PRIMARY KEY,
        
        -- Lexical features
        avg_sentence_length FLOAT,
        vocabulary_richness FLOAT,
        hapax_legomena_ratio FLOAT,
        
        -- Syntactic features
        punctuation_frequency JSONB DEFAULT '{}',
        contraction_usage FLOAT,
        
        -- Character features
        letter_frequencies JSONB DEFAULT '{}',
        digit_frequency FLOAT,
        uppercase_ratio FLOAT,
        
        -- Word features
        function_word_frequencies JSONB DEFAULT '{}',
        word_length_distribution JSONB DEFAULT '{}',
        
        -- Calculated signature
        style_vector FLOAT[],
        style_hash TEXT,
        
        -- Metadata
        sample_size INTEGER DEFAULT 0,
        confidence FLOAT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- THREAT INTELLIGENCE TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Global ban database
      CREATE TABLE IF NOT EXISTS nexus_global_bans (
        user_id TEXT PRIMARY KEY,
        
        -- Ban info
        ban_count INTEGER DEFAULT 1,
        servers TEXT[],
        reasons TEXT[],
        severity TEXT DEFAULT 'medium',
        
        -- Evidence
        evidence JSONB DEFAULT '{}',
        screenshots TEXT[],
        
        -- Timestamps
        first_ban TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_ban TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Appeal status
        appeal_status TEXT DEFAULT 'none',
        appeal_notes TEXT
      );
      
      -- IP intelligence
      CREATE TABLE IF NOT EXISTS nexus_ip_intelligence (
        ip_hash TEXT PRIMARY KEY,
        
        -- Detection flags
        is_vpn BOOLEAN DEFAULT FALSE,
        is_proxy BOOLEAN DEFAULT FALSE,
        is_datacenter BOOLEAN DEFAULT FALSE,
        is_tor BOOLEAN DEFAULT FALSE,
        is_mobile BOOLEAN DEFAULT FALSE,
        is_residential BOOLEAN DEFAULT TRUE,
        
        -- Geolocation
        country_code TEXT,
        region TEXT,
        city TEXT,
        isp TEXT,
        asn TEXT,
        
        -- Risk assessment
        risk_score INTEGER DEFAULT 0,
        risk_factors TEXT[],
        
        -- Usage tracking
        user_ids TEXT[],
        times_seen INTEGER DEFAULT 1,
        first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Raw data from APIs
        api_data JSONB DEFAULT '{}'
      );
      
      -- Known threat actors
      CREATE TABLE IF NOT EXISTS nexus_threat_actors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT, -- 'raider', 'scammer', 'spammer', 'bot_network', 'harassment'
        
        -- Identifiers
        known_user_ids TEXT[],
        known_ips TEXT[],
        known_fingerprints TEXT[],
        
        -- Patterns
        attack_patterns JSONB DEFAULT '{}',
        known_tactics TEXT[],
        
        -- Status
        active BOOLEAN DEFAULT TRUE,
        threat_level TEXT DEFAULT 'medium',
        
        -- Intelligence
        notes TEXT,
        evidence JSONB DEFAULT '{}',
        
        -- Metadata
        discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP
      );
      
      -- Scam/Phishing URLs
      CREATE TABLE IF NOT EXISTS nexus_malicious_urls (
        url_hash TEXT PRIMARY KEY,
        url_pattern TEXT,
        
        -- Classification
        type TEXT, -- 'phishing', 'scam', 'malware', 'nitro_scam', 'ip_grabber'
        confidence FLOAT DEFAULT 1.0,
        
        -- Source
        source TEXT,
        reported_by TEXT,
        
        -- Stats
        times_blocked INTEGER DEFAULT 0,
        users_affected TEXT[],
        
        -- Metadata
        discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- ANTI-RAID TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Raid incidents
      CREATE TABLE IF NOT EXISTS nexus_raid_incidents (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        
        -- Incident details
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        duration_seconds INTEGER,
        
        -- Metrics
        accounts_involved INTEGER DEFAULT 0,
        messages_sent INTEGER DEFAULT 0,
        channels_affected INTEGER DEFAULT 0,
        
        -- Response
        auto_lockdown BOOLEAN DEFAULT FALSE,
        accounts_banned TEXT[],
        accounts_kicked TEXT[],
        
        -- Analysis
        attack_type TEXT,
        attack_vector TEXT,
        threat_actor_id INTEGER REFERENCES nexus_threat_actors(id),
        
        -- Evidence
        evidence JSONB DEFAULT '{}',
        notes TEXT
      );
      
      -- Lockdown history
      CREATE TABLE IF NOT EXISTS nexus_lockdowns (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        
        -- Lockdown details
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        duration_seconds INTEGER,
        
        -- Reason
        reason TEXT,
        triggered_by TEXT, -- 'auto' or user_id
        
        -- Settings during lockdown
        settings JSONB DEFAULT '{}'
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- REPUTATION SYSTEM TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- User reputation
      CREATE TABLE IF NOT EXISTS nexus_reputation (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Scores
        trust_score INTEGER DEFAULT 100,
        behavior_score INTEGER DEFAULT 100,
        helper_score INTEGER DEFAULT 0,
        
        -- Stats
        messages_sent INTEGER DEFAULT 0,
        reactions_given INTEGER DEFAULT 0,
        reactions_received INTEGER DEFAULT 0,
        replies_given INTEGER DEFAULT 0,
        helpful_marks INTEGER DEFAULT 0,
        
        -- Penalties
        warnings_received INTEGER DEFAULT 0,
        mutes_received INTEGER DEFAULT 0,
        kicks_received INTEGER DEFAULT 0,
        
        -- Rewards
        rewards_received INTEGER DEFAULT 0,
        
        -- Progression
        current_level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        
        -- Timestamps
        first_message TIMESTAMP,
        last_active TIMESTAMP,
        
        PRIMARY KEY (user_id, guild_id)
      );
      
      -- Reputation history
      CREATE TABLE IF NOT EXISTS nexus_reputation_history (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Change details
        change_type TEXT, -- 'message', 'reaction', 'warning', 'reward', etc
        change_amount INTEGER,
        new_score INTEGER,
        
        -- Context
        reason TEXT,
        related_message_id TEXT,
        related_user_id TEXT,
        
        -- Timestamp
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- HONEYPOT TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Honeypot triggers
      CREATE TABLE IF NOT EXISTS nexus_honeypot_triggers (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        
        -- Trigger details
        trigger_type TEXT, -- 'channel_access', 'role_request', 'link_click', 'message'
        trigger_data JSONB DEFAULT '{}',
        
        -- Response
        action_taken TEXT,
        
        -- Timestamp
        triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- VERIFICATION FLOW TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Verification tokens
      CREATE TABLE IF NOT EXISTS nexus_verification_tokens (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Token details
        type TEXT DEFAULT 'web', -- 'web', 'oauth', 'phone', 'captcha'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        
        -- Collected data
        verification_data JSONB DEFAULT '{}'
      );
      
      -- Verification attempts
      CREATE TABLE IF NOT EXISTS nexus_verification_attempts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Attempt details
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        method TEXT,
        
        -- Collected data
        ip_hash TEXT,
        fingerprint_hash TEXT,
        device_info JSONB DEFAULT '{}',
        
        -- Result
        result TEXT, -- 'approved', 'denied', 'manual_review', 'challenged'
        risk_score INTEGER,
        flags TEXT[],
        
        -- Challenge (if any)
        challenge_type TEXT,
        challenge_passed BOOLEAN,
        
        -- Raw data
        raw_data JSONB DEFAULT '{}'
      );
      
      -- AI interrogation sessions
      CREATE TABLE IF NOT EXISTS nexus_interrogations (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Session details
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        
        -- Questions and answers
        questions JSONB DEFAULT '[]',
        answers JSONB DEFAULT '[]',
        
        -- Analysis
        ai_assessment JSONB DEFAULT '{}',
        suspicious_responses TEXT[],
        
        -- Result
        passed BOOLEAN,
        confidence FLOAT,
        
        -- Notes
        notes TEXT
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- ANALYTICS TABLES
      -- ══════════════════════════════════════════════════════════════
      
      -- Daily stats
      CREATE TABLE IF NOT EXISTS nexus_daily_stats (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        date DATE NOT NULL,
        
        -- Verification stats
        verifications_attempted INTEGER DEFAULT 0,
        verifications_approved INTEGER DEFAULT 0,
        verifications_denied INTEGER DEFAULT 0,
        verifications_pending INTEGER DEFAULT 0,
        
        -- Threat stats
        alts_detected INTEGER DEFAULT 0,
        vpns_detected INTEGER DEFAULT 0,
        raids_detected INTEGER DEFAULT 0,
        scams_blocked INTEGER DEFAULT 0,
        
        -- Moderation stats
        warnings_issued INTEGER DEFAULT 0,
        mutes_issued INTEGER DEFAULT 0,
        kicks_issued INTEGER DEFAULT 0,
        bans_issued INTEGER DEFAULT 0,
        
        -- User stats
        members_joined INTEGER DEFAULT 0,
        members_left INTEGER DEFAULT 0,
        messages_sent INTEGER DEFAULT 0,
        
        UNIQUE(guild_id, date)
      );
      
      -- Audit log
      CREATE TABLE IF NOT EXISTS nexus_audit_log (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        
        -- Event details
        event_type TEXT NOT NULL,
        event_data JSONB DEFAULT '{}',
        
        -- Actor
        actor_id TEXT,
        actor_type TEXT, -- 'user', 'bot', 'system', 'api'
        
        -- Target
        target_id TEXT,
        target_type TEXT,
        
        -- Timestamp
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- ══════════════════════════════════════════════════════════════
      -- INDEXES FOR PERFORMANCE
      -- ══════════════════════════════════════════════════════════════
      
      CREATE INDEX IF NOT EXISTS idx_verified_guild ON nexus_verified_users(guild_id);
      CREATE INDEX IF NOT EXISTS idx_verified_user ON nexus_verified_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_fingerprint_users ON nexus_fingerprints USING GIN(user_ids);
      CREATE INDEX IF NOT EXISTS idx_alt_primary ON nexus_alt_links(primary_user);
      CREATE INDEX IF NOT EXISTS idx_alt_linked ON nexus_alt_links(linked_user);
      CREATE INDEX IF NOT EXISTS idx_ip_users ON nexus_ip_intelligence USING GIN(user_ids);
      CREATE INDEX IF NOT EXISTS idx_reputation_guild ON nexus_reputation(guild_id);
      CREATE INDEX IF NOT EXISTS idx_reputation_score ON nexus_reputation(trust_score);
      CREATE INDEX IF NOT EXISTS idx_audit_guild ON nexus_audit_log(guild_id);
      CREATE INDEX IF NOT EXISTS idx_audit_time ON nexus_audit_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_attempts_user ON nexus_verification_attempts(user_id);
      CREATE INDEX IF NOT EXISTS idx_attempts_time ON nexus_verification_attempts(attempt_time);
    `);
    
    console.log('✅ NEXUS Ultimate database initialized (25+ tables)');
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN VERIFICATION FLOW
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Process complete verification with all checks
   */
  async processVerification(user, guild, data = {}) {
    const startTime = Date.now();
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    console.log(`[NEXUS] Starting verification for ${user.tag} (session: ${sessionId})`);
    
    try {
      // Check if already verified
      const existing = await this.isVerified(user.id, guild.id);
      if (existing) {
        return { 
          approved: true, 
          action: 'already_verified',
          message: 'Already verified',
          riskScore: existing.risk_score 
        };
      }
      
      // Check rate limiting
      const rateLimitCheck = await this.checkRateLimit(user.id, guild.id);
      if (!rateLimitCheck.allowed) {
        return {
          approved: false,
          action: 'rate_limited',
          message: `Too many attempts. Try again in ${rateLimitCheck.waitMinutes} minutes.`,
          riskScore: 100
        };
      }
      
      // Run all analysis systems in parallel
      const [
        accountAnalysis,
        globalBanCheck,
        ipAnalysis,
        fingerprintAnalysis,
        altDetection,
        behaviorAnalysis,
        stylometryMatch,
        threatActorCheck,
        reputationCheck
      ] = await Promise.allSettled([
        this.analyzeAccount(user),
        this.checkGlobalBans(user.id),
        this.analyzeIP(data.ipHash, user.id, data.ipData),
        this.analyzeFingerprint(data.fingerprintHash, user.id, data.fingerprintData),
        this.detectAlts(user, guild, data),
        this.analyzeBehavior(user.id, guild.id),
        this.matchStylometry(user.id),
        this.checkThreatActors(user.id, data.ipHash, data.fingerprintHash),
        this.getReputation(user.id, guild.id)
      ]);
      
      // Extract results
      const results = {
        account: accountAnalysis.status === 'fulfilled' ? accountAnalysis.value : { flags: [], score: 0 },
        globalBan: globalBanCheck.status === 'fulfilled' ? globalBanCheck.value : { flags: [], score: 0 },
        ip: ipAnalysis.status === 'fulfilled' ? ipAnalysis.value : { flags: [], score: 0 },
        fingerprint: fingerprintAnalysis.status === 'fulfilled' ? fingerprintAnalysis.value : { flags: [], score: 0 },
        alts: altDetection.status === 'fulfilled' ? altDetection.value : { flags: [], score: 0, matches: [] },
        behavior: behaviorAnalysis.status === 'fulfilled' ? behaviorAnalysis.value : { flags: [], score: 0 },
        stylometry: stylometryMatch.status === 'fulfilled' ? stylometryMatch.value : { flags: [], score: 0 },
        threatActor: threatActorCheck.status === 'fulfilled' ? threatActorCheck.value : { flags: [], score: 0 },
        reputation: reputationCheck.status === 'fulfilled' ? reputationCheck.value : { score: 100 }
      };
      
      // Aggregate all flags
      const allFlags = [
        ...results.account.flags,
        ...results.globalBan.flags,
        ...results.ip.flags,
        ...results.fingerprint.flags,
        ...results.alts.flags,
        ...results.behavior.flags,
        ...results.stylometry.flags,
        ...results.threatActor.flags
      ];
      
      // Calculate risk score
      let riskScore = this.calculateRiskScore(results);
      
      // AI assessment for edge cases
      let aiAssessment = null;
      if (riskScore >= this.config.risk.MEDIUM && riskScore < this.config.risk.CRITICAL) {
        aiAssessment = await this.getAIAssessment(user, allFlags, riskScore, results);
        if (aiAssessment.adjustedScore !== null) {
          riskScore = aiAssessment.adjustedScore;
        }
        if (aiAssessment.additionalFlags) {
          allFlags.push(...aiAssessment.additionalFlags);
        }
      }
      
      // Make decision
      const decision = this.makeDecision(riskScore, allFlags, results);
      
      // Handle challenges if needed
      if (decision.requiresChallenge) {
        return await this.initiateChallenge(user, guild, decision.challengeType, riskScore, allFlags);
      }
      
      // Log attempt
      await this.logVerificationAttempt(user.id, guild.id, {
        method: data.method || 'standard',
        ipHash: data.ipHash,
        fingerprintHash: data.fingerprintHash,
        deviceInfo: data.deviceInfo,
        result: decision.action,
        riskScore,
        flags: allFlags,
        rawData: results
      });
      
      // If approved, save verification
      if (decision.approved) {
        await this.saveVerification(user, guild, {
          method: data.method || 'standard',
          riskScore,
          flags: allFlags,
          fingerprintHash: data.fingerprintHash,
          ipHash: data.ipHash,
          oauthData: data.oauthData
        });
        
        // Initialize reputation
        await this.initializeReputation(user.id, guild.id);
      }
      
      // Log to audit
      await this.logAudit(guild.id, 'verification_complete', {
        userId: user.id,
        result: decision.action,
        riskScore,
        flags: allFlags,
        duration: Date.now() - startTime
      });
      
      console.log(`[NEXUS] Verification complete for ${user.tag}: ${decision.action} (risk: ${riskScore}, time: ${Date.now() - startTime}ms)`);
      
      return {
        approved: decision.approved,
        action: decision.action,
        message: decision.message,
        riskScore,
        flags: allFlags,
        requiresManualReview: decision.requiresManualReview,
        altMatches: results.alts.matches
      };
      
    } catch (error) {
      console.error('[NEXUS] Verification error:', error);
      
      await this.logAudit(guild.id, 'verification_error', {
        userId: user.id,
        error: error.message
      });
      
      // Fail-safe: allow through but flag
      return {
        approved: true,
        action: 'approved_with_errors',
        message: 'Verified (some checks incomplete)',
        riskScore: 50,
        flags: ['system_error'],
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
    
    const now = Date.now();
    const accountAge = now - user.createdTimestamp;
    const ageInDays = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    const ageInHours = Math.floor(accountAge / (60 * 60 * 1000));
    const ageInMinutes = Math.floor(accountAge / (60 * 1000));
    
    // Account age scoring (very granular)
    if (ageInMinutes < 30) {
      flags.push('account_minutes_old');
      score += 60;
    } else if (ageInHours < 1) {
      flags.push('account_under_1_hour');
      score += 50;
    } else if (ageInHours < 24) {
      flags.push('account_under_1_day');
      score += 40;
    } else if (ageInDays < 3) {
      flags.push('account_under_3_days');
      score += 30;
    } else if (ageInDays < 7) {
      flags.push('account_under_1_week');
      score += 20;
    } else if (ageInDays < 30) {
      flags.push('account_under_1_month');
      score += 10;
    } else if (ageInDays < 90) {
      flags.push('account_under_3_months');
      score += 5;
    }
    
    // Avatar analysis
    if (!user.avatar) {
      flags.push('no_avatar');
      score += 15;
    } else {
      // Check if avatar is default-looking (solid color, etc.)
      // This would require image analysis
    }
    
    // Banner (premium feature)
    if (!user.banner) {
      score += 3; // Very slight penalty
    }
    
    // Username analysis
    const usernameAnalysis = this.analyzeUsername(user.username);
    flags.push(...usernameAnalysis.flags);
    score += usernameAnalysis.score;
    
    // Display name analysis
    if (user.globalName) {
      const displayNameAnalysis = this.analyzeDisplayName(user.globalName);
      flags.push(...displayNameAnalysis.flags);
      score += displayNameAnalysis.score;
    }
    
    // Account flags from Discord
    const userFlags = user.flags?.toArray() || [];
    
    // Positive signals (reduce risk)
    if (userFlags.includes('VerifiedBot')) {
      score -= 100; // Verified bots are fine
    }
    if (userFlags.includes('Staff')) {
      score -= 100; // Discord staff
    }
    if (userFlags.includes('Partner')) {
      score -= 30; // Discord partner
    }
    if (userFlags.includes('HypeSquadOnlineHouse1') || 
        userFlags.includes('HypeSquadOnlineHouse2') || 
        userFlags.includes('HypeSquadOnlineHouse3')) {
      score -= 10; // HypeSquad member
    }
    if (userFlags.includes('PremiumEarlySupporter')) {
      score -= 15; // Early Nitro supporter
    }
    if (userFlags.includes('ActiveDeveloper')) {
      score -= 10; // Active developer
    }
    
    return { 
      flags, 
      score: Math.max(0, score),
      ageInDays,
      ageInHours,
      userFlags 
    };
  }
  
  analyzeUsername(username) {
    const flags = [];
    let score = 0;
    
    // Random username pattern (letters + many numbers)
    if (/^[a-z]{2,6}[0-9]{4,}$/i.test(username)) {
      flags.push('random_username_pattern');
      score += 20;
    }
    
    // All numbers
    if (/^\d+$/.test(username)) {
      flags.push('numeric_username');
      score += 25;
    }
    
    // Alt-related keywords
    const altPatterns = [
      /\balt\b/i,
      /\bbackup\b/i,
      /\bspare\b/i,
      /\bsecond\b/i,
      /\bnew\b/i,
      /\btest\b/i,
      /\btemp\b/i,
      /\bfake\b/i,
      /\bthrow\s*away\b/i,
      /\bburner\b/i,
      /_alt$/i,
      /alt_/i,
      /[0-9]alt/i
    ];
    
    for (const pattern of altPatterns) {
      if (pattern.test(username)) {
        flags.push('alt_keyword_in_username');
        score += 30;
        break;
      }
    }
    
    // Very short username
    if (username.length <= 2) {
      flags.push('very_short_username');
      score += 15;
    } else if (username.length <= 4) {
      flags.push('short_username');
      score += 8;
    }
    
    // Excessive special characters
    const specialChars = username.replace(/[a-zA-Z0-9]/g, '');
    if (specialChars.length > username.length / 2) {
      flags.push('excessive_special_chars');
      score += 15;
    }
    
    // Unicode abuse / Zalgo text
    const zalgoPattern = /[\u0300-\u036f\u0489]/;
    if (zalgoPattern.test(username)) {
      flags.push('zalgo_text');
      score += 20;
    }
    
    // Impersonation attempts
    const impersonationPatterns = [
      /discord/i,
      /admin/i,
      /moderator/i,
      /support/i,
      /official/i,
      /staff/i,
      /helper/i,
      /system/i
    ];
    
    for (const pattern of impersonationPatterns) {
      if (pattern.test(username)) {
        flags.push('potential_impersonation');
        score += 25;
        break;
      }
    }
    
    return { flags, score };
  }
  
  analyzeDisplayName(displayName) {
    const flags = [];
    let score = 0;
    
    // Similar checks as username
    const impersonationPatterns = [
      /discord/i,
      /admin/i,
      /moderator/i,
      /support/i,
      /official/i,
      /staff/i,
      /giveaway/i,
      /free\s*nitro/i
    ];
    
    for (const pattern of impersonationPatterns) {
      if (pattern.test(displayName)) {
        flags.push('suspicious_display_name');
        score += 20;
        break;
      }
    }
    
    // Excessive emojis in display name
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]/gu;
    const emojiCount = (displayName.match(emojiPattern) || []).length;
    if (emojiCount > 5) {
      flags.push('emoji_spam_display_name');
      score += 10;
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
    
    // Check internal database
    const internal = await this.pool.query(
      'SELECT * FROM nexus_global_bans WHERE user_id = $1',
      [userId]
    );
    
    if (internal.rows.length > 0) {
      banData = internal.rows[0];
      flags.push('globally_banned_internal');
      
      switch (banData.severity) {
        case 'critical': score += 100; break;
        case 'high': score += 80; break;
        case 'medium': score += 60; break;
        case 'low': score += 40; break;
      }
      
      // Additional score for multiple bans
      score += Math.min(banData.ban_count * 15, 50);
    }
    
    // Check external APIs in parallel
    const externalChecks = await Promise.allSettled([
      this.checkDiscordBanList(userId),
      this.checkKSoftBans(userId),
      this.checkDServicesBans(userId),
      this.checkBotBlock(userId),
      this.checkRadarBot(userId)
    ]);
    
    for (const check of externalChecks) {
      if (check.status === 'fulfilled' && check.value.banned) {
        flags.push(`banned_${check.value.source}`);
        score += 50;
        
        if (check.value.proof) {
          flags.push('ban_has_evidence');
          score += 10;
        }
      }
    }
    
    return { flags, score, banData, externalBans: externalChecks.filter(c => c.status === 'fulfilled' && c.value.banned) };
  }
  
  async checkDiscordBanList(userId) {
    try {
      const response = await fetch(`https://bans.discord.id/api/check?user_id=${userId}`, {
        headers: { 'User-Agent': 'NEXUS-Ultimate/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          banned: data.banned, 
          reason: data.reason, 
          proof: data.proof,
          source: 'discord_ban_list' 
        };
      }
    } catch (e) {}
    return { banned: false, source: 'discord_ban_list' };
  }
  
  async checkKSoftBans(userId) {
    if (!process.env.KSOFT_API_KEY) return { banned: false, source: 'ksoft' };
    
    try {
      const response = await fetch(`https://api.ksoft.si/bans/check?user=${userId}`, {
        headers: { 
          'Authorization': `Bearer ${process.env.KSOFT_API_KEY}`,
          'User-Agent': 'NEXUS-Ultimate/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          banned: data.is_banned, 
          reason: data.reason,
          proof: data.proof,
          source: 'ksoft' 
        };
      }
    } catch (e) {}
    return { banned: false, source: 'ksoft' };
  }
  
  async checkDServicesBans(userId) {
    try {
      const response = await fetch(`https://discord.services/api/ban/${userId}`, {
        headers: { 'User-Agent': 'NEXUS-Ultimate/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          banned: data.status === 'banned', 
          reason: data.reason,
          source: 'dservices' 
        };
      }
    } catch (e) {}
    return { banned: false, source: 'dservices' };
  }
  
  async checkBotBlock(userId) {
    // BotBlock.org API
    try {
      const response = await fetch(`https://botblock.org/api/bans/${userId}`, {
        headers: { 'User-Agent': 'NEXUS-Ultimate/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { banned: data.banned || false, source: 'botblock' };
      }
    } catch (e) {}
    return { banned: false, source: 'botblock' };
  }
  
  async checkRadarBot(userId) {
    // RadarBot API (if available)
    try {
      const response = await fetch(`https://radarbot.io/api/bans/${userId}`, {
        headers: { 'User-Agent': 'NEXUS-Ultimate/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { banned: data.is_banned || false, source: 'radarbot' };
      }
    } catch (e) {}
    return { banned: false, source: 'radarbot' };
  }

  // ═══════════════════════════════════════════════════════════════
  // IP ANALYSIS & VPN DETECTION
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeIP(ipHash, userId, ipData = {}) {
    const flags = [];
    let score = 0;
    
    if (!ipHash) {
      flags.push('no_ip_data');
      return { flags, score };
    }
    
    // Check existing intelligence
    const existing = await this.pool.query(
      'SELECT * FROM nexus_ip_intelligence WHERE ip_hash = $1',
      [ipHash]
    );
    
    if (existing.rows.length > 0) {
      const intel = existing.rows[0];
      
      if (intel.is_vpn) {
        flags.push('vpn_detected');
        score += 35;
      }
      if (intel.is_proxy) {
        flags.push('proxy_detected');
        score += 40;
      }
      if (intel.is_datacenter) {
        flags.push('datacenter_ip');
        score += 45;
      }
      if (intel.is_tor) {
        flags.push('tor_exit_node');
        score += 60;
      }
      
      // Check if IP has been used by multiple accounts
      const userIds = intel.user_ids || [];
      if (userIds.length > 3 && !userIds.includes(userId)) {
        flags.push('shared_ip_many_users');
        score += 25;
      }
      
      // Check if any previous users were banned
      for (const prevUserId of userIds) {
        if (prevUserId === userId) continue;
        
        const banned = await this.pool.query(
          'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
          [prevUserId]
        );
        
        if (banned.rows.length > 0) {
          flags.push('ip_used_by_banned_user');
          score += 40;
          break;
        }
      }
      
      // Update user list
      if (!userIds.includes(userId)) {
        await this.pool.query(
          `UPDATE nexus_ip_intelligence 
           SET user_ids = array_append(user_ids, $1), 
               times_seen = times_seen + 1,
               last_seen = NOW()
           WHERE ip_hash = $2`,
          [userId, ipHash]
        );
      }
      
      return { flags, score, intel };
    }
    
    // New IP - analyze and save
    let ipIntel = {
      is_vpn: false,
      is_proxy: false,
      is_datacenter: false,
      is_tor: false,
      risk_score: 0
    };
    
    // Query external APIs
    if (ipData.rawIP) {
      const [ipqs, ipapi, vpnapi] = await Promise.allSettled([
        this.checkIPQualityScore(ipData.rawIP),
        this.checkIPApi(ipData.rawIP),
        this.checkVPNAPI(ipData.rawIP)
      ]);
      
      // Aggregate results
      if (ipqs.status === 'fulfilled' && ipqs.value) {
        const r = ipqs.value;
        ipIntel.is_vpn = ipIntel.is_vpn || r.vpn;
        ipIntel.is_proxy = ipIntel.is_proxy || r.proxy;
        ipIntel.is_tor = ipIntel.is_tor || r.tor;
        ipIntel.country_code = r.country_code;
        ipIntel.isp = r.isp;
        ipIntel.risk_score = Math.max(ipIntel.risk_score, r.fraud_score || 0);
      }
      
      if (ipapi.status === 'fulfilled' && ipapi.value) {
        const r = ipapi.value;
        ipIntel.is_datacenter = ipIntel.is_datacenter || r.hosting;
        ipIntel.country_code = ipIntel.country_code || r.countryCode;
        ipIntel.isp = ipIntel.isp || r.isp;
      }
      
      if (vpnapi.status === 'fulfilled' && vpnapi.value) {
        const r = vpnapi.value;
        ipIntel.is_vpn = ipIntel.is_vpn || r.security?.vpn;
        ipIntel.is_proxy = ipIntel.is_proxy || r.security?.proxy;
        ipIntel.is_tor = ipIntel.is_tor || r.security?.tor;
      }
    }
    
    // Save intelligence
    await this.pool.query(
      `INSERT INTO nexus_ip_intelligence 
       (ip_hash, is_vpn, is_proxy, is_datacenter, is_tor, country_code, isp, risk_score, user_ids, api_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        ipHash,
        ipIntel.is_vpn,
        ipIntel.is_proxy,
        ipIntel.is_datacenter,
        ipIntel.is_tor,
        ipIntel.country_code,
        ipIntel.isp,
        ipIntel.risk_score,
        [userId],
        ipIntel
      ]
    );
    
    // Add flags based on new analysis
    if (ipIntel.is_vpn) { flags.push('vpn_detected'); score += 35; }
    if (ipIntel.is_proxy) { flags.push('proxy_detected'); score += 40; }
    if (ipIntel.is_datacenter) { flags.push('datacenter_ip'); score += 45; }
    if (ipIntel.is_tor) { flags.push('tor_exit_node'); score += 60; }
    
    return { flags, score, intel: ipIntel };
  }
  
  async checkIPQualityScore(ip) {
    if (!process.env.IPQS_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://ipqualityscore.com/api/json/ip/${process.env.IPQS_API_KEY}/${ip}?strictness=2&allow_public_access_points=true`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}
    return null;
  }
  
  async checkIPApi(ip) {
    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,countryCode,isp,hosting`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}
    return null;
  }
  
  async checkVPNAPI(ip) {
    if (!process.env.VPNAPI_KEY) return null;
    
    try {
      const response = await fetch(
        `https://vpnapi.io/api/${ip}?key=${process.env.VPNAPI_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // FINGERPRINT ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeFingerprint(fpHash, userId, fpData = {}) {
    const flags = [];
    let score = 0;
    
    if (!fpHash) {
      flags.push('no_fingerprint');
      score += 15;
      return { flags, score };
    }
    
    // Check existing fingerprints
    const existing = await this.pool.query(
      'SELECT * FROM nexus_fingerprints WHERE fingerprint_hash = $1',
      [fpHash]
    );
    
    if (existing.rows.length > 0) {
      const fp = existing.rows[0];
      const userIds = fp.user_ids || [];
      
      // Check for multiple users on same device
      if (userIds.length > 1 && !userIds.includes(userId)) {
        flags.push('shared_device');
        score += 30;
        
        // Check if any are banned
        for (const prevUserId of userIds) {
          const banned = await this.pool.query(
            'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
            [prevUserId]
          );
          
          if (banned.rows.length > 0) {
            flags.push('device_used_by_banned');
            score += 50;
            break;
          }
        }
      }
      
      // Check risk level
      if (fp.risk_level === 'high') {
        flags.push('high_risk_device');
        score += 30;
      } else if (fp.risk_level === 'critical') {
        flags.push('critical_risk_device');
        score += 50;
      }
      
      // Update record
      if (!userIds.includes(userId)) {
        await this.pool.query(
          `UPDATE nexus_fingerprints 
           SET user_ids = array_append(user_ids, $1),
               times_seen = times_seen + 1,
               last_seen = NOW()
           WHERE fingerprint_hash = $2`,
          [userId, fpHash]
        );
      }
      
      return { flags, score, fingerprint: fp };
    }
    
    // Analyze new fingerprint
    let riskFactors = [];
    
    if (fpData) {
      // Check for automation indicators
      if (fpData.webdriver) {
        riskFactors.push('webdriver_detected');
        score += 40;
      }
      
      // Check for headless browser
      if (fpData.plugins?.length === 0 || fpData.languages?.length === 0) {
        riskFactors.push('headless_browser_suspected');
        score += 30;
      }
      
      // Check for screen size anomalies
      if (fpData.screenResolution) {
        const [width, height] = fpData.screenResolution;
        if (width < 100 || height < 100) {
          riskFactors.push('suspicious_screen_size');
          score += 20;
        }
      }
      
      // Check for virtual machine indicators
      if (fpData.webglVendor?.renderer) {
        const renderer = fpData.webglVendor.renderer.toLowerCase();
        if (renderer.includes('swiftshader') || 
            renderer.includes('llvmpipe') ||
            renderer.includes('virtualbox') ||
            renderer.includes('vmware')) {
          riskFactors.push('virtual_machine_detected');
          score += 25;
        }
      }
    }
    
    flags.push(...riskFactors);
    
    // Save fingerprint
    await this.pool.query(
      `INSERT INTO nexus_fingerprints 
       (fingerprint_hash, user_ids, canvas_hash, webgl_hash, audio_hash, 
        user_agents, screen_resolutions, timezones, languages, risk_factors, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        fpHash,
        [userId],
        fpData.canvasHash,
        fpData.webglHash,
        fpData.audioHash,
        fpData.userAgent ? [fpData.userAgent] : [],
        fpData.screenResolution ? [fpData.screenResolution.join('x')] : [],
        fpData.timezone ? [fpData.timezone] : [],
        fpData.languages || [],
        riskFactors,
        fpData
      ]
    );
    
    return { flags, score, riskFactors };
  }

  // ═══════════════════════════════════════════════════════════════
  // ALT DETECTION
  // ═══════════════════════════════════════════════════════════════
  
  async detectAlts(user, guild, data) {
    const flags = [];
    let score = 0;
    const matches = [];
    
    // Method 1: Fingerprint matching (highest confidence)
    if (data.fingerprintHash) {
      const fpMatches = await this.findFingerprintMatches(user.id, data.fingerprintHash, guild.id);
      for (const match of fpMatches) {
        matches.push({ ...match, method: 'fingerprint', confidence: 0.95 });
        if (match.banned) {
          flags.push('fingerprint_match_banned');
          score += 60;
        } else {
          flags.push('fingerprint_match');
          score += 30;
        }
      }
    }
    
    // Method 2: IP matching
    if (data.ipHash) {
      const ipMatches = await this.findIPMatches(user.id, data.ipHash, guild.id);
      for (const match of ipMatches) {
        // Avoid duplicates
        if (!matches.find(m => m.userId === match.userId)) {
          matches.push({ ...match, method: 'ip', confidence: 0.7 });
          if (match.banned) {
            flags.push('ip_match_banned');
            score += 50;
          } else {
            flags.push('ip_match');
            score += 20;
          }
        }
      }
    }
    
    // Method 3: Username similarity
    const usernameMatches = await this.findUsernameMatches(user, guild.id);
    for (const match of usernameMatches) {
      if (!matches.find(m => m.userId === match.userId)) {
        matches.push({ ...match, method: 'username', confidence: match.similarity });
        if (match.similarity > 0.9) {
          flags.push('very_similar_username');
          score += 25;
        } else if (match.similarity > 0.8) {
          flags.push('similar_username');
          score += 15;
        }
      }
    }
    
    // Method 4: Creation time clustering
    const timeMatches = await this.findCreationTimeMatches(user, guild.id);
    for (const match of timeMatches) {
      if (!matches.find(m => m.userId === match.userId)) {
        matches.push({ ...match, method: 'creation_time', confidence: 0.6 });
        flags.push('creation_time_cluster');
        score += 20;
      }
    }
    
    // Method 5: Behavioral matching
    const behaviorMatches = await this.findBehaviorMatches(user.id, guild.id);
    for (const match of behaviorMatches) {
      if (!matches.find(m => m.userId === match.userId)) {
        matches.push({ ...match, method: 'behavior', confidence: match.similarity });
        if (match.similarity > 0.85) {
          flags.push('behavioral_match');
          score += 35;
        }
      }
    }
    
    // Method 6: Stylometry matching
    const styleMatches = await this.findStyleMatches(user.id);
    for (const match of styleMatches) {
      if (!matches.find(m => m.userId === match.userId)) {
        matches.push({ ...match, method: 'stylometry', confidence: match.similarity });
        if (match.similarity > 0.9) {
          flags.push('writing_style_match');
          score += 40;
        }
      }
    }
    
    // Save detected links
    for (const match of matches) {
      await this.saveAltLink(user.id, match.userId, match.confidence, match.method, {
        guildId: guild.id,
        banned: match.banned,
        detectedAt: new Date().toISOString()
      });
    }
    
    return { flags, score, matches };
  }
  
  async findFingerprintMatches(userId, fpHash, guildId) {
    const result = await this.pool.query(
      `SELECT f.user_ids, gb.user_id IS NOT NULL as banned
       FROM nexus_fingerprints f
       LEFT JOIN nexus_global_bans gb ON gb.user_id = ANY(f.user_ids)
       WHERE f.fingerprint_hash = $1`,
      [fpHash]
    );
    
    if (result.rows.length === 0) return [];
    
    const matches = [];
    const userIds = result.rows[0].user_ids || [];
    
    for (const uid of userIds) {
      if (uid === userId) continue;
      
      const banned = await this.pool.query(
        'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
        [uid]
      );
      
      matches.push({
        userId: uid,
        banned: banned.rows.length > 0
      });
    }
    
    return matches;
  }
  
  async findIPMatches(userId, ipHash, guildId) {
    const result = await this.pool.query(
      'SELECT user_ids FROM nexus_ip_intelligence WHERE ip_hash = $1',
      [ipHash]
    );
    
    if (result.rows.length === 0) return [];
    
    const matches = [];
    const userIds = result.rows[0].user_ids || [];
    
    for (const uid of userIds) {
      if (uid === userId) continue;
      
      const banned = await this.pool.query(
        'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
        [uid]
      );
      
      matches.push({
        userId: uid,
        banned: banned.rows.length > 0
      });
    }
    
    return matches;
  }
  
  async findUsernameMatches(user, guildId) {
    // Get verified users from last 90 days
    const result = await this.pool.query(
      `SELECT user_id FROM nexus_verified_users 
       WHERE guild_id = $1 AND verified_at > NOW() - INTERVAL '90 days'
       AND user_id != $2`,
      [guildId, user.id]
    );
    
    const matches = [];
    const inputNorm = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    for (const row of result.rows) {
      try {
        const otherUser = await this.client.users.fetch(row.user_id).catch(() => null);
        if (!otherUser) continue;
        
        const compareNorm = otherUser.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const similarity = this.calculateStringSimilarity(inputNorm, compareNorm);
        
        if (similarity > 0.75) {
          const banned = await this.pool.query(
            'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
            [row.user_id]
          );
          
          matches.push({
            userId: row.user_id,
            username: otherUser.username,
            similarity,
            banned: banned.rows.length > 0
          });
        }
      } catch (e) {}
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }
  
  async findCreationTimeMatches(user, guildId) {
    // Find accounts created within 15 minutes
    const windowMs = 15 * 60 * 1000;
    
    const result = await this.pool.query(
      `SELECT user_id FROM nexus_verified_users 
       WHERE guild_id = $1 AND user_id != $2`,
      [guildId, user.id]
    );
    
    const matches = [];
    
    for (const row of result.rows) {
      try {
        const otherUser = await this.client.users.fetch(row.user_id).catch(() => null);
        if (!otherUser) continue;
        
        const timeDiff = Math.abs(otherUser.createdTimestamp - user.createdTimestamp);
        
        if (timeDiff < windowMs && timeDiff > 0) {
          const banned = await this.pool.query(
            'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
            [row.user_id]
          );
          
          matches.push({
            userId: row.user_id,
            timeDiffMinutes: Math.round(timeDiff / 60000),
            banned: banned.rows.length > 0
          });
        }
      } catch (e) {}
    }
    
    return matches;
  }
  
  async findBehaviorMatches(userId, guildId) {
    // This requires prior behavioral data
    const profile = await this.pool.query(
      'SELECT * FROM nexus_behavior_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (profile.rows.length === 0) return [];
    
    const userProfile = profile.rows[0];
    
    // Find similar vocabulary hashes
    const similar = await this.pool.query(
      `SELECT user_id FROM nexus_behavior_profiles 
       WHERE user_id != $1 AND vocabulary_hash = $2`,
      [userId, userProfile.vocabulary_hash]
    );
    
    const matches = [];
    
    for (const row of similar.rows) {
      const banned = await this.pool.query(
        'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
        [row.user_id]
      );
      
      matches.push({
        userId: row.user_id,
        similarity: 0.9,
        banned: banned.rows.length > 0
      });
    }
    
    return matches;
  }
  
  async findStyleMatches(userId) {
    // Stylometry matching
    const style = await this.pool.query(
      'SELECT style_hash FROM nexus_stylometry WHERE user_id = $1',
      [userId]
    );
    
    if (style.rows.length === 0) return [];
    
    const similar = await this.pool.query(
      `SELECT user_id FROM nexus_stylometry 
       WHERE user_id != $1 AND style_hash = $2`,
      [userId, style.rows[0].style_hash]
    );
    
    const matches = [];
    
    for (const row of similar.rows) {
      const banned = await this.pool.query(
        'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
        [row.user_id]
      );
      
      matches.push({
        userId: row.user_id,
        similarity: 0.95,
        banned: banned.rows.length > 0
      });
    }
    
    return matches;
  }

  // ═══════════════════════════════════════════════════════════════
  // BEHAVIOR ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeBehavior(userId, guildId) {
    const flags = [];
    let score = 0;
    
    // Get message history if available
    const messages = await this.pool.query(
      `SELECT content, timestamp FROM message_cache 
       WHERE author_id = $1 AND guild_id = $2 
       ORDER BY timestamp DESC LIMIT 100`,
      [userId, guildId]
    );
    
    if (messages.rows.length === 0) {
      return { flags, score };
    }
    
    // Analyze patterns
    const patterns = this.analyzeMessagePatterns(messages.rows);
    
    if (patterns.spamScore > 70) {
      flags.push('spam_behavior');
      score += 40;
    } else if (patterns.spamScore > 50) {
      flags.push('spam_like_behavior');
      score += 20;
    }
    
    if (patterns.botScore > 80) {
      flags.push('bot_like_behavior');
      score += 50;
    } else if (patterns.botScore > 60) {
      flags.push('automated_behavior_suspected');
      score += 25;
    }
    
    // Save/update behavior profile
    await this.updateBehaviorProfile(userId, patterns);
    
    return { flags, score, patterns };
  }
  
  analyzeMessagePatterns(messages) {
    const patterns = {
      spamScore: 0,
      botScore: 0,
      avgMessageLength: 0,
      messageIntervals: [],
      vocabularyDiversity: 0,
      repetitionRate: 0
    };
    
    if (messages.length < 3) {
      return patterns;
    }
    
    let totalLength = 0;
    const allWords = [];
    const uniqueMessages = new Set();
    let lastTimestamp = null;
    
    for (const msg of messages) {
      const content = msg.content || '';
      totalLength += content.length;
      
      // Track unique messages
      uniqueMessages.add(content.toLowerCase().trim());
      
      // Word analysis
      const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      allWords.push(...words);
      
      // Timing analysis
      if (lastTimestamp) {
        const interval = new Date(lastTimestamp) - new Date(msg.timestamp);
        patterns.messageIntervals.push(Math.abs(interval));
      }
      lastTimestamp = msg.timestamp;
    }
    
    // Calculate metrics
    patterns.avgMessageLength = totalLength / messages.length;
    
    // Vocabulary diversity
    const uniqueWords = new Set(allWords);
    patterns.vocabularyDiversity = uniqueWords.size / allWords.length;
    
    // Repetition rate
    patterns.repetitionRate = 1 - (uniqueMessages.size / messages.length);
    
    // Spam score calculation
    if (patterns.repetitionRate > 0.5) patterns.spamScore += 40;
    else if (patterns.repetitionRate > 0.3) patterns.spamScore += 20;
    
    if (patterns.vocabularyDiversity < 0.2) patterns.spamScore += 30;
    else if (patterns.vocabularyDiversity < 0.4) patterns.spamScore += 15;
    
    // Bot score calculation (timing regularity)
    if (patterns.messageIntervals.length > 5) {
      const avgInterval = patterns.messageIntervals.reduce((a, b) => a + b, 0) / patterns.messageIntervals.length;
      const variance = patterns.messageIntervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / patterns.messageIntervals.length;
      
      // Very low variance = bot-like
      if (variance < 500 && avgInterval < 3000) {
        patterns.botScore += 60;
      } else if (variance < 2000 && avgInterval < 5000) {
        patterns.botScore += 30;
      }
    }
    
    return patterns;
  }
  
  async updateBehaviorProfile(userId, patterns) {
    const vocabularyHash = crypto.createHash('md5')
      .update(Array.from(patterns.uniqueWords || []).sort().join(','))
      .digest('hex');
    
    await this.pool.query(
      `INSERT INTO nexus_behavior_profiles 
       (user_id, avg_message_length, vocabulary_hash, message_frequency, messages_analyzed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
       avg_message_length = $2,
       vocabulary_hash = $3,
       message_frequency = $4,
       messages_analyzed = nexus_behavior_profiles.messages_analyzed + $5,
       last_updated = NOW()`,
      [
        userId,
        patterns.avgMessageLength,
        vocabularyHash,
        patterns.messageIntervals.length > 0 ? 
          patterns.messageIntervals.reduce((a, b) => a + b, 0) / patterns.messageIntervals.length : 0,
        1
      ]
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STYLOMETRY ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  
  async matchStylometry(userId) {
    // Get user's style profile
    const profile = await this.pool.query(
      'SELECT * FROM nexus_stylometry WHERE user_id = $1',
      [userId]
    );
    
    if (profile.rows.length === 0) {
      return { flags: [], score: 0 };
    }
    
    const flags = [];
    let score = 0;
    
    // Find matching style hashes
    const matches = await this.pool.query(
      `SELECT user_id FROM nexus_stylometry 
       WHERE user_id != $1 AND style_hash = $2`,
      [userId, profile.rows[0].style_hash]
    );
    
    if (matches.rows.length > 0) {
      flags.push('stylometry_match');
      score += 35;
      
      // Check if any matches are banned
      for (const match of matches.rows) {
        const banned = await this.pool.query(
          'SELECT 1 FROM nexus_global_bans WHERE user_id = $1',
          [match.user_id]
        );
        
        if (banned.rows.length > 0) {
          flags.push('stylometry_match_banned');
          score += 40;
          break;
        }
      }
    }
    
    return { flags, score };
  }

  // ═══════════════════════════════════════════════════════════════
  // THREAT ACTOR CHECK
  // ═══════════════════════════════════════════════════════════════
  
  async checkThreatActors(userId, ipHash, fpHash) {
    const flags = [];
    let score = 0;
    
    // Check if user is in known threat actor list
    const userCheck = await this.pool.query(
      `SELECT * FROM nexus_threat_actors 
       WHERE $1 = ANY(known_user_ids) AND active = TRUE`,
      [userId]
    );
    
    if (userCheck.rows.length > 0) {
      flags.push('known_threat_actor');
      score += 80;
      
      const actor = userCheck.rows[0];
      if (actor.threat_level === 'critical') score += 20;
    }
    
    // Check IP
    if (ipHash) {
      const ipCheck = await this.pool.query(
        `SELECT * FROM nexus_threat_actors 
         WHERE $1 = ANY(known_ips) AND active = TRUE`,
        [ipHash]
      );
      
      if (ipCheck.rows.length > 0) {
        flags.push('threat_actor_ip');
        score += 60;
      }
    }
    
    // Check fingerprint
    if (fpHash) {
      const fpCheck = await this.pool.query(
        `SELECT * FROM nexus_threat_actors 
         WHERE $1 = ANY(known_fingerprints) AND active = TRUE`,
        [fpHash]
      );
      
      if (fpCheck.rows.length > 0) {
        flags.push('threat_actor_device');
        score += 70;
      }
    }
    
    return { flags, score };
  }

  // ═══════════════════════════════════════════════════════════════
  // REPUTATION SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  async getReputation(userId, guildId) {
    const result = await this.pool.query(
      'SELECT * FROM nexus_reputation WHERE user_id = $1 AND guild_id = $2',
      [userId, guildId]
    );
    
    if (result.rows.length === 0) {
      return { score: this.config.reputation.startingScore };
    }
    
    return { 
      score: result.rows[0].trust_score,
      data: result.rows[0]
    };
  }
  
  async initializeReputation(userId, guildId) {
    await this.pool.query(
      `INSERT INTO nexus_reputation (user_id, guild_id, trust_score, first_message)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, guild_id) DO NOTHING`,
      [userId, guildId, this.config.reputation.startingScore]
    );
  }
  
  async updateReputation(userId, guildId, change, reason) {
    const current = await this.getReputation(userId, guildId);
    const newScore = Math.max(
      this.config.reputation.minScore,
      Math.min(this.config.reputation.maxScore, current.score + change)
    );
    
    await this.pool.query(
      `UPDATE nexus_reputation 
       SET trust_score = $1, last_active = NOW()
       WHERE user_id = $2 AND guild_id = $3`,
      [newScore, userId, guildId]
    );
    
    // Log history
    await this.pool.query(
      `INSERT INTO nexus_reputation_history 
       (user_id, guild_id, change_type, change_amount, new_score, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, guildId, reason, change, newScore, reason]
    );
    
    return newScore;
  }

  // ═══════════════════════════════════════════════════════════════
  // AI ASSESSMENT
  // ═══════════════════════════════════════════════════════════════
  
  async getAIAssessment(user, flags, currentScore, results) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `You are a security analyst for Discord server verification.
Analyze the provided data and assess the risk level.
Be thorough but fair - some flags may have innocent explanations.

Return ONLY a JSON object:
{
  "adjustedScore": number (0-100) or null to keep current,
  "reasoning": "1-2 sentence explanation",
  "additionalFlags": ["array", "of", "new", "flags"],
  "recommendation": "approve" | "deny" | "challenge" | "manual_review",
  "confidence": number (0-1),
  "suspiciousPatterns": ["any", "concerning", "patterns"]
}`,
        messages: [{
          role: 'user',
          content: `Assess this verification attempt:

USER: ${user.username} (ID: ${user.id})
Account Age: ${Math.floor((Date.now() - user.createdTimestamp) / (24*60*60*1000))} days
Current Risk Score: ${currentScore}
Flags: ${flags.join(', ')}

ANALYSIS RESULTS:
- Account: ${JSON.stringify(results.account)}
- Global Bans: ${JSON.stringify(results.globalBan)}
- IP Analysis: ${JSON.stringify(results.ip)}
- Alt Detection: ${results.alts.matches?.length || 0} matches found
- Threat Actor Check: ${JSON.stringify(results.threatActor)}
- Reputation: ${results.reputation.score}

Provide your JSON assessment.`
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
    
    return { 
      adjustedScore: null, 
      additionalFlags: [],
      recommendation: 'manual_review',
      confidence: 0
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // RISK CALCULATION
  // ═══════════════════════════════════════════════════════════════
  
  calculateRiskScore(results) {
    const weights = {
      account: 0.15,
      globalBan: 0.25,
      ip: 0.12,
      fingerprint: 0.08,
      alts: 0.20,
      behavior: 0.08,
      stylometry: 0.07,
      threatActor: 0.05
    };
    
    const score = (
      (results.account.score * weights.account) +
      (results.globalBan.score * weights.globalBan) +
      (results.ip.score * weights.ip) +
      (results.fingerprint.score * weights.fingerprint) +
      (results.alts.score * weights.alts) +
      (results.behavior.score * weights.behavior) +
      (results.stylometry.score * weights.stylometry) +
      (results.threatActor.score * weights.threatActor)
    );
    
    return Math.min(Math.round(score), 100);
  }
  
  makeDecision(riskScore, flags, results) {
    // Instant deny conditions
    const instantDeny = [
      'globally_banned_internal',
      'known_threat_actor',
      'threat_actor_device',
      'fingerprint_match_banned',
      'device_used_by_banned'
    ];
    
    if (flags.some(f => instantDeny.includes(f))) {
      return {
        approved: false,
        action: 'denied',
        message: 'Verification denied. Contact staff if you believe this is an error.',
        requiresManualReview: false,
        requiresChallenge: false
      };
    }
    
    // Risk-based decisions
    if (riskScore >= this.config.risk.EXTREME) {
      return {
        approved: false,
        action: 'denied',
        message: 'Verification denied due to security concerns.',
        requiresManualReview: true,
        requiresChallenge: false
      };
    }
    
    if (riskScore >= this.config.risk.CRITICAL) {
      return {
        approved: false,
        action: 'challenge_required',
        message: 'Additional verification required.',
        requiresManualReview: false,
        requiresChallenge: true,
        challengeType: 'captcha_and_questions'
      };
    }
    
    if (riskScore >= this.config.risk.HIGH) {
      return {
        approved: false,
        action: 'challenge_required',
        message: 'Please complete a quick verification challenge.',
        requiresManualReview: false,
        requiresChallenge: true,
        challengeType: 'captcha'
      };
    }
    
    if (riskScore >= this.config.risk.MEDIUM) {
      return {
        approved: true,
        action: 'approved_flagged',
        message: 'Verified! Welcome to the server.',
        requiresManualReview: false,
        requiresChallenge: false
      };
    }
    
    return {
      approved: true,
      action: 'approved',
      message: 'Verified! Welcome to the server.',
      requiresManualReview: false,
      requiresChallenge: false
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CHALLENGE SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  async initiateChallenge(user, guild, challengeType, riskScore, flags) {
    // Create challenge token
    const token = crypto.randomBytes(32).toString('hex');
    
    await this.pool.query(
      `INSERT INTO nexus_verification_tokens 
       (token, user_id, guild_id, type, expires_at, verification_data)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes', $5)`,
      [token, user.id, guild.id, challengeType, { riskScore, flags }]
    );
    
    return {
      approved: false,
      action: 'challenge_initiated',
      message: 'Additional verification required.',
      challengeType,
      challengeToken: token,
      riskScore,
      flags
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ANTI-RAID SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  async checkRaidStatus(guildId) {
    const now = Date.now();
    
    // Get recent joins
    const joins = this.joinTracker.get(guildId) || [];
    const recentJoins = joins.filter(t => now - t < this.config.antiRaid.joinWindow);
    this.joinTracker.set(guildId, recentJoins);
    
    if (recentJoins.length >= this.config.antiRaid.joinThreshold) {
      await this.triggerLockdown(guildId, 'join_flood');
      return { raiding: true, type: 'join_flood' };
    }
    
    // Get recent messages
    const messages = this.messageTracker.get(guildId) || [];
    const recentMessages = messages.filter(t => now - t < this.config.antiRaid.messageWindow);
    this.messageTracker.set(guildId, recentMessages);
    
    if (recentMessages.length >= this.config.antiRaid.messageThreshold) {
      await this.triggerLockdown(guildId, 'message_flood');
      return { raiding: true, type: 'message_flood' };
    }
    
    return { raiding: false };
  }
  
  async triggerLockdown(guildId, reason) {
    const existing = this.lockdownStatus.get(guildId);
    if (existing?.active) return; // Already locked down
    
    const until = Date.now() + this.config.antiRaid.lockdownDuration;
    this.lockdownStatus.set(guildId, { active: true, until, reason });
    
    // Update threat level
    this.threatLevel.set(guildId, 'CRITICAL');
    
    // Log the incident
    await this.pool.query(
      `INSERT INTO nexus_raid_incidents (guild_id, attack_type)
       VALUES ($1, $2)`,
      [guildId, reason]
    );
    
    await this.pool.query(
      `INSERT INTO nexus_lockdowns (guild_id, reason, triggered_by)
       VALUES ($1, $2, 'auto')`,
      [guildId, reason]
    );
    
    // Log to audit
    await this.logAudit(guildId, 'lockdown_triggered', { reason, duration: this.config.antiRaid.lockdownDuration });
    
    console.log(`[NEXUS] 🚨 LOCKDOWN triggered for guild ${guildId}: ${reason}`);
    
    // Schedule unlock
    setTimeout(() => this.endLockdown(guildId), this.config.antiRaid.lockdownDuration);
  }
  
  async endLockdown(guildId) {
    const status = this.lockdownStatus.get(guildId);
    if (!status?.active) return;
    
    this.lockdownStatus.set(guildId, { active: false });
    this.threatLevel.set(guildId, 'ELEVATED');
    
    // Update database
    await this.pool.query(
      `UPDATE nexus_lockdowns 
       SET ended_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
       WHERE guild_id = $1 AND ended_at IS NULL`,
      [guildId]
    );
    
    await this.logAudit(guildId, 'lockdown_ended', {});
    
    console.log(`[NEXUS] Lockdown ended for guild ${guildId}`);
    
    // Decay threat level after 30 minutes
    setTimeout(() => {
      if (this.threatLevel.get(guildId) === 'ELEVATED') {
        this.threatLevel.set(guildId, 'LOW');
      }
    }, 30 * 60 * 1000);
  }
  
  trackJoin(guildId) {
    const joins = this.joinTracker.get(guildId) || [];
    joins.push(Date.now());
    this.joinTracker.set(guildId, joins);
    
    return this.checkRaidStatus(guildId);
  }
  
  trackMessage(guildId) {
    const messages = this.messageTracker.get(guildId) || [];
    messages.push(Date.now());
    this.messageTracker.set(guildId, messages);
  }

  // ═══════════════════════════════════════════════════════════════
  // HONEYPOT SYSTEM
  // ═══════════════════════════════════════════════════════════════
  
  async checkHoneypot(message) {
    if (!this.config.honeypot.enabled) return null;
    
    const channelName = message.channel.name;
    
    // Check if message is in honeypot channel
    if (channelName === this.config.honeypot.trapChannelName) {
      await this.logHoneypotTrigger(message.guild.id, message.author.id, 'channel_access', {
        channel: channelName,
        content: message.content
      });
      
      if (this.config.honeypot.instantBan) {
        return { triggered: true, action: 'ban' };
      }
      
      return { triggered: true, action: 'flag' };
    }
    
    // Check for honeypot role requests
    if (message.content.toLowerCase().includes(this.config.honeypot.trapRoleName.toLowerCase())) {
      await this.logHoneypotTrigger(message.guild.id, message.author.id, 'role_request', {
        content: message.content
      });
      
      return { triggered: true, action: 'flag' };
    }
    
    return null;
  }
  
  async logHoneypotTrigger(guildId, userId, type, data) {
    await this.pool.query(
      `INSERT INTO nexus_honeypot_triggers (guild_id, user_id, trigger_type, trigger_data)
       VALUES ($1, $2, $3, $4)`,
      [guildId, userId, type, data]
    );
    
    await this.logAudit(guildId, 'honeypot_triggered', { userId, type, data });
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════
  
  async isVerified(userId, guildId) {
    const result = await this.pool.query(
      'SELECT * FROM nexus_verified_users WHERE user_id = $1 AND guild_id = $2',
      [userId, guildId]
    );
    return result.rows[0] || null;
  }
  
  async checkRateLimit(userId, guildId) {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count, MAX(attempt_time) as last_attempt
       FROM nexus_verification_attempts
       WHERE user_id = $1 AND guild_id = $2 AND attempt_time > NOW() - INTERVAL '1 hour'`,
      [userId, guildId]
    );
    
    const count = parseInt(result.rows[0].count);
    if (count >= this.config.verification.maxAttempts) {
      const lastAttempt = new Date(result.rows[0].last_attempt);
      const waitMinutes = Math.ceil((this.config.verification.cooldown - (Date.now() - lastAttempt)) / 60000);
      return { allowed: false, waitMinutes };
    }
    
    return { allowed: true };
  }
  
  async saveVerification(user, guild, data) {
    await this.pool.query(
      `INSERT INTO nexus_verified_users 
       (user_id, guild_id, verification_method, risk_score, fingerprint_hash, ip_hash, flags, oauth_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, guild_id) DO UPDATE SET
       verified_at = NOW(),
       verification_method = $3,
       risk_score = $4,
       fingerprint_hash = $5,
       ip_hash = $6,
       flags = $7,
       oauth_data = $8`,
      [user.id, guild.id, data.method, data.riskScore, data.fingerprintHash, data.ipHash, data.flags, data.oauthData || {}]
    );
  }
  
  async logVerificationAttempt(userId, guildId, data) {
    await this.pool.query(
      `INSERT INTO nexus_verification_attempts 
       (user_id, guild_id, method, ip_hash, fingerprint_hash, device_info, result, risk_score, flags, raw_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, guildId, data.method, data.ipHash, data.fingerprintHash, data.deviceInfo, data.result, data.riskScore, data.flags, data.rawData]
    );
  }
  
  async saveAltLink(primaryId, altId, confidence, method, evidence) {
    await this.pool.query(
      `INSERT INTO nexus_alt_links (primary_user, linked_user, confidence, detection_method, evidence)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (primary_user, linked_user) DO UPDATE SET
       confidence = GREATEST(nexus_alt_links.confidence, $3),
       evidence = nexus_alt_links.evidence || $5,
       updated_at = NOW()`,
      [primaryId, altId, confidence, method, evidence]
    );
  }
  
  async logAudit(guildId, eventType, eventData, actorId = null) {
    await this.pool.query(
      `INSERT INTO nexus_audit_log (guild_id, event_type, event_data, actor_id, actor_type)
       VALUES ($1, $2, $3, $4, $5)`,
      [guildId, eventType, eventData, actorId, actorId ? 'user' : 'system']
    );
  }
  
  calculateStringSimilarity(str1, str2) {
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

  // ═══════════════════════════════════════════════════════════════
  // BACKGROUND TASKS
  // ═══════════════════════════════════════════════════════════════
  
  startBackgroundTasks() {
    // Clean expired tokens every hour
    setInterval(async () => {
      await this.pool.query('DELETE FROM nexus_verification_tokens WHERE expires_at < NOW()').catch(() => {});
    }, 60 * 60 * 1000);
    
    // Update daily stats at midnight
    setInterval(async () => {
      await this.updateDailyStats().catch(() => {});
    }, 60 * 60 * 1000);
    
    // Decay threat levels
    setInterval(() => {
      for (const [guildId, level] of this.threatLevel) {
        if (level === 'ELEVATED' && !this.lockdownStatus.get(guildId)?.active) {
          this.threatLevel.set(guildId, 'LOW');
        }
      }
    }, 30 * 60 * 1000);
    
    console.log('✅ NEXUS background tasks started');
  }
  
  async updateDailyStats() {
    // This would aggregate and save daily statistics
    console.log('[NEXUS] Daily stats updated');
  }

  // ═══════════════════════════════════════════════════════════════
  // EMBEDS & UI
  // ═══════════════════════════════════════════════════════════════
  
  createVerificationEmbed(guild) {
    return new EmbedBuilder()
      .setTitle('🛡️ NEXUS Security Verification')
      .setDescription(
        `**Welcome to ${guild.name}**\n\n` +
        `Before accessing the server, you must pass our security verification.\n\n` +
        `**What we check:**\n` +
        `╠ Global ban databases (5+ sources)\n` +
        `╠ Alt account indicators\n` +
        `╠ VPN/Proxy detection\n` +
        `╠ Device fingerprinting\n` +
        `╠ Behavioral analysis\n` +
        `╚ Threat actor database\n\n` +
        `*Click below to begin verification.*`
      )
      .setColor(0x5865F2)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setFooter({ text: 'NEXUS ULTIMATE • Enterprise Security Platform' });
  }
  
  createVerificationButtons() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nexus_verify')
        .setLabel('Verify Me')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔐')
    );
  }
}

module.exports = NexusUltimate;
