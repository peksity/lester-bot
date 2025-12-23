/**
 * ████████████████████████████████████████████████████████████████████████
 * █  NEXUS ULTIMATE COMMANDS                                             █
 * █  Complete staff toolkit for enterprise security                      █
 * ████████████████████████████████████████████████████████████████████████
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class NexusCommands {
  constructor(nexusUltimate, webPortal, client) {
    this.nexus = nexusUltimate;
    this.webPortal = webPortal;
    this.client = client;
    this.pool = nexusUltimate.pool;
  }

  // ═══════════════════════════════════════════════════════════════
  // ?alts @user - Comprehensive alt detection report
  // ═══════════════════════════════════════════════════════════════
  
  async alts(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone to check.");
    
    const loading = await message.reply("🔍 Running comprehensive alt detection...");
    
    try {
      const links = await this.pool.query(
        `SELECT * FROM nexus_alt_links 
         WHERE primary_user = $1 OR linked_user = $1 
         ORDER BY confidence DESC LIMIT 20`,
        [target.id]
      );
      
      if (links.rows.length === 0) {
        return loading.edit({ content: null, embeds: [
          new EmbedBuilder()
            .setTitle('✅ No Alt Accounts Detected')
            .setDescription(`No linked accounts found for ${target.tag}`)
            .setColor(0x43b581)
        ]});
      }
      
      const alts = [];
      for (const link of links.rows) {
        const altId = link.primary_user === target.id ? link.linked_user : link.primary_user;
        const altUser = await this.client.users.fetch(altId).catch(() => null);
        
        const banned = await this.pool.query('SELECT 1 FROM nexus_global_bans WHERE user_id = $1', [altId]);
        
        alts.push({
          user: altUser ? `${altUser.tag}` : `Unknown`,
          id: altId,
          confidence: Math.round(link.confidence * 100),
          method: link.detection_method,
          confirmed: link.confirmed,
          banned: banned.rows.length > 0
        });
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`🔍 Alt Account Report`)
        .setDescription(`**Target:** ${target.tag} (${target.id})`)
        .setColor(alts.some(a => a.banned) ? 0xFF0000 : 0xFFA500)
        .addFields({
          name: `Linked Accounts (${alts.length})`,
          value: alts.map(a => 
            `${a.confirmed ? '✅' : '⚠️'} ${a.banned ? '🚫' : ''} **${a.user}**\n` +
            `└ ${a.confidence}% via ${a.method} • \`${a.id}\``
          ).join('\n\n').slice(0, 1024)
        })
        .setFooter({ text: '✅ = Confirmed • ⚠️ = Detected • 🚫 = Banned' })
        .setTimestamp();
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`nexus_ban_alts_${target.id}`)
          .setLabel('Ban All Alts')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!alts.some(a => a.banned))
      );
      
      await loading.edit({ content: null, embeds: [embed], components: [row] });
      
    } catch (error) {
      console.error('[Alts]', error);
      await loading.edit("Error running alt detection.");
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifystats - Full verification dashboard
  // ═══════════════════════════════════════════════════════════════
  
  async verifystats(message) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const stats = await this.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM nexus_verified_users WHERE guild_id = $1) as total_verified,
        (SELECT COUNT(*) FROM nexus_verification_attempts WHERE guild_id = $1 AND attempt_time > NOW() - INTERVAL '24 hours') as attempts_24h,
        (SELECT COUNT(*) FROM nexus_verification_attempts WHERE guild_id = $1 AND result = 'approved') as approved,
        (SELECT COUNT(*) FROM nexus_verification_attempts WHERE guild_id = $1 AND result = 'denied') as denied,
        (SELECT COUNT(*) FROM nexus_verification_attempts WHERE guild_id = $1 AND result = 'manual_review') as pending_review,
        (SELECT COUNT(*) FROM nexus_alt_links WHERE confidence > 0.8) as high_conf_alts,
        (SELECT COUNT(*) FROM nexus_ip_intelligence WHERE is_vpn = TRUE) as vpn_ips,
        (SELECT COUNT(*) FROM nexus_global_bans) as global_bans,
        (SELECT COUNT(*) FROM nexus_honeypot_triggers WHERE guild_id = $1) as honeypot_triggers,
        (SELECT AVG(risk_score) FROM nexus_verified_users WHERE guild_id = $1) as avg_risk
    `, [message.guild.id]);
    
    const s = stats.rows[0];
    
    // Risk distribution
    const riskDist = await this.pool.query(`
      SELECT 
        COUNT(CASE WHEN risk_score < 20 THEN 1 END) as very_low,
        COUNT(CASE WHEN risk_score >= 20 AND risk_score < 40 THEN 1 END) as low,
        COUNT(CASE WHEN risk_score >= 40 AND risk_score < 60 THEN 1 END) as medium,
        COUNT(CASE WHEN risk_score >= 60 AND risk_score < 80 THEN 1 END) as high,
        COUNT(CASE WHEN risk_score >= 80 THEN 1 END) as critical
      FROM nexus_verified_users WHERE guild_id = $1
    `, [message.guild.id]);
    
    const rd = riskDist.rows[0];
    
    const embed = new EmbedBuilder()
      .setTitle('📊 NEXUS Verification Dashboard')
      .setColor(0x5865F2)
      .addFields(
        { name: '✅ Verified', value: `${s.total_verified}`, inline: true },
        { name: '📝 Attempts (24h)', value: `${s.attempts_24h}`, inline: true },
        { name: '⏳ Pending Review', value: `${s.pending_review}`, inline: true },
        { name: '✓ Approved', value: `${s.approved}`, inline: true },
        { name: '✗ Denied', value: `${s.denied}`, inline: true },
        { name: '📊 Avg Risk', value: `${Math.round(s.avg_risk || 0)}`, inline: true },
        { name: '\u200b', value: '**Detection Stats**', inline: false },
        { name: '👥 Alt Links', value: `${s.high_conf_alts}`, inline: true },
        { name: '🔒 VPN IPs', value: `${s.vpn_ips}`, inline: true },
        { name: '🌐 Global Bans', value: `${s.global_bans}`, inline: true },
        { name: '🪤 Honeypots', value: `${s.honeypot_triggers}`, inline: true },
        { 
          name: 'Risk Distribution', 
          value: `\`\`\`\n🟢 Very Low: ${rd.very_low}\n🟡 Low: ${rd.low}\n🟠 Medium: ${rd.medium}\n🔴 High: ${rd.high}\n⚫ Critical: ${rd.critical}\`\`\``,
          inline: false 
        }
      )
      .setTimestamp()
      .setFooter({ text: 'NEXUS ULTIMATE' });
    
    message.reply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════
  // ?threat - Check threat level and status
  // ═══════════════════════════════════════════════════════════════
  
  async threat(message) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const level = this.nexus.threatLevel.get(message.guild.id) || 'LOW';
    const lockdown = this.nexus.lockdownStatus.get(message.guild.id);
    
    const colors = { LOW: 0x43b581, ELEVATED: 0xFAA61A, HIGH: 0xF04747, SEVERE: 0x9B59B6, CRITICAL: 0x000000 };
    const icons = { LOW: '🟢', ELEVATED: '🟡', HIGH: '🔴', SEVERE: '🟣', CRITICAL: '⚫' };
    
    // Get recent activity
    const recentJoins = (this.nexus.joinTracker.get(message.guild.id) || [])
      .filter(t => Date.now() - t < 300000).length;
    
    const embed = new EmbedBuilder()
      .setTitle(`${icons[level]} Threat Level: ${level}`)
      .setColor(colors[level])
      .addFields(
        { name: 'Status', value: lockdown?.active ? '🔒 LOCKDOWN ACTIVE' : '🔓 Normal Operations', inline: true },
        { name: 'Joins (5m)', value: `${recentJoins}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      );
    
    if (lockdown?.active) {
      const remaining = Math.round((lockdown.until - Date.now()) / 60000);
      embed.addFields(
        { name: 'Lockdown Reason', value: lockdown.reason, inline: true },
        { name: 'Time Remaining', value: `${remaining} minutes`, inline: true }
      );
    }
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nexus_lockdown_toggle')
        .setLabel(lockdown?.active ? 'End Lockdown' : 'Trigger Lockdown')
        .setStyle(lockdown?.active ? ButtonStyle.Success : ButtonStyle.Danger)
    );
    
    message.reply({ embeds: [embed], components: [row] });
  }

  // ═══════════════════════════════════════════════════════════════
  // ?globalban @user <reason> - Add to global ban network
  // ═══════════════════════════════════════════════════════════════
  
  async globalban(message, args) {
    if (!this.hasAdminPermission(message.member)) return message.reply("Admins only.");
    
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone to globally ban.");
    
    const reason = args.slice(1).join(' ') || 'No reason provided';
    const severity = args.includes('--critical') ? 'critical' : args.includes('--high') ? 'high' : 'medium';
    
    await this.pool.query(`
      INSERT INTO nexus_global_bans (user_id, servers, reasons, severity)
      VALUES ($1, ARRAY[$2], ARRAY[$3], $4)
      ON CONFLICT (user_id) DO UPDATE SET
      ban_count = nexus_global_bans.ban_count + 1,
      servers = array_append(nexus_global_bans.servers, $2),
      reasons = array_append(nexus_global_bans.reasons, $3),
      last_ban = NOW(),
      severity = CASE WHEN $4 = 'critical' THEN 'critical' ELSE nexus_global_bans.severity END
    `, [target.id, message.guild.id, reason, severity]);
    
    // Log to audit
    await this.nexus.logAudit(message.guild.id, 'global_ban_added', {
      targetId: target.id,
      reason,
      severity
    }, message.author.id);
    
    const embed = new EmbedBuilder()
      .setTitle('🌐 Global Ban Added')
      .setDescription(`**${target.tag}** added to global ban database`)
      .addFields(
        { name: 'User ID', value: target.id, inline: true },
        { name: 'Severity', value: severity.toUpperCase(), inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setColor(0xFF0000)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifyuser @user - Manual verification
  // ═══════════════════════════════════════════════════════════════
  
  async verifyuser(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const target = message.mentions.members.first();
    if (!target) return message.reply("Mention someone to verify.");
    
    await this.nexus.saveVerification(target.user, message.guild, {
      method: 'manual',
      riskScore: 0,
      flags: ['manually_verified', `by_${message.author.id}`]
    });
    
    await this.nexus.initializeReputation(target.id, message.guild.id);
    
    const verifiedRole = message.guild.roles.cache.find(r => r.name.includes('Verified'));
    if (verifiedRole) await target.roles.add(verifiedRole).catch(() => {});
    
    message.reply(`✅ **${target.user.tag}** has been manually verified.`);
  }

  // ═══════════════════════════════════════════════════════════════
  // ?unverify @user - Remove verification
  // ═══════════════════════════════════════════════════════════════
  
  async unverify(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const target = message.mentions.members.first();
    if (!target) return message.reply("Mention someone to unverify.");
    
    await this.pool.query(
      'DELETE FROM nexus_verified_users WHERE user_id = $1 AND guild_id = $2',
      [target.id, message.guild.id]
    );
    
    const verifiedRole = message.guild.roles.cache.find(r => r.name.includes('Verified'));
    if (verifiedRole) await target.roles.remove(verifiedRole).catch(() => {});
    
    message.reply(`❌ **${target.user.tag}** has been unverified.`);
  }

  // ═══════════════════════════════════════════════════════════════
  // ?verifyhistory @user - Show verification attempts
  // ═══════════════════════════════════════════════════════════════
  
  async verifyhistory(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention someone.");
    
    const attempts = await this.pool.query(
      `SELECT * FROM nexus_verification_attempts 
       WHERE user_id = $1 AND guild_id = $2
       ORDER BY attempt_time DESC LIMIT 10`,
      [target.id, message.guild.id]
    );
    
    if (attempts.rows.length === 0) {
      return message.reply("No verification history found.");
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`📜 Verification History: ${target.tag}`)
      .setColor(0x5865F2)
      .setDescription(attempts.rows.map((a, i) => {
        const icon = a.result === 'approved' ? '✅' : a.result === 'denied' ? '❌' : '⏳';
        return `${icon} **${a.result}** • Risk: ${a.risk_score} • <t:${Math.floor(new Date(a.attempt_time).getTime() / 1000)}:R>\n` +
          `└ Flags: ${(a.flags || []).slice(0, 3).join(', ') || 'None'}`;
      }).join('\n\n'))
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════
  // ?confirmalt @user1 @user2 - Confirm alt relationship
  // ═══════════════════════════════════════════════════════════════
  
  async confirmalt(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const users = [...message.mentions.users.values()];
    if (users.length < 2) return message.reply("Mention two users to link as alts.");
    
    const [user1, user2] = users;
    
    await this.pool.query(`
      INSERT INTO nexus_alt_links (primary_user, linked_user, confidence, detection_method, confirmed, confirmed_by, confirmed_at)
      VALUES ($1, $2, 1.0, 'manual_confirmation', TRUE, $3, NOW())
      ON CONFLICT (primary_user, linked_user) DO UPDATE SET
      confirmed = TRUE, confirmed_by = $3, confirmed_at = NOW()
    `, [user1.id, user2.id, message.author.id]);
    
    message.reply(`✅ Confirmed: **${user1.tag}** and **${user2.tag}** are linked as alts.`);
  }

  // ═══════════════════════════════════════════════════════════════
  // ?reputation @user - Show user reputation
  // ═══════════════════════════════════════════════════════════════
  
  async reputation(message, args) {
    const target = message.mentions.users.first() || message.author;
    
    const rep = await this.pool.query(
      'SELECT * FROM nexus_reputation WHERE user_id = $1 AND guild_id = $2',
      [target.id, message.guild.id]
    );
    
    if (rep.rows.length === 0) {
      return message.reply("No reputation data found for this user.");
    }
    
    const r = rep.rows[0];
    const level = Math.floor(r.trust_score / 100);
    
    const embed = new EmbedBuilder()
      .setTitle(`⭐ Reputation: ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .setColor(r.trust_score >= 500 ? 0x43b581 : r.trust_score >= 200 ? 0xFAA61A : 0xF04747)
      .addFields(
        { name: 'Trust Score', value: `${r.trust_score}`, inline: true },
        { name: 'Level', value: `${level}`, inline: true },
        { name: 'Messages', value: `${r.messages_sent || 0}`, inline: true },
        { name: 'Warnings', value: `${r.warnings_received || 0}`, inline: true },
        { name: 'Helpful', value: `${r.helpful_marks || 0}`, inline: true },
        { name: 'Member Since', value: r.first_message ? `<t:${Math.floor(new Date(r.first_message).getTime() / 1000)}:R>` : 'N/A', inline: true }
      )
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════
  // ?audit [type] - View audit log
  // ═══════════════════════════════════════════════════════════════
  
  async audit(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const type = args[0];
    
    let query = `SELECT * FROM nexus_audit_log WHERE guild_id = $1`;
    const params = [message.guild.id];
    
    if (type) {
      query += ` AND event_type = $2`;
      params.push(type);
    }
    
    query += ` ORDER BY created_at DESC LIMIT 15`;
    
    const logs = await this.pool.query(query, params);
    
    if (logs.rows.length === 0) {
      return message.reply("No audit logs found.");
    }
    
    const embed = new EmbedBuilder()
      .setTitle('📋 NEXUS Audit Log')
      .setColor(0x5865F2)
      .setDescription(logs.rows.map(l => {
        const time = Math.floor(new Date(l.created_at).getTime() / 1000);
        return `<t:${time}:R> • **${l.event_type}**\n└ ${JSON.stringify(l.event_data).slice(0, 100)}`;
      }).join('\n\n'))
      .setFooter({ text: type ? `Filtered: ${type}` : 'All events' })
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
  }

  // ═══════════════════════════════════════════════════════════════
  // ?lockdown [reason] - Manual lockdown
  // ═══════════════════════════════════════════════════════════════
  
  async lockdown(message, args) {
    if (!this.hasAdminPermission(message.member)) return message.reply("Admins only.");
    
    const current = this.nexus.lockdownStatus.get(message.guild.id);
    
    if (current?.active) {
      // End lockdown
      await this.nexus.endLockdown(message.guild.id);
      message.reply("🔓 Lockdown ended.");
    } else {
      // Start lockdown
      const reason = args.join(' ') || 'Manual lockdown';
      await this.nexus.triggerLockdown(message.guild.id, reason);
      message.reply(`🔒 Lockdown activated: ${reason}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ?honeypot - View honeypot triggers
  // ═══════════════════════════════════════════════════════════════
  
  async honeypot(message, args) {
    if (!this.hasPermission(message.member)) return message.reply("Staff only.");
    
    const triggers = await this.pool.query(
      `SELECT * FROM nexus_honeypot_triggers 
       WHERE guild_id = $1 
       ORDER BY triggered_at DESC LIMIT 20`,
      [message.guild.id]
    );
    
    if (triggers.rows.length === 0) {
      return message.reply("🪤 No honeypot triggers yet.");
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🪤 Honeypot Triggers')
      .setColor(0xF04747)
      .setDescription(await Promise.all(triggers.rows.map(async t => {
        const user = await this.client.users.fetch(t.user_id).catch(() => null);
        const time = Math.floor(new Date(t.triggered_at).getTime() / 1000);
        return `<t:${time}:R> • ${user?.tag || t.user_id}\n└ Type: ${t.trigger_type}`;
      })).then(arr => arr.join('\n\n')))
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
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
    return member.permissions.has('Administrator') || member.id === member.guild.ownerId;
  }
}

module.exports = NexusCommands;
