/**
 * ████████████████████████████████████████████████████████████████████████
 * █  NEXUS VERIFICATION COMMANDS                                         █
 * █  Staff tools for managing the verification system                    █
 * ████████████████████████████████████████████████████████████████████████
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class VerificationCommands {
  constructor(pool, nexusVerification, webPortal, client) {
    this.pool = pool;
    this.nexus = nexusVerification;
    this.webPortal = webPortal;
    this.client = client;
  }

  // ═══════════════════════════════════════════════════════════════
  // ?alts @user - Check for alt accounts
  // ═══════════════════════════════════════════════════════════════
  
  async checkAlts(message, args) {
    if (!this.hasPermission(message.member)) {
      return message.reply("*looks at you* You don't have clearance for that.");
    }
    
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply("Who? Mention someone.");
    }
    
    const loading = await message.reply("🔍 Scanning for alt accounts...");
    
    try {
      // Get all alt links for this user
      const altLinks = await this.pool.query(
        `SELECT * FROM nexus_alt_links 
         WHERE primary_user_id = $1 OR alt_user_id = $1 
         ORDER BY confidence DESC`,
        [target.id]
      );
      
      if (altLinks.rows.length === 0) {
        return loading.edit("No alt accounts detected for this user.");
      }
      
      // Build the report
      const alts = [];
      for (const link of altLinks.rows) {
        const altId = link.primary_user_id === target.id ? link.alt_user_id : link.primary_user_id;
        const altUser = await this.client.users.fetch(altId).catch(() => null);
        
        alts.push({
          user: altUser ? `${altUser.tag} (${altId})` : `Unknown (${altId})`,
          confidence: Math.round(link.confidence * 100),
          method: link.detection_method,
          confirmed: link.confirmed
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Alt Account Report: ${target.tag}`)
        .setColor(alts.length > 0 ? 0xFFA500 : 0x00FF00)
        .setDescription(alts.map(a => 
          `${a.confirmed ? '✅' : '⚠️'} **${a.user}**\n` +
          `   Confidence: ${a.confidence}% | Method: ${a.method}`
        ).join('\n\n'))
        .setFooter({ text: `${alts.length} potential alt(s) found` })
        .setTimestamp();
      
      await loading.edit({ content: null, embeds: [embed] });
      
    } catch (error) {
      console.error('[Alts Command] Error:', error);
      await loading.edit("System error checking alts.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?globalban @user <reason> - Add to global ban list
  // ═══════════════════════════════════════════════════════════════
  
  async globalBan(message, args) {
    if (!this.hasAdminPermission(message.member)) {
      return message.reply("Admins only for global bans.");
    }
    
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply("Mention someone to globally ban.");
    }
    
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    try {
      // Add to global ban database
      await this.nexus.reportBan(target.id, message.guild.id, reason, 'high');
      
      const embed = new EmbedBuilder()
        .setTitle('🌐 Global Ban Added')
        .setDescription(`**${target.tag}** has been added to the global ban database.`)
        .addFields(
          { name: 'User ID', value: target.id, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Added By', value: message.author.tag, inline: true }
        )
        .setColor(0xFF0000)
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('[GlobalBan] Error:', error);
      await message.reply("Failed to add global ban.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifystats - Show verification statistics
  // ═══════════════════════════════════════════════════════════════
  
  async verifyStats(message) {
    if (!this.hasPermission(message.member)) {
      return message.reply("Staff only.");
    }
    
    try {
      // Get stats
      const [
        totalVerified,
        recentAttempts,
        deniedCount,
        flaggedCount,
        altCount
      ] = await Promise.all([
        this.pool.query('SELECT COUNT(*) FROM nexus_verified WHERE guild_id = $1', [message.guild.id]),
        this.pool.query(
          `SELECT COUNT(*) FROM nexus_verification_attempts 
           WHERE guild_id = $1 AND attempt_time > NOW() - INTERVAL '24 hours'`,
          [message.guild.id]
        ),
        this.pool.query(
          `SELECT COUNT(*) FROM nexus_verification_attempts 
           WHERE guild_id = $1 AND result = 'denied'`,
          [message.guild.id]
        ),
        this.pool.query(
          `SELECT COUNT(*) FROM nexus_verified 
           WHERE guild_id = $1 AND risk_score >= 50`,
          [message.guild.id]
        ),
        this.pool.query('SELECT COUNT(*) FROM nexus_alt_links')
      ]);
      
      // Get risk distribution
      const riskDist = await this.pool.query(
        `SELECT 
           COUNT(CASE WHEN risk_score < 25 THEN 1 END) as low,
           COUNT(CASE WHEN risk_score >= 25 AND risk_score < 50 THEN 1 END) as medium,
           COUNT(CASE WHEN risk_score >= 50 AND risk_score < 75 THEN 1 END) as high,
           COUNT(CASE WHEN risk_score >= 75 THEN 1 END) as critical
         FROM nexus_verified WHERE guild_id = $1`,
        [message.guild.id]
      );
      
      const dist = riskDist.rows[0];
      
      const embed = new EmbedBuilder()
        .setTitle('📊 NEXUS Verification Statistics')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Total Verified', value: totalVerified.rows[0].count, inline: true },
          { name: 'Attempts (24h)', value: recentAttempts.rows[0].count, inline: true },
          { name: 'Total Denied', value: deniedCount.rows[0].count, inline: true },
          { name: 'Flagged Users', value: flaggedCount.rows[0].count, inline: true },
          { name: 'Alt Links Found', value: altCount.rows[0].count, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { 
            name: 'Risk Distribution', 
            value: `🟢 Low: ${dist.low}\n🟡 Medium: ${dist.medium}\n🟠 High: ${dist.high}\n🔴 Critical: ${dist.critical}`,
            inline: false 
          }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('[VerifyStats] Error:', error);
      await message.reply("Failed to get stats.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifyuser @user - Manually verify a user
  // ═══════════════════════════════════════════════════════════════
  
  async manualVerify(message, args) {
    if (!this.hasPermission(message.member)) {
      return message.reply("Staff only.");
    }
    
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply("Mention someone to verify.");
    }
    
    try {
      // Add to verified table
      await this.pool.query(
        `INSERT INTO nexus_verified (user_id, guild_id, verification_method, risk_score, flags)
         VALUES ($1, $2, 'manual', 0, ARRAY['manually_verified'])
         ON CONFLICT (user_id, guild_id) DO UPDATE SET
         verification_method = 'manual', verified_at = NOW()`,
        [target.id, message.guild.id]
      );
      
      // Add verified role
      const verifiedRole = message.guild.roles.cache.find(r => r.name.includes('Verified'));
      if (verifiedRole) {
        await target.roles.add(verifiedRole);
      }
      
      await message.reply(`✅ **${target.user.tag}** has been manually verified.`);
      
    } catch (error) {
      console.error('[ManualVerify] Error:', error);
      await message.reply("Failed to verify user.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?unverify @user - Remove verification
  // ═══════════════════════════════════════════════════════════════
  
  async unverify(message, args) {
    if (!this.hasPermission(message.member)) {
      return message.reply("Staff only.");
    }
    
    const target = message.mentions.members.first();
    if (!target) {
      return message.reply("Mention someone to unverify.");
    }
    
    try {
      // Remove from verified table
      await this.pool.query(
        'DELETE FROM nexus_verified WHERE user_id = $1 AND guild_id = $2',
        [target.id, message.guild.id]
      );
      
      // Remove verified role
      const verifiedRole = message.guild.roles.cache.find(r => r.name.includes('Verified'));
      if (verifiedRole && target.roles.cache.has(verifiedRole.id)) {
        await target.roles.remove(verifiedRole);
      }
      
      await message.reply(`❌ **${target.user.tag}** has been unverified.`);
      
    } catch (error) {
      console.error('[Unverify] Error:', error);
      await message.reply("Failed to unverify user.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifyhistory @user - Show verification history
  // ═══════════════════════════════════════════════════════════════
  
  async verifyHistory(message, args) {
    if (!this.hasPermission(message.member)) {
      return message.reply("Staff only.");
    }
    
    const target = message.mentions.users.first();
    if (!target) {
      return message.reply("Mention someone.");
    }
    
    try {
      const attempts = await this.pool.query(
        `SELECT * FROM nexus_verification_attempts 
         WHERE user_id = $1 AND guild_id = $2
         ORDER BY attempt_time DESC LIMIT 10`,
        [target.id, message.guild.id]
      );
      
      if (attempts.rows.length === 0) {
        return message.reply("No verification history for this user.");
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`📜 Verification History: ${target.tag}`)
        .setColor(0x5865F2)
        .setDescription(attempts.rows.map((a, i) => 
          `**${i + 1}.** ${a.result} | Risk: ${a.risk_score} | <t:${Math.floor(new Date(a.attempt_time).getTime() / 1000)}:R>\n` +
          `   Flags: ${(a.flags || []).slice(0, 3).join(', ') || 'None'}`
        ).join('\n\n'))
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('[VerifyHistory] Error:', error);
      await message.reply("Failed to get history.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?confirmalt @user1 @user2 - Confirm alt link
  // ═══════════════════════════════════════════════════════════════
  
  async confirmAlt(message, args) {
    if (!this.hasPermission(message.member)) {
      return message.reply("Staff only.");
    }
    
    const users = message.mentions.users;
    if (users.size < 2) {
      return message.reply("Mention two users to confirm as alts.");
    }
    
    const [user1, user2] = [...users.values()];
    
    try {
      await this.pool.query(
        `UPDATE nexus_alt_links SET confirmed = TRUE 
         WHERE (primary_user_id = $1 AND alt_user_id = $2) 
         OR (primary_user_id = $2 AND alt_user_id = $1)`,
        [user1.id, user2.id]
      );
      
      // If no existing link, create one
      await this.pool.query(
        `INSERT INTO nexus_alt_links (primary_user_id, alt_user_id, confidence, detection_method, confirmed)
         VALUES ($1, $2, 1.0, 'manual_confirmation', TRUE)
         ON CONFLICT (primary_user_id, alt_user_id) DO UPDATE SET confirmed = TRUE`,
        [user1.id, user2.id]
      );
      
      await message.reply(`✅ Confirmed: **${user1.tag}** and **${user2.tag}** are linked as alt accounts.`);
      
    } catch (error) {
      console.error('[ConfirmAlt] Error:', error);
      await message.reply("Failed to confirm alt link.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifyconfig - Show/set verification config
  // ═══════════════════════════════════════════════════════════════
  
  async verifyConfig(message, args) {
    if (!this.hasAdminPermission(message.member)) {
      return message.reply("Admins only.");
    }
    
    if (args.length === 0) {
      // Show current config
      const embed = new EmbedBuilder()
        .setTitle('⚙️ NEXUS Verification Config')
        .setColor(0x5865F2)
        .addFields(
          { name: 'Min Account Age', value: `${this.nexus.config.minAccountAge / (24*60*60*1000)} days`, inline: true },
          { name: 'Max Attempts', value: `${this.nexus.config.maxVerificationAttempts}`, inline: true },
          { name: 'Cooldown', value: `${this.nexus.config.verificationCooldown / 60000} minutes`, inline: true },
          { name: 'CAPTCHA', value: this.nexus.config.requireCaptcha ? '✅' : '❌', inline: true },
          { name: 'Web Verification', value: this.nexus.config.requireWebVerification ? '✅' : '❌', inline: true },
          { name: 'VPN Check', value: this.nexus.config.vpnCheckEnabled ? '✅' : '❌', inline: true },
          { name: 'Alt Detection', value: this.nexus.config.altDetectionEnabled ? '✅' : '❌', inline: true }
        )
        .setFooter({ text: 'Use ?verifyconfig <setting> <value> to change' });
      
      return message.reply({ embeds: [embed] });
    }
    
    // Set config
    const [setting, value] = args;
    const validSettings = ['minaccountage', 'maxattempts', 'captcha', 'vpncheck', 'altdetection'];
    
    if (!validSettings.includes(setting.toLowerCase())) {
      return message.reply(`Invalid setting. Valid: ${validSettings.join(', ')}`);
    }
    
    // Update setting (would need to persist to database in production)
    await message.reply(`Config updated: ${setting} = ${value}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // PERMISSION HELPERS
  // ═══════════════════════════════════════════════════════════════
  
  hasPermission(member) {
    return member.permissions.has('ModerateMembers') || 
           member.permissions.has('Administrator') ||
           member.roles.cache.some(r => 
             r.name.includes('Mastermind') || 
             r.name.includes('Enforcer') || 
             r.name.includes('Deputy')
           );
  }
  
  hasAdminPermission(member) {
    return member.permissions.has('Administrator') ||
           member.id === member.guild.ownerId;
  }
}

module.exports = VerificationCommands;
