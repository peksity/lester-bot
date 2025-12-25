/**
 * ██╗      ██████╗  ██████╗  ██████╗ ██╗███╗   ██╗ ██████╗ 
 * ██║     ██╔═══██╗██╔════╝ ██╔════╝ ██║████╗  ██║██╔════╝ 
 * ██║     ██║   ██║██║  ███╗██║  ███╗██║██╔██╗ ██║██║  ███╗
 * ██║     ██║   ██║██║   ██║██║   ██║██║██║╚██╗██║██║   ██║
 * ███████╗╚██████╔╝╚██████╔╝╚██████╔╝██║██║ ╚████║╚██████╔╝
 * ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
 * 
 * LESTER ULTIMATE LOGGING SYSTEM
 * Comprehensive server logging with LFG tracking
 */

const { EmbedBuilder, ChannelType, AuditLogEvent } = require('discord.js');

// ═══════════════════════════════════════════════════════════════════════════════
// LOG CHANNEL IDS
// ═══════════════════════════════════════════════════════════════════════════════

const LOG_CHANNELS = {
  lfgLogs: null,           // Will be created
  inviteLogs: '1453304819224809676',
  scamDetection: '1453304821842051104',
  nicknameLogs: '1453304816037007505',
  modActionLogs: '1453304795149373543',
  messageLogs: '1453304798634967152',
  joinLeaveLogs: '1453304804398076006',
  nexusLogs: '1453304792649568399'
};

const STAFF_CATEGORY_ID = '1453304790145830973';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZE LOGGING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

async function initialize(client) {
  console.log('[LOGGING] Initializing Ultimate Logging System...');
  
  // Create LFG logs channel if it doesn't exist
  const guild = client.guilds.cache.first();
  if (guild) {
    await createLFGLogsChannel(guild);
  }
  
  // Set up event listeners
  setupMessageLogs(client);
  setupJoinLeaveLogs(client);
  setupNicknameLogs(client);
  setupInviteLogs(client);
  
  console.log('[LOGGING] ✅ Ultimate Logging System initialized');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE LFG LOGS CHANNEL
// ═══════════════════════════════════════════════════════════════════════════════

async function createLFGLogsChannel(guild) {
  try {
    // Check if channel already exists
    let lfgLogsChannel = guild.channels.cache.find(c => c.name === 'lfg-logs');
    
    if (!lfgLogsChannel) {
      console.log('[LOGGING] Creating #lfg-logs channel...');
      
      lfgLogsChannel = await guild.channels.create({
        name: 'lfg-logs',
        type: ChannelType.GuildText,
        parent: STAFF_CATEGORY_ID,
        topic: '📊 LFG Session Logs - Wagon, Cayo, Bounty tracking',
        permissionOverwrites: [
          {
            id: guild.id,
            deny: ['ViewChannel']
          }
        ]
      });
      
      // Send welcome message
      await lfgLogsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('📊 LFG Logging System Active')
            .setDescription(
              'This channel tracks all LFG sessions:\n\n' +
              '🛒 **Wagon** - Cripps sessions\n' +
              '🏝️ **Cayo** - Pavel heists\n' +
              '💀 **Bounty** - Chief hunts\n\n' +
              'Logs include: session creation, joins, kicks, completions, and earnings.'
            )
            .setColor(0x00FF00)
            .setTimestamp()
        ]
      });
      
      console.log('[LOGGING] ✅ #lfg-logs channel created');
    }
    
    LOG_CHANNELS.lfgLogs = lfgLogsChannel.id;
    return lfgLogsChannel;
  } catch (error) {
    console.error('[LOGGING] Failed to create LFG logs channel:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LFG LOGGING FUNCTIONS (Called by other bots via cross-bot memory)
// ═══════════════════════════════════════════════════════════════════════════════

async function logLFGSession(client, type, action, data) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNELS.lfgLogs);
    if (!channel) return;
    
    let embed;
    
    switch (action) {
      case 'created':
        embed = new EmbedBuilder()
          .setTitle(`${getTypeEmoji(type)} LFG Session Created`)
          .setDescription(`**Host:** ${data.hostName} (<@${data.hostId}>)`)
          .addFields(
            { name: 'Type', value: type, inline: true },
            { name: 'Platform', value: data.platform || 'Unknown', inline: true },
            { name: 'PSN', value: data.psn || 'N/A', inline: true },
            { name: 'Session ID', value: `\`${data.sessionId}\``, inline: false }
          )
          .setColor(0x00FF00)
          .setTimestamp();
        break;
        
      case 'joined':
        embed = new EmbedBuilder()
          .setTitle(`${getTypeEmoji(type)} Player Joined`)
          .addFields(
            { name: 'Player', value: `${data.playerName} (<@${data.playerId}>)`, inline: true },
            { name: 'PSN', value: data.psn || 'N/A', inline: true },
            { name: 'Host', value: data.hostName, inline: true },
            { name: 'Players', value: `${data.playerCount}/${data.maxPlayers}`, inline: true }
          )
          .setColor(0x00D4FF)
          .setTimestamp();
        break;
        
      case 'kicked':
        embed = new EmbedBuilder()
          .setTitle(`${getTypeEmoji(type)} Player Kicked`)
          .addFields(
            { name: 'Kicked', value: `${data.kickedName} (<@${data.kickedId}>)`, inline: true },
            { name: 'By Host', value: data.hostName, inline: true },
            { name: 'Session', value: `\`${data.sessionId}\``, inline: false }
          )
          .setColor(0xFF6B6B)
          .setTimestamp();
        break;
        
      case 'completed':
        embed = new EmbedBuilder()
          .setTitle(`${getTypeEmoji(type)} Run Completed`)
          .addFields(
            { name: 'Host', value: data.hostName, inline: true },
            { name: 'Earnings', value: `$${data.earnings?.toLocaleString() || 0}`, inline: true },
            { name: 'Run #', value: `${data.runNumber}`, inline: true }
          )
          .setColor(0xFFD700)
          .setTimestamp();
        break;
        
      case 'ended':
        embed = new EmbedBuilder()
          .setTitle(`${getTypeEmoji(type)} Session Ended`)
          .addFields(
            { name: 'Host', value: `${data.hostName} (<@${data.hostId}>)`, inline: true },
            { name: 'Total Earnings', value: `$${data.totalEarnings?.toLocaleString() || 0}`, inline: true },
            { name: 'Duration', value: formatDuration(data.duration), inline: true },
            { name: 'Players', value: data.players?.join(', ') || 'Solo', inline: false }
          )
          .setColor(0x9B59B6)
          .setTimestamp();
        break;
        
      case 'cancelled':
        embed = new EmbedBuilder()
          .setTitle(`${getTypeEmoji(type)} Session Cancelled`)
          .addFields(
            { name: 'Host', value: `${data.hostName} (<@${data.hostId}>)`, inline: true },
            { name: 'Reason', value: data.reason || 'Host cancelled', inline: true }
          )
          .setColor(0xFF0000)
          .setTimestamp();
        break;
    }
    
    if (embed) {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('[LOGGING] LFG log error:', error);
  }
}

function getTypeEmoji(type) {
  switch (type.toLowerCase()) {
    case 'wagon': return '🛒';
    case 'cayo': return '🏝️';
    case 'bounty': return '💀';
    default: return '📋';
  }
}

function formatDuration(ms) {
  if (!ms) return 'Unknown';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE LOGS (Edit/Delete)
// ═══════════════════════════════════════════════════════════════════════════════

function setupMessageLogs(client) {
  // Message Delete
  client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;
    
    try {
      const channel = await client.channels.fetch(LOG_CHANNELS.messageLogs);
      if (!channel) return;
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Message Deleted')
        .setDescription(message.content?.slice(0, 1000) || '*No content*')
        .addFields(
          { name: 'Author', value: `${message.author?.tag || 'Unknown'} (<@${message.author?.id}>)`, inline: true },
          { name: 'Channel', value: `<#${message.channel.id}>`, inline: true }
        )
        .setColor(0xFF6B6B)
        .setTimestamp();
      
      if (message.attachments.size > 0) {
        embed.addFields({ 
          name: 'Attachments', 
          value: message.attachments.map(a => a.name).join(', '), 
          inline: false 
        });
      }
      
      await channel.send({ embeds: [embed] });
    } catch (e) {}
  });
  
  // Message Edit
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    
    try {
      const channel = await client.channels.fetch(LOG_CHANNELS.messageLogs);
      if (!channel) return;
      
      const embed = new EmbedBuilder()
        .setTitle('✏️ Message Edited')
        .addFields(
          { name: 'Author', value: `${oldMessage.author?.tag || 'Unknown'} (<@${oldMessage.author?.id}>)`, inline: true },
          { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
          { name: 'Before', value: oldMessage.content?.slice(0, 500) || '*No content*', inline: false },
          { name: 'After', value: newMessage.content?.slice(0, 500) || '*No content*', inline: false }
        )
        .setColor(0xFFD700)
        .setURL(newMessage.url)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    } catch (e) {}
  });
  
  // Bulk Delete
  client.on('messageDeleteBulk', async (messages) => {
    try {
      const channel = await client.channels.fetch(LOG_CHANNELS.messageLogs);
      if (!channel) return;
      
      const firstMsg = messages.first();
      
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Bulk Messages Deleted')
        .addFields(
          { name: 'Count', value: `${messages.size} messages`, inline: true },
          { name: 'Channel', value: `<#${firstMsg?.channel.id}>`, inline: true }
        )
        .setColor(0xFF0000)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    } catch (e) {}
  });
  
  console.log('[LOGGING] ✅ Message logs ready');
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOIN/LEAVE LOGS
// ═══════════════════════════════════════════════════════════════════════════════

function setupJoinLeaveLogs(client) {
  // Member Join
  client.on('guildMemberAdd', async (member) => {
    try {
      const channel = await client.channels.fetch(LOG_CHANNELS.joinLeaveLogs);
      if (!channel) return;
      
      const accountAge = Date.now() - member.user.createdTimestamp;
      const daysOld = Math.floor(accountAge / (1000 * 60 * 60 * 24));
      
      const embed = new EmbedBuilder()
        .setTitle('📥 Member Joined')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Account Age', value: `${daysOld} days old`, inline: true },
          { name: 'Member #', value: `${member.guild.memberCount}`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();
      
      // Flag new accounts
      if (daysOld < 7) {
        embed.addFields({ name: '⚠️ Warning', value: 'Account less than 7 days old!', inline: false });
        embed.setColor(0xFF6B6B);
      }
      
      await channel.send({ embeds: [embed] });
    } catch (e) {}
  });
  
  // Member Leave
  client.on('guildMemberRemove', async (member) => {
    try {
      const channel = await client.channels.fetch(LOG_CHANNELS.joinLeaveLogs);
      if (!channel) return;
      
      const joinedAt = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown';
      const roles = member.roles.cache
        .filter(r => r.id !== member.guild.id)
        .map(r => r.name)
        .slice(0, 10)
        .join(', ') || 'None';
      
      const embed = new EmbedBuilder()
        .setTitle('📤 Member Left')
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
          { name: 'Joined', value: joinedAt, inline: true },
          { name: 'Roles', value: roles, inline: false }
        )
        .setColor(0xFF6B6B)
        .setTimestamp();
      
      await channel.send({ embeds: [embed] });
    } catch (e) {}
  });
  
  console.log('[LOGGING] ✅ Join/Leave logs ready');
}

// ═══════════════════════════════════════════════════════════════════════════════
// NICKNAME LOGS
// ═══════════════════════════════════════════════════════════════════════════════

function setupNicknameLogs(client) {
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Nickname change
    if (oldMember.nickname !== newMember.nickname) {
      try {
        const channel = await client.channels.fetch(LOG_CHANNELS.nicknameLogs);
        if (!channel) return;
        
        const embed = new EmbedBuilder()
          .setTitle('📝 Nickname Changed')
          .addFields(
            { name: 'User', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: true },
            { name: 'Before', value: oldMember.nickname || '*None*', inline: true },
            { name: 'After', value: newMember.nickname || '*None*', inline: true }
          )
          .setColor(0x00D4FF)
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
      } catch (e) {}
    }
  });
  
  console.log('[LOGGING] ✅ Nickname logs ready');
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVITE LOGS
// ═══════════════════════════════════════════════════════════════════════════════

const inviteCache = new Map();

function setupInviteLogs(client) {
  // Cache invites on startup
  client.on('ready', async () => {
    for (const guild of client.guilds.cache.values()) {
      try {
        const invites = await guild.invites.fetch();
        inviteCache.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
      } catch (e) {}
    }
  });
  
  // Track new invites
  client.on('inviteCreate', async (invite) => {
    const guildInvites = inviteCache.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, invite.uses);
    inviteCache.set(invite.guild.id, guildInvites);
  });
  
  // Track invite usage on member join
  client.on('guildMemberAdd', async (member) => {
    try {
      const channel = await client.channels.fetch(LOG_CHANNELS.inviteLogs);
      if (!channel) return;
      
      const cachedInvites = inviteCache.get(member.guild.id) || new Map();
      const newInvites = await member.guild.invites.fetch();
      
      // Find which invite was used
      let usedInvite = null;
      for (const invite of newInvites.values()) {
        const cachedUses = cachedInvites.get(invite.code) || 0;
        if (invite.uses > cachedUses) {
          usedInvite = invite;
          break;
        }
      }
      
      // Update cache
      inviteCache.set(member.guild.id, new Map(newInvites.map(i => [i.code, i.uses])));
      
      if (usedInvite) {
        const embed = new EmbedBuilder()
          .setTitle('🔗 Invite Used')
          .addFields(
            { name: 'New Member', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: 'Invited By', value: `${usedInvite.inviter?.tag || 'Unknown'} (<@${usedInvite.inviter?.id}>)`, inline: true },
            { name: 'Invite Code', value: `\`${usedInvite.code}\``, inline: true },
            { name: 'Total Uses', value: `${usedInvite.uses}`, inline: true }
          )
          .setColor(0x9B59B6)
          .setTimestamp();
        
        await channel.send({ embeds: [embed] });
      }
    } catch (e) {}
  });
  
  console.log('[LOGGING] ✅ Invite logs ready');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOD ACTION LOGS (Called from mod commands)
// ═══════════════════════════════════════════════════════════════════════════════

async function logModAction(client, action, data) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNELS.modActionLogs);
    if (!channel) return;
    
    let embed;
    
    switch (action) {
      case 'warn':
        embed = new EmbedBuilder()
          .setTitle('⚠️ User Warned')
          .addFields(
            { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true },
            { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
          )
          .setColor(0xFFD700);
        break;
        
      case 'mute':
        embed = new EmbedBuilder()
          .setTitle('🔇 User Muted')
          .addFields(
            { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true },
            { name: 'Duration', value: data.duration || 'Indefinite', inline: true },
            { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
          )
          .setColor(0xFF6B6B);
        break;
        
      case 'unmute':
        embed = new EmbedBuilder()
          .setTitle('🔊 User Unmuted')
          .addFields(
            { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true }
          )
          .setColor(0x00FF00);
        break;
        
      case 'kick':
        embed = new EmbedBuilder()
          .setTitle('👢 User Kicked')
          .addFields(
            { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true },
            { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
          )
          .setColor(0xFF6B6B);
        break;
        
      case 'ban':
        embed = new EmbedBuilder()
          .setTitle('🔨 User Banned')
          .addFields(
            { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true },
            { name: 'Reason', value: data.reason || 'No reason provided', inline: false }
          )
          .setColor(0xFF0000);
        break;
        
      case 'unban':
        embed = new EmbedBuilder()
          .setTitle('✅ User Unbanned')
          .addFields(
            { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true }
          )
          .setColor(0x00FF00);
        break;
        
      case 'purge':
        embed = new EmbedBuilder()
          .setTitle('🧹 Messages Purged')
          .addFields(
            { name: 'Count', value: `${data.count} messages`, inline: true },
            { name: 'Channel', value: `<#${data.channelId}>`, inline: true },
            { name: 'Moderator', value: `<@${data.modId}>`, inline: true }
          )
          .setColor(0x9B59B6);
        break;
    }
    
    if (embed) {
      embed.setTimestamp();
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('[LOGGING] Mod action log error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCAM DETECTION LOGS
// ═══════════════════════════════════════════════════════════════════════════════

async function logScamDetection(client, data) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNELS.scamDetection);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
      .setTitle('🚨 Potential Scam Detected')
      .addFields(
        { name: 'User', value: `${data.userName} (<@${data.userId}>)`, inline: true },
        { name: 'Channel', value: `<#${data.channelId}>`, inline: true },
        { name: 'Type', value: data.type || 'Unknown', inline: true },
        { name: 'Content', value: data.content?.slice(0, 500) || '*No content*', inline: false },
        { name: 'Action Taken', value: data.action || 'Flagged for review', inline: false }
      )
      .setColor(0xFF0000)
      .setTimestamp();
    
    if (data.links) {
      embed.addFields({ name: 'Suspicious Links', value: data.links.join('\n'), inline: false });
    }
    
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('[LOGGING] Scam detection log error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS LOGS (General bot activity)
// ═══════════════════════════════════════════════════════════════════════════════

async function logNexus(client, data) {
  try {
    const channel = await client.channels.fetch(LOG_CHANNELS.nexusLogs);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
      .setTitle(data.title || '📋 Nexus Log')
      .setDescription(data.description || '')
      .setColor(data.color || 0x00D4FF)
      .setTimestamp();
    
    if (data.fields) {
      embed.addFields(data.fields);
    }
    
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('[LOGGING] Nexus log error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  initialize,
  LOG_CHANNELS,
  logLFGSession,
  logModAction,
  logScamDetection,
  logNexus,
  createLFGLogsChannel
};
