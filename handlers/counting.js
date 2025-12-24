/**
 * COUNTING HANDLER - FIXED
 * Manages the counting game with The #1 role
 * Tug-of-war style - whoever has the last valid count holds The #1!
 */

const { EmbedBuilder } = require('discord.js');

// Hardcoded role ID for The #1
const THE_ONE_ROLE_ID = '1453304639578443940';

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
    // Ensure table exists
    await client.db.query(`
      CREATE TABLE IF NOT EXISTS counting (
        guild_id TEXT PRIMARY KEY,
        current_count INTEGER DEFAULT 0,
        last_counter TEXT,
        record INTEGER DEFAULT 0,
        last_message_id TEXT
      )
    `);
    
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
    
    // Update The #1 role - TUG OF WAR! Whoever counted last gets it!
    await updateTheOneRole(message, client);
    
    // React with green checkmark to confirm
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
    
    // New record notification
    if (newCount > data.record && newCount === newRecord && newCount > 10) {
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
    let counterRole = message.guild.roles.cache.get(THE_ONE_ROLE_ID);
    if (!counterRole) {
      counterRole = message.guild.roles.cache.find(r => r.name === '🏆 The #1');
    }
    if (counterRole) {
      const members = counterRole.members;
      for (const [id, member] of members) {
        await member.roles.remove(counterRole).catch(() => {});
      }
    }
    
    // React with X
    await message.react('❌');
    
    // Send failure message
    const embed = new EmbedBuilder()
      .setTitle('💀 COUNT RESET')
      .setDescription(`**${message.author.username}** ruined it.\n\n${reason}`)
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
// UPDATE THE #1 ROLE - TUG OF WAR STYLE
// ============================================
async function updateTheOneRole(message, client) {
  try {
    // Try role ID first, then fall back to name search
    let counterRole = message.guild.roles.cache.get(THE_ONE_ROLE_ID);
    if (!counterRole) {
      counterRole = message.guild.roles.cache.find(r => r.name === '🏆 The #1');
    }
    
    if (!counterRole) {
      console.log('[COUNTING] Could not find 🏆 The #1 role (ID:', THE_ONE_ROLE_ID, ')');
      return;
    }
    
    // Remove from everyone else first
    const currentHolders = counterRole.members;
    for (const [id, member] of currentHolders) {
      if (id !== message.author.id) {
        await member.roles.remove(counterRole).catch(() => {});
      }
    }
    
    // Add to current counter (the person who just counted)
    const member = message.guild.members.cache.get(message.author.id);
    if (member && !member.roles.cache.has(counterRole.id)) {
      await member.roles.add(counterRole);
      console.log(`[COUNTING] ${member.user.username} is now The #1`);
    }
    
  } catch (error) {
    console.error('Update Counter role error:', error);
  }
}

// ============================================
// GET RECORD
// ============================================
async function getRecord(message, client) {
  try {
    // Ensure table exists
    await client.db.query(`
      CREATE TABLE IF NOT EXISTS counting (
        guild_id TEXT PRIMARY KEY,
        current_count INTEGER DEFAULT 0,
        last_counter TEXT,
        record INTEGER DEFAULT 0,
        last_message_id TEXT
      )
    `);
    
    const result = await client.db.query(
      'SELECT * FROM counting WHERE guild_id = $1',
      [message.guild.id]
    );
    
    if (!result.rows[0]) {
      return message.reply("No counting data yet. Go count something.");
    }
    
    const data = result.rows[0];
    
    // Find current holder of The #1
    let counterRole = message.guild.roles.cache.get(THE_ONE_ROLE_ID);
    if (!counterRole) {
      counterRole = message.guild.roles.cache.find(r => r.name === '🏆 The #1');
    }
    let currentHolder = 'Nobody';
    if (counterRole && counterRole.members.size > 0) {
      const holder = counterRole.members.first();
      currentHolder = holder.user.username;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🔢 Counting Stats')
      .addFields(
        { name: 'Current Count', value: `${data.current_count}`, inline: true },
        { name: 'Record', value: `${data.record}`, inline: true },
        { name: '🏆 The #1', value: currentHolder, inline: true }
      )
      .setColor(0x00FF00)
      .setFooter({ text: 'Keep counting to steal The #1 role!' });
    
    message.reply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Get record error:', error);
    message.reply("Couldn't fetch counting stats.");
  }
}

module.exports = {
  isCountingChannel,
  handle,
  getRecord
};
