/**
 * COUNTING HANDLER
 * Manages the counting game with The #1 role
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// CHECK IF COUNTING CHANNEL
// ============================================
async function isCountingChannel(message, client) {
  return message.channel.name === 'counting';
}

// ============================================
// HANDLE COUNTING
// ============================================
async function handle(message, client) {
  const content = message.content.trim();
  const number = parseInt(content);
  
  // If not a number, delete and warn
  if (isNaN(number)) {
    try {
      await message.delete();
      const warning = await message.channel.send(`<@${message.author.id}> Numbers only. This isn't a chat room.`);
      setTimeout(() => warning.delete().catch(() => {}), 5000);
    } catch (e) {}
    return;
  }
  
  try {
    // Get current count
    const result = await client.db.query(
      'SELECT * FROM counting WHERE guild_id = $1',
      [message.guild.id]
    );
    
    let data = result.rows[0];
    if (!data) {
      // Initialize
      await client.db.query(`
        INSERT INTO counting (guild_id, current_count, record)
        VALUES ($1, 0, 0)
      `, [message.guild.id]);
      data = { current_count: 0, last_counter: null, record: 0 };
    }
    
    const expectedNumber = data.current_count + 1;
    const lastCounterId = data.last_counter;
    
    // Check if same person counting twice
    if (message.author.id === lastCounterId) {
      await resetCount(message, client, data, "You can't count twice in a row, genius. Back to 1.");
      return;
    }
    
    // Check if correct number
    if (number !== expectedNumber) {
      await resetCount(message, client, data, `Wrong number. Expected **${expectedNumber}**, got **${number}**. Back to 1.`);
      return;
    }
    
    // Correct! Update count
    const newCount = number;
    const newRecord = Math.max(newCount, data.record);
    
    await client.db.query(`
      UPDATE counting 
      SET current_count = $1, last_counter = $2, record = $3, last_message_id = $4
      WHERE guild_id = $5
    `, [newCount, message.author.id, newRecord, message.id, message.guild.id]);
    
    // Update The #1 role
    await updateTheOneRole(message, client);
    
    // React to confirm
    await message.react('✅');
    
    // Milestone messages
    if (newCount === 100) {
      message.channel.send("🎉 **100!** Not bad. Keep going.");
    } else if (newCount === 500) {
      message.channel.send("🎉 **500!** I'm actually impressed.");
    } else if (newCount === 1000) {
      message.channel.send("🎉 **1000!** Holy shit. You people have dedication.");
    } else if (newCount % 100 === 0 && newCount > 0) {
      // Every 100
      message.channel.send(`📊 Count: **${newCount}** | Record: **${newRecord}**`);
    }
    
    // New record
    if (newCount > data.record && newCount === newRecord) {
      message.channel.send(`🏆 **NEW RECORD: ${newRecord}!**`);
    }
    
  } catch (error) {
    console.error('Counting error:', error);
  }
}

// ============================================
// RESET COUNT
// ============================================
async function resetCount(message, client, data, reason) {
  try {
    // Reset to 0
    await client.db.query(`
      UPDATE counting 
      SET current_count = 0, last_counter = NULL
      WHERE guild_id = $1
    `, [message.guild.id]);
    
    // Remove The #1 role from everyone
    const theOneRole = message.guild.roles.cache.find(r => r.name === '🏆 The #1');
    if (theOneRole) {
      const members = theOneRole.members;
      for (const [id, member] of members) {
        await member.roles.remove(theOneRole).catch(() => {});
      }
    }
    
    // React with X
    await message.react('❌');
    
    // Send failure message
    const embed = new EmbedBuilder()
      .setTitle('💀 COUNT RESET')
      .setDescription(`**${message.author.tag}** ruined it.\n\n${reason}`)
      .addFields(
        { name: 'Got to', value: `${data.current_count}`, inline: true },
        { name: 'Record', value: `${data.record}`, inline: true }
      )
      .setColor(0xFF0000)
      .setTimestamp();
    
    message.channel.send({ embeds: [embed] });
    
  } catch (error) {
    console.error('Reset count error:', error);
  }
}

// ============================================
// UPDATE THE #1 ROLE
// ============================================
async function updateTheOneRole(message, client) {
  try {
    const theOneRole = message.guild.roles.cache.find(r => r.name === '🏆 The #1');
    if (!theOneRole) return;
    
    // Remove from everyone else
    const currentHolders = theOneRole.members;
    for (const [id, member] of currentHolders) {
      if (id !== message.author.id) {
        await member.roles.remove(theOneRole).catch(() => {});
      }
    }
    
    // Add to current counter
    const member = message.guild.members.cache.get(message.author.id);
    if (member && !member.roles.cache.has(theOneRole.id)) {
      await member.roles.add(theOneRole);
    }
    
  } catch (error) {
    console.error('Update The #1 role error:', error);
  }
}

// ============================================
// GET RECORD
// ============================================
async function getRecord(message, client) {
  try {
    const result = await client.db.query(
      'SELECT * FROM counting WHERE guild_id = $1',
      [message.guild.id]
    );
    
    if (!result.rows[0]) {
      return message.reply("No counting data yet. Go count something.");
    }
    
    const data = result.rows[0];
    
    const embed = new EmbedBuilder()
      .setTitle('🔢 Counting Stats')
      .addFields(
        { name: 'Current Count', value: `${data.current_count}`, inline: true },
        { name: 'Record', value: `${data.record}`, inline: true }
      )
      .setColor(0x00FF00);
    
    message.reply({ embeds: [embed] });
    
  } catch (error) {
    message.reply("Couldn't fetch counting stats.");
  }
}

module.exports = {
  isCountingChannel,
  handle,
  getRecord
};
