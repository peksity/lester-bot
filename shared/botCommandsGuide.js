/**
 * BOT COMMANDS GUIDE - ULTIMATE EDITION
 * All features including Economy, AI, Reputation, Analytics
 */

const { EmbedBuilder } = require('discord.js');

const COLORS = {
  pink: 0xFF0080,
  orange: 0xFF6B35,
  teal: 0x00D4AA,
  purple: 0x8B5CF6,
  blue: 0x0099FF,
  gold: 0xFFD700,
  red: 0xFF3333,
  green: 0x00FF00,
  cyan: 0x00FFFF,
};

const BOT_COMMANDS_CHANNEL_ID = '1453304719605895169';

async function postBotCommandsGuide(client) {
  const channel = client.channels.cache.get(BOT_COMMANDS_CHANNEL_ID);
  if (!channel) {
    console.log('[GUIDE] Bot commands channel not found');
    return false;
  }

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
  // HEADER
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🤖 THE UNPATCHED METHOD - BOT COMMANDS')
    .setDescription(`
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

> **5 AI-Powered Bots with HiveMind Intelligence**
> *They understand natural language and remember you.*

**📊 FEATURE COUNT: 294+**
*Every decision powered by AI*

**🧠 Features:**
> ◆ Bots **remember** you across conversations
> ◆ **Economy system** with gambling & betting
> ◆ **AI image/video generation** 
> ◆ **Reputation tracking** between players
> ◆ **Predictive analytics** for optimal LFG times

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
    `)
    .setColor(COLORS.pink)
  );

  // ═══════════════════════════════════════════════════════════════
  // ECONOMY SYSTEM
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('💰 ECONOMY SYSTEM')
    .setDescription(`
**Earn, gamble, and compete for riches!**
*Everyone starts with 1,000 chips.*
    `)
    .addFields(
      { 
        name: '💵 Earning Money', 
        value: '```\n?daily   - Daily reward + streak bonus\n?work    - Work for chips (30m cooldown)\n?crime   - Risk it all (1hr cooldown)```', 
        inline: false 
      },
      { 
        name: '🎰 Gambling', 
        value: '```\n?slots [bet]         - Slot machine\n?coinflip [bet] h/t  - 50/50 flip\n?blackjack [bet]     - Play 21\n?roulette [bet] red/black/0-36```', 
        inline: false 
      },
      { 
        name: '💳 Other', 
        value: '```\n?balance - Check your chips\n?pay @user [amount] - Send chips\n?richest - Leaderboard```', 
        inline: false 
      }
    )
    .setColor(COLORS.gold)
  );

  // ═══════════════════════════════════════════════════════════════
  // AI GENERATION
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🎨 AI IMAGE & VIDEO GENERATION')
    .setDescription(`
**Create custom content with Kling AI!**
*Powered by advanced AI models.*
    `)
    .addFields(
      { 
        name: '🖼️ Image Generation', 
        value: '```\n?generate [prompt]\n  Example: ?generate epic GTA heist scene\n\n?wanted @user  - GTA wanted poster\n?bounty @user  - RDO bounty poster\n?victory [text] - Victory screen```', 
        inline: false 
      },
      { 
        name: '🎬 Video Generation', 
        value: '```\n?video [prompt]\n  Example: ?video car chase through city\n  (Takes 1-2 minutes)```', 
        inline: false 
      }
    )
    .setColor(COLORS.purple)
  );

  // ═══════════════════════════════════════════════════════════════
  // REPUTATION & ANALYTICS
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('📊 REPUTATION & ANALYTICS')
    .setDescription(`
**Track your grinding stats and connections!**
    `)
    .addFields(
      { 
        name: '⭐ Reputation', 
        value: '```\n?rep @user      - View reputation\n?rate @user 1-5 - Rate a player\n?partners       - Your frequent crew\n?connection @user - History together```', 
        inline: true 
      },
      { 
        name: '🔮 Predictions', 
        value: '```\n?mytime    - Your best LFG time\n?peaktimes - Server peak hours\n?plan [mins] [players]\n  Optimal grinding route```', 
        inline: true 
      }
    )
    .setColor(COLORS.cyan)
  );

  // ═══════════════════════════════════════════════════════════════
  // LESTER
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🧠 LESTER - The Mastermind')
    .setDescription(`
**Server Management, Economy & AI**
*He watches everything.*

> 💬 **Chat:** #talk-to-lester
    `)
    .addFields(
      { 
        name: '🔧 Utility', 
        value: '```\n?help      - All commands\n?ping      - Latency\n?serverinfo\n?userinfo\n?avatar\n?gunvan```', 
        inline: true 
      },
      { 
        name: '⚙️ Admin', 
        value: '```\n?setup     - Server setup\n?nuke      - Reset server\n?setuppremium\n?setuptiers\n?setuptos\n?setupstats```', 
        inline: true 
      },
      { 
        name: '🔨 Moderation', 
        value: '```\n?kick ?ban ?unban\n?mute ?unmute ?timeout\n?warn ?warnings\n?purge ?lock ?unlock```', 
        inline: true 
      }
    )
    .setColor(COLORS.orange)
  );

  // ═══════════════════════════════════════════════════════════════
  // PAVEL
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🚢 PAVEL - The Submarine Captain')
    .setDescription(`
**GTA Online Heist LFG**
*"Ah, Kapitan! Let us make some money, yes?"*

> 💬 **Chat:** #talk-to-pavel
> 📍 **LFG Channel:** #cayo-lfg
    `)
    .addFields(
      { 
        name: '🎯 ?cayo - Heist LFG', 
        value: '```diff\n+ Platform: PS4/PS5/Cross-Gen\n+ Primary Target with payouts\n+ Secondary Loot selection\n+ Approach selection\n+ B2B toggle for grinding\n+ Auto voice channel```', 
        inline: false 
      },
      { 
        name: '💰 Payouts', 
        value: '> 💎 Pink Diamond: $1.43M\n> 📜 Bearer Bonds: $1.21M\n> 🥇 Gold: ~$500K/stack', 
        inline: true 
      },
      { 
        name: '🎮 Features', 
        value: '> ◆ Join/Leave buttons\n> ◆ Auto voice channel\n> ◆ Heist counter', 
        inline: true 
      }
    )
    .setColor(COLORS.teal)
  );

  // ═══════════════════════════════════════════════════════════════
  // CRIPPS
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🏕️ CRIPPS - The Trader')
    .setDescription(`
**Red Dead Online Wagon LFG**
*"Did I ever tell you about the time I..."*

> 💬 **Chat:** #talk-to-cripps
> 📍 **LFG Channel:** #wagon-lfg
    `)
    .addFields(
      { 
        name: '🛒 ?wagon - Wagon LFG', 
        value: '```diff\n+ Platform: PS4/PS5/Cross-Gen\n+ Wagon Size: Small/Med/Large\n+ Delivery: Local or Distant\n+ Dupe toggle for grinding\n+ Auto voice channel```', 
        inline: false 
      },
      { 
        name: '💰 Payouts', 
        value: '> 🐌 Small: ~$62.50\n> 🚚 Medium: ~$150\n> 🐂 Large: ~$500-625', 
        inline: true 
      },
      { 
        name: '🎮 Features', 
        value: '> ◆ Join/Leave buttons\n> ◆ Auto voice channel\n> ◆ Dupe counter', 
        inline: true 
      }
    )
    .setColor(COLORS.gold)
  );

  // ═══════════════════════════════════════════════════════════════
  // POLICE CHIEF
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('⭐ POLICE CHIEF - The Lawman')
    .setDescription(`
**Red Dead Online Bounty LFG**
*"Justice doesn't sleep. Neither do I."*

> 💬 **Chat:** #talk-to-chief
> 📍 **LFG Channel:** #bounty-lfg
    `)
    .addFields(
      { 
        name: '💀 ?bounty - Bounty LFG', 
        value: '```diff\n+ Platform: PS4/PS5/Cross-Gen\n+ Regular or Legendary bounty\n+ Timer strategy (12min/AFK)\n+ Pick legendary target + stars\n+ Auto voice channel```', 
        inline: false 
      },
      { 
        name: '💰 Payouts', 
        value: '> ⏱️ 12 min: ~$40 + 0.24g\n> 😴 30 min: ~$60 + 0.48g\n> ⭐⭐⭐⭐⭐ Legendary: $225', 
        inline: true 
      },
      { 
        name: '🎮 Features', 
        value: '> ◆ Join/Leave buttons\n> ◆ Auto voice channel\n> ◆ Bounty counter', 
        inline: true 
      }
    )
    .setColor(COLORS.red)
  );

  // ═══════════════════════════════════════════════════════════════
  // MADAM NAZAR
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('🔮 MADAM NAZAR - The Fortune Teller')
    .setDescription(`
**Red Dead Online Collector**
*"The spirits guide me..."*

> 💬 **Chat:** #talk-to-nazar
> 📍 **Daily Location:** #madam-nazar
    `)
    .addFields(
      { 
        name: '🗺️ Commands', 
        value: '```\n?nazar    - Today\'s location\n?location - Same as above```', 
        inline: true 
      },
      { 
        name: '✨ Features', 
        value: '> ◆ Auto-posts daily location\n> ◆ Interactive map links\n> ◆ Mystic personality', 
        inline: true 
      }
    )
    .setColor(COLORS.purple)
  );

  // ═══════════════════════════════════════════════════════════════
  // PREMIUM
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('⭐ PREMIUM MEMBERSHIP')
    .setDescription(`
**Support the server & unlock exclusive perks!**

> 🌟 **Inner Circle** - $9.99/mo
> 💎 **Inner Circle+** - $19.99/mo  
> 👑 **Lifetime VIP** - $149.99 once

**Perks include:**
◆ VIP lounge access
◆ Priority LFG matching
◆ Exclusive AI features
◆ Custom wanted posters
◆ Direct support
◆ Early access to new features

**Check #premium-info for details!**
    `)
    .setColor(COLORS.gold)
  );

  // ═══════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════
  embeds.push(new EmbedBuilder()
    .setTitle('📌 QUICK TIPS')
    .setDescription(`
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

> 🗣️ **Talk naturally** - Bots understand context
> 📸 **Post screenshots** - Bots can analyze images
> 🎰 **Start with ?daily** - Free chips every day
> 🤝 **Rate players** - Build your reputation
> 📋 **Use ?plan** - Get optimal grinding routes

**Need help?** Just ask any bot!

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**
    `)
    .setColor(COLORS.green)
    .setFooter({ text: 'The Unpatched Method • Ultimate Edition' })
    .setTimestamp()
  );

  // Post all embeds
  for (const embed of embeds) {
    await channel.send({ embeds: [embed] });
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[GUIDE] Posted ${embeds.length} embeds to #bot-commands`);
  return true;
}

async function handlePostGuideCommand(message, client) {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('Admin only.');
  }
  
  const msg = await message.reply('📝 Updating bot commands guide...');
  const success = await postBotCommandsGuide(client);
  
  if (success) {
    await msg.edit('✅ Bot commands guide updated!');
  } else {
    await msg.edit('❌ Failed to update guide. Check channel ID.');
  }
}

module.exports = {
  postBotCommandsGuide,
  handlePostGuideCommand,
  BOT_COMMANDS_CHANNEL_ID
};
