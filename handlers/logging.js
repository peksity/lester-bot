/**
 * LOGGING HANDLER
 * Handles all server event logging to appropriate channels
 */

const { EmbedBuilder, AuditLogEvent } = require('discord.js');

// Cache for log channels
const logChannels = new Map();

/**
 * Get a log channel by name
 */
async function getLogChannel(guild, channelName) {
  const cacheKey = `${guild.id}-${channelName}`;
  
  if (logChannels.has(cacheKey)) {
    return logChannels.get(cacheKey);
  }
  
  const channel = guild.channels.cache.find(c => c.name === channelName);
  if (channel) {
    logChannels.set(cacheKey, channel);
  }
  return channel;
}

/**
 * Log deleted messages
 */
async function messageDeleted(message, client) {
  if (!message.guild) return;
  if (message.author?.bot) return;
  if (!message.content && !message.attachments.size) return;
  
  const logChannel = await getLogChannel(message.guild, 'message-logs');
  if (!logChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .setDescription(message.content?.substring(0, 1000) || '*No text content*')
    .addFields(
      { name: '👤 Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: true },
      { name: '📍 Channel', value: `<#${message.channel.id}>`, inline: true }
    )
    .setColor(0xFF6B6B)
    .setTimestamp();
  
  if (message.attachments.size > 0) {
    embed.addFields({ 
      name: '📎 Attachments', 
      value: message.attachments.map(a => a.name).join(', ').substring(0, 500) 
    });
  }
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log edited messages
 */
async function messageEdited(oldMessage, newMessage, client) {
  if (!newMessage.guild) return;
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  
  const logChannel = await getLogChannel(newMessage.guild, 'message-logs');
  if (!logChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle('✏️ Message Edited')
    .addFields(
      { name: '📝 Before', value: oldMessage.content?.substring(0, 500) || '*Unknown*', inline: false },
      { name: '📝 After', value: newMessage.content?.substring(0, 500) || '*Unknown*', inline: false },
      { name: '👤 Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: true },
      { name: '📍 Channel', value: `<#${newMessage.channel.id}>`, inline: true },
      { name: '🔗 Jump', value: `[Click Here](${newMessage.url})`, inline: true }
    )
    .setColor(0xFFD93D)
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log member joins
 */
async function memberJoined(member, client) {
  const logChannel = await getLogChannel(member.guild, 'join-leave');
  if (!logChannel) return;
  
  const accountAge = Date.now() - member.user.createdTimestamp;
  const daysOld = Math.floor(accountAge / (1000 * 60 * 60 * 24));
  
  const embed = new EmbedBuilder()
    .setTitle('📥 Member Joined')
    .setDescription(`${member.user.tag} joined the server`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 User', value: `<@${member.id}>`, inline: true },
      { name: '🆔 ID', value: member.id, inline: true },
      { name: '📅 Account Age', value: `${daysOld} days`, inline: true },
      { name: '👥 Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setColor(0x2ECC71)
    .setTimestamp();
  
  // Flag new accounts
  if (daysOld < 7) {
    embed.setColor(0xFFA500);
    embed.addFields({ name: '⚠️ Warning', value: 'Account is less than 7 days old!' });
  }
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log member leaves
 */
async function memberLeft(member, client) {
  const logChannel = await getLogChannel(member.guild, 'join-leave');
  if (!logChannel) return;
  
  const joinedAt = member.joinedAt;
  const timeInServer = joinedAt ? Math.floor((Date.now() - joinedAt) / (1000 * 60 * 60 * 24)) : 'Unknown';
  
  const embed = new EmbedBuilder()
    .setTitle('📤 Member Left')
    .setDescription(`${member.user.tag} left the server`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 User', value: `${member.user.tag}`, inline: true },
      { name: '🆔 ID', value: member.id, inline: true },
      { name: '⏱️ Time in Server', value: `${timeInServer} days`, inline: true },
      { name: '👥 Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setColor(0xE74C3C)
    .setTimestamp();
  
  // List roles they had
  const roles = member.roles.cache
    .filter(r => r.name !== '@everyone')
    .map(r => r.name)
    .join(', ');
  
  if (roles) {
    embed.addFields({ name: '🏷️ Roles', value: roles.substring(0, 1000) || 'None' });
  }
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log member bans
 */
async function memberBanned(ban, client) {
  const logChannel = await getLogChannel(ban.guild, 'mod-actions');
  if (!logChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle('🔨 Member Banned')
    .setDescription(`${ban.user.tag} was banned`)
    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '👤 User', value: `${ban.user.tag}`, inline: true },
      { name: '🆔 ID', value: ban.user.id, inline: true },
      { name: '📝 Reason', value: ban.reason || 'No reason provided', inline: false }
    )
    .setColor(0x000000)
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log voice state changes
 */
async function voiceStateUpdate(oldState, newState, client) {
  const logChannel = await getLogChannel(newState.guild, 'voice-logs');
  if (!logChannel) return;
  
  const member = newState.member;
  if (!member || member.user.bot) return;
  
  let embed = null;
  
  // Joined voice channel
  if (!oldState.channel && newState.channel) {
    embed = new EmbedBuilder()
      .setTitle('🎤 Joined Voice')
      .setDescription(`${member.user.tag} joined **${newState.channel.name}**`)
      .setColor(0x2ECC71)
      .setTimestamp();
  }
  // Left voice channel
  else if (oldState.channel && !newState.channel) {
    embed = new EmbedBuilder()
      .setTitle('🔇 Left Voice')
      .setDescription(`${member.user.tag} left **${oldState.channel.name}**`)
      .setColor(0xE74C3C)
      .setTimestamp();
  }
  // Moved channels
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    embed = new EmbedBuilder()
      .setTitle('🔄 Moved Voice')
      .setDescription(`${member.user.tag} moved from **${oldState.channel.name}** to **${newState.channel.name}**`)
      .setColor(0x3498DB)
      .setTimestamp();
  }
  
  if (embed) {
    embed.addFields({ name: '👤 User', value: `<@${member.id}>`, inline: true });
    await logChannel.send({ embeds: [embed] }).catch(() => {});
  }
}

/**
 * Log role changes
 */
async function roleChanged(oldMember, newMember, client) {
  const logChannel = await getLogChannel(newMember.guild, 'role-changes');
  if (!logChannel) return;
  
  const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
  
  if (addedRoles.size === 0 && removedRoles.size === 0) return;
  
  const embed = new EmbedBuilder()
    .setTitle('🏷️ Role Changed')
    .setDescription(`Roles updated for ${newMember.user.tag}`)
    .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
    .setColor(0x9B59B6)
    .setTimestamp();
  
  if (addedRoles.size > 0) {
    embed.addFields({ 
      name: '➕ Added', 
      value: addedRoles.map(r => r.name).join(', '), 
      inline: true 
    });
  }
  
  if (removedRoles.size > 0) {
    embed.addFields({ 
      name: '➖ Removed', 
      value: removedRoles.map(r => r.name).join(', '), 
      inline: true 
    });
  }
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log nickname changes
 */
async function nicknameChanged(oldMember, newMember, client) {
  if (oldMember.nickname === newMember.nickname) return;
  
  const logChannel = await getLogChannel(newMember.guild, 'nickname-logs');
  if (!logChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle('📛 Nickname Changed')
    .setDescription(`${newMember.user.tag}'s nickname was changed`)
    .addFields(
      { name: '📝 Before', value: oldMember.nickname || '*None*', inline: true },
      { name: '📝 After', value: newMember.nickname || '*None*', inline: true },
      { name: '👤 User', value: `<@${newMember.id}>`, inline: true }
    )
    .setColor(0xF39C12)
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * Log moderation action (called manually by mod commands)
 */
async function logModAction(guild, action, moderator, target, reason, duration = null) {
  const logChannel = await getLogChannel(guild, 'mod-actions');
  if (!logChannel) return;
  
  const colors = {
    'ban': 0x000000,
    'kick': 0xE74C3C,
    'mute': 0xFFA500,
    'unmute': 0x2ECC71,
    'warn': 0xFFD700,
    'unban': 0x2ECC71
  };
  
  const embed = new EmbedBuilder()
    .setTitle(`${getActionEmoji(action)} ${action.toUpperCase()}`)
    .addFields(
      { name: '👤 Target', value: typeof target === 'string' ? target : `${target.tag} (${target.id})`, inline: true },
      { name: '👮 Moderator', value: `${moderator.tag}`, inline: true },
      { name: '📝 Reason', value: reason || 'No reason provided', inline: false }
    )
    .setColor(colors[action] || 0x7289DA)
    .setTimestamp();
  
  if (duration) {
    embed.addFields({ name: '⏱️ Duration', value: duration, inline: true });
  }
  
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

function getActionEmoji(action) {
  const emojis = {
    'ban': '🔨',
    'kick': '👢',
    'mute': '🔇',
    'unmute': '🔊',
    'warn': '⚠️',
    'unban': '🔓'
  };
  return emojis[action] || '📋';
}

/**
 * Handle member update (roles and nickname)
 */
async function memberUpdated(oldMember, newMember, client) {
  // Check role changes
  if (oldMember.roles.cache.size !== newMember.roles.cache.size || 
      !oldMember.roles.cache.every(r => newMember.roles.cache.has(r.id))) {
    await roleChanged(oldMember, newMember, client);
  }
  
  // Check nickname changes
  if (oldMember.nickname !== newMember.nickname) {
    await nicknameChanged(oldMember, newMember, client);
  }
}

module.exports = {
  messageDeleted,
  messageEdited,
  memberJoined,
  memberLeft,
  memberBanned,
  voiceStateUpdate,
  roleChanged,
  nicknameChanged,
  memberUpdated,
  logModAction,
  getLogChannel
};
