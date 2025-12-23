/**
 * INVESTIGATION HANDLER - Message Logging & Smart Rules
 * 
 * Features:
 * - Logs ALL messages to database
 * - Tracks edits and deletions
 * - Smart rule violation detection
 * - Links to specific rules
 * - Evidence collection for moderation
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const Anthropic = require('@anthropic-ai/sdk');

// ============================================
// DATABASE INITIALIZATION
// ============================================
async function initInvestigationDB(pool) {
  await pool.query(`
    -- Message log - stores EVERY message
    CREATE TABLE IF NOT EXISTS message_log (
      id SERIAL PRIMARY KEY,
      message_id VARCHAR(32) UNIQUE,
      channel_id VARCHAR(32),
      channel_name VARCHAR(100),
      guild_id VARCHAR(32),
      author_id VARCHAR(32),
      author_name VARCHAR(64),
      content TEXT,
      attachments JSONB DEFAULT '[]',
      reply_to VARCHAR(32),
      edited BOOLEAN DEFAULT FALSE,
      deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      edited_at TIMESTAMP,
      deleted_at TIMESTAMP
    );
    
    -- Message edits history
    CREATE TABLE IF NOT EXISTS message_edits (
      id SERIAL PRIMARY KEY,
      message_id VARCHAR(32),
      old_content TEXT,
      new_content TEXT,
      edited_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Server rules
    CREATE TABLE IF NOT EXISTS server_rules (
      id SERIAL PRIMARY KEY,
      rule_id VARCHAR(16) UNIQUE,
      guild_id VARCHAR(32),
      category VARCHAR(64),
      title VARCHAR(128),
      description TEXT,
      examples TEXT,
      severity VARCHAR(16) DEFAULT 'warning',
      message_id VARCHAR(32),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Rule violations
    CREATE TABLE IF NOT EXISTS rule_violations (
      id SERIAL PRIMARY KEY,
      rule_id VARCHAR(16),
      user_id VARCHAR(32),
      user_name VARCHAR(64),
      message_id VARCHAR(32),
      message_content TEXT,
      channel_id VARCHAR(32),
      confidence FLOAT,
      action_taken VARCHAR(32),
      false_positive BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Mod actions
    CREATE TABLE IF NOT EXISTS mod_actions (
      id SERIAL PRIMARY KEY,
      action_type VARCHAR(32),
      target_id VARCHAR(32),
      target_name VARCHAR(64),
      moderator_id VARCHAR(32),
      moderator_name VARCHAR(64),
      reason TEXT,
      evidence JSONB DEFAULT '[]',
      guild_id VARCHAR(32),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Appeals
    CREATE TABLE IF NOT EXISTS appeals (
      id SERIAL PRIMARY KEY,
      appeal_id VARCHAR(32) UNIQUE,
      user_id VARCHAR(32),
      user_name VARCHAR(64),
      action_id INT,
      appeal_reason TEXT,
      status VARCHAR(16) DEFAULT 'pending',
      verdict TEXT,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_msg_author ON message_log(author_id);
    CREATE INDEX IF NOT EXISTS idx_msg_channel ON message_log(channel_id);
    CREATE INDEX IF NOT EXISTS idx_msg_created ON message_log(created_at);
  `);
  
  console.log('✅ Investigation database initialized');
}

// ============================================
// MESSAGE LOGGING
// ============================================
const messageCache = new Map();

async function logMessage(pool, message) {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  try {
    // Cache for edit tracking
    messageCache.set(message.id, {
      content: message.content,
      timestamp: Date.now()
    });
    
    // Clean old cache (1 hour)
    for (const [id, data] of messageCache) {
      if (Date.now() - data.timestamp > 3600000) {
        messageCache.delete(id);
      }
    }
    
    const attachments = message.attachments.map(a => ({
      name: a.name,
      url: a.url,
      type: a.contentType
    }));
    
    await pool.query(`
      INSERT INTO message_log 
      (message_id, channel_id, channel_name, guild_id, author_id, author_name, content, attachments, reply_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (message_id) DO NOTHING
    `, [
      message.id,
      message.channel.id,
      message.channel.name,
      message.guild.id,
      message.author.id,
      message.author.username,
      message.content,
      JSON.stringify(attachments),
      message.reference?.messageId || null
    ]);
  } catch (error) {
    // Silently fail - don't break bot for logging errors
  }
}

async function logEdit(pool, oldMessage, newMessage) {
  try {
    const oldContent = messageCache.get(oldMessage.id)?.content || oldMessage.content || '[unknown]';
    
    await pool.query(`
      INSERT INTO message_edits (message_id, old_content, new_content)
      VALUES ($1, $2, $3)
    `, [oldMessage.id, oldContent, newMessage.content]);
    
    await pool.query(`
      UPDATE message_log SET content = $1, edited = TRUE, edited_at = NOW()
      WHERE message_id = $2
    `, [newMessage.content, newMessage.id]);
    
    messageCache.set(newMessage.id, {
      content: newMessage.content,
      timestamp: Date.now()
    });
  } catch (error) {}
}

async function logDeletion(pool, message) {
  try {
    await pool.query(`
      UPDATE message_log SET deleted = TRUE, deleted_at = NOW()
      WHERE message_id = $1
    `, [message.id]);
  } catch (error) {}
}

// ============================================
// RULES SYSTEM
// ============================================
const DEFAULT_RULES = [
  {
    category: 'Respect',
    title: 'Be Respectful',
    description: 'Treat all members with respect. No harassment, bullying, hate speech, or personal attacks.',
    examples: 'Slurs, targeted harassment, discrimination',
    severity: 'warning'
  },
  {
    category: 'Content',
    title: 'No NSFW Content',
    description: 'Keep all content safe for work. No explicit images, gore, or sexual content.',
    examples: 'Pornography, graphic violence, explicit discussions',
    severity: 'ban'
  },
  {
    category: 'Spam',
    title: 'No Spam',
    description: 'Don\'t spam messages, emojis, or links. Self-promotion needs mod approval.',
    examples: 'Repeated messages, excessive caps, uninvited ads',
    severity: 'mute'
  },
  {
    category: 'Channels',
    title: 'Use Correct Channels',
    description: 'Post content in appropriate channels. LFG in LFG channels, chat in chat channels.',
    examples: 'LFG requests in general, random chat in LFG channels',
    severity: 'warning'
  },
  {
    category: 'Safety',
    title: 'No Real-Money Trading',
    description: 'In-game glitches only. No account selling, modded money, or real-money scams.',
    examples: 'Selling accounts, recovery services, money drops',
    severity: 'ban'
  },
  {
    category: 'Privacy',
    title: 'No Personal Information',
    description: 'Don\'t share or request personal info like addresses, phone numbers, or real names.',
    examples: 'Doxxing, asking for addresses, sharing private info',
    severity: 'ban'
  },
  {
    category: 'Community',
    title: 'No Griefing Talk',
    description: 'We help each other here. Don\'t discuss or plan griefing other players.',
    examples: 'Cargo destruction plans, targeting users, trolling strategies',
    severity: 'warning'
  },
  {
    category: 'LFG',
    title: 'Honor LFG Commitments',
    description: 'If you join an LFG, follow through. Don\'t abandon your team without reason.',
    examples: 'Leaving mid-heist, no-shows, sabotaging runs',
    severity: 'warning'
  },
  {
    category: 'Moderation',
    title: 'Respect Mods',
    description: 'Follow moderator instructions. Take warnings seriously.',
    examples: 'Arguing publicly with mods, ignoring warnings, mini-modding',
    severity: 'mute'
  },
  {
    category: 'Scams',
    title: 'No Scams',
    description: 'No scam links, phishing, or fake giveaways.',
    examples: 'Free Shark Card links, fake Rockstar pages, phishing',
    severity: 'ban'
  }
];

async function setupRules(pool, guildId, rulesChannel) {
  // Check if rules already exist
  const existing = await pool.query(
    'SELECT COUNT(*) as count FROM server_rules WHERE guild_id = $1',
    [guildId]
  );
  
  if (parseInt(existing.rows[0].count) > 0) {
    return false; // Already set up
  }
  
  // Create rules embed
  const embed = new EmbedBuilder()
    .setTitle('📜 SERVER RULES')
    .setDescription('Welcome to **The Unpatched Method**! Please read and follow these rules.')
    .setColor(0x5865F2);
  
  // Add each rule
  for (let i = 0; i < DEFAULT_RULES.length; i++) {
    const rule = DEFAULT_RULES[i];
    const ruleId = `R${String(i + 1).padStart(2, '0')}`;
    
    embed.addFields({
      name: `${ruleId} - ${rule.title}`,
      value: `${rule.description}\n*Examples: ${rule.examples}*`,
      inline: false
    });
    
    // Store in database
    await pool.query(`
      INSERT INTO server_rules (rule_id, guild_id, category, title, description, examples, severity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (rule_id) DO NOTHING
    `, [ruleId, guildId, rule.category, rule.title, rule.description, rule.examples, rule.severity]);
  }
  
  embed.setFooter({ text: 'Breaking rules = warnings → mutes → bans. Be cool! 😎' });
  
  // Send to rules channel
  const rulesMsg = await rulesChannel.send({ embeds: [embed] });
  
  // Update rules with message ID for linking
  for (let i = 0; i < DEFAULT_RULES.length; i++) {
    const ruleId = `R${String(i + 1).padStart(2, '0')}`;
    await pool.query(
      'UPDATE server_rules SET message_id = $1 WHERE rule_id = $2',
      [rulesMsg.id, ruleId]
    );
  }
  
  return true;
}

async function getRules(pool, guildId) {
  const result = await pool.query(
    'SELECT * FROM server_rules WHERE guild_id = $1 ORDER BY rule_id',
    [guildId]
  );
  return result.rows;
}

async function getRule(pool, guildId, ruleId) {
  const result = await pool.query(
    'SELECT * FROM server_rules WHERE guild_id = $1 AND rule_id = $2',
    [guildId, ruleId]
  );
  return result.rows[0];
}

// ============================================
// SMART RULE CHECKING
// ============================================
const recentWarnings = new Map();

async function checkForViolation(pool, anthropic, message) {
  if (message.author.bot) return null;
  
  // Check warning cooldown (1 min per user per channel)
  const warningKey = `${message.author.id}-${message.channel.id}`;
  const lastWarning = recentWarnings.get(warningKey);
  if (lastWarning && Date.now() - lastWarning < 60000) {
    return null;
  }
  
  // Get rules
  const rules = await getRules(pool, message.guild.id);
  if (rules.length === 0) return null;
  
  // Skip very short messages
  if (message.content.length < 10) return null;
  
  // Build context
  const rulesContext = rules.map(r => 
    `[${r.rule_id}] ${r.title}: ${r.description}`
  ).join('\n');
  
  // Get recent context
  let context = '';
  try {
    const recent = await message.channel.messages.fetch({ limit: 5, before: message.id });
    context = recent.reverse().map(m => `${m.author.username}: ${m.content}`).join('\n');
  } catch (e) {}
  
  // AI check - be VERY careful about false positives
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: `You detect rule violations in a GAMING Discord server for GTA/RDO glitch communities.

CRITICAL: Avoid false positives! Only flag OBVIOUS violations.

Consider:
- Gaming language is casual ("you're insane" = compliment not insult)
- Glitch discussion is ALLOWED and ENCOURAGED
- Banter between friends is fine
- Only flag CLEAR violations with HIGH confidence
- When uncertain, DO NOT FLAG

Respond with ONLY valid JSON:
{"violation":false}
or
{"violation":true,"rule_id":"R01","reason":"brief reason","confidence":0.8}

Only flag if confidence > 0.75`,
    messages: [{
      role: 'user',
      content: `RULES:\n${rulesContext}\n\nCONTEXT:\n${context}\n\nCHECK THIS:\n${message.author.username}: ${message.content}`
    }]
  });
  
  try {
    const result = JSON.parse(analysis.content[0].text);
    
    if (result.violation && result.confidence > 0.75) {
      recentWarnings.set(warningKey, Date.now());
      
      // Log violation
      await pool.query(`
        INSERT INTO rule_violations (rule_id, user_id, user_name, message_id, message_content, channel_id, confidence, action_taken)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'warned')
      `, [result.rule_id, message.author.id, message.author.username, message.id, message.content, message.channel.id, result.confidence]);
      
      return result;
    }
  } catch (e) {}
  
  return null;
}

async function sendSmartWarning(message, violation, pool) {
  const rule = await getRule(pool, message.guild.id, violation.rule_id);
  if (!rule) return;
  
  // Find rules channel for linking
  const rulesChannel = message.guild.channels.cache.find(c => c.name === 'rules');
  
  const embed = new EmbedBuilder()
    .setTitle('⚠️ Heads Up')
    .setDescription(`Hey <@${message.author.id}>, just a friendly reminder about our rules.`)
    .setColor(0xFFAA00)
    .addFields(
      {
        name: `📜 Rule ${rule.rule_id}: ${rule.title}`,
        value: rule.description,
        inline: false
      },
      {
        name: '💬 Why?',
        value: violation.reason,
        inline: false
      }
    )
    .setFooter({ text: `Not a violation? Click below • Confidence: ${Math.round(violation.confidence * 100)}%` });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`not_violation_${message.id}`)
        .setLabel('❌ This wasn\'t a violation')
        .setStyle(ButtonStyle.Secondary)
    );
  
  if (rulesChannel && rule.message_id) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(`📖 View Rules`)
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${message.guild.id}/${rulesChannel.id}/${rule.message_id}`)
    );
  }
  
  const warning = await message.channel.send({ embeds: [embed], components: [row] });
  
  // Delete after 30 seconds
  setTimeout(() => warning.delete().catch(() => {}), 30000);
}

// Handle false positive button
async function handleFalsePositive(pool, interaction) {
  const messageId = interaction.customId.replace('not_violation_', '');
  
  await pool.query(
    'UPDATE rule_violations SET false_positive = TRUE WHERE message_id = $1',
    [messageId]
  );
  
  await interaction.reply({ content: '✅ Thanks for the feedback! This helps me learn.', ephemeral: true });
}

// ============================================
// INVESTIGATION QUERIES
// ============================================
async function investigateUser(pool, anthropic, userId, guildId) {
  // Get user's messages
  const messages = await pool.query(`
    SELECT * FROM message_log WHERE author_id = $1 AND guild_id = $2
    ORDER BY created_at DESC LIMIT 100
  `, [userId, guildId]);
  
  // Get deleted messages
  const deleted = await pool.query(`
    SELECT * FROM message_log WHERE author_id = $1 AND guild_id = $2 AND deleted = TRUE
    ORDER BY deleted_at DESC LIMIT 50
  `, [userId, guildId]);
  
  // Get violations
  const violations = await pool.query(`
    SELECT v.*, r.title as rule_title FROM rule_violations v
    LEFT JOIN server_rules r ON v.rule_id = r.rule_id
    WHERE v.user_id = $1
    ORDER BY v.created_at DESC
  `, [userId]);
  
  // Get mod actions
  const modActions = await pool.query(`
    SELECT * FROM mod_actions WHERE target_id = $1
    ORDER BY created_at DESC
  `, [userId]);
  
  return {
    totalMessages: messages.rows.length,
    deletedCount: deleted.rows.length,
    violations: violations.rows,
    modActions: modActions.rows,
    recentMessages: messages.rows.slice(0, 20),
    deletedMessages: deleted.rows
  };
}

async function getEvidenceForUser(pool, anthropic, userId, guildId, context = '') {
  const data = await investigateUser(pool, anthropic, userId, guildId);
  
  // Use AI to analyze
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are Police Chief, an investigation AI. Analyze user evidence objectively.

Look for:
- Behavior patterns
- Rule violations
- Deleted message patterns
- Whether past actions were justified

Be fair and thorough.`,
    messages: [{
      role: 'user',
      content: `Investigation context: ${context || 'General review'}

User data:
- Total messages: ${data.totalMessages}
- Deleted messages: ${data.deletedCount}
- Violations: ${data.violations.length}
- Mod actions: ${data.modActions.length}

Recent messages: ${JSON.stringify(data.recentMessages.slice(0, 10))}
Violations: ${JSON.stringify(data.violations)}
Deleted content: ${JSON.stringify(data.deletedMessages.slice(0, 10))}

Provide investigation summary.`
    }]
  });
  
  return {
    data,
    analysis: analysis.content[0].text
  };
}

module.exports = {
  initInvestigationDB,
  logMessage,
  logEdit,
  logDeletion,
  setupRules,
  getRules,
  getRule,
  checkForViolation,
  sendSmartWarning,
  handleFalsePositive,
  investigateUser,
  getEvidenceForUser
};
