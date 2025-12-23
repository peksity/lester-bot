/**
 * MODERATION HANDLER
 * All moderation commands with full functionality
 */

const { 
  EmbedBuilder, 
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

// ============================================
// PERMISSION CHECK
// ============================================
function hasModPermission(member) {
  return member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
         member.permissions.has(PermissionFlagsBits.KickMembers) ||
         member.permissions.has(PermissionFlagsBits.BanMembers) ||
         member.permissions.has(PermissionFlagsBits.Administrator);
}

function hasAdminPermission(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

// ============================================
// LOG TO CHANNEL
// ============================================
async function logAction(guild, client, embedData) {
  try {
    const config = await client.db.query('SELECT log_channels FROM server_config WHERE guild_id = $1', [guild.id]);
    if (!config.rows[0]) return;
    
    const logChannels = config.rows[0].log_channels;
    const modActionsId = logChannels['mod-actions'];
    
    if (!modActionsId) return;
    
    const channel = guild.channels.cache.get(modActionsId);
    if (!channel) return;
    
    const embed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setDescription(embedData.description)
      .setColor(embedData.color)
      .setTimestamp()
      .setFooter({ text: `ID: ${embedData.targetId || 'N/A'}` });
    
    if (embedData.fields) {
      embed.addFields(embedData.fields);
    }
    
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

// ============================================
// KICK
// ============================================
async function kick(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission. Nice try though.");
  }
  
  const target = message.mentions.members.first();
  if (!target) {
    return message.reply("Mention someone to kick. I can't read minds... yet.");
  }
  
  if (!target.kickable) {
    return message.reply("Can't kick them. They're either above me or the owner.");
  }
  
  if (target.id === message.author.id) {
    return message.reply("You want to kick yourself? Just leave. It's easier.");
  }
  
  const reason = args.slice(1).join(' ') || 'No reason provided';
  
  try {
    // DM the user
    try {
      await target.send(`You've been kicked from **${message.guild.name}**.\nReason: ${reason}\n\n*Don't say I didn't warn you.*`);
    } catch (e) {
      // Can't DM, continue anyway
    }
    
    await target.kick(reason);
    
    const embed = new EmbedBuilder()
      .setTitle('👢 User Kicked')
      .setDescription(`**${target.user.tag}** has been kicked.`)
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
      .setColor(0xFFA500)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    // Log to database
    await client.db.query(`
      INSERT INTO mod_actions (guild_id, action_type, target_id, moderator_id, reason)
      VALUES ($1, 'kick', $2, $3, $4)
    `, [message.guild.id, target.id, message.author.id, reason]);
    
    // Log to channel
    await logAction(message.guild, client, {
      title: '👢 KICK',
      description: `**User:** ${target.user.tag}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
      color: 0xFFA500,
      targetId: target.id
    });
    
  } catch (error) {
    console.error('Kick error:', error);
    message.reply("Something went wrong. Even I make mistakes sometimes.");
  }
}

// ============================================
// BAN
// ============================================
async function ban(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission. Nice try though.");
  }
  
  const target = message.mentions.members.first() || message.mentions.users.first();
  if (!target) {
    return message.reply("Mention someone to ban. Be specific.");
  }
  
  const targetMember = message.guild.members.cache.get(target.id);
  if (targetMember && !targetMember.bannable) {
    return message.reply("Can't ban them. They're either above me or the owner.");
  }
  
  if (target.id === message.author.id) {
    return message.reply("Banning yourself? That's a new level of self-hatred.");
  }
  
  const reason = args.slice(1).join(' ') || 'No reason provided';
  
  try {
    // DM the user
    try {
      const user = target.user || target;
      await user.send(`You've been banned from **${message.guild.name}**.\nReason: ${reason}\n\n*Permanently. Don't come back.*`);
    } catch (e) {
      // Can't DM, continue anyway
    }
    
    await message.guild.members.ban(target.id || target, { reason, deleteMessageDays: 1 });
    
    const user = target.user || target;
    const embed = new EmbedBuilder()
      .setTitle('🔨 User Banned')
      .setDescription(`**${user.tag}** has been banned.`)
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
      .setColor(0xFF0000)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    // Log to database
    await client.db.query(`
      INSERT INTO mod_actions (guild_id, action_type, target_id, moderator_id, reason, duration)
      VALUES ($1, 'ban', $2, $3, $4, 'permanent')
    `, [message.guild.id, target.id, message.author.id, reason]);
    
    // Log to channel
    await logAction(message.guild, client, {
      title: '🔨 BAN',
      description: `**User:** ${user.tag}\n**ID:** ${target.id}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**Duration:** Permanent`,
      color: 0xFF0000,
      targetId: target.id
    });
    
  } catch (error) {
    console.error('Ban error:', error);
    message.reply("Something went wrong. Check if the user ID is valid.");
  }
}

// ============================================
// UNBAN
// ============================================
async function unban(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const userId = args[0];
  if (!userId) {
    return message.reply("Give me a user ID to unban. ?unban <userID>");
  }
  
  try {
    const banList = await message.guild.bans.fetch();
    const bannedUser = banList.get(userId);
    
    if (!bannedUser) {
      return message.reply("That user isn't banned. Check the ID.");
    }
    
    await message.guild.members.unban(userId);
    
    const embed = new EmbedBuilder()
      .setTitle('✅ User Unbanned')
      .setDescription(`**${bannedUser.user.tag}** has been unbanned.`)
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setColor(0x00FF00)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    // Log
    await logAction(message.guild, client, {
      title: '✅ UNBAN',
      description: `**User:** ${bannedUser.user.tag}\n**ID:** ${userId}\n**Moderator:** ${message.author.tag}`,
      color: 0x00FF00,
      targetId: userId
    });
    
  } catch (error) {
    console.error('Unban error:', error);
    message.reply("Invalid user ID or something went wrong.");
  }
}

// ============================================
// TIMEOUT
// ============================================
async function timeout(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const target = message.mentions.members.first();
  if (!target) {
    return message.reply("?timeout @user <duration> [reason]\nExample: ?timeout @user 10m Being annoying");
  }
  
  if (!target.moderatable) {
    return message.reply("Can't timeout that user. They're above me.");
  }
  
  const durationStr = args[1];
  if (!durationStr) {
    return message.reply("Specify a duration: 10s, 5m, 1h, 1d");
  }
  
  const duration = parseDuration(durationStr);
  if (!duration || duration > 2419200000) { // Max 28 days
    return message.reply("Invalid duration. Max is 28d. Use format: 10s, 5m, 1h, 1d");
  }
  
  const reason = args.slice(2).join(' ') || 'No reason provided';
  
  try {
    await target.timeout(duration, reason);
    
    const embed = new EmbedBuilder()
      .setTitle('⏱️ User Timed Out')
      .setDescription(`**${target.user.tag}** has been timed out.`)
      .addFields(
        { name: 'Duration', value: durationStr, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setColor(0xFFA500)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    // Log
    await client.db.query(`
      INSERT INTO mod_actions (guild_id, action_type, target_id, moderator_id, reason, duration)
      VALUES ($1, 'timeout', $2, $3, $4, $5)
    `, [message.guild.id, target.id, message.author.id, reason, durationStr]);
    
    await logAction(message.guild, client, {
      title: '⏱️ TIMEOUT',
      description: `**User:** ${target.user.tag}\n**Duration:** ${durationStr}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
      color: 0xFFA500,
      targetId: target.id
    });
    
  } catch (error) {
    console.error('Timeout error:', error);
    message.reply("Something went wrong with the timeout.");
  }
}

// ============================================
// MUTE (Role-based)
// ============================================
async function mute(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const target = message.mentions.members.first();
  if (!target) {
    return message.reply("?mute @user [reason]");
  }
  
  const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
  if (!mutedRole) {
    return message.reply("Muted role doesn't exist. Run ?setup first.");
  }
  
  if (target.roles.cache.has(mutedRole.id)) {
    return message.reply("They're already muted.");
  }
  
  const reason = args.slice(1).join(' ') || 'No reason provided';
  
  try {
    await target.roles.add(mutedRole, reason);
    
    const embed = new EmbedBuilder()
      .setTitle('🔇 User Muted')
      .setDescription(`**${target.user.tag}** has been muted.`)
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Reason', value: reason, inline: true }
      )
      .setColor(0x808080)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    await logAction(message.guild, client, {
      title: '🔇 MUTE',
      description: `**User:** ${target.user.tag}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
      color: 0x808080,
      targetId: target.id
    });
    
  } catch (error) {
    console.error('Mute error:', error);
    message.reply("Couldn't mute them. Check my permissions.");
  }
}

// ============================================
// UNMUTE
// ============================================
async function unmute(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const target = message.mentions.members.first();
  if (!target) {
    return message.reply("?unmute @user");
  }
  
  const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
  if (!mutedRole) {
    return message.reply("Muted role doesn't exist.");
  }
  
  if (!target.roles.cache.has(mutedRole.id)) {
    return message.reply("They're not muted.");
  }
  
  try {
    await target.roles.remove(mutedRole);
    
    // Also remove timeout if any
    if (target.communicationDisabledUntilTimestamp) {
      await target.timeout(null);
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🔊 User Unmuted')
      .setDescription(`**${target.user.tag}** has been unmuted.`)
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setColor(0x00FF00)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    await logAction(message.guild, client, {
      title: '🔊 UNMUTE',
      description: `**User:** ${target.user.tag}\n**Moderator:** ${message.author.tag}`,
      color: 0x00FF00,
      targetId: target.id
    });
    
  } catch (error) {
    console.error('Unmute error:', error);
    message.reply("Couldn't unmute them.");
  }
}

// ============================================
// WARN
// ============================================
async function warn(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const target = message.mentions.members.first();
  if (!target) {
    return message.reply("?warn @user <reason>");
  }
  
  const reason = args.slice(1).join(' ');
  if (!reason) {
    return message.reply("You need to provide a reason for the warning.");
  }
  
  try {
    // Add warning to database
    await client.db.query(`
      INSERT INTO warnings (user_id, guild_id, moderator_id, reason)
      VALUES ($1, $2, $3, $4)
    `, [target.id, message.guild.id, message.author.id, reason]);
    
    // Get warning count
    const result = await client.db.query(`
      SELECT COUNT(*) FROM warnings WHERE user_id = $1 AND guild_id = $2
    `, [target.id, message.guild.id]);
    
    const warnCount = parseInt(result.rows[0].count);
    
    // DM the user
    try {
      await target.send(`⚠️ You've been warned in **${message.guild.name}**\nReason: ${reason}\n\nThis is warning #${warnCount}. Don't push your luck.`);
    } catch (e) {
      // Can't DM
    }
    
    const embed = new EmbedBuilder()
      .setTitle('⚠️ Warning Issued')
      .setDescription(`**${target.user.tag}** has been warned.`)
      .addFields(
        { name: 'Reason', value: reason, inline: false },
        { name: 'Warning Count', value: `${warnCount}`, inline: true },
        { name: 'Moderator', value: message.author.tag, inline: true }
      )
      .setColor(0xFFFF00)
      .setTimestamp();
    
    message.reply({ embeds: [embed] });
    
    await logAction(message.guild, client, {
      title: '⚠️ WARNING',
      description: `**User:** ${target.user.tag}\n**Reason:** ${reason}\n**Warning #:** ${warnCount}\n**Moderator:** ${message.author.tag}`,
      color: 0xFFFF00,
      targetId: target.id
    });
    
    // Auto-action based on warning count
    if (warnCount >= 3) {
      await message.channel.send(`⚠️ **${target.user.tag}** has ${warnCount} warnings. Consider further action.`);
    }
    
  } catch (error) {
    console.error('Warn error:', error);
    message.reply("Couldn't issue warning.");
  }
}

// ============================================
// WARNINGS (View)
// ============================================
async function warnings(message, args, client) {
  const target = message.mentions.members.first() || message.member;
  
  try {
    const result = await client.db.query(`
      SELECT * FROM warnings WHERE user_id = $1 AND guild_id = $2 ORDER BY timestamp DESC
    `, [target.id, message.guild.id]);
    
    if (result.rows.length === 0) {
      return message.reply(`**${target.user.tag}** has no warnings. Clean record... for now.`);
    }
    
    const warningList = result.rows.slice(0, 10).map((w, i) => 
      `**${i + 1}.** ${w.reason}\n   <t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R> by <@${w.moderator_id}>`
    ).join('\n\n');
    
    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings for ${target.user.tag}`)
      .setDescription(warningList)
      .setColor(0xFFFF00)
      .setFooter({ text: `Total: ${result.rows.length} warnings` });
    
    message.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Warnings error:', error);
    message.reply("Couldn't fetch warnings.");
  }
}

// ============================================
// CLEAR WARNINGS
// ============================================
async function clearWarnings(message, args, client) {
  if (!hasAdminPermission(message.member)) {
    return message.reply("Only admins can clear warnings.");
  }
  
  const target = message.mentions.members.first();
  if (!target) {
    return message.reply("?clearwarnings @user");
  }
  
  try {
    await client.db.query(`
      DELETE FROM warnings WHERE user_id = $1 AND guild_id = $2
    `, [target.id, message.guild.id]);
    
    message.reply(`✅ Cleared all warnings for **${target.user.tag}**. Fresh start.`);
    
    await logAction(message.guild, client, {
      title: '🧹 WARNINGS CLEARED',
      description: `**User:** ${target.user.tag}\n**Cleared by:** ${message.author.tag}`,
      color: 0x00FF00,
      targetId: target.id
    });
    
  } catch (error) {
    console.error('Clear warnings error:', error);
    message.reply("Couldn't clear warnings.");
  }
}

// ============================================
// PURGE
// ============================================
async function purge(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const amount = parseInt(args[0]);
  if (!amount || amount < 1 || amount > 100) {
    return message.reply("?purge <1-100>");
  }
  
  try {
    // Delete the command message first
    await message.delete().catch(() => {});
    
    // Bulk delete
    const deleted = await message.channel.bulkDelete(amount, true);
    
    const confirmMsg = await message.channel.send(`🗑️ Deleted ${deleted.size} messages.`);
    
    // Auto-delete confirmation
    setTimeout(() => confirmMsg.delete().catch(() => {}), 3000);
    
    await logAction(message.guild, client, {
      title: '🗑️ PURGE',
      description: `**Channel:** ${message.channel.name}\n**Amount:** ${deleted.size} messages\n**Moderator:** ${message.author.tag}`,
      color: 0x808080,
      targetId: message.channel.id
    });
    
  } catch (error) {
    console.error('Purge error:', error);
    message.reply("Couldn't purge. Messages older than 14 days can't be bulk deleted.");
  }
}

// ============================================
// SLOWMODE
// ============================================
async function slowmode(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  const seconds = parseInt(args[0]);
  if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
    return message.reply("?slowmode <0-21600 seconds>\n0 = off, max = 6 hours");
  }
  
  try {
    await message.channel.setRateLimitPerUser(seconds);
    
    if (seconds === 0) {
      message.reply("Slowmode disabled.");
    } else {
      message.reply(`Slowmode set to ${seconds} seconds.`);
    }
    
    await logAction(message.guild, client, {
      title: '🐌 SLOWMODE',
      description: `**Channel:** ${message.channel.name}\n**Duration:** ${seconds}s\n**Moderator:** ${message.author.tag}`,
      color: 0x00CED1,
      targetId: message.channel.id
    });
    
  } catch (error) {
    console.error('Slowmode error:', error);
    message.reply("Couldn't set slowmode.");
  }
}

// ============================================
// LOCK CHANNEL
// ============================================
async function lock(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  try {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });
    
    const embed = new EmbedBuilder()
      .setTitle('🔒 Channel Locked')
      .setDescription('This channel has been locked by staff.')
      .setColor(0xFF0000)
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
    
    await logAction(message.guild, client, {
      title: '🔒 CHANNEL LOCKED',
      description: `**Channel:** ${message.channel.name}\n**Moderator:** ${message.author.tag}`,
      color: 0xFF0000,
      targetId: message.channel.id
    });
    
  } catch (error) {
    console.error('Lock error:', error);
    message.reply("Couldn't lock channel.");
  }
}

// ============================================
// UNLOCK CHANNEL
// ============================================
async function unlock(message, args, client) {
  if (!hasModPermission(message.member)) {
    return message.reply("You don't have permission.");
  }
  
  try {
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null
    });
    
    const embed = new EmbedBuilder()
      .setTitle('🔓 Channel Unlocked')
      .setDescription('This channel has been unlocked.')
      .setColor(0x00FF00)
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
    
    await logAction(message.guild, client, {
      title: '🔓 CHANNEL UNLOCKED',
      description: `**Channel:** ${message.channel.name}\n**Moderator:** ${message.author.tag}`,
      color: 0x00FF00,
      targetId: message.channel.id
    });
    
  } catch (error) {
    console.error('Unlock error:', error);
    message.reply("Couldn't unlock channel.");
  }
}

// ============================================
// NUKE CHANNEL
// ============================================
async function nuke(message, args, client) {
  if (!hasAdminPermission(message.member)) {
    return message.reply("Only admins can nuke channels. This is serious business.");
  }
  
  try {
    const channel = message.channel;
    const position = channel.position;
    const parent = channel.parent;
    
    // Clone the channel
    const newChannel = await channel.clone({
      reason: `Nuked by ${message.author.tag}`
    });
    
    // Set position
    await newChannel.setPosition(position);
    
    // Delete old channel
    await channel.delete();
    
    const embed = new EmbedBuilder()
      .setTitle('💥 Channel Nuked')
      .setDescription('This channel has been reset.')
      .setColor(0xFF4500)
      .setImage('https://media.giphy.com/media/XUFPGrX5Zis6Y/giphy.gif')
      .setTimestamp()
      .setFooter({ text: `Nuked by ${message.author.tag}` });
    
    newChannel.send({ embeds: [embed] });
    
  } catch (error) {
    console.error('Nuke error:', error);
    message.reply("Nuke failed. Check my permissions.");
  }
}

// ============================================
// HELPER: Parse Duration
// ============================================
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  
  const num = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

module.exports = {
  kick,
  ban,
  unban,
  timeout,
  mute,
  unmute,
  warn,
  warnings,
  clearWarnings,
  purge,
  slowmode,
  lock,
  unlock,
  nuke
};
