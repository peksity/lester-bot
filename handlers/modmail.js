/**
 * MODMAIL SYSTEM
 * - DM the bot to create a ticket
 * - Staff can respond through channel
 * - Automatic transcripts on close
 * - Categories for different issues
 */

const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  StringSelectMenuBuilder
} = require('discord.js');

class ModmailSystem {
  constructor(pool, client) {
    this.pool = pool;
    this.client = client;
    this.activeTickets = new Map(); // channelId -> userId
  }

  /**
   * Initialize database tables
   */
  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS modmail_tickets (
        id SERIAL PRIMARY KEY,
        ticket_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        channel_id TEXT,
        category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP,
        closed_by TEXT
      )
    `);
    
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS modmail_messages (
        id SERIAL PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        is_staff BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attachments TEXT[]
      )
    `);
    
    console.log('✅ Modmail system initialized');
  }

  /**
   * Generate ticket ID
   */
  generateTicketId() {
    return `TKT-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Handle incoming DM for modmail
   */
  async handleDM(message) {
    const user = message.author;
    
    // Check for existing open ticket
    const existing = await this.pool.query(
      `SELECT * FROM modmail_tickets WHERE user_id = $1 AND status = 'open'`,
      [user.id]
    );
    
    if (existing.rows.length > 0) {
      // Forward to existing ticket channel
      const ticket = existing.rows[0];
      const guild = this.client.guilds.cache.first();
      const channel = guild.channels.cache.get(ticket.channel_id);
      
      if (channel) {
        await this.forwardToChannel(message, channel, ticket.ticket_id);
        await message.react('✅');
        return true;
      }
    }
    
    // No existing ticket - ask if they want to create one
    const embed = new EmbedBuilder()
      .setTitle('📬 Contact Staff')
      .setDescription(
        `Would you like to open a support ticket?\n\n` +
        `**Your message will be sent to the staff team.**\n` +
        `Please select a category below.`
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'The Unpatched Method • Modmail' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('modmail_category')
      .setPlaceholder('Select a category...')
      .addOptions([
        { label: 'General Question', value: 'general', emoji: '❓' },
        { label: 'Report a User', value: 'report', emoji: '🚨' },
        { label: 'Appeal a Ban/Mute', value: 'appeal', emoji: '⚖️' },
        { label: 'Bug Report', value: 'bug', emoji: '🐛' },
        { label: 'Suggestion', value: 'suggestion', emoji: '💡' }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Store the initial message temporarily
    this.pendingTickets = this.pendingTickets || new Map();
    this.pendingTickets.set(user.id, message.content);

    await message.reply({ embeds: [embed], components: [row] });
    return true;
  }

  /**
   * Handle category selection
   */
  async handleCategorySelect(interaction) {
    const category = interaction.values[0];
    const user = interaction.user;
    const initialMessage = this.pendingTickets?.get(user.id) || 'No initial message';
    
    await interaction.deferReply();
    
    // Create ticket
    const ticketId = this.generateTicketId();
    const guild = this.client.guilds.cache.first();
    
    // Find or create modmail category
    let modmailCategory = guild.channels.cache.find(
      c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('modmail')
    );
    
    if (!modmailCategory) {
      modmailCategory = await guild.channels.create({
        name: '📬 MODMAIL',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
    }
    
    // Create ticket channel
    const channel = await guild.channels.create({
      name: `${category}-${user.username}`.substring(0, 100),
      type: ChannelType.GuildText,
      parent: modmailCategory.id,
      topic: `Modmail ticket for ${user.tag} | ${ticketId}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ]
    });

    // Save to database
    await this.pool.query(
      `INSERT INTO modmail_tickets (ticket_id, user_id, guild_id, channel_id, category) 
       VALUES ($1, $2, $3, $4, $5)`,
      [ticketId, user.id, guild.id, channel.id, category]
    );

    // Save initial message
    await this.pool.query(
      `INSERT INTO modmail_messages (ticket_id, author_id, author_name, content, is_staff) 
       VALUES ($1, $2, $3, $4, FALSE)`,
      [ticketId, user.id, user.tag, initialMessage]
    );

    // Track active ticket
    this.activeTickets.set(channel.id, user.id);

    // Send ticket embed to channel
    const ticketEmbed = new EmbedBuilder()
      .setTitle(`📬 New Ticket: ${ticketId}`)
      .setDescription(`**User:** ${user.tag} (${user.id})\n**Category:** ${category}`)
      .addFields(
        { name: 'Initial Message', value: initialMessage.substring(0, 1024) || 'No message' },
        { name: 'Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setColor(this.getCategoryColor(category))
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();

    const closeRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`modmail_close_${ticketId}`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    await channel.send({ embeds: [ticketEmbed], components: [closeRow] });
    await channel.send(`@here New ${category} ticket from ${user.tag}`);

    // Confirm to user
    await interaction.editReply({
      content: `✅ **Ticket Created!** (${ticketId})\n\nYour message has been sent to the staff team. They will respond here in DMs.\n\n*Category: ${category}*`,
      components: []
    });

    // Clean up pending
    this.pendingTickets?.delete(user.id);
    
    return ticketId;
  }

  /**
   * Forward user message to ticket channel
   */
  async forwardToChannel(message, channel, ticketId) {
    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: message.author.tag, 
        iconURL: message.author.displayAvatarURL() 
      })
      .setDescription(message.content || '*No text content*')
      .setColor(0x3498db)
      .setTimestamp();

    // Handle attachments
    const attachments = [];
    if (message.attachments.size > 0) {
      const urls = message.attachments.map(a => a.url);
      embed.addFields({ 
        name: 'Attachments', 
        value: urls.join('\n').substring(0, 1024) 
      });
      attachments.push(...urls);
    }

    await channel.send({ embeds: [embed] });

    // Log to database
    await this.pool.query(
      `INSERT INTO modmail_messages (ticket_id, author_id, author_name, content, is_staff, attachments) 
       VALUES ($1, $2, $3, $4, FALSE, $5)`,
      [ticketId, message.author.id, message.author.tag, message.content, attachments]
    );
  }

  /**
   * Forward staff message to user
   */
  async forwardToUser(message, ticketId) {
    // Get ticket info
    const ticket = await this.pool.query(
      'SELECT * FROM modmail_tickets WHERE ticket_id = $1',
      [ticketId]
    );

    if (ticket.rows.length === 0) return false;

    const userId = ticket.rows[0].user_id;
    const user = await this.client.users.fetch(userId);

    if (!user) return false;

    const embed = new EmbedBuilder()
      .setAuthor({ 
        name: `Staff Response`, 
        iconURL: message.guild.iconURL() 
      })
      .setDescription(message.content)
      .setColor(0x2ecc71)
      .setFooter({ text: 'Reply to this DM to respond' })
      .setTimestamp();

    try {
      await user.send({ embeds: [embed] });
      await message.react('✅');

      // Log to database
      await this.pool.query(
        `INSERT INTO modmail_messages (ticket_id, author_id, author_name, content, is_staff) 
         VALUES ($1, $2, $3, $4, TRUE)`,
        [ticketId, message.author.id, message.author.tag, message.content]
      );

      return true;
    } catch (e) {
      await message.react('❌');
      await message.channel.send('⚠️ Could not DM user. They may have DMs disabled.');
      return false;
    }
  }

  /**
   * Close ticket and generate transcript
   */
  async closeTicket(ticketId, closedBy) {
    const ticket = await this.pool.query(
      'SELECT * FROM modmail_tickets WHERE ticket_id = $1',
      [ticketId]
    );

    if (ticket.rows.length === 0) return null;

    const ticketData = ticket.rows[0];
    const guild = this.client.guilds.cache.get(ticketData.guild_id);
    
    // Get all messages for transcript
    const messages = await this.pool.query(
      'SELECT * FROM modmail_messages WHERE ticket_id = $1 ORDER BY timestamp ASC',
      [ticketId]
    );

    // Generate transcript
    const transcript = this.generateTranscript(ticketData, messages.rows);

    // Find/create transcripts channel
    let transcriptChannel = guild.channels.cache.find(c => c.name === 'transcripts');
    
    if (!transcriptChannel) {
      const staffCategory = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('staff')
      );
      
      transcriptChannel = await guild.channels.create({
        name: 'transcripts',
        type: ChannelType.GuildText,
        parent: staffCategory?.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
    }

    // Post transcript
    const transcriptEmbed = new EmbedBuilder()
      .setTitle(`📜 Transcript: ${ticketId}`)
      .setDescription(
        `**User:** <@${ticketData.user_id}>\n` +
        `**Category:** ${ticketData.category}\n` +
        `**Closed by:** ${closedBy}\n` +
        `**Messages:** ${messages.rows.length}`
      )
      .setColor(0x95a5a6)
      .setTimestamp();

    await transcriptChannel.send({ embeds: [transcriptEmbed] });
    await transcriptChannel.send({ 
      content: '```\n' + transcript.substring(0, 1900) + '\n```' 
    });

    // Notify user
    try {
      const user = await this.client.users.fetch(ticketData.user_id);
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(`Your ticket **${ticketId}** has been closed.\n\nThank you for contacting us!`)
            .setColor(0x95a5a6)
        ]
      });
    } catch (e) {}

    // Update database
    await this.pool.query(
      `UPDATE modmail_tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = $2 
       WHERE ticket_id = $1`,
      [ticketId, closedBy]
    );

    // Delete channel
    const channel = guild.channels.cache.get(ticketData.channel_id);
    if (channel) {
      await channel.delete().catch(() => {});
    }

    // Remove from active
    this.activeTickets.delete(ticketData.channel_id);

    return transcript;
  }

  /**
   * Generate text transcript
   */
  generateTranscript(ticket, messages) {
    let transcript = `=== MODMAIL TRANSCRIPT ===\n`;
    transcript += `Ticket: ${ticket.ticket_id}\n`;
    transcript += `User: ${ticket.user_id}\n`;
    transcript += `Category: ${ticket.category}\n`;
    transcript += `Created: ${ticket.created_at}\n`;
    transcript += `=========================\n\n`;

    for (const msg of messages) {
      const time = new Date(msg.timestamp).toISOString();
      const prefix = msg.is_staff ? '[STAFF]' : '[USER]';
      transcript += `${time} ${prefix} ${msg.author_name}:\n${msg.content}\n\n`;
    }

    return transcript;
  }

  /**
   * Get color based on category
   */
  getCategoryColor(category) {
    const colors = {
      general: 0x3498db,
      report: 0xe74c3c,
      appeal: 0xf39c12,
      bug: 0x9b59b6,
      suggestion: 0x2ecc71
    };
    return colors[category] || 0x3498db;
  }

  /**
   * Check if channel is a modmail channel
   */
  isModmailChannel(channelId) {
    return this.activeTickets.has(channelId);
  }

  /**
   * Get ticket ID from channel
   */
  async getTicketFromChannel(channelId) {
    const result = await this.pool.query(
      'SELECT ticket_id FROM modmail_tickets WHERE channel_id = $1 AND status = $2',
      [channelId, 'open']
    );
    return result.rows[0]?.ticket_id;
  }
}

module.exports = ModmailSystem;
