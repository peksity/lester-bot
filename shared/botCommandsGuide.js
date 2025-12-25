/**
 * BOT COMMANDS GUIDE - GTA 6 THEMED EMBEDS
 * Auto-posts to #bot-commands on startup
 * Also available via ?postguide command
 */

const { EmbedBuilder } = require('discord.js');

// GTA 6 Color Palette
const COLORS = {
  pink: 0xFF0080,
  orange: 0xFF6B35,
  teal: 0x00D4AA,
  purple: 0x8B5CF6,
  blue: 0x0099FF,
  gold: 0xFFD700,
  red: 0xFF3333,
  darkPink: 0xC71585,
};

const BOT_COMMANDS_CHANNEL_ID = '1453304719605895169';

async function postBotCommandsGuide(client) {
  const channel = client.channels.cache.get(BOT_COMMANDS_CHANNEL_ID);
  if (!channel) {
    console.log('[GUIDE] Bot commands channel not found');
    return false;
  }

  // Delete old messages in channel (last 50)
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    if (messages.size > 0) {
      await channel.bulkDelete(messages, true).catch(() => {});
    }
  } catch (e) {
    console.log('[GUIDE] Could not clear old messages');
  }

  const embeds = [];

  // ═══════════════════════════════════════════════════════════════
  // HEADER EMBED
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🤖 NEXUS AI-POWERED BOTS')
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
        value: '```\n?help     - Commands\n?ping     - Latency\n?mood     - His mood\n?rep @usr - Reputation\n?memory   - Your memory```', 
        inline: true 
      },
      { 
        name: '📊 Info', 
        value: '```\n?serverinfo - Stats\n?userinfo   - User info\n?avatar     - Avatar\n?gunvan     - Gun Van\n?countrecord```', 
        inline: true 
      },
      { 
        name: '⚙️ Admin', 
        value: '```\n?setup   - Server setup\n?nuke    - Reset server\n?postguide - Update this```', 
        inline: true 
      }
    )
    .setColor(COLORS.orange)
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
        value: '```diff\n+ In-channel setup (only you see)\n+ Platform: PS4/PS5/Cross-Gen\n+ Primary Target with payouts\n+ Secondary Loot selection\n+ Approach (Drainage = best)\n+ B2B toggle for grinding\n+ Auto voice channel```', 
        inline: false 
      },
      { 
        name: '💰 Payout Info Shown', 
        value: '> 💎 Pink Diamond: $1.43M\n> 📜 Bearer Bonds: $1.21M\n> 🥇 Gold: ~$500K/stack\n> Host vs Crew % displayed', 
        inline: true 
      },
      { 
        name: '🎮 Features', 
        value: '> ◆ Join/Leave/Voice buttons\n> ◆ Heist counter (B2B)\n> ◆ Kick + Blacklist\n> ◆ Total earnings tracked', 
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
        value: '```diff\n+ In-channel setup (only you see)\n+ Platform: PS4/PS5/Cross-Gen\n+ Wagon Size: Small/Med/Large\n+ Delivery: Local or Distant\n+ Dupe toggle for grinding\n+ Auto voice channel```', 
        inline: false 
      },
      { 
        name: '💰 Payout Info Shown', 
        value: '> 🐌 Small: ~$62.50\n> 🚚 Medium: ~$150\n> 🐂 Large: ~$500-625\n> Host 100% / Posse ~50%', 
        inline: true 
      },
      { 
        name: '🎮 Features', 
        value: '> ◆ Join/Leave/Voice buttons\n> ◆ **Dupe counter** 💰\n> ◆ Kick + Blacklist\n> ◆ Total earnings tracked', 
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
        value: '```diff\n+ In-channel setup (only you see)\n+ Platform: PS4/PS5/Cross-Gen\n+ Regular or Legendary bounty\n+ Timer strategy (12min/AFK)\n+ Legendary: Pick target + stars\n+ Auto voice channel```', 
        inline: false 
      },
      { 
        name: '💰 Payout Info Shown', 
        value: '> ⏱️ 12 min: ~$40 + 0.24 gold\n> 😴 30 min AFK: ~$60 + 0.48g\n> ⭐⭐⭐⭐⭐ Legendary: $225\n> 📖 Catalogue tip for AFK!', 
        inline: true 
      },
      { 
        name: '🎮 Features', 
        value: '> ◆ Join/Leave/Voice buttons\n> ◆ **Bounty counter** 🎯\n> ◆ Cash + Gold tracked\n> ◆ Everyone = same pay!', 
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
> 📍 **Daily Location:** #madam-nazar (auto-updates)
    `)
    .addFields(
      { 
        name: '🔮 Commands', 
        value: '```\n?fortune  - Get a prediction\n?help     - Show commands\n?ping     - Latency```', 
        inline: false 
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
        value: '> ◆ Works across **ALL** LFG types\n> ◆ Blacklisted users get notified\n> ◆ Persists forever until you unblock\n> ◆ Voice auto-deletes on Complete/Cancel\n> ◆ **Cayo** → GTA category\n> ◆ **Wagon/Bounty** → Red Dead category', 
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
  try {
    // First batch (5 embeds)
    await channel.send({ embeds: embeds.slice(0, 5) });
    
    // Second batch (remaining embeds)
    if (embeds.length > 5) {
      await channel.send({ embeds: embeds.slice(5, 10) });
    }
    
    console.log('[GUIDE] ✅ Posted bot commands guide to #bot-commands');
    return true;
  } catch (e) {
    console.error('[GUIDE] Error posting:', e.message);
    return false;
  }
}

// Command handler for ?postguide
async function handlePostGuideCommand(message, client) {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Admin only.');
  }

  await message.reply('📝 Updating #bot-commands guide...');
  const success = await postBotCommandsGuide(client);
  
  if (success) {
    await message.channel.send('✅ Guide updated!');
  } else {
    await message.channel.send('❌ Failed to post guide.');
  }
}

module.exports = { postBotCommandsGuide, handlePostGuideCommand, BOT_COMMANDS_CHANNEL_ID };
