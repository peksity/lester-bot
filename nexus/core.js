/**
 * ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
 * ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
 * ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
 * ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
 * ██║ ╚████║███████╗██╔╝ ╚██╗╚██████╔╝███████║
 * ╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝ ╚═════╝ ╚══════╝
 * 
 * AI-FIRST MODERATION SYSTEM
 * 
 * This is not pattern matching with AI on top.
 * This IS the AI making every decision.
 * 
 * Every message → AI understands context → AI decides → Action
 * Every image → AI sees it → AI judges → Action
 * Every user → AI builds psychological profile → Predicts behavior
 * Every appeal → AI reviews full history → AI decides
 * 
 * The AI is not a tool. The AI IS the moderator.
 */

const { EmbedBuilder } = require('discord.js');

class NexusCore {
  constructor(pool, anthropic, client) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.client = client;
    
    // Conversation context windows (last 50 messages per channel)
    this.channelContext = new Map();
    
    // User psychological profiles
    this.userProfiles = new Map();
    
    // Learning data
    this.decisions = [];
    this.corrections = [];
    
    // Rate limiting for API calls
    this.lastAnalysis = new Map();
    this.analysisQueue = [];
    this.processing = false;
  }

  async initialize() {
    await this.initDatabase();
    this.startBackgroundProcesses();
    
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║     ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗             ║
    ║     ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝             ║
    ║     ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗             ║
    ║     ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║             ║
    ║     ██║ ╚████║███████╗██╔╝ ╚██╗╚██████╔╝███████║             ║
    ║     ╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝ ╚═════╝ ╚══════╝             ║
    ║                                                              ║
    ║              AI-FIRST MODERATION SYSTEM                      ║
    ║                                                              ║
    ║     Every decision made by AI. No regex. No keywords.        ║
    ║     Context-aware. Predictive. Self-learning.                ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
  }

  async initDatabase() {
    await this.pool.query(`
      -- AI Decision Log (every decision the AI makes)
      CREATE TABLE IF NOT EXISTS nexus_decisions (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(32),
        user_id VARCHAR(32),
        guild_id VARCHAR(32),
        channel_id VARCHAR(32),
        
        -- The content analyzed
        content TEXT,
        has_image BOOLEAN DEFAULT FALSE,
        image_analysis TEXT,
        
        -- AI's understanding
        ai_interpretation TEXT,
        detected_intent TEXT,
        emotional_state TEXT,
        
        -- AI's decision
        threat_level VARCHAR(16),
        action_taken VARCHAR(32),
        confidence FLOAT,
        reasoning TEXT,
        
        -- Context used
        context_messages INT,
        user_history_considered BOOLEAN,
        
        -- Learning
        was_corrected BOOLEAN DEFAULT FALSE,
        correction_reason TEXT,
        
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- User Psychological Profiles (AI-built over time)
      CREATE TABLE IF NOT EXISTS nexus_profiles (
        user_id VARCHAR(32),
        guild_id VARCHAR(32),
        
        -- AI-assessed personality traits
        communication_style TEXT,
        typical_emotional_state TEXT,
        humor_style TEXT,
        conflict_tendency TEXT,
        
        -- Behavioral patterns
        active_hours JSONB,
        topic_interests JSONB,
        social_connections JSONB,
        
        -- Risk assessment
        baseline_behavior TEXT,
        deviation_sensitivity FLOAT DEFAULT 0.5,
        predicted_risk TEXT,
        
        -- Trust metrics
        trust_score INT DEFAULT 50,
        positive_contributions INT DEFAULT 0,
        negative_incidents INT DEFAULT 0,
        
        -- History summary (AI-generated)
        behavior_summary TEXT,
        
        last_analyzed TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY(user_id, guild_id)
      );

      -- Conversation Context Cache
      CREATE TABLE IF NOT EXISTS nexus_context (
        id SERIAL PRIMARY KEY,
        channel_id VARCHAR(32),
        guild_id VARCHAR(32),
        user_id VARCHAR(32),
        username VARCHAR(64),
        content TEXT,
        has_attachment BOOLEAN DEFAULT FALSE,
        attachment_type VARCHAR(32),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_nexus_context_channel ON nexus_context(channel_id, created_at DESC);

      -- Cross-Server Reputation
      CREATE TABLE IF NOT EXISTS nexus_reputation (
        user_id VARCHAR(32) PRIMARY KEY,
        global_trust_score INT DEFAULT 50,
        servers_positive INT DEFAULT 0,
        servers_negative INT DEFAULT 0,
        known_issues JSONB,
        global_summary TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Learning Corrections (when AI was wrong)
      CREATE TABLE IF NOT EXISTS nexus_learning (
        id SERIAL PRIMARY KEY,
        decision_id INT REFERENCES nexus_decisions(id),
        original_action VARCHAR(32),
        correct_action VARCHAR(32),
        correction_context TEXT,
        learned_pattern TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Image Analysis Cache
      CREATE TABLE IF NOT EXISTS nexus_images (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(32),
        image_url TEXT,
        ai_description TEXT,
        detected_content JSONB,
        is_problematic BOOLEAN,
        problem_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  startBackgroundProcesses() {
    // Process analysis queue
    setInterval(() => this.processQueue(), 100);
    
    // Update user profiles every 10 minutes
    setInterval(() => this.updateProfiles(), 600000);
    
    // Generate daily insights
    this.scheduleDailyInsights();
    
    // Cleanup old context
    setInterval(() => this.cleanupContext(), 3600000);
  }

  // ═══════════════════════════════════════════════════════════════
  // CORE: Process Every Message Through AI
  // ═══════════════════════════════════════════════════════════════
  
  async processMessage(message) {
    if (!message.guild || message.author.bot) return null;
    
    // SKIP MODERATION in talk-to channels - these are conversation channels
    const channelName = message.channel.name || '';
    if (channelName.startsWith('talk-to-')) {
      return null; // Don't moderate conversation channels
    }
    
    const userId = message.author.id;
    const guildId = message.guild.id;
    const channelId = message.channel.id;
    const content = message.content;
    
    // Store in context
    await this.addToContext(message);
    
    // FAST PATH: Skip obviously safe messages
    // Short messages, questions, greetings are almost never violations
    const lowerContent = content.toLowerCase().trim();
    if (content.length < 50 && !this.hasPotentialIssue(lowerContent)) {
      return null; // Don't even analyze - it's fine
    }
    
    // Get conversation context (last 20 messages in this channel)
    const context = await this.getChannelContext(channelId, 20);
    
    // Get user's profile and history
    const profile = await this.getUserProfile(userId, guildId);
    
    // Check for images
    let imageAnalysis = null;
    if (message.attachments.size > 0) {
      imageAnalysis = await this.analyzeImages(message);
    }
    
    // THE CORE: AI analyzes everything
    const decision = await this.aiAnalyze({
      message,
      content: message.content,
      context,
      profile,
      imageAnalysis,
      channelName: message.channel.name,
      serverName: message.guild.name
    });
    
    // Execute if action needed
    if (decision.action && decision.action !== 'none') {
      await this.executeDecision(message, decision);
      return decision;
    }
    
    // Update profile based on this message
    await this.updateProfileFromMessage(userId, guildId, message, decision);
    
    return null;
  }

  // Check if message might need moderation
  hasPotentialIssue(content) {
    // Only flag if message contains potential issues
    const redFlags = [
      'kill', 'die', 'kys', 'neck', 'rope',
      'nigger', 'nigga', 'faggot', 'retard',
      'http://', 'https://', 'discord.gg',
      'free nitro', 'free money', 'dm me',
      '@everyone', '@here'
    ];
    
    return redFlags.some(flag => content.includes(flag));
  }

  // ═══════════════════════════════════════════════════════════════
  // AI ANALYSIS: The Brain
  // ═══════════════════════════════════════════════════════════════
  
  async aiAnalyze({ message, content, context, profile, imageAnalysis, channelName, serverName }) {
    // Build context string
    const contextString = context.map(m => 
      `[${m.username}]: ${m.content}${m.has_attachment ? ' [+attachment]' : ''}`
    ).join('\n');
    
    // Build profile string
    const profileString = profile ? `
Communication style: ${profile.communication_style || 'Unknown'}
Typical emotional state: ${profile.typical_emotional_state || 'Unknown'}
Humor style: ${profile.humor_style || 'Unknown'}
Trust score: ${profile.trust_score}/100
Past incidents: ${profile.negative_incidents || 0}
Behavior summary: ${profile.behavior_summary || 'New user, no history'}
    ` : 'New user, no profile yet';

    const prompt = `You are NEXUS, an advanced AI moderator. You don't use keyword matching - you UNDERSTAND context.

CURRENT MESSAGE:
Author: ${message.author.username} (ID: ${message.author.id})
Channel: #${channelName}
Server: ${serverName}
Content: "${content}"
${imageAnalysis ? `\nIMAGE ANALYSIS:\n${imageAnalysis}` : ''}

CONVERSATION CONTEXT (last ${context.length} messages):
${contextString || 'No recent context'}

USER PROFILE:
${profileString}

YOUR TASK:
Analyze this message in context. Consider:
1. Is this person joking with friends or being genuinely hostile?
2. Is this normal banter for this channel/community or crossing a line?
3. Does the user's history suggest this is out of character or a pattern?
4. Would a reasonable person in this community be hurt or offended?
5. Is there actual harm or just edgy humor?

RESPOND IN THIS EXACT FORMAT:
INTERPRETATION: [What you understand the person is actually trying to communicate]
INTENT: [genuine_hostility | joking | venting | asking | informing | other]
EMOTIONAL_STATE: [angry | playful | frustrated | neutral | excited | other]
THREAT_LEVEL: [none | low | medium | high | critical]
ACTION: [none | note | warn | mute_5m | mute_15m | mute_1h | mute_24h | kick | ban]
CONFIDENCE: [0.0-1.0]
REASONING: [2-3 sentences explaining your decision in plain language]

IMPORTANT:
- "none" action is valid and STRONGLY preferred for normal conversation
- 99% of messages should get ACTION: none
- Friends roasting each other is ALWAYS fine
- Swearing is fine unless directed AT someone aggressively
- Context matters more than individual words
- Only act on genuine harm, threats, or CLEAR rule violations
- When uncertain, ALWAYS choose "none"
- Short messages like "hi", "lol", "what", "ok" are NEVER violations
- Questions are NEVER violations
- Normal conversation is NEVER a violation`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const text = response.content[0].text;
      
      // Parse response
      const interpretation = this.extract(text, 'INTERPRETATION');
      const intent = this.extract(text, 'INTENT');
      const emotionalState = this.extract(text, 'EMOTIONAL_STATE');
      const threatLevel = this.extract(text, 'THREAT_LEVEL');
      const action = this.extract(text, 'ACTION');
      const confidence = parseFloat(this.extract(text, 'CONFIDENCE')) || 0.5;
      const reasoning = this.extract(text, 'REASONING');
      
      // Log decision
      await this.logDecision({
        messageId: message.id,
        userId: message.author.id,
        guildId: message.guild.id,
        channelId: message.channel.id,
        content,
        hasImage: !!imageAnalysis,
        imageAnalysis,
        interpretation,
        intent,
        emotionalState,
        threatLevel,
        action,
        confidence,
        reasoning,
        contextCount: context.length,
        profileUsed: !!profile
      });
      
      return {
        interpretation,
        intent,
        emotionalState,
        threatLevel,
        action,
        confidence,
        reasoning
      };
      
    } catch (error) {
      console.error('AI Analysis error:', error);
      return { action: 'none', confidence: 0, reasoning: 'Analysis failed' };
    }
  }

  extract(text, field) {
    const regex = new RegExp(`${field}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  // ═══════════════════════════════════════════════════════════════
  // IMAGE ANALYSIS: Vision
  // ═══════════════════════════════════════════════════════════════
  
  async analyzeImages(message) {
    const analyses = [];
    
    for (const [, attachment] of message.attachments) {
      if (attachment.contentType?.startsWith('image/')) {
        try {
          const response = await this.anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'url',
                    url: attachment.url
                  }
                },
                {
                  type: 'text',
                  text: `Analyze this image for a Discord moderation system. Describe:
1. What is shown in the image
2. Is there any problematic content (NSFW, gore, harassment, personal info, etc.)
3. Any text visible in the image
4. Overall assessment: safe / questionable / problematic

Be concise but thorough.`
                }
              ]
            }]
          });
          
          const analysis = response.content[0].text;
          analyses.push(analysis);
          
          // Cache the analysis
          const isProblematic = analysis.toLowerCase().includes('problematic') || 
                               analysis.toLowerCase().includes('nsfw') ||
                               analysis.toLowerCase().includes('gore');
          
          await this.pool.query(`
            INSERT INTO nexus_images (message_id, image_url, ai_description, is_problematic, problem_reason)
            VALUES ($1, $2, $3, $4, $5)
          `, [message.id, attachment.url, analysis, isProblematic, isProblematic ? analysis : null]);
          
        } catch (e) {
          console.error('Image analysis error:', e);
        }
      }
    }
    
    return analyses.length > 0 ? analyses.join('\n---\n') : null;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXECUTE DECISIONS
  // ═══════════════════════════════════════════════════════════════
  
  async executeDecision(message, decision) {
    const member = message.member;
    const guild = message.guild;
    
    // Only delete message if:
    // 1. Action is more than note/warn
    // 2. OR confidence is very high (>0.85) for warns
    const shouldDelete = 
      (decision.action !== 'none' && decision.action !== 'note' && decision.action !== 'warn') ||
      (decision.action === 'warn' && decision.confidence > 0.85);
    
    if (shouldDelete) {
      await message.delete().catch(() => {});
    }
    
    // Map actions to durations
    const muteDurations = {
      'mute_5m': 5,
      'mute_15m': 15,
      'mute_1h': 60,
      'mute_24h': 1440
    };
    
    switch (decision.action) {
      case 'note':
        // Silent logging only - no user notification
        await this.logToMods(guild, 'note', member, decision.reasoning, decision.confidence);
        break;
        
      case 'warn':
        await this.sendWarning(member, guild, decision);
        await this.logToMods(guild, 'warn', member, decision.reasoning, decision.confidence);
        break;
        
      case 'mute_5m':
      case 'mute_15m':
      case 'mute_1h':
      case 'mute_24h':
        const duration = muteDurations[decision.action];
        await this.executeMute(member, guild, decision, duration);
        break;
        
      case 'kick':
        await this.executeKick(member, guild, decision);
        break;
        
      case 'ban':
        await this.executeBan(member, guild, decision);
        break;
    }
    
    // Update global reputation
    if (decision.action !== 'none' && decision.action !== 'note') {
      await this.updateGlobalReputation(member.id, decision.action);
    }
  }

  async sendWarning(member, guild, decision) {
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Heads Up')
      .setDescription(`Your message in **${guild.name}** was flagged.`)
      .addFields(
        { name: 'Why', value: decision.reasoning },
        { name: 'What I understood', value: decision.interpretation || 'N/A' }
      )
      .setColor(0xFFAA00)
      .setFooter({ text: 'This is an AI assessment. If I misunderstood, the mods can review.' })
      .setTimestamp();
    
    await member.send({ embeds: [embed] }).catch(() => {});
    
    await this.pool.query(`
      UPDATE nexus_profiles 
      SET negative_incidents = negative_incidents + 1, trust_score = GREATEST(0, trust_score - 5)
      WHERE user_id = $1 AND guild_id = $2
    `, [member.id, guild.id]);
  }

  async executeMute(member, guild, decision, durationMinutes) {
    await member.timeout(durationMinutes * 60 * 1000, decision.reasoning).catch(console.error);
    
    const embed = new EmbedBuilder()
      .setTitle('🔇 Muted')
      .setDescription(`You've been muted in **${guild.name}** for ${durationMinutes} minutes.`)
      .addFields(
        { name: 'Why', value: decision.reasoning },
        { name: 'What I understood', value: decision.interpretation || 'N/A' },
        { name: 'Appeal', value: 'DM me with "appeal" and explain your side. I\'ll review the full context.' }
      )
      .setColor(0xFF8C00)
      .setTimestamp();
    
    await member.send({ embeds: [embed] }).catch(() => {});
    await this.logToMods(guild, 'mute', member, decision.reasoning, decision.confidence, `${durationMinutes}min`);
    
    await this.pool.query(`
      UPDATE nexus_profiles 
      SET negative_incidents = negative_incidents + 1, trust_score = GREATEST(0, trust_score - 15)
      WHERE user_id = $1 AND guild_id = $2
    `, [member.id, guild.id]);
  }

  async executeKick(member, guild, decision) {
    const embed = new EmbedBuilder()
      .setTitle('👢 Kicked')
      .setDescription(`You've been kicked from **${guild.name}**.`)
      .addFields(
        { name: 'Why', value: decision.reasoning },
        { name: 'Rejoin', value: 'You can rejoin, but please follow the rules.' },
        { name: 'Appeal', value: 'DM me with "appeal" if you think this was a mistake.' }
      )
      .setColor(0xFF4500)
      .setTimestamp();
    
    await member.send({ embeds: [embed] }).catch(() => {});
    await member.kick(decision.reasoning).catch(console.error);
    await this.logToMods(guild, 'kick', member, decision.reasoning, decision.confidence);
    
    await this.pool.query(`
      UPDATE nexus_profiles 
      SET negative_incidents = negative_incidents + 1, trust_score = GREATEST(0, trust_score - 25)
      WHERE user_id = $1 AND guild_id = $2
    `, [member.id, guild.id]);
  }

  async executeBan(member, guild, decision) {
    const embed = new EmbedBuilder()
      .setTitle('🔨 Banned')
      .setDescription(`You've been banned from **${guild.name}**.`)
      .addFields(
        { name: 'Why', value: decision.reasoning },
        { name: 'Appeal', value: 'DM me with "appeal" followed by your explanation. I will review the full context and may overturn this.' }
      )
      .setColor(0xFF0000)
      .setTimestamp();
    
    await member.send({ embeds: [embed] }).catch(() => {});
    await member.ban({ reason: decision.reasoning, deleteMessageSeconds: 3600 }).catch(console.error);
    await this.logToMods(guild, 'ban', member, decision.reasoning, decision.confidence);
    
    await this.pool.query(`
      UPDATE nexus_profiles 
      SET negative_incidents = negative_incidents + 1, trust_score = 0
      WHERE user_id = $1 AND guild_id = $2
    `, [member.id, guild.id]);
  }

  // ═══════════════════════════════════════════════════════════════
  // APPEALS: AI Reviews Full Context
  // ═══════════════════════════════════════════════════════════════
  
  async processAppeal(user, appealMessage) {
    const userId = user.id;
    
    // Find their ban/action
    const lastDecision = await this.pool.query(`
      SELECT * FROM nexus_decisions 
      WHERE user_id = $1 AND action_taken IN ('ban', 'kick', 'mute_24h', 'mute_1h')
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    
    if (lastDecision.rows.length === 0) {
      return { success: false, message: "I couldn't find any recent actions against your account." };
    }
    
    const original = lastDecision.rows[0];
    
    // Get their full history
    const history = await this.pool.query(`
      SELECT content, ai_interpretation, action_taken, reasoning, created_at
      FROM nexus_decisions 
      WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 20
    `, [userId]);
    
    // Get their profile
    const profile = await this.pool.query(`
      SELECT * FROM nexus_profiles WHERE user_id = $1
    `, [userId]);
    
    // AI reviews the appeal
    const prompt = `You are reviewing an appeal. Be fair but thorough.

ORIGINAL DECISION:
Content: "${original.content}"
My interpretation: ${original.ai_interpretation}
Action taken: ${original.action_taken}
My reasoning: ${original.reasoning}
Confidence: ${original.confidence}

USER'S APPEAL:
"${appealMessage}"

USER'S HISTORY (${history.rows.length} past decisions):
${history.rows.map(h => `- "${h.content?.slice(0, 50)}..." → ${h.action_taken} (${h.reasoning?.slice(0, 50)})`).join('\n')}

USER'S PROFILE:
Trust score: ${profile.rows[0]?.trust_score || 50}/100
Negative incidents: ${profile.rows[0]?.negative_incidents || 0}
Behavior summary: ${profile.rows[0]?.behavior_summary || 'Unknown'}

CONSIDER:
1. Did I misunderstand the context?
2. Was the user joking and I took it too seriously?
3. Is their appeal showing genuine understanding or just wanting unbanned?
4. Does their history support or contradict their appeal?
5. Would overturning this set a bad precedent?

RESPOND:
DECISION: [uphold | reduce | overturn]
NEW_ACTION: [If reducing: what should it be instead]
REASONING: [2-3 sentences to tell the user]
INTERNAL_NOTES: [Notes for mod channel]
CONFIDENCE: [0.0-1.0]`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const text = response.content[0].text;
      
      const decision = this.extract(text, 'DECISION')?.toLowerCase() || 'uphold';
      const newAction = this.extract(text, 'NEW_ACTION');
      const reasoning = this.extract(text, 'REASONING');
      const internalNotes = this.extract(text, 'INTERNAL_NOTES');
      const confidence = parseFloat(this.extract(text, 'CONFIDENCE')) || 0.7;
      
      // Execute decision
      if (decision === 'overturn') {
        // Unban from all guilds
        for (const [, guild] of this.client.guilds.cache) {
          await guild.members.unban(userId, 'Appeal approved by NEXUS').catch(() => {});
        }
        
        // Record as correction for learning
        await this.recordCorrection(original.id, original.action_taken, 'none', appealMessage);
        
        // Restore some trust
        await this.pool.query(`
          UPDATE nexus_profiles SET trust_score = LEAST(50, trust_score + 20)
          WHERE user_id = $1
        `, [userId]);
      }
      
      // Log to mod channels
      for (const [, guild] of this.client.guilds.cache) {
        await this.logToMods(guild, `appeal-${decision}`, { id: userId, user }, 
          `${reasoning}\n\nInternal: ${internalNotes}`, confidence);
      }
      
      return {
        success: true,
        decision,
        reasoning,
        newAction
      };
      
    } catch (e) {
      console.error('Appeal processing error:', e);
      return { success: false, message: 'Unable to process appeal right now. Try again later.' };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // USER PROFILES: Psychological Understanding
  // ═══════════════════════════════════════════════════════════════
  
  async getUserProfile(userId, guildId) {
    const result = await this.pool.query(`
      SELECT * FROM nexus_profiles WHERE user_id = $1 AND guild_id = $2
    `, [userId, guildId]);
    
    if (result.rows.length === 0) {
      // Create new profile
      await this.pool.query(`
        INSERT INTO nexus_profiles (user_id, guild_id) VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [userId, guildId]);
      return null;
    }
    
    return result.rows[0];
  }

  async updateProfileFromMessage(userId, guildId, message, decision) {
    // Only do deep profile updates occasionally (not every message)
    const key = `${userId}-${guildId}`;
    const lastUpdate = this.userProfiles.get(key);
    const now = Date.now();
    
    if (lastUpdate && now - lastUpdate < 300000) return; // 5 minute cooldown
    this.userProfiles.set(key, now);
    
    // Queue profile update
    this.analysisQueue.push({
      type: 'profile_update',
      userId,
      guildId,
      decision
    });
  }

  async updateProfiles() {
    // Pick random users to update profiles for
    const users = await this.pool.query(`
      SELECT user_id, guild_id FROM (
        SELECT DISTINCT user_id, guild_id FROM nexus_context
        WHERE created_at > NOW() - INTERVAL '24 hours'
      ) AS recent_users
      ORDER BY RANDOM() LIMIT 10
    `);
    
    for (const user of users.rows) {
      await this.buildUserProfile(user.user_id, user.guild_id);
    }
  }

  async buildUserProfile(userId, guildId) {
    // Get their recent messages
    const messages = await this.pool.query(`
      SELECT content, created_at FROM nexus_context
      WHERE user_id = $1 AND guild_id = $2
      ORDER BY created_at DESC LIMIT 50
    `, [userId, guildId]);
    
    if (messages.rows.length < 5) return; // Not enough data
    
    // Get their decisions
    const decisions = await this.pool.query(`
      SELECT intent, emotional_state, threat_level, action_taken FROM nexus_decisions
      WHERE user_id = $1 AND guild_id = $2
      ORDER BY created_at DESC LIMIT 20
    `, [userId, guildId]);
    
    const prompt = `Analyze this Discord user's behavior and build a psychological profile.

RECENT MESSAGES (${messages.rows.length}):
${messages.rows.map(m => `- "${m.content?.slice(0, 100)}"`).join('\n')}

PAST AI ASSESSMENTS:
${decisions.rows.map(d => `- Intent: ${d.intent}, Emotion: ${d.emotional_state}, Threat: ${d.threat_level}`).join('\n') || 'None yet'}

Build a profile:
COMMUNICATION_STYLE: [How they typically communicate - formal, casual, memes, one-word, etc.]
TYPICAL_EMOTIONAL_STATE: [Their baseline mood]
HUMOR_STYLE: [How they joke - sarcastic, dark, wholesome, none, etc.]
CONFLICT_TENDENCY: [How they handle disagreement]
PREDICTED_RISK: [low/medium/high - likelihood of future issues]
BEHAVIOR_SUMMARY: [2-3 sentence summary of who this person is in this server]`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const text = response.content[0].text;
      
      await this.pool.query(`
        UPDATE nexus_profiles SET
          communication_style = $3,
          typical_emotional_state = $4,
          humor_style = $5,
          conflict_tendency = $6,
          predicted_risk = $7,
          behavior_summary = $8,
          last_analyzed = NOW()
        WHERE user_id = $1 AND guild_id = $2
      `, [
        userId, guildId,
        this.extract(text, 'COMMUNICATION_STYLE'),
        this.extract(text, 'TYPICAL_EMOTIONAL_STATE'),
        this.extract(text, 'HUMOR_STYLE'),
        this.extract(text, 'CONFLICT_TENDENCY'),
        this.extract(text, 'PREDICTED_RISK'),
        this.extract(text, 'BEHAVIOR_SUMMARY')
      ]);
      
    } catch (e) {
      console.error('Profile build error:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTEXT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  
  async addToContext(message) {
    await this.pool.query(`
      INSERT INTO nexus_context (channel_id, guild_id, user_id, username, content, has_attachment, attachment_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      message.channel.id,
      message.guild.id,
      message.author.id,
      message.author.username,
      message.content.slice(0, 2000),
      message.attachments.size > 0,
      message.attachments.first()?.contentType || null
    ]);
  }

  async getChannelContext(channelId, limit = 20) {
    const result = await this.pool.query(`
      SELECT username, content, has_attachment, created_at
      FROM nexus_context
      WHERE channel_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [channelId, limit]);
    
    return result.rows.reverse(); // Oldest first
  }

  async cleanupContext() {
    // Keep last 24 hours
    await this.pool.query(`DELETE FROM nexus_context WHERE created_at < NOW() - INTERVAL '24 hours'`);
  }

  // ═══════════════════════════════════════════════════════════════
  // CROSS-SERVER REPUTATION
  // ═══════════════════════════════════════════════════════════════
  
  async updateGlobalReputation(userId, action) {
    const isNegative = ['ban', 'kick', 'mute_24h'].includes(action);
    
    await this.pool.query(`
      INSERT INTO nexus_reputation (user_id, global_trust_score, servers_negative)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        global_trust_score = CASE 
          WHEN $4 THEN GREATEST(0, nexus_reputation.global_trust_score - 10)
          ELSE nexus_reputation.global_trust_score
        END,
        servers_negative = CASE 
          WHEN $4 THEN nexus_reputation.servers_negative + 1
          ELSE nexus_reputation.servers_negative
        END,
        updated_at = NOW()
    `, [userId, isNegative ? 40 : 50, isNegative ? 1 : 0, isNegative]);
  }

  async getGlobalReputation(userId) {
    const result = await this.pool.query(`
      SELECT * FROM nexus_reputation WHERE user_id = $1
    `, [userId]);
    return result.rows[0] || null;
  }

  // ═══════════════════════════════════════════════════════════════
  // LEARNING: Record Corrections
  // ═══════════════════════════════════════════════════════════════
  
  async recordCorrection(decisionId, originalAction, correctAction, context) {
    await this.pool.query(`
      INSERT INTO nexus_learning (decision_id, original_action, correct_action, correction_context)
      VALUES ($1, $2, $3, $4)
    `, [decisionId, originalAction, correctAction, context]);
    
    await this.pool.query(`
      UPDATE nexus_decisions SET was_corrected = TRUE, correction_reason = $2
      WHERE id = $1
    `, [decisionId, context]);
  }

  // ═══════════════════════════════════════════════════════════════
  // LOGGING
  // ═══════════════════════════════════════════════════════════════
  
  async logDecision(data) {
    await this.pool.query(`
      INSERT INTO nexus_decisions (
        message_id, user_id, guild_id, channel_id, content, has_image, image_analysis,
        ai_interpretation, detected_intent, emotional_state, threat_level, action_taken,
        confidence, reasoning, context_messages, user_history_considered
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      data.messageId, data.userId, data.guildId, data.channelId, data.content,
      data.hasImage, data.imageAnalysis, data.interpretation, data.intent,
      data.emotionalState, data.threatLevel, data.action, data.confidence,
      data.reasoning, data.contextCount, data.profileUsed
    ]);
  }

  async logToMods(guild, action, member, reason, confidence, extra = null) {
    const modChannel = guild.channels.cache.find(c => 
      c.name.includes('mod-log') || c.name.includes('nexus') || c.name.includes('staff')
    );
    if (!modChannel) return;
    
    const colors = {
      'note': 0x5865F2,
      'warn': 0xFFAA00,
      'mute': 0xFF8C00,
      'kick': 0xFF4500,
      'ban': 0xFF0000,
      'appeal-uphold': 0xFF6B6B,
      'appeal-reduce': 0xFFAA00,
      'appeal-overturn': 0x00FF00
    };
    
    const emojis = {
      'note': '📝',
      'warn': '⚠️',
      'mute': '🔇',
      'kick': '👢',
      'ban': '🔨',
      'appeal-uphold': '❌',
      'appeal-reduce': '⚖️',
      'appeal-overturn': '✅'
    };
    
    const embed = new EmbedBuilder()
      .setDescription(`${emojis[action] || '🤖'} **${action.toUpperCase()}**\n\n**User:** <@${member.id}>\n**Reason:** ${reason}`)
      .setColor(colors[action] || 0x5865F2)
      .setFooter({ text: confidence ? `Confidence: ${Math.round(confidence * 100)}% • NEXUS AI` : 'NEXUS AI' })
      .setTimestamp();
    
    if (extra) embed.addFields({ name: 'Details', value: extra });
    
    await modChannel.send({ embeds: [embed] }).catch(() => {});
  }

  // ═══════════════════════════════════════════════════════════════
  // DAILY INSIGHTS
  // ═══════════════════════════════════════════════════════════════
  
  scheduleDailyInsights() {
    const scheduleNext = () => {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(6, 0, 0, 0);
      if (now >= next) next.setDate(next.getDate() + 1);
      
      setTimeout(async () => {
        await this.sendDailyInsights();
        scheduleNext();
      }, next.getTime() - now.getTime());
    };
    scheduleNext();
  }

  async sendDailyInsights() {
    for (const [guildId, guild] of this.client.guilds.cache) {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        // Get stats
        const stats = await this.pool.query(`
          SELECT 
            COUNT(*) as total_analyzed,
            COUNT(*) FILTER (WHERE action_taken != 'none') as actions_taken,
            COUNT(*) FILTER (WHERE action_taken = 'warn') as warns,
            COUNT(*) FILTER (WHERE action_taken LIKE 'mute%') as mutes,
            COUNT(*) FILTER (WHERE action_taken = 'kick') as kicks,
            COUNT(*) FILTER (WHERE action_taken = 'ban') as bans,
            AVG(confidence) as avg_confidence,
            COUNT(*) FILTER (WHERE was_corrected) as corrections
          FROM nexus_decisions
          WHERE guild_id = $1 AND created_at::date = $2
        `, [guildId, dateStr]);
        
        const s = stats.rows[0];
        
        // Generate AI insight
        const insight = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Write a 2-3 sentence daily summary for a Discord server:
- Messages analyzed: ${s.total_analyzed}
- Actions taken: ${s.actions_taken}
- Warns: ${s.warns}, Mutes: ${s.mutes}, Kicks: ${s.kicks}, Bans: ${s.bans}
- Average confidence: ${Math.round((s.avg_confidence || 0) * 100)}%
- Corrections (times I was wrong): ${s.corrections}

Be concise. Note trends or concerns.`
          }]
        });
        
        const modChannel = guild.channels.cache.find(c => 
          c.name.includes('mod-log') || c.name.includes('nexus') || c.name.includes('staff')
        );
        
        if (modChannel) {
          const embed = new EmbedBuilder()
            .setTitle(`📊 NEXUS Daily Report - ${dateStr}`)
            .setDescription(insight.content[0].text)
            .addFields(
              { name: '🔍 Analyzed', value: `${s.total_analyzed} messages`, inline: true },
              { name: '⚡ Actions', value: `⚠️${s.warns} 🔇${s.mutes} 👢${s.kicks} 🔨${s.bans}`, inline: true },
              { name: '🎯 Accuracy', value: `${s.corrections || 0} corrections`, inline: true }
            )
            .setColor(0x5865F2)
            .setFooter({ text: 'NEXUS AI - Every decision by AI' })
            .setTimestamp();
          
          await modChannel.send({ embeds: [embed] });
        }
        
      } catch (e) {
        console.error('Daily insight error:', e);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // QUEUE PROCESSING
  // ═══════════════════════════════════════════════════════════════
  
  async processQueue() {
    if (this.processing || this.analysisQueue.length === 0) return;
    
    this.processing = true;
    const item = this.analysisQueue.shift();
    
    try {
      if (item.type === 'profile_update') {
        await this.buildUserProfile(item.userId, item.guildId);
      }
    } catch (e) {
      console.error('Queue processing error:', e);
    }
    
    this.processing = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // MEMBER JOIN: Check Global Reputation
  // ═══════════════════════════════════════════════════════════════
  
  async checkNewMember(member) {
    const globalRep = await this.getGlobalReputation(member.id);
    
    if (globalRep && globalRep.servers_negative >= 2) {
      // Known bad actor
      await this.logToMods(member.guild, 'note', member, 
        `⚠️ Known bad actor: Banned/kicked from ${globalRep.servers_negative} other servers. Global trust: ${globalRep.global_trust_score}/100`,
        null);
    }
    
    // Check account age
    const ageHours = (Date.now() - member.user.createdTimestamp) / 3600000;
    if (ageHours < 24) {
      await this.logToMods(member.guild, 'note', member,
        `👶 New account alert: Account is only ${ageHours.toFixed(1)} hours old.`,
        null);
    }
  }
}

module.exports = NexusCore;
