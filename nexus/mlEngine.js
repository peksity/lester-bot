/**
 * ████████████████████████████████████████████████████████████████████████
 * █  NEXUS ML ENGINE                                                     █
 * █  Machine Learning Classification & Prediction                        █
 * ████████████████████████████████████████████████████████████████████████
 * 
 * Features:
 * - Behavioral classification (legit vs threat)
 * - Alt account probability scoring
 * - Raid prediction
 * - Toxicity prediction
 * - User clustering
 * - Anomaly detection
 */

class NexusMLEngine {
  constructor(pool, anthropic) {
    this.pool = pool;
    this.anthropic = anthropic;
    
    // Model weights (would be trained in production)
    this.weights = {
      accountAge: 0.15,
      avatarPresence: 0.08,
      usernamePattern: 0.12,
      joinPattern: 0.18,
      messagePattern: 0.20,
      behaviorPattern: 0.15,
      socialGraph: 0.12
    };
    
    // Feature importance for alt detection
    this.altFeatures = {
      fingerprintMatch: 0.95,
      ipMatch: 0.70,
      behaviorSimilarity: 0.85,
      stylometrySimilarity: 0.90,
      timingCorrelation: 0.65,
      vocabularyOverlap: 0.80,
      reactionPattern: 0.60
    };
    
    // Toxicity indicators
    this.toxicityIndicators = {
      slurs: 1.0,
      threats: 0.95,
      harassment: 0.85,
      spam: 0.70,
      negativeSentiment: 0.40,
      capsAbuse: 0.30,
      emojiSpam: 0.25
    };
  }

  async initialize() {
    await this.pool.query(`
      -- ML training data
      CREATE TABLE IF NOT EXISTS nexus_ml_training (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Features
        features JSONB NOT NULL,
        
        -- Labels
        label TEXT NOT NULL, -- 'legit', 'threat', 'alt', 'bot', 'raider'
        confidence FLOAT DEFAULT 1.0,
        
        -- Metadata
        labeled_by TEXT, -- 'auto', 'manual', 'feedback'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Model predictions
      CREATE TABLE IF NOT EXISTS nexus_ml_predictions (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        
        -- Predictions
        threat_probability FLOAT,
        alt_probability FLOAT,
        bot_probability FLOAT,
        raid_probability FLOAT,
        toxicity_score FLOAT,
        
        -- Raw scores
        feature_scores JSONB DEFAULT '{}',
        
        -- Metadata
        model_version TEXT DEFAULT 'v1',
        predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Anomaly detection
      CREATE TABLE IF NOT EXISTS nexus_ml_anomalies (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        anomaly_type TEXT NOT NULL,
        severity FLOAT NOT NULL,
        data JSONB DEFAULT '{}',
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- User clusters
      CREATE TABLE IF NOT EXISTS nexus_ml_clusters (
        cluster_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_ids TEXT[],
        centroid JSONB DEFAULT '{}',
        cluster_type TEXT, -- 'legitimate', 'suspicious', 'threat'
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ ML Engine initialized');
  }

  // ═══════════════════════════════════════════════════════════════
  // THREAT CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════
  
  async classifyUser(userId, guildId, features) {
    const scores = {
      accountAge: this.scoreAccountAge(features.accountAgeDays),
      avatar: this.scoreAvatar(features.hasAvatar, features.avatarHash),
      username: this.scoreUsername(features.username),
      behavior: await this.scoreBehavior(userId, guildId),
      social: await this.scoreSocialGraph(userId, guildId),
      history: await this.scoreHistory(userId)
    };
    
    // Weighted combination
    let threatScore = 0;
    for (const [key, weight] of Object.entries(this.weights)) {
      if (scores[key] !== undefined) {
        threatScore += scores[key] * weight;
      }
    }
    
    // Normalize to 0-1
    threatScore = Math.min(1, Math.max(0, threatScore));
    
    // AI-powered refinement for edge cases
    if (threatScore > 0.3 && threatScore < 0.7) {
      const aiScore = await this.getAIClassification(features, scores);
      if (aiScore !== null) {
        threatScore = (threatScore + aiScore) / 2;
      }
    }
    
    // Save prediction
    await this.savePrediction(userId, guildId, {
      threat_probability: threatScore,
      feature_scores: scores
    });
    
    return {
      threatScore,
      classification: this.getClassification(threatScore),
      scores,
      confidence: this.calculateConfidence(scores)
    };
  }
  
  scoreAccountAge(days) {
    if (days < 1) return 0.9;
    if (days < 7) return 0.7;
    if (days < 30) return 0.4;
    if (days < 90) return 0.2;
    if (days < 365) return 0.1;
    return 0;
  }
  
  scoreAvatar(hasAvatar, hash) {
    if (!hasAvatar) return 0.6;
    // Check for commonly reused avatars
    return 0;
  }
  
  scoreUsername(username) {
    let score = 0;
    
    // Random pattern
    if (/^[a-z]{2,4}[0-9]{4,}$/i.test(username)) score += 0.4;
    
    // Alt keywords
    if (/\b(alt|backup|spare|test|temp)\b/i.test(username)) score += 0.5;
    
    // All numbers
    if (/^\d+$/.test(username)) score += 0.6;
    
    // Very short
    if (username.length <= 3) score += 0.3;
    
    // Zalgo
    if (/[\u0300-\u036f\u0489]/.test(username)) score += 0.4;
    
    return Math.min(1, score);
  }
  
  async scoreBehavior(userId, guildId) {
    const behavior = await this.pool.query(
      'SELECT * FROM nexus_behavior_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (behavior.rows.length === 0) return 0.3; // Unknown = slight risk
    
    const profile = behavior.rows[0];
    let score = 0;
    
    // Spam-like patterns
    if (profile.message_frequency > 10) score += 0.3;
    
    // Low vocabulary diversity
    if (profile.vocabulary_size < 50) score += 0.2;
    
    // Bot-like timing
    // Would check message intervals
    
    return Math.min(1, score);
  }
  
  async scoreSocialGraph(userId, guildId) {
    // Check connections to known bad actors
    const links = await this.pool.query(
      `SELECT COUNT(*) as bad_links FROM nexus_alt_links al
       JOIN nexus_global_bans gb ON (al.linked_user = gb.user_id OR al.primary_user = gb.user_id)
       WHERE al.primary_user = $1 OR al.linked_user = $1`,
      [userId]
    );
    
    const badLinks = parseInt(links.rows[0].bad_links);
    if (badLinks > 0) return Math.min(1, badLinks * 0.3);
    
    return 0;
  }
  
  async scoreHistory(userId) {
    // Check past verification attempts
    const attempts = await this.pool.query(
      `SELECT result, risk_score FROM nexus_verification_attempts
       WHERE user_id = $1 ORDER BY attempt_time DESC LIMIT 10`,
      [userId]
    );
    
    if (attempts.rows.length === 0) return 0;
    
    const deniedCount = attempts.rows.filter(a => a.result === 'denied').length;
    const avgRisk = attempts.rows.reduce((sum, a) => sum + (a.risk_score || 0), 0) / attempts.rows.length;
    
    return Math.min(1, (deniedCount * 0.2) + (avgRisk / 200));
  }
  
  getClassification(score) {
    if (score >= 0.8) return 'HIGH_THREAT';
    if (score >= 0.6) return 'MODERATE_THREAT';
    if (score >= 0.4) return 'LOW_THREAT';
    if (score >= 0.2) return 'MINIMAL_RISK';
    return 'SAFE';
  }
  
  calculateConfidence(scores) {
    // Confidence based on data availability
    const dataPoints = Object.values(scores).filter(s => s !== undefined).length;
    return Math.min(1, dataPoints / 6);
  }

  // ═══════════════════════════════════════════════════════════════
  // ALT PROBABILITY SCORING
  // ═══════════════════════════════════════════════════════════════
  
  async calculateAltProbability(user1Id, user2Id, evidenceData) {
    const scores = {};
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Fingerprint match
    if (evidenceData.fingerprintMatch) {
      scores.fingerprint = 1.0;
      weightedSum += this.altFeatures.fingerprintMatch;
      totalWeight += this.altFeatures.fingerprintMatch;
    }
    
    // IP match
    if (evidenceData.ipMatch) {
      scores.ip = evidenceData.sameNetwork ? 0.5 : 1.0;
      weightedSum += scores.ip * this.altFeatures.ipMatch;
      totalWeight += this.altFeatures.ipMatch;
    }
    
    // Behavior similarity
    if (evidenceData.behaviorSimilarity !== undefined) {
      scores.behavior = evidenceData.behaviorSimilarity;
      weightedSum += scores.behavior * this.altFeatures.behaviorSimilarity;
      totalWeight += this.altFeatures.behaviorSimilarity;
    }
    
    // Stylometry
    if (evidenceData.stylometrySimilarity !== undefined) {
      scores.stylometry = evidenceData.stylometrySimilarity;
      weightedSum += scores.stylometry * this.altFeatures.stylometrySimilarity;
      totalWeight += this.altFeatures.stylometrySimilarity;
    }
    
    // Timing correlation
    if (evidenceData.timingCorrelation !== undefined) {
      scores.timing = evidenceData.timingCorrelation;
      weightedSum += scores.timing * this.altFeatures.timingCorrelation;
      totalWeight += this.altFeatures.timingCorrelation;
    }
    
    // Calculate probability
    const probability = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    return {
      probability,
      scores,
      confidence: Math.min(1, totalWeight / 3)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // RAID PREDICTION
  // ═══════════════════════════════════════════════════════════════
  
  async predictRaid(guildId, recentActivity) {
    const features = {
      joinVelocity: recentActivity.joinsPerMinute || 0,
      newAccountRatio: recentActivity.newAccountRatio || 0,
      defaultAvatarRatio: recentActivity.defaultAvatarRatio || 0,
      similarUsernameRatio: recentActivity.similarUsernameRatio || 0,
      messageVelocity: recentActivity.messagesPerMinute || 0,
      mentionSpamRatio: recentActivity.mentionSpamRatio || 0
    };
    
    // Calculate raid probability
    let raidScore = 0;
    
    if (features.joinVelocity > 5) raidScore += 0.3;
    if (features.joinVelocity > 10) raidScore += 0.3;
    if (features.newAccountRatio > 0.5) raidScore += 0.2;
    if (features.defaultAvatarRatio > 0.7) raidScore += 0.15;
    if (features.similarUsernameRatio > 0.3) raidScore += 0.2;
    if (features.messageVelocity > 50) raidScore += 0.2;
    if (features.mentionSpamRatio > 0.1) raidScore += 0.25;
    
    raidScore = Math.min(1, raidScore);
    
    // Log anomaly if high
    if (raidScore > 0.6) {
      await this.logAnomaly(guildId, 'raid_predicted', raidScore, features);
    }
    
    return {
      probability: raidScore,
      features,
      recommendation: raidScore > 0.7 ? 'LOCKDOWN' : raidScore > 0.4 ? 'ALERT' : 'MONITOR'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // TOXICITY PREDICTION
  // ═══════════════════════════════════════════════════════════════
  
  async predictToxicity(userId, guildId, messageHistory) {
    if (!messageHistory || messageHistory.length === 0) {
      return { score: 0, confidence: 0 };
    }
    
    let toxicityScore = 0;
    let indicators = [];
    
    // Analyze messages
    for (const msg of messageHistory.slice(-50)) {
      const content = msg.content?.toLowerCase() || '';
      
      // Check for various indicators
      if (this.containsSlurs(content)) {
        toxicityScore += this.toxicityIndicators.slurs;
        indicators.push('slurs');
      }
      
      if (this.containsThreats(content)) {
        toxicityScore += this.toxicityIndicators.threats;
        indicators.push('threats');
      }
      
      if (this.isSpam(content, messageHistory)) {
        toxicityScore += this.toxicityIndicators.spam;
        indicators.push('spam');
      }
      
      // Caps abuse (>70% caps in message >10 chars)
      if (content.length > 10) {
        const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
        if (capsRatio > 0.7) {
          toxicityScore += this.toxicityIndicators.capsAbuse;
          indicators.push('caps_abuse');
        }
      }
    }
    
    // Normalize
    toxicityScore = Math.min(1, toxicityScore / messageHistory.length);
    
    // AI sentiment analysis for nuanced cases
    if (toxicityScore > 0.2 && toxicityScore < 0.6) {
      const aiSentiment = await this.analyzesentimentAI(messageHistory.slice(-10));
      if (aiSentiment !== null) {
        toxicityScore = (toxicityScore + aiSentiment) / 2;
      }
    }
    
    return {
      score: toxicityScore,
      indicators: [...new Set(indicators)],
      confidence: Math.min(1, messageHistory.length / 20)
    };
  }
  
  containsSlurs(text) {
    // Would use a proper slur database
    const patterns = [
      // Patterns would be here - not including actual slurs
    ];
    return patterns.some(p => p.test(text));
  }
  
  containsThreats(text) {
    const patterns = [
      /\b(kill|murder|attack|hurt|harm)\s+(you|him|her|them)\b/i,
      /\bi('ll|m going to)\s+(kill|hurt|find)\b/i,
      /\bdox(x)?(ed|ing)?\b/i,
      /\bswat(t)?(ed|ing)?\b/i
    ];
    return patterns.some(p => p.test(text));
  }
  
  isSpam(content, history) {
    // Check if message is repeated
    const duplicates = history.filter(m => m.content === content).length;
    return duplicates > 3;
  }
  
  async analyzesentimentAI(messages) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        system: 'Analyze the toxicity of these messages. Return only a number from 0 (friendly) to 1 (toxic).',
        messages: [{
          role: 'user',
          content: messages.map(m => m.content).join('\n').slice(0, 1000)
        }]
      });
      
      const num = parseFloat(response.content[0].text);
      if (!isNaN(num) && num >= 0 && num <= 1) {
        return num;
      }
    } catch (e) {}
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // USER CLUSTERING
  // ═══════════════════════════════════════════════════════════════
  
  async clusterUsers(guildId) {
    // Get all user feature vectors
    const users = await this.pool.query(
      `SELECT user_id, features FROM nexus_ml_training WHERE guild_id = $1`,
      [guildId]
    );
    
    if (users.rows.length < 10) return null;
    
    // Simple k-means clustering (would use proper ML library in production)
    const k = 3; // legit, suspicious, threat
    const clusters = this.kMeans(users.rows, k);
    
    // Save clusters
    for (const cluster of clusters) {
      await this.pool.query(
        `INSERT INTO nexus_ml_clusters (cluster_id, guild_id, user_ids, centroid, cluster_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (cluster_id) DO UPDATE SET
         user_ids = $3, centroid = $4, updated_at = NOW()`,
        [
          `${guildId}_${cluster.id}`,
          guildId,
          cluster.userIds,
          cluster.centroid,
          cluster.type
        ]
      );
    }
    
    return clusters;
  }
  
  kMeans(data, k) {
    // Simplified k-means - would use proper implementation
    const clusters = [];
    for (let i = 0; i < k; i++) {
      clusters.push({
        id: i,
        userIds: [],
        centroid: {},
        type: ['legitimate', 'suspicious', 'threat'][i]
      });
    }
    
    // Distribute users (simplified)
    data.forEach((user, idx) => {
      clusters[idx % k].userIds.push(user.user_id);
    });
    
    return clusters;
  }

  // ═══════════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════════════
  
  async detectAnomalies(guildId, metrics) {
    const anomalies = [];
    
    // Get baseline
    const baseline = await this.getBaseline(guildId);
    
    // Check each metric
    if (metrics.joinRate > baseline.joinRate * 3) {
      anomalies.push({
        type: 'join_spike',
        severity: Math.min(1, metrics.joinRate / baseline.joinRate / 10),
        data: { current: metrics.joinRate, baseline: baseline.joinRate }
      });
    }
    
    if (metrics.messageRate > baseline.messageRate * 5) {
      anomalies.push({
        type: 'message_spike',
        severity: Math.min(1, metrics.messageRate / baseline.messageRate / 10),
        data: { current: metrics.messageRate, baseline: baseline.messageRate }
      });
    }
    
    if (metrics.newAccountRatio > 0.5 && baseline.newAccountRatio < 0.2) {
      anomalies.push({
        type: 'new_account_surge',
        severity: 0.8,
        data: { current: metrics.newAccountRatio, baseline: baseline.newAccountRatio }
      });
    }
    
    // Log anomalies
    for (const anomaly of anomalies) {
      await this.logAnomaly(guildId, anomaly.type, anomaly.severity, anomaly.data);
    }
    
    return anomalies;
  }
  
  async getBaseline(guildId) {
    // Would calculate from historical data
    return {
      joinRate: 5,
      messageRate: 100,
      newAccountRatio: 0.1
    };
  }
  
  async logAnomaly(guildId, type, severity, data) {
    await this.pool.query(
      `INSERT INTO nexus_ml_anomalies (guild_id, anomaly_type, severity, data)
       VALUES ($1, $2, $3, $4)`,
      [guildId, type, severity, data]
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // AI CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════
  
  async getAIClassification(features, scores) {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        system: 'You are classifying Discord users as threats. Return only a number from 0 (safe) to 1 (threat).',
        messages: [{
          role: 'user',
          content: `Features: ${JSON.stringify(features)}\nScores: ${JSON.stringify(scores)}`
        }]
      });
      
      const num = parseFloat(response.content[0].text);
      if (!isNaN(num) && num >= 0 && num <= 1) {
        return num;
      }
    } catch (e) {}
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // TRAINING & FEEDBACK
  // ═══════════════════════════════════════════════════════════════
  
  async addTrainingData(userId, guildId, features, label, labeledBy = 'manual') {
    await this.pool.query(
      `INSERT INTO nexus_ml_training (user_id, guild_id, features, label, labeled_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, guildId, features, label, labeledBy]
    );
  }
  
  async processFeedback(userId, guildId, wasCorrect, actualLabel) {
    if (!wasCorrect) {
      // Get the prediction
      const prediction = await this.pool.query(
        `SELECT * FROM nexus_ml_predictions 
         WHERE user_id = $1 AND guild_id = $2 
         ORDER BY predicted_at DESC LIMIT 1`,
        [userId, guildId]
      );
      
      if (prediction.rows.length > 0) {
        // Add as training data with correct label
        await this.addTrainingData(
          userId, 
          guildId, 
          prediction.rows[0].feature_scores, 
          actualLabel, 
          'feedback'
        );
      }
    }
  }
  
  async savePrediction(userId, guildId, predictions) {
    await this.pool.query(
      `INSERT INTO nexus_ml_predictions (user_id, guild_id, threat_probability, feature_scores)
       VALUES ($1, $2, $3, $4)`,
      [userId, guildId, predictions.threat_probability, predictions.feature_scores]
    );
  }
}

module.exports = NexusMLEngine;
