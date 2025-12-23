/**
 * LESTER'S MASTER BRAIN
 * Integrates all advanced systems:
 * - Shared Intelligence (cross-bot awareness)
 * - Advanced Investigation
 * - Appeal System
 * - Enhanced Brain (smart responses)
 */

const SharedIntelligence = require('../shared/sharedIntelligence');
const AdvancedInvestigation = require('../shared/advancedInvestigation');
const AppealSystem = require('../shared/appealSystem');
const EnhancedBrain = require('../shared/enhancedBrain');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

class LesterMasterBrain {
  constructor(pool, anthropic) {
    this.pool = pool;
    this.anthropic = anthropic;
    
    // Initialize all systems
    this.intelligence = new SharedIntelligence(pool, 'lester');
    this.investigation = new AdvancedInvestigation(pool, anthropic, this.intelligence);
    this.appeals = new AppealSystem(pool, anthropic, this.investigation, this.intelligence);
    this.brain = new EnhancedBrain('lester', pool, anthropic, this.intelligence);
    
    // Active modmail conversations
    this.activeModmail = new Map();
  }

  async initialize() {
    await this.intelligence.initTables();
    await this.investigation.initTables();
    console.log('🧠 Lester Master Brain initialized');
  }

  // ============================================
  // MESSAGE LOGGING (Enhanced)
  // ============================================
  async logMessage(message) {
    if (!message.guild) return;
    await this.investigation.logMessage(message);
  }

  async logEdit(oldMessage, newMessage) {
    await this.investigation.logEdit(oldMessage, newMessage);
  }

  async logDeletion(message) {
    await this.investigation.logDeletion(message);
  }

  // ============================================
  // MODMAIL HANDLER
  // ============================================
  async handleModmail(message) {
    const userId = message.author.id;
    
    // Check if they have an active conversation
    if (this.activeModmail.has(userId)) {
      await this.appeals.handleAppealMessage(message);
      return;
    }
    
    // Check what they want
    const content = message.content.toLowerCase();
    
    if (content.includes('appeal') || content.includes('banned') || content.includes('muted') || content.includes('kicked')) {
      // Start appeal flow
      this.appeals.activeAppeals.set(userId, {
        stage: 'offered',
        expiresAt: Date.now() + 600000
      });
      await this.appeals.handleAppealMessage(message);
      return;
    }
    
    // General modmail - explain what's available
    const embed = new EmbedBuilder()
      .setTitle('📨 Lester\'s Line')
      .setDescription(`*adjusts glasses* What do you need?\n\n**Say one of these:**\n• \`appeal\` - Contest a ban/mute/kick\n• \`report\` - Report something to mods\n• \`help\` - General help`)
      .setColor(0x5865F2)
      .setFooter({ text: 'I see everything that happens in that server, by the way.' });
    
    await message.reply({ embeds: [embed] });
  }

  // ============================================
  // INVESTIGATION COMMANDS
  // ============================================
  async handleInvestigateCommand(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("*squints* Mod-only, pal.");
    }
    
    const target = message.mentions.members.first() || 
      (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    
    if (!target) {
      return message.reply("*sighs* Who am I supposed to investigate? Give me a name.");
    }
    
    const loading = await message.reply("*pulls up their file* Give me a second...");
    
    try {
      const result = await this.investigation.runFullInvestigation(
        target.id, 
        message.guild.id, 
        message.author.id
      );
      
      const embed = this.investigation.buildInvestigationEmbed(result, target.user);
      
      // Add action buttons
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`inv_timeline_${target.id}`)
            .setLabel('📅 Timeline')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`inv_network_${target.id}`)
            .setLabel('🕸️ Network')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`inv_deleted_${target.id}`)
            .setLabel('🗑️ Deleted')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`inv_predict_${target.id}`)
            .setLabel('🔮 Predict')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await loading.edit({ content: null, embeds: [embed], components: [buttons] });
      
    } catch (error) {
      console.error('Investigation error:', error);
      await loading.edit("*taps keyboard* Something's wrong with the system. Try again.");
    }
  }

  async handleEvidenceCommand(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("Mod-only.");
    }
    
    const target = message.mentions.members.first() || 
      (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    
    if (!target) return message.reply("Who?");
    
    const [deleted, edited, violations] = await Promise.all([
      this.investigation.getDeletedMessages(target.id, message.guild.id, 15),
      this.investigation.getEditedMessages(target.id, message.guild.id, 10),
      this.investigation.getViolations(target.id, message.guild.id)
    ]);
    
    let deletedText = 'Clean.';
    if (deleted.length > 0) {
      deletedText = deleted.slice(0, 8).map(m => 
        `• [#${m.channel_name}] "${m.content?.slice(0, 50) || '[no text]'}..."`
      ).join('\n');
    }
    
    let editedText = 'None.';
    if (edited.length > 0) {
      editedText = edited.slice(0, 5).map(m =>
        `• "${m.old_content?.slice(0, 30)}" → "${m.new_content?.slice(0, 30)}"`
      ).join('\n');
    }
    
    let violationText = 'None on record.';
    if (violations.length > 0) {
      violationText = violations.slice(0, 5).map(v =>
        `• ${v.rule_title || v.rule_id} (${Math.round(v.confidence * 100)}% confidence)`
      ).join('\n');
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`📁 Evidence File: ${target.user.username}`)
      .setColor(0xB22222)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: '🗑️ Deleted Messages', value: deletedText.slice(0, 1000), inline: false },
        { name: '✏️ Edited Messages', value: editedText.slice(0, 1000), inline: false },
        { name: '⚠️ Violations', value: violationText, inline: false }
      )
      .setFooter({ text: `Use ?investigate for full analysis` });
    
    message.reply({ embeds: [embed] });
  }

  async handleRecordCommand(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("Mod-only.");
    }
    
    const target = message.mentions.members.first() || 
      (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    
    if (!target) return message.reply("Need a target.");
    
    const messages = await this.investigation.getUserMessages(target.id, message.guild.id, 25);
    
    if (messages.length === 0) {
      return message.reply("No messages on file for this one.");
    }
    
    const msgList = messages.map(m => {
      let status = '';
      if (m.deleted) status = ' ❌';
      else if (m.edited) status = ' ✏️';
      return `[#${m.channel_name}] ${m.content?.slice(0, 50) || '[embed/attachment]'}${status}`;
    }).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle(`📜 Message Record: ${target.user.username}`)
      .setDescription(msgList.slice(0, 3800))
      .setColor(0x4169E1)
      .setFooter({ text: `${messages.length} messages shown • ❌ = deleted, ✏️ = edited` });
    
    message.reply({ embeds: [embed] });
  }

  async handleWatchlistCommand(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("Mod-only.");
    }
    
    // Get high-risk users
    const result = await this.pool.query(`
      SELECT user_id, username, risk_score, trust_score, warnings_received, bans_received
      FROM unified_profiles
      WHERE risk_score > 30 OR is_watchlist = TRUE
      ORDER BY risk_score DESC
      LIMIT 15
    `);
    
    if (result.rows.length === 0) {
      return message.reply("*checks monitors* Watchlist is empty. Town's quiet.");
    }
    
    const list = result.rows.map(u => 
      `<@${u.user_id}> - Risk: ${u.risk_score}, Trust: ${u.trust_score}`
    ).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('👁️ Watchlist')
      .setDescription(list)
      .setColor(0xFF4500)
      .setFooter({ text: 'Users with elevated risk scores or flagged for monitoring' });
    
    message.reply({ embeds: [embed] });
  }

  async handleAppealsCommand(message) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("Mod-only.");
    }
    
    const pending = await this.appeals.getPendingAppeals(message.guild.id);
    
    if (pending.length === 0) {
      return message.reply("*checks inbox* No pending appeals. Everyone's accepted their fate.");
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`📨 Pending Appeals (${pending.length})`)
      .setColor(0xFFAA00)
      .setDescription(pending.slice(0, 10).map(a => 
        `**${a.appeal_id}** - <@${a.user_id}> (${a.action_type})\n"${a.user_statement?.slice(0, 80)}..."`
      ).join('\n\n'))
      .setFooter({ text: 'Use ?appeal <id> to review' });
    
    message.reply({ embeds: [embed] });
  }

  async handleAppealReviewCommand(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("Mod-only.");
    }
    
    const appealId = args[0];
    if (!appealId) {
      return message.reply("Need an appeal ID. Use ?appeals to see pending.");
    }
    
    const appeal = await this.appeals.getAppeal(appealId);
    if (!appeal) {
      return message.reply("*searches files* Can't find that appeal ID.");
    }
    
    const embed = this.appeals.buildAppealEmbed(appeal);
    const buttons = this.appeals.buildAppealButtons(appealId);
    
    message.reply({ embeds: [embed], components: [buttons] });
  }

  async handlePredictCommand(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("Mod-only.");
    }
    
    const target = message.mentions.members.first() || 
      (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    
    if (!target) return message.reply("Who am I predicting?");
    
    const prediction = await this.investigation.predictRisk(target.id, message.guild.id);
    
    const embed = new EmbedBuilder()
      .setTitle(`🔮 Risk Prediction: ${target.user.username}`)
      .setColor(prediction.concerns.length > 2 ? 0xFF0000 : prediction.concerns.length > 0 ? 0xFFAA00 : 0x00FF00)
      .addFields(
        { name: '⚠️ Likely to Violate Rules', value: prediction.likelyToViolate ? 'Yes' : 'No', inline: true },
        { name: '📈 Likely to Escalate', value: prediction.likelyToEscalate ? 'Yes' : 'No', inline: true },
        { name: '🚪 Likely to Leave', value: prediction.likelyToLeave ? 'Yes' : 'No', inline: true }
      );
    
    if (prediction.concerns.length > 0) {
      embed.addFields({
        name: '🚨 Concerns',
        value: prediction.concerns.join('\n'),
        inline: false
      });
    } else {
      embed.addFields({
        name: '✅ Assessment',
        value: 'No immediate concerns detected.',
        inline: false
      });
    }
    
    embed.setFooter({ text: 'Based on recent behavioral patterns' });
    
    message.reply({ embeds: [embed] });
  }

  // ============================================
  // BUTTON HANDLERS
  // ============================================
  async handleButton(interaction) {
    const customId = interaction.customId;
    
    // Investigation buttons
    if (customId.startsWith('inv_')) {
      await this.handleInvestigationButton(interaction);
      return;
    }
    
    // Appeal buttons
    if (customId.startsWith('appeal_')) {
      await this.handleAppealButton(interaction);
      return;
    }
  }

  async handleInvestigationButton(interaction) {
    const [, action, oduserId] = interaction.customId.split('_');
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Mod-only.', ephemeral: true });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    switch (action) {
      case 'timeline':
        const events = await this.intelligence.getUserEvents(oduserId, 20);
        const timelineText = events.length > 0 
          ? events.map(e => `[${new Date(e.created_at).toLocaleDateString()}] ${e.event_type}: ${e.description}`).join('\n')
          : 'No significant events on record.';
        
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('📅 Event Timeline')
            .setDescription(timelineText.slice(0, 4000))
            .setColor(0x5865F2)]
        });
        break;
        
      case 'network':
        const network = await this.intelligence.getUserNetwork(oduserId, interaction.guild.id);
        const networkText = network.length > 0
          ? network.map(n => `<@${n.connected_user}> - ${n.interaction_count} interactions (${n.positive_interactions}+ / ${n.negative_interactions}-)`).join('\n')
          : 'No significant connections mapped.';
        
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('🕸️ Network Map')
            .setDescription(networkText.slice(0, 4000))
            .setColor(0x5865F2)]
        });
        break;
        
      case 'deleted':
        const deleted = await this.investigation.getDeletedMessages(oduserId, interaction.guild.id, 20);
        const deletedText = deleted.length > 0
          ? deleted.map(m => `[#${m.channel_name}] "${m.content?.slice(0, 80) || '[no text]'}"`).join('\n')
          : 'No deleted messages on record.';
        
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('🗑️ Deleted Messages')
            .setDescription(deletedText.slice(0, 4000))
            .setColor(0xB22222)]
        });
        break;
        
      case 'predict':
        const prediction = await this.investigation.predictRisk(oduserId, interaction.guild.id);
        await interaction.editReply({
          embeds: [new EmbedBuilder()
            .setTitle('🔮 Risk Prediction')
            .setDescription(`**Likely to violate:** ${prediction.likelyToViolate ? 'Yes' : 'No'}\n**Likely to escalate:** ${prediction.likelyToEscalate ? 'Yes' : 'No'}\n\n${prediction.concerns.length > 0 ? '**Concerns:**\n' + prediction.concerns.join('\n') : '✅ No immediate concerns'}`)
            .setColor(prediction.concerns.length > 0 ? 0xFF4500 : 0x00FF00)]
        });
        break;
    }
  }

  async handleAppealButton(interaction) {
    const [, action, appealId] = interaction.customId.split('_');
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Mod-only.', ephemeral: true });
    }
    
    if (action === 'info') {
      const appeal = await this.appeals.getAppeal(appealId);
      if (!appeal) return interaction.reply({ content: 'Appeal not found.', ephemeral: true });
      
      // Run full investigation
      const investigation = await this.investigation.runFullInvestigation(
        appeal.user_id,
        appeal.guild_id,
        interaction.user.id
      );
      
      await interaction.reply({
        embeds: [this.investigation.buildInvestigationEmbed(investigation, { 
          username: 'Appellant', 
          displayAvatarURL: () => null 
        })],
        ephemeral: true
      });
      return;
    }
    
    // Verdict actions
    const verdictMap = {
      'overturn': 'overturn',
      'reduce': 'reduce',
      'uphold': 'uphold'
    };
    
    if (verdictMap[action]) {
      const appeal = await this.appeals.resolveAppeal(
        appealId,
        verdictMap[action],
        `Decided by ${interaction.user.username}`,
        interaction.user.id
      );
      
      if (appeal) {
        // Notify the user
        try {
          const user = await interaction.client.users.fetch(appeal.user_id);
          const verdictEmbed = new EmbedBuilder()
            .setTitle(`⚖️ Appeal ${verdictMap[action].toUpperCase()}ED`)
            .setDescription(`Your appeal (\`${appealId}\`) has been reviewed.\n\n**Verdict:** ${verdictMap[action].toUpperCase()}\n**Reviewed by:** A moderator`)
            .setColor(action === 'overturn' ? 0x00FF00 : action === 'reduce' ? 0xFFAA00 : 0xFF0000);
          
          await user.send({ embeds: [verdictEmbed] }).catch(() => {});
        } catch (e) {}
        
        await interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle(`✅ Appeal ${verdictMap[action].toUpperCase()}ED`)
            .setDescription(`Appeal \`${appealId}\` has been resolved.`)
            .setColor(0x00FF00)],
          components: []
        });
      }
    }
  }

  // ============================================
  // MODERATION ACTION HOOK
  // ============================================
  async onModAction(action, target, guild, moderator, reason, duration = null) {
    return await this.appeals.onModerationAction(action, target, guild, moderator, reason, duration);
  }

  // ============================================
  // SMART RESPONSE
  // ============================================
  async generateSmartResponse(message, context = {}) {
    return await this.brain.generateResponse(message, context);
  }

  // ============================================
  // SELF DESCRIPTION
  // ============================================
  async describeSelf(context = 'general') {
    return await this.brain.describeCapabilities(context);
  }
}

module.exports = LesterMasterBrain;
