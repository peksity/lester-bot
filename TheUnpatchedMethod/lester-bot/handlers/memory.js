/**
 * MEMORY HANDLER
 * Manages user memory and relationship data
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// SHOW MEMORY
// ============================================
async function showMemory(message, args, client) {
  const target = message.mentions.users.first() || message.author;
  
  // Only allow staff to view others' memory
  if (target.id !== message.author.id && !message.member.permissions.has('ModerateMembers')) {
    return message.reply("You can only view your own memory. Staff can view others.");
  }
  
  try {
    const profile = await client.db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1 AND guild_id = $2',
      [target.id, message.guild.id]
    );
    
    if (!profile.rows[0]) {
      return message.reply(`I don't have any memory of ${target.id === message.author.id ? 'you' : 'them'} yet.`);
    }
    
    const data = profile.rows[0];
    
    // Get recent conversations
    const conversations = await client.db.query(`
      SELECT * FROM conversation_memory 
      WHERE user_id = $1 AND guild_id = $2 AND bot_name = 'lester'
      ORDER BY timestamp DESC LIMIT 5
    `, [target.id, message.guild.id]);
    
    // Get memories/events
    const memories = await client.db.query(`
      SELECT * FROM user_memories
      WHERE user_id = $1 AND guild_id = $2
      ORDER BY timestamp DESC LIMIT 5
    `, [target.id, message.guild.id]);
    
    // Determine relationship status
    let status = 'Neutral';
    if (data.lester_trust <= -50) status = '😠 I have serious issues with them';
    else if (data.lester_trust <= -20) status = '😒 They\'ve pissed me off';
    else if (data.lester_trust <= 0) status = '😐 Don\'t know them well';
    else if (data.lester_trust <= 30) status = '🙂 They\'re alright';
    else if (data.lester_trust <= 60) status = '😊 I respect them';
    else status = '💚 One of the good ones';
    
    const embed = new EmbedBuilder()
      .setTitle(`🧠 Lester's Memory: ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(data.lester_trust > 0 ? 0x00FF00 : data.lester_trust < 0 ? 0xFF0000 : 0x808080)
      .addFields(
        { name: 'Relationship', value: status, inline: false },
        { name: 'Trust Level', value: `${data.lester_trust}/100`, inline: true },
        { name: 'Respect', value: `${data.lester_respect}/100`, inline: true },
        { name: 'Total Messages', value: `${data.total_messages}`, inline: true },
        { name: 'Times Insulted Me', value: `${data.times_insulted}`, inline: true },
        { name: 'Times Apologized', value: `${data.times_apologized}`, inline: true },
        { name: 'Times Thanked Me', value: `${data.times_thanked}`, inline: true }
      )
      .setFooter({ text: `First met: ${new Date(data.first_interaction).toLocaleDateString()}` });
    
    // Add recent topics if any
    if (conversations.rows.length > 0) {
      const topics = conversations.rows.map(c => 
        `• "${c.user_message.substring(0, 50)}..."`
      ).join('\n');
      embed.addFields({ name: 'Recent Topics', value: topics, inline: false });
    }
    
    message.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Show memory error:', error);
    message.reply("Couldn't retrieve memory data.");
  }
}

// ============================================
// FORGET USER
// ============================================
async function forgetUser(message, client) {
  try {
    // Only forget yourself unless admin
    const targetId = message.author.id;
    
    // Delete profile
    await client.db.query('DELETE FROM user_profiles WHERE user_id = $1 AND guild_id = $2', [targetId, message.guild.id]);
    
    // Delete conversation memory
    await client.db.query('DELETE FROM conversation_memory WHERE user_id = $1 AND guild_id = $2', [targetId, message.guild.id]);
    
    // Delete memories
    await client.db.query('DELETE FROM user_memories WHERE user_id = $1 AND guild_id = $2', [targetId, message.guild.id]);
    
    message.reply("Fine. I've forgotten everything about you. We're strangers now. Happy?");
    
  } catch (error) {
    console.error('Forget user error:', error);
    message.reply("Couldn't erase memory. Ironic, isn't it?");
  }
}

// ============================================
// ADD MEMORY
// ============================================
async function addMemory(userId, guildId, memoryType, description, client) {
  try {
    await client.db.query(`
      INSERT INTO user_memories (user_id, guild_id, memory_type, description)
      VALUES ($1, $2, $3, $4)
    `, [userId, guildId, memoryType, description]);
  } catch (error) {
    console.error('Add memory error:', error);
  }
}

// ============================================
// GET USER RELATIONSHIP
// ============================================
async function getRelationship(userId, guildId, client) {
  try {
    const result = await client.db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1 AND guild_id = $2',
      [userId, guildId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  showMemory,
  forgetUser,
  addMemory,
  getRelationship
};
