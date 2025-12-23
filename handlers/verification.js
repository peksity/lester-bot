/**
 * VERIFICATION SYSTEM
 * - New members only see rules + welcome
 * - Verification button reveals all channels
 * - Blacklist detection via external APIs
 * - Alt account detection
 * - Account age checking
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class VerificationSystem {
  constructor(pool, client) {
    this.pool = pool;
    this.client = client;
    
    // Minimum account age (7 days in ms)
    this.minAccountAge = 7 * 24 * 60 * 60 * 1000;
    
    // Known ban list APIs
    this.banListAPIs = [
      'https://bans.discord.id/api/check', // Discord Ban List
      'https://api.ksoft.si/bans/check'     // KSoft.Si Bans
    ];
  }

  /**
   * Initialize database tables
   */
  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS verified_users (
        user_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_by TEXT,
        ip_hash TEXT,
        account_age_days INTEGER
      )
    `);
    
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS blacklist (
        user_id TEXT PRIMARY KEY,
        reason TEXT,
        added_by TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source TEXT
      )
    `);
    
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS verification_attempts (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        result TEXT,
        flags TEXT[]
      )
    `);
    
    console.log('✅ Verification system initialized');
  }

  /**
   * Create the verification embed for welcome channel
   */
  createVerificationEmbed(guild) {
    const embed = new EmbedBuilder()
      .setTitle('🔐 Welcome to The Unpatched Method')
      .setDescription(
        `**Before you can access the server, you need to verify.**\n\n` +
        `This helps us keep the community safe from:\n` +
        `• Alt accounts from banned users\n` +
        `• Known scammers and trolls\n` +
        `• Bot accounts\n\n` +
        `**Click the button below to verify.**\n` +
        `*Your account will be checked against global ban databases.*`
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'Verification is required to see other channels' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify_user')
          .setLabel('✅ Verify Me')
          .setStyle(ButtonStyle.Success)
      );

    return { embed, row };
  }

  /**
   * Check if user is on any blacklists
   */
  async checkBlacklists(userId) {
    const flags = [];
    
    // Check our internal blacklist first
    const internal = await this.pool.query(
      'SELECT * FROM blacklist WHERE user_id = $1',
      [userId]
    );
    
    if (internal.rows.length > 0) {
      flags.push({
        source: 'internal',
        reason: internal.rows[0].reason,
        severity: 'high'
      });
    }
    
    // Check external APIs (with fallbacks)
    try {
      // Discord Ban List (dservices)
      const dblResponse = await fetch(`https://bans.discord.id/api/check?user_id=${userId}`, {
        timeout: 5000
      }).catch(() => null);
      
      if (dblResponse && dblResponse.ok) {
        const data = await dblResponse.json();
        if (data.banned) {
          flags.push({
            source: 'discord-ban-list',
            reason: data.reason || 'Listed on Discord Ban List',
            severity: 'high'
          });
        }
      }
    } catch (e) {
      // API unavailable, continue
    }
    
    return flags;
  }

  /**
   * Check account age and creation patterns
   */
  checkAccountAge(user) {
    const flags = [];
    const accountAge = Date.now() - user.createdTimestamp;
    const ageInDays = Math.floor(accountAge / (24 * 60 * 60 * 1000));
    
    // Account less than 7 days old
    if (accountAge < this.minAccountAge) {
      flags.push({
        type: 'new_account',
        message: `Account is only ${ageInDays} days old`,
        severity: 'medium'
      });
    }
    
    // Account less than 1 day old - very suspicious
    if (accountAge < 24 * 60 * 60 * 1000) {
      flags.push({
        type: 'brand_new',
        message: 'Account created less than 24 hours ago',
        severity: 'high'
      });
    }
    
    // Check for default avatar (often bots/alts)
    if (!user.avatar) {
      flags.push({
        type: 'no_avatar',
        message: 'Using default Discord avatar',
        severity: 'low'
      });
    }
    
    return { ageInDays, flags };
  }

  /**
   * Process verification attempt
   */
  async processVerification(interaction) {
    const user = interaction.user;
    const guild = interaction.guild;
    const member = interaction.member;
    
    // Defer reply (verification checks take time)
    await interaction.deferReply({ ephemeral: true });
    
    const allFlags = [];
    
    // 1. Check account age
    const ageCheck = this.checkAccountAge(user);
    allFlags.push(...ageCheck.flags);
    
    // 2. Check blacklists
    const blacklistFlags = await this.checkBlacklists(user.id);
    allFlags.push(...blacklistFlags);
    
    // 3. Log the attempt
    await this.pool.query(
      `INSERT INTO verification_attempts (user_id, guild_id, result, flags) 
       VALUES ($1, $2, $3, $4)`,
      [user.id, guild.id, allFlags.length > 0 ? 'flagged' : 'clean', 
       allFlags.map(f => f.type || f.source)]
    );
    
    // 4. Decide outcome
    const highSeverity = allFlags.filter(f => f.severity === 'high');
    const mediumSeverity = allFlags.filter(f => f.severity === 'medium');
    
    // BLOCKED - High severity flags
    if (highSeverity.length > 0) {
      const logChannel = guild.channels.cache.find(c => c.name === 'nexus-log');
      
      // Log to staff
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🚨 Verification BLOCKED')
          .setDescription(`**User:** ${user.tag} (${user.id})`)
          .addFields(
            { name: 'Flags', value: highSeverity.map(f => `• ${f.reason || f.message}`).join('\n') }
          )
          .setColor(0xFF0000)
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
      }
      
      return interaction.editReply({
        content: `❌ **Verification Failed**\n\nYour account has been flagged by our security systems.\n\nIf you believe this is an error, please contact a moderator.`
      });
    }
    
    // WARNING - Medium severity, but allow
    if (mediumSeverity.length > 0) {
      const logChannel = guild.channels.cache.find(c => c.name === 'nexus-log');
      
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('⚠️ Verification with Warnings')
          .setDescription(`**User:** ${user.tag} (${user.id})`)
          .addFields(
            { name: 'Warnings', value: mediumSeverity.map(f => `• ${f.message}`).join('\n') }
          )
          .setColor(0xFFAA00)
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
    
    // 5. Grant verified role
    const verifiedRole = guild.roles.cache.find(r => 
      r.name.toLowerCase().includes('verified') || r.name.toLowerCase().includes('member')
    );
    
    if (verifiedRole) {
      try {
        await member.roles.add(verifiedRole);
      } catch (e) {
        console.error('Failed to add verified role:', e);
        return interaction.editReply({
          content: '❌ An error occurred. Please contact a moderator.'
        });
      }
    }
    
    // 6. Record verification
    await this.pool.query(
      `INSERT INTO verified_users (user_id, guild_id, account_age_days) 
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET verified_at = CURRENT_TIMESTAMP`,
      [user.id, guild.id, ageCheck.ageInDays]
    );
    
    // 7. Success
    return interaction.editReply({
      content: `✅ **Verified!**\n\nWelcome to The Unpatched Method! You now have access to all channels.\n\n*Account age: ${ageCheck.ageInDays} days*`
    });
  }

  /**
   * Add user to internal blacklist
   */
  async addToBlacklist(userId, reason, addedBy) {
    await this.pool.query(
      `INSERT INTO blacklist (user_id, reason, added_by, source) 
       VALUES ($1, $2, $3, 'manual')
       ON CONFLICT (user_id) DO UPDATE SET reason = $2`,
      [userId, reason, addedBy]
    );
  }

  /**
   * Remove user from blacklist
   */
  async removeFromBlacklist(userId) {
    await this.pool.query('DELETE FROM blacklist WHERE user_id = $1', [userId]);
  }

  /**
   * Check if user is verified
   */
  async isVerified(userId, guildId) {
    const result = await this.pool.query(
      'SELECT * FROM verified_users WHERE user_id = $1 AND guild_id = $2',
      [userId, guildId]
    );
    return result.rows.length > 0;
  }
}

module.exports = VerificationSystem;
