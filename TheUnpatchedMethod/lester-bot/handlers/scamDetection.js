/**
 * SCAM DETECTION HANDLER
 * AI-powered scam detection using Claude
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// KNOWN SCAM PATTERNS
// ============================================
const SCAM_KEYWORDS = [
  'free nitro',
  'discord nitro',
  'claim your nitro',
  'steam gift',
  'free steam',
  'you won',
  'you have been selected',
  'airdrop',
  'crypto giveaway',
  'free money drop',
  'mod menu for sale',
  'account for sale',
  'selling accounts',
  'dm for prices',
  'cashapp flip',
  'paypal flip',
  'double your money',
  'free robux',
  'free vbucks'
];

const SCAM_DOMAINS = [
  'discord.gift', // Real one is different
  'discordgift.com',
  'discord-nitro',
  'steamcommunity.net',
  'steampowered.net',
  'free-nitro',
  'nitro-gift',
  'dlscord', // Typosquat
  'discorb', // Typosquat
  'dlscorcl', // Typosquat
  'bit.ly', // Link shortener (suspicious in context)
  'tinyurl', // Link shortener
  'grabify',
  'iplogger'
];

// ============================================
// CHECK MESSAGE FOR SCAMS
// ============================================
async function check(message, client) {
  const content = message.content.toLowerCase();
  const result = {
    isScam: false,
    type: null,
    confidence: 0,
    reason: null
  };
  
  // Check for known scam keywords
  for (const keyword of SCAM_KEYWORDS) {
    if (content.includes(keyword)) {
      result.isScam = true;
      result.type = 'keyword';
      result.confidence = 80;
      result.reason = `Contains scam keyword: "${keyword}"`;
      return result;
    }
  }
  
  // Check for scam domains in links
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = content.match(urlRegex) || [];
  
  for (const url of urls) {
    // Check against known scam domains
    for (const domain of SCAM_DOMAINS) {
      if (url.includes(domain)) {
        result.isScam = true;
        result.type = 'domain';
        result.confidence = 90;
        result.reason = `Contains scam domain: "${domain}"`;
        return result;
      }
    }
    
    // Check database for blacklisted links
    try {
      const dbCheck = await client.db.query(
        'SELECT * FROM scam_links WHERE $1 LIKE \'%\' || link || \'%\'',
        [url]
      );
      if (dbCheck.rows.length > 0) {
        result.isScam = true;
        result.type = 'blacklisted';
        result.confidence = 95;
        result.reason = `Blacklisted link: "${dbCheck.rows[0].link}"`;
        return result;
      }
    } catch (e) {}
  }
  
  // Check for suspicious patterns
  const hasLink = urls.length > 0;
  const hasMention = message.mentions.users.size > 3;
  const isNewAccount = (Date.now() - message.author.createdTimestamp) < 7 * 24 * 60 * 60 * 1000;
  const hasUrgency = /urgent|hurry|fast|quick|limited|expires|ending soon/i.test(content);
  
  // Combine suspicious factors
  let suspicionScore = 0;
  if (hasLink) suspicionScore += 20;
  if (hasMention) suspicionScore += 30;
  if (isNewAccount) suspicionScore += 25;
  if (hasUrgency) suspicionScore += 15;
  
  // If suspicious enough, use Claude AI to analyze
  if (suspicionScore >= 40 && hasLink) {
    try {
      const aiResult = await analyzeWithAI(message, client);
      if (aiResult.isScam) {
        return aiResult;
      }
    } catch (e) {
      console.error('AI scam analysis error:', e);
    }
  }
  
  return result;
}

// ============================================
// AI ANALYSIS
// ============================================
async function analyzeWithAI(message, client) {
  const prompt = `Analyze this Discord message for scam/phishing attempts. Be strict.

Message content: "${message.content}"

Author account age: ${Math.floor((Date.now() - message.author.createdTimestamp) / (24 * 60 * 60 * 1000))} days

Respond with JSON only:
{
  "isScam": true/false,
  "confidence": 0-100,
  "type": "phishing/scam/spam/safe",
  "reason": "brief explanation"
}`;

  try {
    const response = await client.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      result.type = 'ai-detected';
      return result;
    }
  } catch (e) {
    console.error('AI analysis error:', e);
  }
  
  return { isScam: false };
}

// ============================================
// HANDLE SCAM DETECTION
// ============================================
async function handle(message, scamResult, client) {
  try {
    // Delete the message
    await message.delete();
    
    // Log to scam-detection channel
    const config = await client.db.query('SELECT log_channels FROM server_config WHERE guild_id = $1', [message.guild.id]);
    if (config.rows[0]) {
      const logChannelId = config.rows[0].log_channels['scam-detection'];
      const logChannel = message.guild.channels.cache.get(logChannelId);
      
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🚨 SCAM DETECTED')
          .setColor(0xFF0000)
          .addFields(
            { name: 'Author', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
            { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
            { name: 'Detection Type', value: scamResult.type, inline: true },
            { name: 'Confidence', value: `${scamResult.confidence}%`, inline: true },
            { name: 'Content', value: message.content.substring(0, 1024), inline: false },
            { name: 'Reason', value: scamResult.reason, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: `User ID: ${message.author.id}` });
        
        await logChannel.send({ embeds: [embed] });
      }
    }
    
    // Warn or action the user based on confidence
    if (scamResult.confidence >= 90) {
      // High confidence - timeout or ban
      try {
        const member = message.guild.members.cache.get(message.author.id);
        if (member && member.moderatable) {
          await member.timeout(24 * 60 * 60 * 1000, 'Posting scam links'); // 24 hour timeout
          await message.channel.send({
            embeds: [new EmbedBuilder()
              .setDescription(`🚨 **${message.author.tag}** has been timed out for posting scam content.`)
              .setColor(0xFF0000)
            ]
          });
        }
      } catch (e) {}
    }
    
    // Log to database
    await client.db.query(`
      INSERT INTO mod_actions (guild_id, action_type, target_id, moderator_id, reason)
      VALUES ($1, 'scam_detected', $2, $3, $4)
    `, [message.guild.id, message.author.id, client.user.id, scamResult.reason]);
    
  } catch (error) {
    console.error('Error handling scam:', error);
  }
}

// ============================================
// ADD SCAM LINK
// ============================================
async function addScam(message, args, client) {
  if (!message.member.permissions.has('ModerateMembers')) {
    return message.reply("You don't have permission.");
  }
  
  const link = args[0];
  if (!link) {
    return message.reply("?addscam <link>");
  }
  
  try {
    await client.db.query(`
      INSERT INTO scam_links (link, type, added_by)
      VALUES ($1, 'manual', $2)
      ON CONFLICT (link) DO NOTHING
    `, [link.toLowerCase(), message.author.id]);
    
    message.reply(`✅ Added \`${link}\` to scam blacklist.`);
  } catch (error) {
    message.reply("Couldn't add link to blacklist.");
  }
}

// ============================================
// REMOVE SCAM LINK
// ============================================
async function removeScam(message, args, client) {
  if (!message.member.permissions.has('ModerateMembers')) {
    return message.reply("You don't have permission.");
  }
  
  const link = args[0];
  if (!link) {
    return message.reply("?removescam <link>");
  }
  
  try {
    const result = await client.db.query(`
      DELETE FROM scam_links WHERE link = $1
    `, [link.toLowerCase()]);
    
    if (result.rowCount > 0) {
      message.reply(`✅ Removed \`${link}\` from scam blacklist.`);
    } else {
      message.reply("Link wasn't in the blacklist.");
    }
  } catch (error) {
    message.reply("Couldn't remove link.");
  }
}

// ============================================
// LIST SCAM LINKS
// ============================================
async function listScams(message, client) {
  if (!message.member.permissions.has('ModerateMembers')) {
    return message.reply("You don't have permission.");
  }
  
  try {
    const result = await client.db.query('SELECT * FROM scam_links ORDER BY timestamp DESC LIMIT 25');
    
    if (result.rows.length === 0) {
      return message.reply("No custom blacklisted links. Default protections still active.");
    }
    
    const list = result.rows.map((row, i) => `${i + 1}. \`${row.link}\``).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Blacklisted Links')
      .setDescription(list)
      .setColor(0xFF0000)
      .setFooter({ text: `Total: ${result.rows.length}` });
    
    message.reply({ embeds: [embed] });
  } catch (error) {
    message.reply("Couldn't fetch blacklist.");
  }
}

// ============================================
// CHECK LINK
// ============================================
async function checkLink(message, args, client) {
  const link = args[0];
  if (!link) {
    return message.reply("?checklink <link>");
  }
  
  // Check against database
  const dbCheck = await client.db.query(
    'SELECT * FROM scam_links WHERE $1 LIKE \'%\' || link || \'%\'',
    [link.toLowerCase()]
  );
  
  if (dbCheck.rows.length > 0) {
    return message.reply(`🚨 **DANGEROUS** - This link is blacklisted: \`${dbCheck.rows[0].link}\``);
  }
  
  // Check against known patterns
  for (const domain of SCAM_DOMAINS) {
    if (link.toLowerCase().includes(domain)) {
      return message.reply(`🚨 **SUSPICIOUS** - Contains known scam domain pattern: \`${domain}\``);
    }
  }
  
  message.reply(`✅ Link appears safe (not in blacklist). Stay cautious anyway.`);
}

module.exports = {
  check,
  handle,
  addScam,
  removeScam,
  listScams,
  checkLink
};
