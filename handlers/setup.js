/**
 * SETUP HANDLER - THE UNPATCHED METHOD
 * Creates the ENTIRE server structure automatically
 * Role-gated channels, permissions, verification - EVERYTHING
 * 
 * Features:
 * - ?setup - Creates entire server structure
 * - ?nuke - Deletes EVERYTHING (owner only)
 * - ?reset - Deletes only bot-created content
 * - Role-gated channel visibility
 * - PS4/PS5 conflict detection
 * - All 120+ features documented
 */

const { 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');

// ============================================
// SERVER STRUCTURE CONFIGURATION
// ============================================

const SERVER_STRUCTURE = {
  roles: [
    // Staff Roles (highest) - Admin perms
    { name: '👑 Owner', color: '#FFD700', permissions: 'ADMIN', hoist: true },
    { name: '🧠 Mastermind', color: '#FF0000', permissions: 'ADMIN', hoist: true },
    { name: '🔫 Enforcer', color: '#FF4500', permissions: 'ADMIN', hoist: true },
    { name: '🤠 Deputy', color: '#FFA500', permissions: 'MOD', hoist: true },
    { name: '🔧 Mechanic', color: '#00CED1', permissions: 'MOD', hoist: true },
    
    // VIP/Booster Role (special - above bots)
    { name: '💜 VIP', color: '#FF73FA', permissions: 'MEMBER', hoist: true },
    
    // Bot Roles
    { name: 'Lester', color: '#FFA500', permissions: 'BOT', hoist: true },
    { name: 'Pavel', color: '#FFD700', permissions: 'BOT', hoist: true },
    { name: 'Cripps', color: '#8B4513', permissions: 'BOT', hoist: true },
    { name: 'Madam Nazar', color: '#9B59B6', permissions: 'BOT', hoist: true },
    { name: 'Police Chief', color: '#C0392B', permissions: 'BOT', hoist: true },
    
    // Special Achievement Roles
    { name: '🏆 The #1', color: '#FFD700', permissions: 'MEMBER', hoist: true },
    { name: '🎖️ Veteran Grinder', color: '#DAA520', permissions: 'MEMBER', hoist: true },  // 500+ total
    { name: '🌟 Helping Hand', color: '#FF69B4', permissions: 'MEMBER', hoist: true },     // 50+ helper sessions
    { name: '🔥 On Fire', color: '#FF4500', permissions: 'MEMBER', hoist: false },         // 10 in 24hrs
    
    // GTA Cayo Activity Ranks
    { name: '👑 El Rubio\'s Nightmare', color: '#FFD700', permissions: 'MEMBER', hoist: true },  // 100 cayo
    { name: '🐋 Whale Hunter', color: '#0097A7', permissions: 'MEMBER', hoist: true },           // 50 cayo
    { name: '🦈 Shark Card Killer', color: '#00CED1', permissions: 'MEMBER', hoist: false },     // 25 cayo
    { name: '🐟 Small Fry', color: '#87CEEB', permissions: 'MEMBER', hoist: false },             // 5 cayo
    
    // RDO Wagon Activity Ranks
    { name: '🏰 Cripps\' Partner', color: '#8B4513', permissions: 'MEMBER', hoist: true },  // 100 wagon
    { name: '🚚 Trade Baron', color: '#A0522D', permissions: 'MEMBER', hoist: true },       // 50 wagon
    { name: '🛒 Supply Runner', color: '#CD853F', permissions: 'MEMBER', hoist: false },    // 25 wagon
    { name: '📦 Delivery Boy', color: '#D2691E', permissions: 'MEMBER', hoist: false },     // 5 wagon
    
    // RDO Bounty Activity Ranks
    { name: '💀 Grim Reaper', color: '#4A0000', permissions: 'MEMBER', hoist: true },   // 100 bounty
    { name: '⚔️ Manhunter', color: '#8B0000', permissions: 'MEMBER', hoist: true },     // 50 bounty
    { name: '🎯 Sharpshooter', color: '#B22222', permissions: 'MEMBER', hoist: false }, // 25 bounty
    { name: '🔫 Rookie Hunter', color: '#DC143C', permissions: 'MEMBER', hoist: false }, // 5 bounty
    
    // Verified Role - Base access after verification
    { name: '✅ Verified', color: '#2ECC71', permissions: 'VERIFIED', hoist: false },
    
    // Time-Based Progression Roles
    { name: '💎 Method Finder', color: '#E91E63', permissions: 'MEMBER', hoist: true },    // 90+ days
    { name: '🏆 Glitch Veteran', color: '#9C27B0', permissions: 'MEMBER', hoist: true },   // 30+ days
    { name: '⭐ Patched In', color: '#4CAF50', permissions: 'MEMBER', hoist: false },      // 7+ days - unlocks clips
    { name: '🆕 Fresh Spawn', color: '#607D8B', permissions: 'MEMBER', hoist: false },     // 0-7 days
    
    // GAME ROLES - These unlock categories
    { name: '💰 Los Santos Hustler', color: '#2ECC71', permissions: 'MEMBER', hoist: false }, // Unlocks GTA
    { name: '🐴 Frontier Outlaw', color: '#8B4513', permissions: 'MEMBER', hoist: false },    // Unlocks RDO
    
    // Platform Roles
    { name: '⭐ Primary: PS5', color: '#00D4FF', permissions: 'MEMBER', hoist: true },
    { name: '⭐ Primary: PS4', color: '#00BFFF', permissions: 'MEMBER', hoist: true },
    { name: '🎮 PlayStation 5', color: '#003087', permissions: 'MEMBER', hoist: false },
    { name: '🎮 PlayStation 4', color: '#003087', permissions: 'MEMBER', hoist: false },
    
    // LFG Ping Roles - These unlock specific channels
    { name: '🏝️ Cayo Grinder', color: '#00BCD4', permissions: 'MEMBER', hoist: false },   // Unlocks cayo-lfg, talk-to-pavel
    { name: '🚁 Heist Crew', color: '#FF9800', permissions: 'MEMBER', hoist: false },
    { name: '🛞 Wagon Runner', color: '#795548', permissions: 'MEMBER', hoist: false },   // Unlocks wagon-lfg, talk-to-cripps
    { name: '💀 Bounty Hunter', color: '#F44336', permissions: 'MEMBER', hoist: false },  // Unlocks bounty-lfg, talk-to-police-chief
    
    // Muted Role (lowest)
    { name: 'Muted', color: '#000000', permissions: 'MUTED', hoist: false },
    
    // ========== ACTIVITY XP ROLES ==========
    // Overall XP Ranks
    { name: '💫 Community Legend', color: '#E74C3C', permissions: 'MEMBER', hoist: true },   // 50,000 XP
    { name: '🌟 Server Star', color: '#F39C12', permissions: 'MEMBER', hoist: true },        // 10,000 XP
    { name: '🌳 Rooted Regular', color: '#16A085', permissions: 'MEMBER', hoist: false },    // 2,500 XP
    { name: '🌿 Growing Member', color: '#2ECC71', permissions: 'MEMBER', hoist: false },    // 500 XP
    { name: '🌱 Active Seed', color: '#27AE60', permissions: 'MEMBER', hoist: false },       // 100 XP
    
    // Message Ranks
    { name: '👑 Legendary Talker', color: '#9B59B6', permissions: 'MEMBER', hoist: true },   // 25,000 messages
    { name: '📢 Server Voice', color: '#1ABC9C', permissions: 'MEMBER', hoist: true },       // 10,000 messages
    { name: '🗣️ Conversation Starter', color: '#2980B9', permissions: 'MEMBER', hoist: false }, // 2,500 messages
    { name: '💬 Chatterbox', color: '#3498DB', permissions: 'MEMBER', hoist: false },        // 500 messages
    
    // Voice Ranks
    { name: '🔊 Voice Lord', color: '#8E44AD', permissions: 'MEMBER', hoist: true },         // 100 hours
    { name: '🎤 Party Animal', color: '#C0392B', permissions: 'MEMBER', hoist: true },       // 50 hours
    { name: '🎧 Voice Regular', color: '#E74C3C', permissions: 'MEMBER', hoist: false },     // 10 hours
    
    // Special Activity Roles
    { name: '🦉 Night Owl', color: '#34495E', permissions: 'MEMBER', hoist: false },         // Active 12am-6am
    { name: '🐦 Early Bird', color: '#F1C40F', permissions: 'MEMBER', hoist: false },        // Active 5am-9am
    { name: '⚔️ Weekend Warrior', color: '#E67E22', permissions: 'MEMBER', hoist: false },   // Weekend activity
    { name: '🔥 Streak Master', color: '#FF6B6B', permissions: 'MEMBER', hoist: false },     // 30 day streak
    { name: '👍 Reaction King', color: '#FF69B4', permissions: 'MEMBER', hoist: false }      // 1000+ reactions
  ],
  
  categories: [
    // Voice Channels at top (no category)
    
    // SERVER STATS - Visible to verified
    {
      name: '📊 SERVER STATS',
      permissions: 'verified-category',
      channels: [
        { name: '👥 Members: 0', type: 'voice', permissions: 'stats' },
        { name: '🟢 Online: 0', type: 'voice', permissions: 'stats' },
        { name: '🤖 Bots: 5', type: 'voice', permissions: 'stats' }
      ]
    },
    
    // INFO - Public (unverified can see welcome, verify, rules)
    {
      name: '📌 INFO',
      permissions: 'public-category',
      channels: [
        { name: 'announcements', type: 'text', permissions: 'verified-readonly' },
        { name: 'welcome', type: 'text', permissions: 'public-readonly' },
        { name: 'verify', type: 'text', permissions: 'public-verify' },
        { name: 'rules', type: 'text', permissions: 'public-readonly' },
        { name: 'role-info', type: 'text', permissions: 'public-readonly' },
        { name: 'role-unlocks', type: 'text', permissions: 'public-readonly' },
        { name: 'roles', type: 'text', permissions: 'verified-react' },
        { name: 'bot-commands', type: 'text', permissions: 'game-role-readonly' } // Visible if GTA OR RDO role
      ]
    },
    
    // GENERAL - Visible to verified
    {
      name: '💬 GENERAL',
      permissions: 'verified-category',
      channels: [
        { name: 'general-chat', type: 'text', permissions: 'verified' },
        { name: 'vip-lounge', type: 'text', permissions: 'vip-only' },         // VIP/Boosters only
        { name: 'clips', type: 'text', permissions: 'patched-in-only' },       // 7+ days only
        { name: 'memes', type: 'text', permissions: 'verified' },
        { name: 'counting', type: 'text', permissions: 'verified-counting' },
        { name: 'General Voice', type: 'voice', permissions: 'verified' }
      ]
    },
    
    // GTA ONLINE - Only visible with 💰 Los Santos Hustler role
    {
      name: '💰 GTA 5 ONLINE',
      permissions: 'gta-category',
      channels: [
        { name: 'gun-van', type: 'text', permissions: 'gta-readonly' },
        { name: 'cayo-lfg', type: 'text', permissions: 'cayo-only' },        // Only 🏝️ Cayo Grinder
        { name: 'gta-chat', type: 'text', permissions: 'gta-only' },
        { name: 'talk-to-lester', type: 'text', permissions: 'gta-only' },
        { name: 'talk-to-pavel', type: 'text', permissions: 'cayo-only' },   // Only 🏝️ Cayo Grinder
        { name: 'GTA Voice', type: 'voice', permissions: 'gta-only' }
      ]
    },
    
    // RED DEAD ONLINE - Only visible with 🐴 Frontier Outlaw role
    {
      name: '🤠 RED DEAD 2 ONLINE',
      permissions: 'rdo-category',
      channels: [
        { name: 'madam-nazar', type: 'text', permissions: 'rdo-readonly' },
        { name: 'wagon-lfg', type: 'text', permissions: 'wagon-only' },          // Only 🛞 Wagon Runner
        { name: 'bounty-lfg', type: 'text', permissions: 'bounty-only' },        // Only 💀 Bounty Hunter
        { name: 'rdo-chat', type: 'text', permissions: 'rdo-only' },
        { name: 'talk-to-cripps', type: 'text', permissions: 'wagon-only' },     // Only 🛞 Wagon Runner
        { name: 'talk-to-madam', type: 'text', permissions: 'rdo-only' },
        { name: 'talk-to-police-chief', type: 'text', permissions: 'bounty-only' }, // Only 💀 Bounty Hunter
        { name: 'RDO Voice', type: 'voice', permissions: 'rdo-only' }
      ]
    },
    
    // STAFF LOGS - Staff only
    {
      name: '🔒 STAFF LOGS',
      permissions: 'staff-category',
      channels: [
        { name: 'nexus-log', type: 'text', permissions: 'staff-only' },
        { name: 'mod-actions', type: 'text', permissions: 'staff-only' },
        { name: 'message-logs', type: 'text', permissions: 'staff-only' },
        { name: 'bot-actions', type: 'text', permissions: 'staff-only' },
        { name: 'join-leave', type: 'text', permissions: 'staff-only' },
        { name: 'voice-logs', type: 'text', permissions: 'staff-only' },
        { name: 'role-changes', type: 'text', permissions: 'staff-only' },
        { name: 'nickname-logs', type: 'text', permissions: 'staff-only' },
        { name: 'invite-logs', type: 'text', permissions: 'staff-only' },
        { name: 'scam-detection', type: 'text', permissions: 'staff-only' },
        { name: 'channel-logs', type: 'text', permissions: 'staff-only' },
        { name: 'audit-log', type: 'text', permissions: 'staff-only' },
        { name: 'transcripts', type: 'text', permissions: 'staff-only' }
      ]
    },
    
    // STAFF - Staff only
    {
      name: '👑 STAFF',
      permissions: 'staff-category',
      channels: [
        { name: 'staff-chat', type: 'text', permissions: 'staff-only' },
        { name: 'staff-commands', type: 'text', permissions: 'staff-only' },
        { name: 'Staff Voice', type: 'voice', permissions: 'staff-only' }
      ]
    }
  ]
};

// ============================================
// WELCOME MESSAGE
// ============================================
const WELCOME_MESSAGE = {
  title: '🎮 THE UNPATCHED METHOD',
  description: `The premier Rockstar glitch grinding community.

Make money FAST in GTA Online and Red Dead Online. No bullshit - just efficient grinding with people who know what they're doing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💰 GTA ONLINE**
• **Cayo Perico B2B** - Pavel runs Cayo heists. Back-to-back without setups.
• **Gun Van** - Daily location posted every day.
• Talk to **Lester** or **Pavel** anytime.

**🤠 RED DEAD ONLINE**  
• **Wagon Duplication** - Cripps runs wagons. 11 dupes in 15 mins = $2,750+
• **Bounty Hunting** - Police Chief runs bounty LFGs. Regular & legendary.
• **Daily Nazar Location** - Madam Nazar posts her spot daily.
• Talk to **Cripps**, **Madam Nazar**, or **Police Chief** anytime.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🤖 THE BOTS**
All 5 bots are AI-powered and chat freely in the server. They help, they joke, they have opinions. Just talk to them.

**🔔 LFG SYSTEM**
Find crew members instantly for any activity with the LFG commands.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**GET STARTED:**
1️⃣ Verify in #verify
2️⃣ Grab your roles in #roles
3️⃣ Find a crew
4️⃣ Start grinding`,
  color: 0x2F3136
};

// ============================================
// RULES
// ============================================
const RULES_MESSAGE = {
  title: '📜 Server Rules',
  description: `**Follow these or get banned. Simple.**

**1. No Scamming**
Don't scam members. Don't advertise "money drops" or "modded accounts." We catch you, you're gone. Permanently.

**2. No Real Money Trading**
This is a GLITCH community. We don't sell anything. Anyone asking for money is a scammer.

**3. Respect Each Other**
Talk shit during heists? Fine. Actual harassment? Not fine. Know the difference.

**4. No Slurs**
We curse like sailors here, but slurs are off limits. Racial, homophobic, whatever - just don't.

**5. English Only (Main Channels)**
Keep it English so everyone can understand. Use DMs for other languages.

**6. No Spam**
Don't flood channels. Don't spam pings. Don't be annoying.

**7. Use Correct Channels**
LFG goes in LFG channels. Chat goes in chat channels. It's not complicated.

**8. Listen to Staff**
🧠 Mastermind, 🔫 Enforcer, 🤠 Deputy, 🔧 Mechanic - if they tell you something, listen.

**9. No Advertising**
Don't promote other servers, YouTube channels, or whatever else. Nobody cares.

**10. Have Fun**
We're here to grind and have a good time. Don't ruin it for everyone else.

*Breaking rules = Warning → Mute → Ban*
*Serious violations = Instant ban*`,
  color: 0xFF0000
};

// ============================================
// ROLE SELECTION MESSAGE
// ============================================
const ROLE_SELECTION = {
  title: '🎮 Pick Your Roles',
  description: `**React to get your roles. Channels unlock based on your selections!**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎮 WHAT DO YOU PLAY?**
💰 - **GTA Online** → Unlocks GTA channels
🐴 - **Red Dead Online** → Unlocks RDO channels

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📱 PLATFORM**
5️⃣ - PlayStation 5
4️⃣ - PlayStation 4
*If you select both, Lester will DM you to pick your primary!*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🔔 PING ME FOR (Unlocks extra channels):**
🏝️ - **Cayo Perico** → Unlocks cayo-lfg & talk-to-pavel
🚁 - **Other Heists** → Heist notifications
🛞 - **Wagon Runs** → Unlocks wagon-lfg & talk-to-cripps
💀 - **Bounty Hunting** → Unlocks bounty-lfg & talk-to-police-chief

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*React below to get your roles!*`,
  color: 0x00FF00,
  reactions: ['💰', '🐴', '5️⃣', '4️⃣', '🏝️', '🚁', '🛞', '💀']
};

// ============================================
// BOT COMMANDS - ALL 120+ FEATURES
// ============================================
const BOT_COMMANDS_MESSAGE = {
  embeds: [
    // Main Info Embed
    {
      title: '🤖 NEXUS AI-POWERED BOTS',
      description: `**All 5 bots are powered by NEXUS - they understand natural language.**

You don't need commands. Just talk naturally:
• *"anyone wanna do cayo?"* → Creates LFG automatically
• *"need help with wagon"* → Creates LFG automatically
• *"where is nazar?"* → Shows location

Commands still work if you prefer them. The bots also chat freely - they have real personalities. Just talk to them!

**NEXUS AI** • Every decision powered by AI`,
      color: 0x5865F2
    },
    
    // Lester
    {
      title: '🟠 Lester - The Mastermind',
      description: `**Server Management & AI Moderation**
Lester runs NEXUS moderation - he watches everything and handles problems automatically.`,
      fields: [
        { name: '💬 Chat', value: '#talk-to-lester - Talk to Lester anytime', inline: true },
        { name: '🛡️ Moderation', value: 'Fully automatic. No commands needed.', inline: true },
        { name: '🛠️ Utility Commands', value: '`?help` - Show commands\n`?ping` - Bot latency\n`?serverinfo` - Server stats\n`?userinfo @user` - User info', inline: false },
        { name: '🔫 Gun Van', value: '`?gunvan` - Today\'s Gun Van location & stock', inline: true },
        { name: '🔢 Counting', value: '`?countrecord` - View counting record', inline: true },
        { name: '⚙️ Admin', value: '`?setup` - Server setup\n`?nuke` - Reset server', inline: true }
      ],
      color: 0xFFA500
    },
    
    // Pavel
    {
      title: '🟡 Pavel - The Submarine Captain',
      description: `**GTA Online Heist LFG**
*"Ah, Kapitan! Let us make some money, yes?"*`,
      fields: [
        { name: '💬 Chat', value: '#talk-to-pavel - Talk to Pavel', inline: true },
        { name: '📍 LFG Channel', value: '#cayo-lfg', inline: true },
        { name: '🗣️ Natural Language', value: 'Just say *"anyone wanna do cayo?"* or *"need 2 for heist"* - Pavel understands!', inline: false },
        { name: '⚡ LFG Commands', value: '`?cayo` - Cayo Perico heist\n`?casino` - Casino heist\n`?heist` - Any heist\n`?bogdan` - Act 2 Bogdan\n`?doomsday` - Doomsday heist', inline: false },
        { name: '📊 Reputation', value: '`?rep [@user]` - Check player reputation', inline: true },
        { name: '✅ Session', value: '`?done` - Complete (+rep)\n`?cancel` - Cancel session', inline: true }
      ],
      footer: { text: 'Reputation system tracks reliable players • Voice channels auto-created' },
      color: 0xFFD700
    },
    
    // Cripps
    {
      title: '🟤 Cripps - The Old Trader',
      description: `**Red Dead Online Wagon LFG**
*"Did I ever tell you about the time I... never mind."*`,
      fields: [
        { name: '💬 Chat', value: '#talk-to-cripps - Talk to Cripps', inline: true },
        { name: '📍 LFG Channel', value: '#wagon-lfg', inline: true },
        { name: '🗣️ Natural Language', value: 'Just say *"need help with wagon"* or *"running deliveries"* - Cripps understands!', inline: false },
        { name: '⚡ LFG Commands', value: '`?wagon` - Wagon delivery\n`?delivery` - Same as wagon\n`?trader` - Trader activities\n`?moonshine` - Moonshine delivery\n`?posse` - General posse', inline: false },
        { name: '📊 Reputation', value: '`?rep [@user]` - Check reputation', inline: true },
        { name: '✅ Session', value: '`?done` - Complete\n`?cancel` - Cancel', inline: true }
      ],
      footer: { text: 'Reputation system tracks reliable players • Voice channels auto-created' },
      color: 0x8B4513
    },
    
    // Madam Nazar
    {
      title: '🟣 Madam Nazar - The Fortune Teller',
      description: `**Daily Location & Collector Guide**
*"The spirits have guided me here today..."*`,
      fields: [
        { name: '💬 Chat', value: '#talk-to-madam - Consult with Nazar', inline: true },
        { name: '📍 Daily Post', value: '#madam-nazar', inline: true },
        { name: '🗣️ Natural Language', value: 'Just ask *"where is nazar?"* or *"nazar location"* - she\'ll tell you!', inline: false },
        { name: '📍 Location Commands', value: '`?nazar` - Today\'s location\n`?where` - Same thing', inline: false },
        { name: '🗺️ Collector Map', value: '[Jean Ropke Map](https://jeanropke.github.io/RDR2CollectorsMap/) - Best tool for collectibles', inline: false }
      ],
      footer: { text: 'Location changes daily at midnight UTC' },
      color: 0x9B59B6
    },
    
    // Police Chief
    {
      title: '⭐ Police Chief - The Lawman',
      description: `**Red Dead Online Bounty LFG**
*"The law always needs good hunters."*`,
      fields: [
        { name: '💬 Chat', value: '#talk-to-police-chief - Talk to the Chief', inline: true },
        { name: '📍 LFG Channel', value: '#bounty-lfg', inline: true },
        { name: '🗣️ Natural Language', value: 'Just say *"anyone down for etta doyle?"* or *"need bounty crew"* - the Chief understands!', inline: false },
        { name: '⚡ LFG Commands', value: '`?bounty` - Bounty hunting\n`?legendary [name]` - Legendary bounty\n`?etta` `?owlhoot` `?cecil` - Specific legendaries\n`?posse` - General posse', inline: false },
        { name: '📊 Reputation', value: '`?rep [@user]` - Check reputation', inline: true },
        { name: '✅ Session', value: '`?done` - Complete\n`?cancel` - Cancel', inline: true }
      ],
      footer: { text: 'Reputation system tracks reliable players • Voice channels auto-created' },
      color: 0xC0392B
    },
    
    // Reputation System
    {
      title: '📊 Player Reputation System',
      description: `**NEXUS tracks every player's reliability.**`,
      fields: [
        { name: '➕ Gain Reputation', value: '• Complete sessions: +5 rep\n• Be reliable and show up', inline: true },
        { name: '➖ Lose Reputation', value: '• Cancel/abandon: -5 rep\n• Get reported: -10 to -30 rep', inline: true },
        { name: '⚠️ Consequences', value: '• Low rep (<50): Warning shown when you join\n• Very low rep (<30): **LFG banned**', inline: false },
        { name: '🔍 Check Reputation', value: '`?rep` - Your rep\n`?rep @user` - Someone else\'s rep', inline: false }
      ],
      footer: { text: 'Be reliable. Show up. Complete sessions.' },
      color: 0x3498DB
    },
    
    // Appeals System
    {
      title: '⚖️ Appeals System',
      description: `**Got muted or banned? AI reviews your appeal.**`,
      fields: [
        { name: 'How to Appeal', value: 'DM any bot with **"appeal"** followed by your explanation.', inline: false },
        { name: 'Example', value: '*"appeal I was just joking with my friend, we always talk like that"*', inline: false },
        { name: 'What Happens', value: '• AI reviews your full history\n• AI considers context and patterns\n• Decision: **Approved**, **Reduced**, or **Denied**\n• You get a DM with the result', inline: false }
      ],
      footer: { text: 'Appeals are reviewed by AI, not humans. Be honest in your appeal.' },
      color: 0x9B59B6
    },
    
    // Quick Start
    {
      title: '🚀 Quick Start',
      description: `**Get started in 3 steps:**`,
      fields: [
        { name: '1️⃣ Get Roles', value: '→ #roles\nPick your game, platform, and what you want pings for', inline: false },
        { name: '2️⃣ Find Crew', value: '→ Use LFG channels\nCommands work, but natural language works too!', inline: false },
        { name: '3️⃣ Complete Sessions', value: '→ Use `?done`\nThis gives everyone +5 reputation', inline: false }
      ],
      footer: { text: 'The bots are AI-powered. They understand context, remember conversations, and have real personalities. Just talk to them!' },
      color: 0x2ECC71
    }
  ]
};

// ============================================
// MAIN SETUP FUNCTION
// ============================================
async function execute(message, args, client) {
  // Check if user is server owner
  if (message.author.id !== message.guild.ownerId) {
    return message.reply("Nice try. Only the server owner can run setup. I don't just let anyone restructure the whole operation.");
  }
  
  // Confirmation
  const confirmEmbed = new EmbedBuilder()
    .setTitle('⚠️ Server Setup Confirmation')
    .setDescription(`**This will restructure the ENTIRE server.**

I'm going to create:
• ${SERVER_STRUCTURE.roles.length} roles
• ${SERVER_STRUCTURE.categories.length} categories
• ${SERVER_STRUCTURE.categories.reduce((acc, cat) => acc + cat.channels.length, 0)} channels

**Role-Gated Visibility:**
• Unverified: Only see INFO (welcome, verify, rules)
• Verified: See GENERAL + roles
• GTA Role: Unlocks GTA 5 ONLINE category
• RDO Role: Unlocks RED DEAD 2 ONLINE category
• Cayo/Wagon/Bounty roles: Unlock specific LFG channels

Existing channels will NOT be deleted, but this will add a lot of new stuff.

**Are you sure?**`)
    .setColor(0xFFA500)
    .setFooter({ text: 'React with ✅ to confirm or ❌ to cancel. You have 30 seconds.' });
  
  const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
  await confirmMsg.react('✅');
  await confirmMsg.react('❌');
  
  const filter = (reaction, user) => {
    return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
  };
  
  try {
    const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] });
    const reaction = collected.first();
    
    if (reaction.emoji.name === '❌') {
      return confirmMsg.edit({ embeds: [new EmbedBuilder().setTitle('Setup Cancelled').setDescription('Smart. Always think before you act.').setColor(0xFF0000)] });
    }
    
    // Start setup
    await confirmMsg.edit({ embeds: [new EmbedBuilder().setTitle('🔧 Setting Up Server...').setDescription('"Alright, I\'ll handle the planning..."').setColor(0x00FF00)] });
    
    const statusChannel = message.channel;
    
    // Create roles
    await updateStatus(statusChannel, '📋 Creating roles...');
    const createdRoles = await createRoles(message.guild);
    
    // Create categories and channels
    await updateStatus(statusChannel, '📁 Creating categories and channels...');
    const createdChannels = await createCategoriesAndChannels(message.guild, createdRoles);
    
    // Set up permissions
    await updateStatus(statusChannel, '🔐 Setting up role-gated permissions...');
    await setupPermissions(message.guild, createdRoles, createdChannels);
    
    // Send welcome message
    await updateStatus(statusChannel, '👋 Setting up welcome message...');
    await setupWelcomeMessage(createdChannels);
    
    // Send verification embed
    await updateStatus(statusChannel, '🔐 Setting up verification...');
    await setupVerification(createdChannels, createdRoles);
    
    // Send rules
    await updateStatus(statusChannel, '📜 Setting up rules...');
    await setupRules(createdChannels);
    
    // Send role info
    await updateStatus(statusChannel, '📋 Setting up role info...');
    await setupRoleInfo(createdChannels);
    
    // Send role unlocks guide
    await updateStatus(statusChannel, '🔓 Setting up role unlocks guide...');
    await setupRoleUnlocks(createdChannels);
    
    // Send bot commands
    await updateStatus(statusChannel, '🤖 Setting up bot commands list...');
    await setupBotCommands(createdChannels);
    
    // Send role selection
    await updateStatus(statusChannel, '🎮 Setting up role selection...');
    await setupRoleSelection(createdChannels, createdRoles, client);
    
    // Initialize counting
    await updateStatus(statusChannel, '🔢 Setting up counting game...');
    await setupCounting(message.guild, createdChannels, client);
    
    // Assign bot roles
    await updateStatus(statusChannel, '🤖 Assigning bot roles...');
    await assignBotRoles(message.guild, createdRoles);
    
    // Update stats channels
    await updateStatus(statusChannel, '📊 Updating stats...');
    await updateStatsChannels(message.guild, createdChannels);
    
    // Save config to database
    await updateStatus(statusChannel, '💾 Saving configuration...');
    await saveConfig(message.guild, createdChannels, createdRoles, client);
    
    // Final message
    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Setup Complete')
      .setDescription(`"Done. You owe me one."

**Created:**
• ${Object.keys(createdRoles).length} roles
• ${SERVER_STRUCTURE.categories.length} categories
• ${Object.keys(createdChannels).length} channels

**Role-Gated System Active:**
• Unverified → Only see INFO
• Verified → See GENERAL + roles
• Game roles → Unlock game categories
• LFG roles → Unlock specific channels

**Log Channels Configured:**
All logging is now active in the Staff Logs category.

**Next Steps:**
1. Give yourself the 🧠 Mastermind role
2. Test verification in #verify
3. Test role selection in #roles

The server is ready. Don't screw it up.`)
      .setColor(0x00FF00)
      .setFooter({ text: 'The Unpatched Method - Setup by Lester Bot' });
    
    await statusChannel.send({ embeds: [finalEmbed] });
    
    // Post daily updates now that channels exist
    try {
      const gunVanHandler = require('./gunVan');
      await gunVanHandler.postDailyUpdate(client);
      console.log('Posted Gun Van update after setup');
    } catch (e) {
      console.error('Failed to post Gun Van:', e.message);
    }
    
  } catch (error) {
    console.error('Setup error:', error);
    message.reply("Something went wrong during setup. Check the console. Even my plans fail sometimes... rarely, but sometimes.");
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateStatus(channel, status) {
  await channel.send(`✅ ${status}`);
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function createRoles(guild) {
  const createdRoles = {};
  
  for (const roleConfig of SERVER_STRUCTURE.roles.reverse()) {
    try {
      let role = guild.roles.cache.find(r => r.name === roleConfig.name);
      
      if (!role) {
        const permissions = getRolePermissions(roleConfig.permissions);
        
        role = await guild.roles.create({
          name: roleConfig.name,
          color: roleConfig.color,
          permissions: permissions,
          hoist: roleConfig.hoist,
          reason: 'Server setup by Lester Bot'
        });
      }
      
      createdRoles[roleConfig.name] = role;
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Error creating role ${roleConfig.name}:`, error);
    }
  }
  
  return createdRoles;
}

function getRolePermissions(type) {
  switch (type) {
    case 'ADMIN':
      return [PermissionFlagsBits.Administrator];
    case 'MOD':
      return [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.KickMembers,
        PermissionFlagsBits.BanMembers,
        PermissionFlagsBits.ManageNicknames,
        PermissionFlagsBits.MuteMembers,
        PermissionFlagsBits.DeafenMembers,
        PermissionFlagsBits.MoveMembers,
        PermissionFlagsBits.ModerateMembers
      ];
    case 'BOT':
      return [PermissionFlagsBits.Administrator];
    case 'MUTED':
      return [];
    case 'VERIFIED':
      return [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ];
    default:
      return [
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ];
  }
}

async function createCategoriesAndChannels(guild, roles) {
  const createdChannels = {};
  
  for (const categoryConfig of SERVER_STRUCTURE.categories) {
    try {
      const category = await guild.channels.create({
        name: categoryConfig.name,
        type: ChannelType.GuildCategory,
        reason: 'Server setup by Lester Bot'
      });
      
      createdChannels[categoryConfig.name] = category;
      await new Promise(resolve => setTimeout(resolve, 300));
      
      for (const channelConfig of categoryConfig.channels) {
        try {
          const channelType = channelConfig.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
          
          const channel = await guild.channels.create({
            name: channelConfig.name,
            type: channelType,
            parent: category.id,
            reason: 'Server setup by Lester Bot'
          });
          
          createdChannels[channelConfig.name] = channel;
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error creating channel ${channelConfig.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error creating category ${categoryConfig.name}:`, error);
    }
  }
  
  return createdChannels;
}

async function setupPermissions(guild, roles, channels) {
  const everyoneRole = guild.roles.everyone;
  const verifiedRole = roles['✅ Verified'];
  const mutedRole = roles['Muted'];
  const staffRoles = [roles['👑 Owner'], roles['🧠 Mastermind'], roles['🔫 Enforcer'], roles['🤠 Deputy'], roles['🔧 Mechanic']].filter(Boolean);
  const botRoles = [roles['Lester'], roles['Pavel'], roles['Cripps'], roles['Madam Nazar'], roles['Police Chief']].filter(Boolean);
  
  // Game roles
  const gtaRole = roles['💰 Los Santos Hustler'];
  const rdoRole = roles['🐴 Frontier Outlaw'];
  
  // LFG-specific roles
  const cayoRole = roles['🏝️ Cayo Grinder'];
  const wagonRole = roles['🛞 Wagon Runner'];
  const bountyRole = roles['💀 Bounty Hunter'];
  
  // VIP and Progression roles
  const vipRole = roles['💜 VIP'];
  const patchedInRole = roles['⭐ Patched In'];

  for (const categoryConfig of SERVER_STRUCTURE.categories) {
    for (const channelConfig of categoryConfig.channels) {
      const channel = channels[channelConfig.name];
      if (!channel) continue;
      
      try {
        const permOverwrites = [];
        
        switch (channelConfig.permissions) {
          // PUBLIC - Everyone can see (unverified too)
          case 'public-readonly':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }))
            );
            break;
          
          case 'public-verify':
            // Everyone can see and add reactions (for verify button)
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.SendMessages], allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] },
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }))
            );
            break;
          
          // VERIFIED ONLY
          case 'verified':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(verifiedRole ? [{ id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          case 'verified-readonly':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(verifiedRole ? [{ id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }))
            );
            break;
          
          case 'verified-react':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(verifiedRole ? [{ id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions], deny: [PermissionFlagsBits.SendMessages] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }))
            );
            break;
          
          case 'verified-counting':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(verifiedRole ? [{ id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }))
            );
            break;
          
          case 'stats':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
              ...(verifiedRole ? [{ id: verifiedRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.Connect] }))
            );
            break;
          
          // GAME ROLE GATED - Visible if GTA OR RDO role
          case 'game-role-readonly':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(gtaRole ? [{ id: gtaRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
              ...(rdoRole ? [{ id: rdoRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }))
            );
            break;
          
          // GTA ONLY - Need 💰 Los Santos Hustler
          case 'gta-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(gtaRole ? [{ id: gtaRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          case 'gta-readonly':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(gtaRole ? [{ id: gtaRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }))
            );
            break;
          
          // CAYO ONLY - Need 🏝️ Cayo Grinder (subset of GTA)
          case 'cayo-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(cayoRole ? [{ id: cayoRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          // RDO ONLY - Need 🐴 Frontier Outlaw
          case 'rdo-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(rdoRole ? [{ id: rdoRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          case 'rdo-readonly':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(rdoRole ? [{ id: rdoRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles] }))
            );
            break;
          
          // WAGON ONLY - Need 🛞 Wagon Runner (subset of RDO)
          case 'wagon-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(wagonRole ? [{ id: wagonRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          // BOUNTY ONLY - Need 💀 Bounty Hunter (subset of RDO)
          case 'bounty-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(bountyRole ? [{ id: bountyRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          // VIP ONLY - Need 💜 VIP role (boosters)
          case 'vip-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(vipRole ? [{ id: vipRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] }] : []),
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }))
            );
            break;
          
          // PATCHED IN ONLY - Need ⭐ Patched In role (7+ days in server)
          case 'patched-in-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...(patchedInRole ? [{ id: patchedInRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] }] : []),
              ...(vipRole ? [{ id: vipRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] }] : []), // VIP also gets access
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] })),
              ...(mutedRole ? [{ id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }] : [])
            );
            break;
          
          // STAFF ONLY
          case 'staff-only':
            permOverwrites.push(
              { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
              ...staffRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] })),
              ...botRoles.map(r => ({ id: r.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] }))
            );
            break;
          
          default:
            if (mutedRole) {
              permOverwrites.push(
                { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions] },
                { id: mutedRole.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions] }
              );
            }
            break;
        }
        
        if (permOverwrites.length > 0) {
          await channel.permissionOverwrites.set(permOverwrites);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error setting permissions for ${channelConfig.name}:`, error);
      }
    }
  }
}

async function setupWelcomeMessage(channels) {
  const welcomeChannel = channels['welcome'];
  if (!welcomeChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle(WELCOME_MESSAGE.title)
    .setDescription(WELCOME_MESSAGE.description)
    .setColor(WELCOME_MESSAGE.color)
    .setImage('https://i.imgur.com/nVNwMAJ.png')
    .setFooter({ text: 'The Unpatched Method' })
    .setTimestamp();
  
  await welcomeChannel.send({ embeds: [embed] });
}

async function setupVerification(channels, roles) {
  const verifyChannel = channels['verify'];
  if (!verifyChannel) return;
  
  const verifiedRole = roles['✅ Verified'];
  
  const embed = new EmbedBuilder()
    .setTitle('🔐 Verification Required')
    .setDescription(
      `**Welcome! Before you can access the server, you need to verify.**\n\n` +
      `This helps us keep the community safe from:\n` +
      `• Alt accounts from banned users\n` +
      `• Known scammers and trolls\n` +
      `• Bot raids and spam\n\n` +
      `**Your account will be checked against global ban databases.**\n\n` +
      `Click the button below to verify and gain access to all channels.`
    )
    .setColor(0xFFD700)
    .setFooter({ text: 'Verification is quick and automatic' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_${verifiedRole?.id || 'norole'}`)
        .setLabel('✅ Verify Me')
        .setStyle(ButtonStyle.Success)
    );

  await verifyChannel.send({ embeds: [embed], components: [row] });
}

async function setupRules(channels) {
  const rulesChannel = channels['rules'];
  if (!rulesChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle(RULES_MESSAGE.title)
    .setDescription(RULES_MESSAGE.description)
    .setColor(RULES_MESSAGE.color)
    .setFooter({ text: 'Breaking rules = consequences. Simple.' })
    .setTimestamp();
  
  await rulesChannel.send({ embeds: [embed] });
}

async function setupRoleInfo(channels) {
  const roleInfoChannel = channels['role-info'];
  if (!roleInfoChannel) return;
  
  // Staff Hierarchy Embed
  const staffEmbed = new EmbedBuilder()
    .setTitle('👑 STAFF HIERARCHY')
    .setDescription('The people who keep this place running.')
    .addFields(
      { name: '👑 Owner', value: 'Server creator. Ultimate authority.', inline: false },
      { name: '🧠 Mastermind', value: 'Senior Administrator. Full server control.', inline: false },
      { name: '🔫 Enforcer', value: 'Administrator. Handles serious issues.', inline: false },
      { name: '🤠 Deputy', value: 'Moderator. Day-to-day moderation.', inline: false },
      { name: '🔧 Mechanic', value: 'Junior Moderator. Helps with basic tasks.', inline: false }
    )
    .setColor(0xFF0000)
    .setFooter({ text: 'Listen to staff. They\'re here to help.' });
  
  await roleInfoChannel.send({ embeds: [staffEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // Time-Based Progression Embed
  const progressionEmbed = new EmbedBuilder()
    .setTitle('📈 TIME-BASED PROGRESSION')
    .setDescription('Ranks earned by time in the server. Be patient, stay active!')
    .addFields(
      { name: '🆕 Fresh Spawn', value: '**0-7 days**\nNew member. Limited access.\n*Can\'t post in #clips yet.*', inline: true },
      { name: '⭐ Patched In', value: '**7+ days**\nTrusted member.\n*Unlocks #clips channel!*', inline: true },
      { name: '🏆 Glitch Veteran', value: '**30+ days**\nRespected member.\n*You\'re part of the crew.*', inline: true },
      { name: '💎 Method Finder', value: '**90+ days**\nSenior member.\n*You\'ve proven yourself.*', inline: true }
    )
    .setColor(0x4CAF50)
    .setFooter({ text: 'Ranks are automatic. Just keep grinding!' });
  
  await roleInfoChannel.send({ embeds: [progressionEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // GTA Activity Ranks
  const gtaRanksEmbed = new EmbedBuilder()
    .setTitle('🎮 GTA HEIST RANKS')
    .setDescription('**Earn these by completing Cayo Perico and other heists!**\nRanks are awarded automatically when you use `?done` after sessions.')
    .addFields(
      { name: '🐟 Small Fry', value: '5+ completions', inline: true },
      { name: '🦈 Shark Card Killer', value: '25+ completions', inline: true },
      { name: '🐋 Whale Hunter', value: '50+ completions', inline: true },
      { name: '👑 El Rubio\'s Nightmare', value: '100+ completions', inline: true }
    )
    .setColor(0x00CED1)
    .setFooter({ text: 'Complete heists with ?done to earn these ranks!' });
  
  await roleInfoChannel.send({ embeds: [gtaRanksEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // RDO Wagon Ranks
  const wagonRanksEmbed = new EmbedBuilder()
    .setTitle('🛒 WAGON DELIVERY RANKS')
    .setDescription('**Earn these by completing wagon deliveries!**')
    .addFields(
      { name: '📦 Delivery Boy', value: '5+ completions', inline: true },
      { name: '🛒 Supply Runner', value: '25+ completions', inline: true },
      { name: '🚚 Trade Baron', value: '50+ completions', inline: true },
      { name: '🏰 Cripps\' Partner', value: '100+ completions', inline: true }
    )
    .setColor(0x8B4513)
    .setFooter({ text: 'Help with wagons and use ?done to rank up!' });
  
  await roleInfoChannel.send({ embeds: [wagonRanksEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // RDO Bounty Ranks
  const bountyRanksEmbed = new EmbedBuilder()
    .setTitle('🎯 BOUNTY HUNTER RANKS')
    .setDescription('**Earn these by completing bounty hunts!**')
    .addFields(
      { name: '🔫 Rookie Hunter', value: '5+ completions', inline: true },
      { name: '🎯 Sharpshooter', value: '25+ completions', inline: true },
      { name: '⚔️ Manhunter', value: '50+ completions', inline: true },
      { name: '💀 Grim Reaper', value: '100+ completions', inline: true }
    )
    .setColor(0xDC143C)
    .setFooter({ text: 'Hunt bounties and use ?done to rank up!' });
  
  await roleInfoChannel.send({ embeds: [bountyRanksEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // Special Achievement Roles
  const achievementsEmbed = new EmbedBuilder()
    .setTitle('🏅 SPECIAL ACHIEVEMENTS')
    .setDescription('**Rare roles for exceptional grinders!**')
    .addFields(
      { name: '🏆 The #1', value: 'Top weekly contributor', inline: true },
      { name: '🌟 Helping Hand', value: '50+ sessions as helper (non-host)', inline: true },
      { name: '🎖️ Veteran Grinder', value: '500+ total completions', inline: true },
      { name: '🔥 On Fire', value: '10 completions in 24 hours', inline: true }
    )
    .setColor(0xFFD700)
    .setFooter({ text: 'These are rare. Flex them proudly.' });
  
  await roleInfoChannel.send({ embeds: [achievementsEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // VIP Embed
  const vipEmbed = new EmbedBuilder()
    .setTitle('💜 VIP PERKS')
    .setDescription('**Boost the server to unlock exclusive perks!**')
    .addFields(
      { name: 'How to Get VIP', value: 'Boost the server with Discord Nitro! Your VIP role is automatic.', inline: false },
      { name: '🎁 Your Perks', value: 
        '💜 **VIP Role** - Hoisted above regular members\n' +
        '🏠 **VIP Lounge** - Exclusive booster-only chat\n' +
        '⚡ **Priority LFG** - Get matched first in heists\n' +
        '🎨 **Custom Color** - Stand out in chat\n' +
        '🎬 **Clips Access** - Immediate access (skip 7-day wait)\n' +
        '🏆 **Eternal Gratitude** - We love you', inline: false
      }
    )
    .setColor(0xFF73FA)
    .setFooter({ text: 'Thank you for supporting The Unpatched Method! 💜' });
  
  await roleInfoChannel.send({ embeds: [vipEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // Anti-Abuse Info
  const antiAbuseEmbed = new EmbedBuilder()
    .setTitle('🛡️ FAIR PLAY SYSTEM')
    .setDescription('**We track activity to prevent abuse.**')
    .addFields(
      { name: '⏱️ Minimum Session Time', value: 'Cayo: 15 min | Wagon: 8 min | Bounty: 5 min\n*Can\'t speed-run completions*', inline: false },
      { name: '👥 Crew Verification', value: 'At least 2 people must join, and participants confirm completion.\n*No solo farming*', inline: false },
      { name: '⏳ Cooldowns', value: 'Short wait between completions.\n*Prevents spam*', inline: false },
      { name: '📊 Pattern Detection', value: 'Lester watches for suspicious activity.\n*Same 2 people farming = flagged*', inline: false }
    )
    .setColor(0x3498DB)
    .setFooter({ text: 'Play fair. Earn your ranks legitimately.' });
  
  await roleInfoChannel.send({ embeds: [antiAbuseEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // Game Roles Embed
  const gameRolesEmbed = new EmbedBuilder()
    .setTitle('🎮 GAME & LFG ROLES')
    .setDescription('Get these in #roles to unlock channels.')
    .addFields(
      { name: 'Game Selection', value: 
        '💰 **Los Santos Hustler** - GTA Online player\n' +
        '🐴 **Frontier Outlaw** - Red Dead Online player', inline: false },
      { name: 'GTA LFG Roles', value: 
        '🏝️ **Cayo Grinder** - Unlocks cayo-lfg & talk-to-pavel\n' +
        '🚁 **Heist Crew** - Get pinged for heists', inline: false },
      { name: 'RDO LFG Roles', value: 
        '🛞 **Wagon Runner** - Unlocks wagon-lfg & talk-to-cripps\n' +
        '💀 **Bounty Hunter** - Unlocks bounty-lfg & talk-to-police-chief', inline: false },
      { name: 'Platform Roles', value: 
        '🎮 **PlayStation 5**\n' +
        '🎮 **PlayStation 4**\n' +
        '*If you have both, Lester will DM you to pick your primary!*', inline: false }
    )
    .setColor(0x5865F2)
    .setFooter({ text: 'Pick your roles in #roles' });
  
  await roleInfoChannel.send({ embeds: [gameRolesEmbed] });
}

async function setupRoleUnlocks(channels) {
  const roleUnlocksChannel = channels['role-unlocks'];
  if (!roleUnlocksChannel) return;
  
  // Header
  const headerEmbed = new EmbedBuilder()
    .setTitle('🔓 ALL UNLOCKABLE ROLES')
    .setDescription(`**Every role you can earn in The Unpatched Method!**\n\nRoles are earned through time, activity, completions, and achievements. This is your progression guide.`)
    .setColor(0xFFD700);
  
  await roleUnlocksChannel.send({ embeds: [headerEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== TIME-BASED PROGRESSION ==========
  const timeEmbed = new EmbedBuilder()
    .setTitle('⏰ TIME-BASED PROGRESSION')
    .setDescription('*Automatically earned by being in the server*')
    .addFields(
      { name: '🆕 Fresh Spawn', value: '`0-7 days` - New member', inline: true },
      { name: '⭐ Patched In', value: '`7+ days` - Unlocks #clips', inline: true },
      { name: '🏆 Glitch Veteran', value: '`30+ days` - Trusted', inline: true },
      { name: '💎 Method Finder', value: '`90+ days` - Senior', inline: true }
    )
    .setColor(0x4CAF50)
    .setFooter({ text: 'These are automatic - just stay active!' });
  
  await roleUnlocksChannel.send({ embeds: [timeEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== ACTIVITY XP RANKS ==========
  const xpEmbed = new EmbedBuilder()
    .setTitle('⭐ ACTIVITY XP RANKS')
    .setDescription('*Earned from chatting, voice, reactions, commands*')
    .addFields(
      { name: '🌱 Active Seed', value: '`100 XP`', inline: true },
      { name: '🌿 Growing Member', value: '`500 XP`', inline: true },
      { name: '🌳 Rooted Regular', value: '`2,500 XP`', inline: true },
      { name: '🌟 Server Star', value: '`10,000 XP`', inline: true },
      { name: '💫 Community Legend', value: '`50,000 XP`', inline: true }
    )
    .setColor(0x27AE60)
    .setFooter({ text: 'XP: Messages (1-3) | Voice (1/min) | Reactions (0.5) | Daily Bonus (50)' });
  
  await roleUnlocksChannel.send({ embeds: [xpEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== MESSAGE RANKS ==========
  const messageEmbed = new EmbedBuilder()
    .setTitle('💬 MESSAGE RANKS')
    .setDescription('*Earned by chatting in the server*')
    .addFields(
      { name: '💬 Chatterbox', value: '`500 messages`', inline: true },
      { name: '🗣️ Conversation Starter', value: '`2,500 messages`', inline: true },
      { name: '📢 Server Voice', value: '`10,000 messages`', inline: true },
      { name: '👑 Legendary Talker', value: '`25,000 messages`', inline: true }
    )
    .setColor(0x3498DB)
    .setFooter({ text: 'Keep chatting to rank up!' });
  
  await roleUnlocksChannel.send({ embeds: [messageEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== VOICE RANKS ==========
  const voiceEmbed = new EmbedBuilder()
    .setTitle('🎤 VOICE RANKS')
    .setDescription('*Earned by time in voice channels*')
    .addFields(
      { name: '🎧 Voice Regular', value: '`10 hours`', inline: true },
      { name: '🎤 Party Animal', value: '`50 hours`', inline: true },
      { name: '🔊 Voice Lord', value: '`100 hours`', inline: true }
    )
    .setColor(0xE74C3C)
    .setFooter({ text: 'Hang out in voice to rank up!' });
  
  await roleUnlocksChannel.send({ embeds: [voiceEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== GTA HEIST RANKS ==========
  const gtaEmbed = new EmbedBuilder()
    .setTitle('🎮 GTA HEIST RANKS')
    .setDescription('*Earned by completing Cayo Perico & other heists*')
    .addFields(
      { name: '🐟 Small Fry', value: '`5 completions`', inline: true },
      { name: '🦈 Shark Card Killer', value: '`25 completions`', inline: true },
      { name: '🐋 Whale Hunter', value: '`50 completions`', inline: true },
      { name: '👑 El Rubio\'s Nightmare', value: '`100 completions`', inline: true }
    )
    .setColor(0x00CED1)
    .setFooter({ text: 'Use ?cayo then ?done after completing sessions!' });
  
  await roleUnlocksChannel.send({ embeds: [gtaEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== WAGON RANKS ==========
  const wagonEmbed = new EmbedBuilder()
    .setTitle('🛒 WAGON DELIVERY RANKS')
    .setDescription('*Earned by completing wagon deliveries*')
    .addFields(
      { name: '📦 Delivery Boy', value: '`5 completions`', inline: true },
      { name: '🛒 Supply Runner', value: '`25 completions`', inline: true },
      { name: '🚚 Trade Baron', value: '`50 completions`', inline: true },
      { name: '🏰 Cripps\' Partner', value: '`100 completions`', inline: true }
    )
    .setColor(0x8B4513)
    .setFooter({ text: 'Use ?wagon then ?done after completing sessions!' });
  
  await roleUnlocksChannel.send({ embeds: [wagonEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== BOUNTY RANKS ==========
  const bountyEmbed = new EmbedBuilder()
    .setTitle('🎯 BOUNTY HUNTER RANKS')
    .setDescription('*Earned by completing bounty hunts*')
    .addFields(
      { name: '🔫 Rookie Hunter', value: '`5 completions`', inline: true },
      { name: '🎯 Sharpshooter', value: '`25 completions`', inline: true },
      { name: '⚔️ Manhunter', value: '`50 completions`', inline: true },
      { name: '💀 Grim Reaper', value: '`100 completions`', inline: true }
    )
    .setColor(0xDC143C)
    .setFooter({ text: 'Use ?bounty then ?done after completing sessions!' });
  
  await roleUnlocksChannel.send({ embeds: [bountyEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== SPECIAL ACHIEVEMENTS ==========
  const achievementsEmbed = new EmbedBuilder()
    .setTitle('🏅 SPECIAL ACHIEVEMENTS')
    .setDescription('*Rare roles for exceptional members*')
    .addFields(
      { name: '🏆 The #1', value: 'Top weekly contributor', inline: true },
      { name: '🌟 Helping Hand', value: '50+ helper sessions', inline: true },
      { name: '🎖️ Veteran Grinder', value: '500+ total completions', inline: true },
      { name: '🔥 On Fire', value: '10 completions in 24hrs', inline: true },
      { name: '🔥 Streak Master', value: '30 day activity streak', inline: true },
      { name: '👍 Reaction King', value: '1,000+ reactions given', inline: true }
    )
    .setColor(0xFFD700)
    .setFooter({ text: 'These are rare - show them off!' });
  
  await roleUnlocksChannel.send({ embeds: [achievementsEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== SPECIAL TIME ROLES ==========
  const timeSpecialEmbed = new EmbedBuilder()
    .setTitle('🕐 SPECIAL TIME ROLES')
    .setDescription('*Earned by being active at certain times*')
    .addFields(
      { name: '🦉 Night Owl', value: 'Active between 12am-6am', inline: true },
      { name: '🐦 Early Bird', value: 'Active between 5am-9am', inline: true },
      { name: '⚔️ Weekend Warrior', value: 'Most active on weekends', inline: true }
    )
    .setColor(0x34495E)
    .setFooter({ text: 'Automatically detected based on your activity!' });
  
  await roleUnlocksChannel.send({ embeds: [timeSpecialEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== VIP ==========
  const vipEmbed = new EmbedBuilder()
    .setTitle('💜 VIP STATUS')
    .setDescription('*Boost the server to become VIP!*')
    .addFields(
      { name: '💜 VIP', value: '**Boost the server** with Nitro', inline: false },
      { name: 'Perks', value: 
        '• Hoisted above regular members\n' +
        '• Access to #vip-lounge\n' +
        '• Priority LFG matching\n' +
        '• 2x XP multiplier\n' +
        '• Instant #clips access\n' +
        '• Custom role color', inline: false }
    )
    .setColor(0xFF73FA)
    .setFooter({ text: 'Thank you for supporting the server! 💜' });
  
  await roleUnlocksChannel.send({ embeds: [vipEmbed] });
  await new Promise(r => setTimeout(r, 500));
  
  // ========== XP MULTIPLIERS ==========
  const multipliersEmbed = new EmbedBuilder()
    .setTitle('✨ XP MULTIPLIERS')
    .setDescription('*Ways to earn XP faster*')
    .addFields(
      { name: '🎉 Weekend Bonus', value: '`1.5x XP` on Saturdays & Sundays', inline: true },
      { name: '💜 Booster Bonus', value: '`2x XP` for server boosters', inline: true },
      { name: '🔥 Streak Bonus', value: '`+10% per day` (max 100%)', inline: true },
      { name: '🎁 Daily Bonus', value: '`+50 XP` for first message each day', inline: true }
    )
    .setColor(0x9B59B6)
    .setFooter({ text: 'Stack multipliers for maximum XP gains!' });
  
  await roleUnlocksChannel.send({ embeds: [multipliersEmbed] });
}

async function setupBotCommands(channels) {
  const botCommandsChannel = channels['bot-commands'];
  if (!botCommandsChannel) return;
  
  for (const embedData of BOT_COMMANDS_MESSAGE.embeds) {
    const embed = new EmbedBuilder()
      .setTitle(embedData.title)
      .setDescription(embedData.description)
      .setColor(embedData.color);
    
    if (embedData.fields) {
      embed.addFields(embedData.fields);
    }
    if (embedData.footer) {
      embed.setFooter(embedData.footer);
    }
    
    await botCommandsChannel.send({ embeds: [embed] });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function setupRoleSelection(channels, roles, client) {
  const rolesChannel = channels['roles'];
  if (!rolesChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle(ROLE_SELECTION.title)
    .setDescription(ROLE_SELECTION.description)
    .setColor(ROLE_SELECTION.color)
    .setFooter({ text: 'Channels unlock based on your selections!' })
    .setTimestamp();
  
  const roleMsg = await rolesChannel.send({ embeds: [embed] });
  
  // Add reactions
  for (const emoji of ROLE_SELECTION.reactions) {
    await roleMsg.react(emoji);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Store message ID for reaction handling
  try {
    await client.db.query(
      `INSERT INTO server_config (guild_id, key, value) VALUES ($1, 'role_message_id', $2)
       ON CONFLICT (guild_id, key) DO UPDATE SET value = $2`,
      [rolesChannel.guild.id, roleMsg.id]
    );
  } catch (e) {
    console.error('Failed to save role message ID:', e.message);
  }
}

async function setupCounting(guild, channels, client) {
  const countingChannel = channels['counting'];
  if (!countingChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle('🔢 Counting Game')
    .setDescription(`**Rules:**
• Count up by 1
• Don't count twice in a row
• If you mess up, we start over from 1

**Current Count: 0**

Start counting!`)
    .setColor(0x3498DB);
  
  await countingChannel.send({ embeds: [embed] });
  
  // Initialize counting in database
  try {
    await client.db.query(
      `INSERT INTO server_config (guild_id, key, value) VALUES ($1, 'counting_current', '0')
       ON CONFLICT (guild_id, key) DO UPDATE SET value = '0'`,
      [guild.id]
    );
    await client.db.query(
      `INSERT INTO server_config (guild_id, key, value) VALUES ($1, 'counting_record', '0')
       ON CONFLICT (guild_id, key) DO UPDATE SET value = GREATEST(value::int, 0)::text`,
      [guild.id]
    );
  } catch (e) {
    console.error('Failed to init counting:', e.message);
  }
}

async function assignBotRoles(guild, roles) {
  const botMappings = {
    'Pavel': '1451411814226071552',
    'Cripps': '1451411731271385163',
    'Madam Nazar': '1451411607342022831',
    'Police Chief': '1451847841583595593'
  };
  
  for (const [roleName, botId] of Object.entries(botMappings)) {
    const role = roles[roleName];
    if (!role) continue;
    
    try {
      const member = await guild.members.fetch(botId).catch(() => null);
      if (member && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        console.log(`Assigned ${roleName} role to bot`);
      }
    } catch (e) {
      console.error(`Failed to assign ${roleName} role:`, e.message);
    }
  }
  
  // Assign Lester role to this bot
  const lesterRole = roles['Lester'];
  if (lesterRole) {
    try {
      const me = guild.members.me;
      if (me && !me.roles.cache.has(lesterRole.id)) {
        await me.roles.add(lesterRole);
        console.log('Assigned Lester role to self');
      }
    } catch (e) {
      console.error('Failed to assign Lester role:', e.message);
    }
  }
}

async function updateStatsChannels(guild, channels) {
  const memberCount = guild.memberCount;
  const onlineCount = guild.members.cache.filter(m => m.presence?.status !== 'offline').size || 0;
  const botCount = guild.members.cache.filter(m => m.user.bot).size;
  
  const updates = [
    { pattern: '👥 Members:', value: memberCount },
    { pattern: '🟢 Online:', value: onlineCount },
    { pattern: '🤖 Bots:', value: botCount }
  ];
  
  for (const update of updates) {
    const channel = Object.values(channels).find(c => c.name?.startsWith(update.pattern.split(':')[0]));
    if (channel && channel.type === ChannelType.GuildVoice) {
      try {
        await channel.setName(`${update.pattern} ${update.value}`);
      } catch (e) {
        console.error(`Failed to update ${update.pattern}:`, e.message);
      }
    }
  }
}

async function saveConfig(guild, channels, roles, client) {
  const channelConfigs = [
    ['mod_log_channel', 'mod-actions'],
    ['message_log_channel', 'message-logs'],
    ['join_leave_channel', 'join-leave'],
    ['voice_log_channel', 'voice-logs'],
    ['role_log_channel', 'role-changes'],
    ['nexus_log_channel', 'nexus-log'],
    ['gun_van_channel', 'gun-van'],
    ['nazar_channel', 'madam-nazar'],
    ['general_channel', 'general-chat'],
    ['verify_channel', 'verify'],
    ['rules_channel', 'rules'],
    ['roles_channel', 'roles'],
    ['cayo_lfg_channel', 'cayo-lfg'],
    ['wagon_lfg_channel', 'wagon-lfg'],
    ['bounty_lfg_channel', 'bounty-lfg']
  ];
  
  for (const [key, channelName] of channelConfigs) {
    const channel = channels[channelName];
    if (channel) {
      try {
        await client.db.query(
          `INSERT INTO server_config (guild_id, key, value) VALUES ($1, $2, $3)
           ON CONFLICT (guild_id, key) DO UPDATE SET value = $3`,
          [guild.id, key, channel.id]
        );
      } catch (e) {
        console.error(`Failed to save ${key}:`, e.message);
      }
    }
  }
  
  // Save role IDs
  const roleConfigs = [
    ['verified_role', '✅ Verified'],
    ['muted_role', 'Muted'],
    ['gta_role', '💰 Los Santos Hustler'],
    ['rdo_role', '🐴 Frontier Outlaw'],
    ['cayo_role', '🏝️ Cayo Grinder'],
    ['wagon_role', '🛞 Wagon Runner'],
    ['bounty_role', '💀 Bounty Hunter'],
    ['ps5_role', '🎮 PlayStation 5'],
    ['ps4_role', '🎮 PlayStation 4']
  ];
  
  for (const [key, roleName] of roleConfigs) {
    const role = roles[roleName];
    if (role) {
      try {
        await client.db.query(
          `INSERT INTO server_config (guild_id, key, value) VALUES ($1, $2, $3)
           ON CONFLICT (guild_id, key) DO UPDATE SET value = $3`,
          [guild.id, key, role.id]
        );
      } catch (e) {
        console.error(`Failed to save ${key}:`, e.message);
      }
    }
  }
}

// ============================================
// RESET COMMAND - Delete only bot-created content
// ============================================
async function executeReset(message, client) {
  if (message.author.id !== message.guild.ownerId) {
    return message.reply("Only the server owner can reset the server.");
  }

  const confirmEmbed = new EmbedBuilder()
    .setColor('#FF6600')
    .setTitle('⚠️ Server Reset')
    .setDescription(`**This will delete all bot-created content:**
    
• Categories: SERVER STATS, INFO, GENERAL, GTA, RDO, STAFF LOGS, STAFF
• All channels in those categories
• Bot-created roles

**Type \`CONFIRM RESET\` to proceed.**`)
    .setFooter({ text: 'You have 30 seconds.' });

  await message.channel.send({ embeds: [confirmEmbed] });

  const filter = m => m.author.id === message.author.id && m.content === 'CONFIRM RESET';
  
  try {
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
    
    if (!collected.first()) {
      return message.channel.send('Reset cancelled.');
    }

    const statusMsg = await message.channel.send('🔄 **RESETTING SERVER...**');
    const guild = message.guild;

    let deletedChannels = 0;
    let deletedCategories = 0;
    let deletedRoles = 0;

    await guild.channels.fetch();
    await guild.roles.fetch();

    // Category names to delete
    const categoryNames = SERVER_STRUCTURE.categories.map(c => c.name);
    
    // Channel names to delete
    const channelNames = SERVER_STRUCTURE.categories.flatMap(c => c.channels.map(ch => ch.name));
    
    // Role names to delete
    const roleNames = SERVER_STRUCTURE.roles.map(r => r.name);

    // Delete channels first
    await statusMsg.edit('🗑️ Deleting channels...');
    
    for (const channelName of channelNames) {
      const channels = guild.channels.cache.filter(c => c.name === channelName || c.name.startsWith(channelName.split(':')[0]));
      for (const [, channel] of channels) {
        try {
          await channel.delete();
          deletedChannels++;
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error(`Failed to delete channel ${channel.name}:`, e.message);
        }
      }
    }

    // Delete categories
    await statusMsg.edit('🗑️ Deleting categories...');
    
    for (const catName of categoryNames) {
      const category = guild.channels.cache.find(c => c.name === catName && c.type === 4);
      if (category) {
        try {
          await category.delete();
          deletedCategories++;
        } catch (e) {
          console.error(`Failed to delete category ${catName}:`, e.message);
        }
      }
    }

    // Delete roles
    await statusMsg.edit('🗑️ Deleting roles...');
    await guild.roles.fetch();
    
    for (const roleName of roleNames) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        try {
          await role.delete();
          deletedRoles++;
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          console.error(`Failed to delete role ${roleName}:`, e.message);
        }
      }
    }

    // Clear database config
    try {
      await client.db.query('DELETE FROM server_config WHERE guild_id = $1', [guild.id]);
    } catch (e) {
      console.error('Failed to clear database config:', e.message);
    }

    const doneEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Server Reset Complete')
      .setDescription(`**Deleted:**
• ${deletedCategories} categories
• ${deletedChannels} channels
• ${deletedRoles} roles

You can now run \`?setup\` again to start fresh.`)
      .setFooter({ text: 'The slate is clean.' });

    await statusMsg.edit({ content: null, embeds: [doneEmbed] });

  } catch (error) {
    if (error.message === 'time') {
      return message.channel.send('Reset cancelled - timed out.');
    }
    console.error('Reset error:', error);
    message.channel.send('Reset encountered an error. Check if Lester has Administrator permission.');
  }
}

// ============================================
// NUKE COMMAND - Delete EVERYTHING
// ============================================
async function executeNuke(message, client) {
  if (message.author.id !== message.guild.ownerId) {
    return message.reply("Only the server owner can nuke the server.");
  }

  const confirmEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('☢️ NUCLEAR OPTION')
    .setDescription(`**THIS WILL DELETE EVERYTHING:**
    
• ALL channels (except this one temporarily)
• ALL categories
• ALL roles (except @everyone and bot integration roles)

**This CANNOT be undone.**

Type \`CONFIRM NUKE\` to proceed.`)
    .setFooter({ text: 'You have 30 seconds.' });

  await message.channel.send({ embeds: [confirmEmbed] });

  const filter = m => m.author.id === message.author.id && m.content === 'CONFIRM NUKE';
  
  try {
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
    
    if (!collected.first()) {
      return message.channel.send('Nuke cancelled.');
    }

    const statusMsg = await message.channel.send('☢️ **NUKING SERVER...**');
    const guild = message.guild;
    const currentChannelId = message.channel.id;

    let deletedChannels = 0;
    let deletedCategories = 0;
    let deletedRoles = 0;

    await guild.channels.fetch();
    await guild.roles.fetch();

    // Delete ALL channels except the current one
    await statusMsg.edit('🗑️ Deleting all channels...');
    
    const allChannels = guild.channels.cache.filter(c => 
      c.id !== currentChannelId && 
      c.type !== ChannelType.GuildCategory
    );
    
    for (const [, channel] of allChannels) {
      try {
        await channel.delete();
        deletedChannels++;
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error(`Failed to delete channel ${channel.name}:`, e.message);
      }
    }

    // Delete ALL categories
    await statusMsg.edit('🗑️ Deleting all categories...');
    
    const allCategories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
    
    for (const [, category] of allCategories) {
      try {
        await category.delete();
        deletedCategories++;
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error(`Failed to delete category ${category.name}:`, e.message);
      }
    }

    // Delete ALL roles except @everyone and bot-managed roles
    await statusMsg.edit('🗑️ Deleting all roles...');
    
    const allRoles = guild.roles.cache.filter(r => 
      r.name !== '@everyone' && 
      !r.managed &&
      r.position < guild.members.me.roles.highest.position
    );
    
    for (const [, role] of allRoles) {
      try {
        await role.delete();
        deletedRoles++;
        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.error(`Failed to delete role ${role.name}:`, e.message);
      }
    }

    // Clear database config
    try {
      await client.db.query('DELETE FROM server_config WHERE guild_id = $1', [guild.id]);
    } catch (e) {
      console.error('Failed to clear database config:', e.message);
    }

    const doneEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('☢️ Server Nuked')
      .setDescription(`**Deleted:**
• ${deletedChannels} channels
• ${deletedCategories} categories
• ${deletedRoles} roles

Server is now empty. Run \`?setup\` to rebuild.`)
      .setFooter({ text: 'The slate is clean.' });

    await statusMsg.edit({ content: null, embeds: [doneEmbed] });

  } catch (error) {
    if (error.message === 'time') {
      return message.channel.send('Nuke cancelled - timed out.');
    }
    console.error('Nuke error:', error);
    message.channel.send('Nuke failed. Check bot permissions.');
  }
}

module.exports = { execute, executeReset, executeNuke, updateStatsChannels };

// Updated 12/23/2025 17:32:32
// v2 12/23/2025 17:37:51
