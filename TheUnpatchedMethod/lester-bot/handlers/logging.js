/**
 * LOGGING HANDLER
 * Logs ALL server events to appropriate channels
 */

const { EmbedBuilder, AuditLogEvent } = require('discord.js');

// ============================================
// GET LOG CHANNEL
// ============================================
async function getLogChannel(guild, client, channelName) {
  try {
    const config = await client.db.query('SELECT log_channels FROM server_config WHERE guild_id = $1', [guild.id]);
    if (!config.rows[0]) return null;
    
    const logChannels = config.rows[0].log_channels;
    const channelId = logChannels[channelName];
    
    if (!channelId) return null;
    
    return guild.channels.cache.get(channelId);
  } catch (error) {
    console.error('Error getting log channel:', error);
    return null;
  }
}

// ============================================
// MESSAGE DELETED
// ============================================
async function messageDeleted(message, client) {
  if (!message.guild) return;
  if (message.author?.bot) return;
  
  const logChannel = await getLogChannel(message.guild, client, 'message-logs');
  if (!logChannel) return;
  
  // Try to get from cache first
  let cachedMessage = client.messageCache.get(message.id);
  
  // Get who deleted it
  let deletedBy = 'Unknown';
  try {
    const auditLogs = await message.guild.fetchAuditLogs({
      type: AuditLogEvent.MessageDelete,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === message.author?.id && Date.now() - log.createdTimestamp < 5000) {
      deletedBy = log.executor.tag;
    } else {
      deletedBy = 'Author (self)';
    }
  } catch (e) {
    deletedBy = 'Unknown';
  }
  
  const content = cachedMessage?.content || message.content || '*Content not cached*';
  const author = cachedMessage?.author || message.author;
  
  const embed = new EmbedBuilder()
    .setTitle('🗑️ MESSAGE DELETED')
    .setColor(0xFF4500)
    .addFields(
      { name: 'Author', value: author ? `${author.tag} (<@${author.id}>)` : 'Unknown', inline: true },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Deleted By', value: deletedBy, inline: true },
      { name: 'Content', value: content.substring(0, 1024) || '*Empty*', inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `Message ID: ${message.id}` });
  
  // Handle attachments
  const attachments = cachedMessage?.attachments || Array.from(message.attachments.values());
  if (attachments.length > 0) {
    const attachmentList = attachments.map(a => a.name || a.url).join('\n');
    embed.addFields({ name: 'Attachments', value: attachmentList.substring(0, 1024), inline: false });
    
    // Try to re-upload first image
    const imageAttachment = attachments.find(a => a.contentType?.startsWith('image/') || a.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    if (imageAttachment) {
      embed.setImage(imageAttachment.url);
    }
  }
  
  await logChannel.send({ embeds: [embed] });
  
  // Clean up cache
  client.messageCache.delete(message.id);
}

// ============================================
// MESSAGE EDITED
// ============================================
async function messageEdited(oldMessage, newMessage, client) {
  if (!newMessage.guild) return;
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  
  const logChannel = await getLogChannel(newMessage.guild, client, 'message-logs');
  if (!logChannel) return;
  
  const oldContent = oldMessage.content || '*Not cached*';
  const newContent = newMessage.content || '*Empty*';
  
  const embed = new EmbedBuilder()
    .setTitle('✏️ MESSAGE EDITED')
    .setColor(0x00BFFF)
    .addFields(
      { name: 'Author', value: `${newMessage.author.tag} (<@${newMessage.author.id}>)`, inline: true },
      { name: 'Channel', value: `<#${newMessage.channel.id}>`, inline: true },
      { name: 'Jump to Message', value: `[Click Here](${newMessage.url})`, inline: true },
      { name: 'Before', value: oldContent.substring(0, 1024), inline: false },
      { name: 'After', value: newContent.substring(0, 1024), inline: false }
    )
    .setTimestamp()
    .setFooter({ text: `Message ID: ${newMessage.id}` });
  
  await logChannel.send({ embeds: [embed] });
  
  // Update cache
  client.messageCache.set(newMessage.id, {
    id: newMessage.id,
    content: newMessage.content,
    author: newMessage.author,
    channel: newMessage.channel,
    attachments: Array.from(newMessage.attachments.values()),
    timestamp: newMessage.createdAt
  });
}

// ============================================
// MEMBER JOINED
// ============================================
async function memberJoined(member, client) {
  const logChannel = await getLogChannel(member.guild, client, 'join-leave');
  if (!logChannel) return;
  
  // Try to find which invite was used
  let inviteUsed = 'Unknown';
  try {
    const cachedInvites = await client.db.query('SELECT * FROM invite_tracking WHERE guild_id = $1', [member.guild.id]);
    const currentInvites = await member.guild.invites.fetch();
    
    for (const [code, invite] of currentInvites) {
      const cached = cachedInvites.rows.find(i => i.code === code);
      if (cached && invite.uses > cached.uses) {
        inviteUsed = `${code} (by <@${invite.inviter?.id || cached.inviter_id}>)`;
        // Update cache
        await client.db.query('UPDATE invite_tracking SET uses = $1 WHERE code = $2', [invite.uses, code]);
        break;
      }
    }
  } catch (e) {
    // Couldn't track invite
  }
  
  const accountAge = Date.now() - member.user.createdTimestamp;
  const isNew = accountAge < 7 * 24 * 60 * 60 * 1000; // Less than 7 days
  
  const embed = new EmbedBuilder()
    .setTitle('📥 MEMBER JOINED')
    .setColor(0x00FF00)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: 'ID', value: member.id, inline: true },
      { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Invite Used', value: inviteUsed, inline: true },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();
  
  if (isNew) {
    embed.addFields({ name: '⚠️ Warning', value: 'New account (< 7 days old)', inline: false });
    embed.setColor(0xFFA500);
  }
  
  await logChannel.send({ embeds: [embed] });
  
  // Auto-assign Fresh Spawn role
  try {
    const freshSpawnRole = member.guild.roles.cache.find(r => r.name === '🆕 Fresh Spawn');
    if (freshSpawnRole) {
      await member.roles.add(freshSpawnRole);
    }
  } catch (e) {
    // Couldn't add role
  }
  
  // Welcome message in general chat (as Lester)
  try {
    const generalChat = member.guild.channels.cache.find(c => c.name === 'general-chat');
    if (generalChat) {
      const welcomeMessages = [
        `Well, well, well... <@${member.id}> just walked in. Try not to draw too much attention to yourself, alright? Check out the rules and grab your roles. I've got my eye on you.`,
        `<@${member.id}>, you made it. Good. Head to the rules channel, grab your roles, and don't do anything stupid. Welcome to The Unpatched Method.`,
        `Look who decided to show up - <@${member.id}>. Alright, here's the deal: read the rules, get your roles, and we'll get along just fine. Welcome.`,
        `<@${member.id}> just joined the crew. Listen, I don't do the whole 'welcome wagon' thing, but... read the rules, grab your roles, and let's make some money. That's what we're here for.`,
        `Ah, <@${member.id}>. Fresh meat. Look, I'll keep this simple - rules are in the rules channel, roles are in the roles channel. Don't be an idiot and we'll be fine. Welcome.`
      ];
      const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      await generalChat.send(randomWelcome);
    }
  } catch (e) {
    console.error('Error sending welcome message:', e);
  }
}

// ============================================
// MEMBER LEFT
// ============================================
async function memberLeft(member, client) {
  const logChannel = await getLogChannel(member.guild, client, 'join-leave');
  if (!logChannel) return;
  
  const roles = member.roles.cache
    .filter(r => r.name !== '@everyone')
    .map(r => r.name)
    .slice(0, 10)
    .join(', ') || 'None';
  
  const embed = new EmbedBuilder()
    .setTitle('📤 MEMBER LEFT')
    .setColor(0xFF0000)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
      { name: 'ID', value: member.id, inline: true },
      { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
      { name: 'Roles', value: roles.substring(0, 1024), inline: false },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// MEMBER BANNED
// ============================================
async function memberBanned(ban, client) {
  const logChannel = await getLogChannel(ban.guild, client, 'mod-actions');
  if (!logChannel) return;
  
  let moderator = 'Unknown';
  let reason = ban.reason || 'No reason provided';
  
  try {
    const auditLogs = await ban.guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanAdd,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === ban.user.id) {
      moderator = log.executor.tag;
      reason = log.reason || reason;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('🔨 MEMBER BANNED')
    .setColor(0xFF0000)
    .setThumbnail(ban.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'User', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Moderator', value: moderator, inline: true },
      { name: 'Reason', value: reason, inline: false }
    )
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// MEMBER UNBANNED
// ============================================
async function memberUnbanned(ban, client) {
  const logChannel = await getLogChannel(ban.guild, client, 'mod-actions');
  if (!logChannel) return;
  
  let moderator = 'Unknown';
  
  try {
    const auditLogs = await ban.guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === ban.user.id) {
      moderator = log.executor.tag;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('✅ MEMBER UNBANNED')
    .setColor(0x00FF00)
    .addFields(
      { name: 'User', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Moderator', value: moderator, inline: true }
    )
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// MEMBER UPDATED (Roles, Nickname)
// ============================================
async function memberUpdated(oldMember, newMember, client) {
  // Role changes
  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    const logChannel = await getLogChannel(newMember.guild, client, 'role-changes');
    if (!logChannel) return;
    
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    
    let moderator = 'Unknown';
    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberRoleUpdate,
        limit: 1
      });
      const log = auditLogs.entries.first();
      if (log && log.target.id === newMember.id && Date.now() - log.createdTimestamp < 5000) {
        moderator = log.executor.tag;
      }
    } catch (e) {}
    
    const embed = new EmbedBuilder()
      .setTitle('🏷️ ROLE UPDATE')
      .setColor(0x9B59B6)
      .addFields(
        { name: 'User', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: true },
        { name: 'Changed By', value: moderator, inline: true }
      )
      .setTimestamp();
    
    if (addedRoles.size > 0) {
      embed.addFields({ name: '✅ Added', value: addedRoles.map(r => r.name).join(', '), inline: false });
    }
    if (removedRoles.size > 0) {
      embed.addFields({ name: '❌ Removed', value: removedRoles.map(r => r.name).join(', '), inline: false });
    }
    
    await logChannel.send({ embeds: [embed] });
  }
  
  // Nickname changes
  if (oldMember.nickname !== newMember.nickname) {
    const logChannel = await getLogChannel(newMember.guild, client, 'nickname-logs');
    if (!logChannel) return;
    
    let changedBy = 'Self';
    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberUpdate,
        limit: 1
      });
      const log = auditLogs.entries.first();
      if (log && log.target.id === newMember.id && Date.now() - log.createdTimestamp < 5000) {
        changedBy = log.executor.tag;
      }
    } catch (e) {}
    
    const embed = new EmbedBuilder()
      .setTitle('📝 NICKNAME CHANGED')
      .setColor(0x3498DB)
      .addFields(
        { name: 'User', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: true },
        { name: 'Changed By', value: changedBy, inline: true },
        { name: 'Before', value: oldMember.nickname || '*None*', inline: true },
        { name: 'After', value: newMember.nickname || '*None*', inline: true }
      )
      .setTimestamp();
    
    await logChannel.send({ embeds: [embed] });
  }
}

// ============================================
// VOICE STATE UPDATE
// ============================================
async function voiceStateUpdate(oldState, newState, client) {
  const logChannel = await getLogChannel(newState.guild, client, 'voice-logs');
  if (!logChannel) return;
  
  const member = newState.member || oldState.member;
  if (!member) return;
  
  let action = '';
  let color = 0x808080;
  let details = '';
  
  if (!oldState.channel && newState.channel) {
    action = 'JOINED';
    color = 0x00FF00;
    details = `Joined <#${newState.channel.id}>`;
  } else if (oldState.channel && !newState.channel) {
    action = 'LEFT';
    color = 0xFF0000;
    details = `Left <#${oldState.channel.id}>`;
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    action = 'MOVED';
    color = 0xFFA500;
    details = `<#${oldState.channel.id}> → <#${newState.channel.id}>`;
  } else if (oldState.selfMute !== newState.selfMute) {
    action = newState.selfMute ? 'SELF MUTED' : 'SELF UNMUTED';
    color = 0x808080;
    details = `In <#${newState.channel?.id}>`;
  } else if (oldState.selfDeaf !== newState.selfDeaf) {
    action = newState.selfDeaf ? 'SELF DEAFENED' : 'SELF UNDEAFENED';
    color = 0x808080;
    details = `In <#${newState.channel?.id}>`;
  } else if (oldState.serverMute !== newState.serverMute) {
    action = newState.serverMute ? 'SERVER MUTED' : 'SERVER UNMUTED';
    color = 0xFFA500;
    details = `In <#${newState.channel?.id}>`;
  } else if (oldState.serverDeaf !== newState.serverDeaf) {
    action = newState.serverDeaf ? 'SERVER DEAFENED' : 'SERVER UNDEAFENED';
    color = 0xFFA500;
    details = `In <#${newState.channel?.id}>`;
  } else if (oldState.streaming !== newState.streaming) {
    action = newState.streaming ? 'STARTED STREAMING' : 'STOPPED STREAMING';
    color = 0x9B59B6;
    details = `In <#${newState.channel?.id}>`;
  } else {
    return; // No significant change
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`🎙️ VOICE ${action}`)
    .setColor(color)
    .addFields(
      { name: 'User', value: `${member.user.tag}`, inline: true },
      { name: 'Details', value: details, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `User ID: ${member.id}` });
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// CHANNEL CREATED
// ============================================
async function channelCreated(channel, client) {
  if (!channel.guild) return;
  
  const logChannel = await getLogChannel(channel.guild, client, 'channel-logs');
  if (!logChannel) return;
  
  let creator = 'Unknown';
  try {
    const auditLogs = await channel.guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelCreate,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === channel.id) {
      creator = log.executor.tag;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('📁 CHANNEL CREATED')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Name', value: channel.name, inline: true },
      { name: 'Type', value: channel.type.toString(), inline: true },
      { name: 'Created By', value: creator, inline: true },
      { name: 'Category', value: channel.parent?.name || 'None', inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `Channel ID: ${channel.id}` });
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// CHANNEL DELETED
// ============================================
async function channelDeleted(channel, client) {
  if (!channel.guild) return;
  
  const logChannel = await getLogChannel(channel.guild, client, 'channel-logs');
  if (!logChannel) return;
  
  let deletedBy = 'Unknown';
  try {
    const auditLogs = await channel.guild.fetchAuditLogs({
      type: AuditLogEvent.ChannelDelete,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === channel.id) {
      deletedBy = log.executor.tag;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('📁 CHANNEL DELETED')
    .setColor(0xFF0000)
    .addFields(
      { name: 'Name', value: channel.name, inline: true },
      { name: 'Type', value: channel.type.toString(), inline: true },
      { name: 'Deleted By', value: deletedBy, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `Channel ID: ${channel.id}` });
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// ROLE CREATED
// ============================================
async function roleCreated(role, client) {
  const logChannel = await getLogChannel(role.guild, client, 'role-changes');
  if (!logChannel) return;
  
  let creator = 'Unknown';
  try {
    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleCreate,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === role.id) {
      creator = log.executor.tag;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('🏷️ ROLE CREATED')
    .setColor(role.color || 0x00FF00)
    .addFields(
      { name: 'Name', value: role.name, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'Created By', value: creator, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `Role ID: ${role.id}` });
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// ROLE DELETED
// ============================================
async function roleDeleted(role, client) {
  const logChannel = await getLogChannel(role.guild, client, 'role-changes');
  if (!logChannel) return;
  
  let deletedBy = 'Unknown';
  try {
    const auditLogs = await role.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleDelete,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === role.id) {
      deletedBy = log.executor.tag;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('🏷️ ROLE DELETED')
    .setColor(0xFF0000)
    .addFields(
      { name: 'Name', value: role.name, inline: true },
      { name: 'Deleted By', value: deletedBy, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `Role ID: ${role.id}` });
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// INVITE CREATED
// ============================================
async function inviteCreated(invite, client) {
  const logChannel = await getLogChannel(invite.guild, client, 'invite-logs');
  if (!logChannel) return;
  
  // Cache invite
  await client.db.query(`
    INSERT INTO invite_tracking (code, guild_id, inviter_id, uses)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (code) DO UPDATE SET uses = $4
  `, [invite.code, invite.guild.id, invite.inviter?.id, invite.uses]);
  
  const embed = new EmbedBuilder()
    .setTitle('🔗 INVITE CREATED')
    .setColor(0x00BFFF)
    .addFields(
      { name: 'Code', value: invite.code, inline: true },
      { name: 'Created By', value: invite.inviter?.tag || 'Unknown', inline: true },
      { name: 'Channel', value: `<#${invite.channel.id}>`, inline: true },
      { name: 'Max Uses', value: invite.maxUses?.toString() || 'Unlimited', inline: true },
      { name: 'Expires', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Never', inline: true }
    )
    .setTimestamp();
  
  await logChannel.send({ embeds: [embed] });
}

// ============================================
// EMOJI CREATED
// ============================================
async function emojiCreated(emoji, client) {
  const logChannel = await getLogChannel(emoji.guild, client, 'audit-log');
  if (!logChannel) return;
  
  let creator = 'Unknown';
  try {
    const auditLogs = await emoji.guild.fetchAuditLogs({
      type: AuditLogEvent.EmojiCreate,
      limit: 1
    });
    const log = auditLogs.entries.first();
    if (log && log.target.id === emoji.id) {
      creator = log.executor.tag;
    }
  } catch (e) {}
  
  const embed = new EmbedBuilder()
    .setTitle('😀 EMOJI ADDED')
    .setColor(0xFFD700)
    .setThumbnail(emoji.url)
    .addFields(
      { name: 'Name', value: `:${emoji.name}:`, inline: true },
      { name: 'Added By', value: creator, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: `Emoji ID: ${emoji.id}` });
  
  await logChannel.send({ embeds: [embed] });
}

module.exports = {
  messageDeleted,
  messageEdited,
  memberJoined,
  memberLeft,
  memberBanned,
  memberUnbanned,
  memberUpdated,
  voiceStateUpdate,
  channelCreated,
  channelDeleted,
  roleCreated,
  roleDeleted,
  inviteCreated,
  emojiCreated
};
