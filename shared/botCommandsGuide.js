/**
 * BOT COMMANDS GUIDE - GTA 6 THEMED EMBEDS
 * Posts a beautiful multi-embed guide to #bot-commands
 * 
 * Usage: ?postguide (admin only)
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// GTA 6 Color Palette
const COLORS = {
  pink: 0xFF0080,      // Hot pink
  orange: 0xFF6B35,    // Sunset orange
  teal: 0x00D4AA,      // Vice teal
  purple: 0x8B5CF6,    // Neon purple
  blue: 0x0099FF,      // Ocean blue
  gold: 0xFFD700,      // Gold
  red: 0xFF3333,       // Red
  darkPink: 0xC71585,  // Deep pink
};

async function postBotCommandsGuide(channel) {
  const embeds = [];

  // ═══════════════════════════════════════════════════════════════
  // HEADER EMBED
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('```🤖 NEXUS AI-POWERED BOTS```')
    .setDescription(`
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

> **All 5 bots are powered by NEXUS AI**
> *They understand natural language.*

**Just talk naturally:**
\`\`\`
"anyone wanna do cayo?"  → Creates LFG
"need help with wagon"   → Creates LFG  
"where is nazar?"        → Shows location
\`\`\`

**🧠 Hive Mind Features:**
> ◆ Bots **remember** you across conversations
> ◆ They form **opinions** and relationships  
> ◆ **Mood** changes based on time & interactions
> ◆ They **talk to each other** naturally
> ◆ Only **one bot responds** at a time

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
    `)
    .setColor(COLORS.pink)
    .setImage('https://i.imgur.com/8QlbCGe.png') // You can add a custom banner image
  );

  // ═══════════════════════════════════════════════════════════════
  // LESTER
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🟡 Lester - The Mastermind')
    .setDescription(`
**Server Management & AI Moderation**
*He watches everything. Handles problems automatically.*

> 💬 **Chat:** #talk-to-lester
> 🛡️ **Moderation:** Fully automatic
    `)
    .addFields(
      { 
        name: '🔧 Utility', 
        value: '```\n?help     - Commands\n?ping     - Latency\n?mood     - His mood\n?rep @usr - Reputation```', 
        inline: true 
      },
      { 
        name: '📊 Info', 
        value: '```\n?serverinfo - Stats\n?userinfo   - User info\n?gunvan     - Gun Van\n?countrecord```', 
        inline: true 
      },
      { 
        name: '⚙️ Admin', 
        value: '```\n?setup - Server setup\n?nuke  - Reset server```', 
        inline: true 
      }
    )
    .setColor(COLORS.orange)
    .setThumbnail('https://i.imgur.com/LESTER_ICON.png') // Replace with actual icon
  );

  // ═══════════════════════════════════════════════════════════════
  // PAVEL
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🟡 Pavel - The Submarine Captain')
    .setDescription(`
**GTA Online Heist LFG**
*"Ah, Kapitan! Let us make some money, yes?"*

> 💬 **Chat:** #talk-to-pavel
> 📍 **LFG Channel:** #cayo-lfg
    `)
    .addFields(
      { 
        name: '🎯 ?cayo - Advanced Heist LFG', 
        value: '```diff\n+ Select GTA version (PS4/PS5)\n+ Enter PSN username\n+ Pick target (Pink Diamond, etc)\n+ Choose approach\n+ Toggle B2B mode\n+ Auto voice channel\n+ Private setup until recruiting```', 
        inline: false 
      },
      { 
        name: '🎮 Host Controls', 
        value: '> ◆ Kick players\n> ◆ **Blacklist** - Block forever\n> ◆ Ready Up → **Complete**\n> ◆ Auto voice in GTA category', 
        inline: true 
      },
      { 
        name: '💬 Natural Language', 
        value: '> *"anyone wanna do cayo?"*\n> *"need 2 for heist"*\n> Pavel understands!', 
        inline: true 
      }
    )
    .setColor(COLORS.teal)
  );

  // ═══════════════════════════════════════════════════════════════
  // CRIPPS
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🟡 Cripps - The Trader')
    .setDescription(`
**Red Dead Online Wagon LFG**
*"Did I ever tell you about the time I... never mind."*

> 💬 **Chat:** #talk-to-cripps
> 📍 **LFG Channel:** #wagon-lfg
    `)
    .addFields(
      { 
        name: '🛒 ?wagon - Advanced Wagon LFG', 
        value: '```diff\n+ Select console (PS4/PS5)\n+ Enter PSN username\n+ Delivery type (Local/Long)\n+ Set wagon count\n+ Auto voice channel\n+ Private setup until recruiting```', 
        inline: false 
      },
      { 
        name: '🎮 Host Controls', 
        value: '> ◆ Kick players\n> ◆ **Blacklist** - Block forever\n> ◆ Ready Up → **Complete**\n> ◆ Auto voice in Red Dead category', 
        inline: true 
      },
      { 
        name: '💬 Natural Language', 
        value: '> *"need help with wagon"*\n> *"long distance anyone?"*\n> Cripps understands!', 
        inline: true 
      }
    )
    .setColor(COLORS.gold)
  );

  // ═══════════════════════════════════════════════════════════════
  // POLICE CHIEF
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🟡 Police Chief - The Lawman')
    .setDescription(`
**Red Dead Online Bounty LFG**
*"Justice doesn't sleep. Neither do I."*

> 💬 **Chat:** #talk-to-chief
> 📍 **LFG Channel:** #bounty-lfg
    `)
    .addFields(
      { 
        name: '💀 ?bounty - Advanced Bounty LFG', 
        value: '```diff\n+ Select console (PS4/PS5)\n+ Enter PSN username\n+ Bounty type (Regular/Legendary)\n+ Pick target (Etta Doyle, etc)\n+ Strategy (Speed/Timer)\n+ Auto voice channel\n+ Private setup until recruiting```', 
        inline: false 
      },
      { 
        name: '🎮 Host Controls', 
        value: '> ◆ Kick players\n> ◆ **Blacklist** - Block forever\n> ◆ Ready Up → **Complete**\n> ◆ Auto voice in Red Dead category', 
        inline: true 
      },
      { 
        name: '💬 Natural Language', 
        value: '> *"etta doyle?"*\n> *"legendary bounty anyone?"*\n> Chief understands!', 
        inline: true 
      }
    )
    .setColor(COLORS.red)
  );

  // ═══════════════════════════════════════════════════════════════
  // MADAM NAZAR
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🟡 Madam Nazar - The Mystic')
    .setDescription(`
**Collector & Fortune Teller**
*"The spirits have much to tell..."*

> 💬 **Chat:** #talk-to-nazar
    `)
    .addFields(
      { 
        name: '🔮 Fortune Telling', 
        value: '```\n?fortune  - Get a prediction\n?reading  - Tarot reading```', 
        inline: true 
      },
      { 
        name: '📍 Location', 
        value: '```\n?location - Find Nazar today\n?where    - Same as above```', 
        inline: true 
      }
    )
    .setFooter({ text: '✨ She remembers her predictions and may bring them up later...' })
    .setColor(COLORS.purple)
  );

  // ═══════════════════════════════════════════════════════════════
  // BLACKLIST SYSTEM
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🚫 LFG Blacklist System')
    .setDescription(`
**Block toxic players from YOUR sessions permanently.**

\`\`\`
HOW IT WORKS:
1. Kick someone from your LFG
2. Bot asks: "Blacklist them?"  
3. Confirm → They can NEVER join your LFGs again
\`\`\`
    `)
    .addFields(
      { 
        name: '📋 Commands (any LFG channel)', 
        value: '```\n?myblacklist  - View your blacklist\n?unblock @usr - Remove from blacklist```', 
        inline: false 
      },
      { 
        name: '✨ Features', 
        value: '> ◆ Works across **ALL** LFG types\n> ◆ Blacklisted users get notified\n> ◆ Persists forever until you unblock\n> ◆ Voice auto-deletes on Complete/Cancel\n> ◆ Cayo → GTA category\n> ◆ Wagon/Bounty → Red Dead category', 
        inline: false 
      }
    )
    .setColor(COLORS.darkPink)
  );

  // ═══════════════════════════════════════════════════════════════
  // REPUTATION SYSTEM
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('⭐ Reputation System')
    .setDescription(`
**Every user has a reputation score (0-100) that bots remember.**
    `)
    .addFields(
      { 
        name: '📈 Gain Rep', 
        value: '```diff\n+ Complete LFG  (+5)\n+ Host LFG      (+3)\n+ Join LFG      (+1)```', 
        inline: true 
      },
      { 
        name: '📉 Lose Rep', 
        value: '```diff\n- Abandon LFG   (-15)\n- No-show       (-20)\n- Get kicked    (-10)```', 
        inline: true 
      },
      { 
        name: '🎭 Rep Affects', 
        value: '> ◆ How bots treat you\n> ◆ Whether hosts trust you\n> ◆ Bot response tone', 
        inline: false 
      }
    )
    .setFooter({ text: 'Check with: ?rep or ?rep @user' })
    .setColor(COLORS.gold)
  );

  // ═══════════════════════════════════════════════════════════════
  // BOT PERSONALITIES
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🧠 Bot Personalities')
    .setDescription(`
**The bots have REAL personalities powered by AI**

> 🟡 **Lester** - Snarky genius, easily annoyed, secretly helpful
> 🟡 **Pavel** - Cheerful captain, loves heists, loyal friend  
> 🟡 **Cripps** - Grumpy old-timer, mysterious past, endless stories
> 🟡 **Chief** - Stern lawman, suspicious of everyone
> 🟡 **Nazar** - Mystical fortune teller, cryptic but warm

**They will:**
\`\`\`
◆ Remember your conversations
◆ Form opinions about you
◆ Have good and bad moods
◆ Talk to each other
◆ Hold grudges if you're rude
\`\`\`
    `)
    .setColor(COLORS.blue)
  );

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setDescription(`
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

\`\`\`
        📊 FEATURE COUNT: 285+
     Every decision powered by AI
\`\`\`

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
    `)
    .setColor(COLORS.pink)
    .setTimestamp()
    .setFooter({ text: 'The Unpatched Method • NEXUS AI' })
  );

  // Post all embeds (Discord allows 10 per message)
  // Split into batches if needed
  try {
    // First batch (5 embeds)
    await channel.send({ embeds: embeds.slice(0, 5) });
    
    // Second batch (remaining embeds)
    if (embeds.length > 5) {
      await channel.send({ embeds: embeds.slice(5, 10) });
    }
    
    console.log('[GUIDE] Posted bot commands guide');
    return true;
  } catch (e) {
    console.error('[GUIDE] Error posting:', e.message);
    return false;
  }
}

// Command handler
async function handlePostGuideCommand(message, client) {
  // Admin only
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Admin only.');
  }

  const targetChannel = client.channels.cache.get('1453304719605895169');
  
  if (!targetChannel) {
    return message.reply('❌ Cannot find bot-commands channel.');
  }

  // Delete existing messages in channel (optional)
  // await targetChannel.bulkDelete(100).catch(() => {});

  await message.reply('📝 Posting guide to #bot-commands...');
  
  const success = await postBotCommandsGuide(targetChannel);
  
  if (success) {
    await message.channel.send('✅ Guide posted!');
  } else {
    await message.channel.send('❌ Failed to post guide.');
  }
}

module.exports = { postBotCommandsGuide, handlePostGuideCommand };
