/**
 * SETUP HANDLER
 * Creates the ENTIRE server structure automatically
 * Categories, channels, roles, permissions - EVERYTHING
 */

const { 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// ============================================
// SERVER STRUCTURE CONFIGURATION
// ============================================

const SERVER_STRUCTURE = {
  roles: [
    // Staff Roles (highest to lowest)
    { name: '🧠 Mastermind', color: '#FF0000', permissions: 'ADMIN', hoist: true, position: 'top' },
    { name: '🔫 Enforcer', color: '#FF4500', permissions: 'ADMIN', hoist: true },
    { name: '🤠 Deputy', color: '#FFA500', permissions: 'MOD', hoist: true },
    { name: '🔧 Mechanic', color: '#00CED1', permissions: 'MOD', hoist: true },
    
    // Special Roles
    { name: '🏆 The #1', color: '#FFD700', permissions: 'MEMBER', hoist: true },
    { name: '🏆 The #1', color: '#FFD700', permissions: 'MEMBER', hoist: true },
    
    // Activity/Trust Roles
    { name: '💎 Method Finder', color: '#E91E63', permissions: 'MEMBER', hoist: true },
    { name: '🏆 Glitch Veteran', color: '#9C27B0', permissions: 'MEMBER', hoist: true },
    { name: '⭐ Patched In', color: '#4CAF50', permissions: 'MEMBER', hoist: false },
    { name: '🆕 Fresh Spawn', color: '#607D8B', permissions: 'MEMBER', hoist: false },
    
    // Game Roles
    { name: '💰 Los Santos Hustler', color: '#4CAF50', permissions: 'MEMBER', hoist: false },
    { name: '🐴 Frontier Outlaw', color: '#8B4513', permissions: 'MEMBER', hoist: false },
    
    // Platform Roles
    { name: '🎮 PS5', color: '#003087', permissions: 'MEMBER', hoist: false },
    { name: '🕹️ PS4', color: '#003087', permissions: 'MEMBER', hoist: false },
    
    // Ping Roles
    { name: '🏝️ Cayo Grinder', color: '#00BCD4', permissions: 'MEMBER', hoist: false },
    { name: '🚁 Heist Crew', color: '#FF9800', permissions: 'MEMBER', hoist: false },
    { name: '🛞 Wagon Runner', color: '#795548', permissions: 'MEMBER', hoist: false },
    { name: '💀 Bounty Hunter', color: '#F44336', permissions: 'MEMBER', hoist: false },
    
    // Bot Roles (all yellow)
    { name: 'Lester Bot', color: '#FFD700', permissions: 'BOT', hoist: false },
    { name: 'Cripps Bot', color: '#FFD700', permissions: 'BOT', hoist: false },
    { name: 'Pavel Bot', color: '#FFD700', permissions: 'BOT', hoist: false },
    { name: 'Madam Bot', color: '#FFD700', permissions: 'BOT', hoist: false },
    
    // Muted Role
    { name: 'Muted', color: '#000000', permissions: 'MUTED', hoist: false }
  ],
  
  categories: [
    {
      name: '📊 SERVER STATS',
      channels: [
        { name: '👥 Members: 0', type: 'voice', permissions: 'stats' },
        { name: '🟢 Online: 0', type: 'voice', permissions: 'stats' },
        { name: '🤖 Bots: 4', type: 'voice', permissions: 'stats' }
      ]
    },
    {
      name: '📌 INFO',
      channels: [
        { name: 'welcome', type: 'text', permissions: 'readonly' },
        { name: 'rules', type: 'text', permissions: 'readonly' },
        { name: 'roles', type: 'text', permissions: 'react-only' },
        { name: 'bot-commands', type: 'text', permissions: 'readonly' }
      ]
    },
    {
      name: '💬 GENERAL',
      channels: [
        { name: 'general-chat', type: 'text', permissions: 'normal' },
        { name: 'counting', type: 'text', permissions: 'counting' },
        { name: 'clips', type: 'text', permissions: 'normal' },
        { name: 'memes', type: 'text', permissions: 'normal' },
        { name: 'General Voice', type: 'voice', permissions: 'normal' }
      ]
    },
    {
      name: '💰 GTA ONLINE',
      channels: [
        { name: 'gun-van', type: 'text', permissions: 'readonly' },
        { name: 'cayo-lfg', type: 'text', permissions: 'react-only' },
        { name: 'gta-chat', type: 'text', permissions: 'normal' },
        { name: 'talk-to-lester', type: 'text', permissions: 'normal' },
        { name: 'talk-to-pavel', type: 'text', permissions: 'normal' },
        { name: 'GTA Voice', type: 'voice', permissions: 'normal' }
      ]
    },
    {
      name: '🤠 RED DEAD ONLINE',
      channels: [
        { name: 'madam-nazar', type: 'text', permissions: 'readonly' },
        { name: 'wagon-lfg', type: 'text', permissions: 'react-only' },
        { name: 'bounty-lfg', type: 'text', permissions: 'react-only' },
        { name: 'rdo-chat', type: 'text', permissions: 'normal' },
        { name: 'talk-to-cripps', type: 'text', permissions: 'normal' },
        { name: 'RDO Voice', type: 'voice', permissions: 'normal' }
      ]
    },
    {
      name: '🔒 STAFF LOGS',
      channels: [
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
        { name: 'audit-log', type: 'text', permissions: 'staff-only' }
      ]
    },
    {
      name: '👑 STAFF',
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
  title: '🎮 Welcome to The Unpatched Method',
  description: `**The premier Rockstar glitch grinding community.**

We're here to help you make money FAST in GTA Online and Red Dead Online. No bullshit. Just efficient grinding with people who know what they're doing.

**What We Offer:**

🛞 **Wagon Duplication** - Cripps runs wagon deliveries. Duplicate it 11 times in 15 minutes for $2,750+ and massive XP. Way better than waiting hours to fill it once.

🏝️ **Cayo Perico B2B** - Pavel handles Cayo. Repeat the heist back-to-back without redoing setups. Fast money.

📍 **Daily Locations** - Madam Nazar posts her location every 24 hours. Gun Van location posted daily.

🤖 **AI Bots** - Talk to Lester, Pavel, Cripps, and Madam Nazar. They actually respond and help.

🔔 **LFG System** - Find crew members instantly for any activity.

**Get Started:**
1. Read the <#RULES_CHANNEL>
2. Grab your roles in <#ROLES_CHANNEL>
3. Find a crew in the LFG channels
4. Start grinding

*"I know a guy who knows a guy... and that guy is me."* - Lester`,
  color: 0x2F3136,
  image: 'attachment://banner.png'
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
  description: `**React to get your roles:**

**What do you play?**
💰 - GTA Online
🐴 - Red Dead Online

**Platform?**
🎮 - PS5
🕹️ - PS4

**Ping me for:**
🏝️ - Cayo Perico runs
🚁 - Other Heists
🛞 - Wagon deliveries
💀 - Bounty hunting

*Pick what applies to you. You can have multiple.*`,
  color: 0x00FF00,
  reactions: ['💰', '🐴', '🎮', '🕹️', '🏝️', '🚁', '🛞', '💀']
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
    await updateStatus(statusChannel, '🔐 Setting up permissions...');
    await setupPermissions(message.guild, createdRoles, createdChannels);
    
    // Send welcome message
    await updateStatus(statusChannel, '👋 Setting up welcome message...');
    await setupWelcomeMessage(createdChannels);
    
    // Send rules
    await updateStatus(statusChannel, '📜 Setting up rules...');
    await setupRules(createdChannels);
    
    // Send bot commands
    await updateStatus(statusChannel, '🤖 Setting up bot commands list...');
    await setupBotCommands(createdChannels);
    
    // Send role selection
    await updateStatus(statusChannel, '🎮 Setting up role selection...');
    await setupRoleSelection(createdChannels, createdRoles);
    
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
    await saveConfig(message.guild, createdChannels, client);
    
    // Final message
    const finalEmbed = new EmbedBuilder()
      .setTitle('✅ Setup Complete')
      .setDescription(`"Done. You owe me one."

**Created:**
• ${Object.keys(createdRoles).length} roles
• ${SERVER_STRUCTURE.categories.length} categories
• ${Object.keys(createdChannels).length} channels

**Log Channels Configured:**
All logging is now active in the Staff Logs category.

**Next Steps:**
1. Give yourself the 🧠 Mastermind role
2. Test the LFG commands in the appropriate channels

The server is ready. Don't screw it up.`)
      .setColor(0x00FF00)
      .setFooter({ text: 'The Unpatched Method - Setup by Lester Bot' });
    
    await statusChannel.send({ embeds: [finalEmbed] });
    
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
  await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit prevention
}

async function createRoles(guild) {
  const createdRoles = {};
  
  // Delete existing roles with same names (optional - be careful)
  // For safety, we'll just create new ones
  
  for (const roleConfig of SERVER_STRUCTURE.roles.reverse()) { // Reverse so highest roles are created last (positioned higher)
    try {
      // Check if role exists
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
      await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit
    } catch (error) {
      console.error(`Error creating role ${roleConfig.name}:`, error);
    }
  }
  
  return createdRoles;
}

function getRolePermissions(type) {
  switch (type) {
    case 'ADMIN':
      return [
        PermissionFlagsBits.Administrator
      ];
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
      return [
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageRoles,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.AddReactions,
        PermissionFlagsBits.UseExternalEmojis,
        PermissionFlagsBits.ManageNicknames
      ];
    case 'MUTED':
      return [];
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
      // Create category
      const category = await guild.channels.create({
        name: categoryConfig.name,
        type: ChannelType.GuildCategory,
        reason: 'Server setup by Lester Bot'
      });
      
      createdChannels[categoryConfig.name] = category;
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create channels in category
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
  const mutedRole = roles['Muted'];
  const staffRoles = [roles['🧠 Mastermind'], roles['🔫 Enforcer'], roles['🤠 Deputy'], roles['🔧 Mechanic']].filter(Boolean);
  
  // Setup permissions for each channel based on type
  for (const categoryConfig of SERVER_STRUCTURE.categories) {
    for (const channelConfig of categoryConfig.channels) {
      const channel = channels[channelConfig.name];
      if (!channel) continue;
      
      try {
        switch (channelConfig.permissions) {
          case 'readonly':
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
              },
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              }))
            ]);
            break;
            
          case 'react-only':
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions]
              },
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              }))
            ]);
            break;
            
          case 'staff-only':
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              }))
            ]);
            break;
            
          case 'counting':
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.AddReactions]
              }
            ]);
            break;
          
          case 'stats':
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.Connect]
              }
            ]);
            break;
            
          default: // normal
            if (mutedRole) {
              await channel.permissionOverwrites.set([
                {
                  id: everyoneRole.id,
                  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions]
                },
                {
                  id: mutedRole.id,
                  deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
                }
              ]);
            }
            break;
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
    .setDescription(WELCOME_MESSAGE.description
      .replace('RULES_CHANNEL', channels['rules']?.id || 'rules')
      .replace('ROLES_CHANNEL', channels['roles']?.id || 'roles'))
    .setColor(WELCOME_MESSAGE.color)
    .setImage('https://i.imgur.com/your-banner-here.png') // Replace with actual banner
    .setFooter({ text: 'The Unpatched Method' })
    .setTimestamp();
  
  await welcomeChannel.send({ embeds: [embed] });
}

async function setupRules(channels) {
  const rulesChannel = channels['rules'];
  if (!rulesChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle(RULES_MESSAGE.title)
    .setDescription(RULES_MESSAGE.description)
    .setColor(RULES_MESSAGE.color)
    .setFooter({ text: 'Last updated' })
    .setTimestamp();
  
  await rulesChannel.send({ embeds: [embed] });
}

async function setupBotCommands(channels) {
  const botCommandsChannel = channels['bot-commands'];
  if (!botCommandsChannel) return;
  
  // Get channel IDs for proper linking
  const talkLester = channels['talk-to-lester']?.id || 'talk-to-lester';
  const talkPavel = channels['talk-to-pavel']?.id || 'talk-to-pavel';
  const talkCripps = channels['talk-to-cripps']?.id || 'talk-to-cripps';
  const madamNazar = channels['madam-nazar']?.id || 'madam-nazar';
  const rolesChannel = channels['roles']?.id || 'roles';
  
  // Lester Commands
  const lesterEmbed = new EmbedBuilder()
    .setTitle('🧠 Lester Commands')
    .setDescription(`**The Mastermind** - Server management & moderation`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Talk to Lester', value: `Go to <#${talkLester}> and just chat with him!`, inline: false },
      { name: '📊 Utility', value: '`?help` - Show all commands\n`?ping` - Check bot latency\n`?serverinfo` - Server stats\n`?userinfo @user` - User info\n`?avatar @user` - Get avatar', inline: false },
      { name: '🔫 Gun Van', value: '`?gunvan` - Today\'s Gun Van location & stock', inline: false },
      { name: '🔢 Counting', value: '`?countrecord` - View counting record', inline: false }
    )
    .setFooter({ text: 'Lester handles all server moderation behind the scenes' });
  
  // Pavel Commands
  const pavelEmbed = new EmbedBuilder()
    .setTitle('🚢 Pavel Commands')
    .setDescription(`**The Submarine Captain** - GTA Online LFG`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Talk to Pavel', value: `Go to <#${talkPavel}> and chat with him!`, inline: false },
      { name: '🏝️ Cayo Perico LFG', value: '`?cayo [spots] [PSN]` - Host a Cayo Perico heist\nExample: `?cayo 2 MyPSN_Name`\n*Requires: 🏝️ Cayo Grinder role*', inline: false },
      { name: '✅ Finish Session', value: '`?done` - Close your LFG when finished', inline: false },
      { name: '📖 Guide', value: '`?cayoguide` - Full Cayo Perico guide', inline: false }
    )
    .setFooter({ text: 'Use these commands in #cayo-lfg' });
  
  // Cripps Commands
  const crippsEmbed = new EmbedBuilder()
    .setTitle('🤠 Cripps Commands')
    .setDescription(`**The Old Trader** - Red Dead Online LFG`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Talk to Cripps', value: `Go to <#${talkCripps}> and chat with him!`, inline: false },
      { name: '🛞 Wagon LFG', value: '`?wagon [spots] [PSN]` - Host a wagon delivery\nExample: `?wagon 4 MyPSN_Name`\n*Requires: 🛞 Wagon Runner role*', inline: false },
      { name: '💀 Bounty LFG', value: '`?bounty [spots] [PSN]` - Host a bounty hunt\nExample: `?bounty 2 MyPSN_Name`\n*Requires: 💀 Bounty Hunter role*', inline: false },
      { name: '✅ Finish Session', value: '`?done` - Close your LFG when finished', inline: false },
      { name: '📖 Guides', value: '`?traderguide` - Full trader guide\n`?pelts` - Pelt values & hunting tips', inline: false }
    )
    .setFooter({ text: 'Use these commands in #wagon-lfg or #bounty-lfg' });
  
  // Madam Nazar Commands
  const nazarEmbed = new EmbedBuilder()
    .setTitle('🔮 Madam Nazar Commands')
    .setDescription(`**The Fortune Teller** - Daily locations`)
    .setColor(0xFFD700)
    .addFields(
      { name: '📍 Location', value: `\`?nazar\` - Today's Madam Nazar location\n*Also posted daily in <#${madamNazar}>*`, inline: false },
      { name: '💬 Talk to Nazar', value: `Go to <#${madamNazar}> and ask her about collectibles!`, inline: false }
    )
    .setFooter({ text: 'Madam Nazar moves to a new location every day at reset' });
  
  // Important Notes
  const notesEmbed = new EmbedBuilder()
    .setTitle('📋 Important Notes')
    .setDescription(`**Before using LFG commands:**
    
1. Go to <#${rolesChannel}> and grab your roles first
2. You need the matching role to use LFG commands:
   • 🏝️ Cayo Grinder → \`?cayo\`
   • 🚁 Heist Crew → \`?heist\`
   • 🛞 Wagon Runner → \`?wagon\`
   • 💀 Bounty Hunter → \`?bounty\`

3. Use commands in the correct channels
4. Include your PSN so people can add you
5. Use \`?done\` when your session is complete`)
    .setColor(0xFF6B6B)
    .setFooter({ text: 'Questions? Ask in general-chat' });
  
  await botCommandsChannel.send({ embeds: [lesterEmbed] });
  await botCommandsChannel.send({ embeds: [pavelEmbed] });
  await botCommandsChannel.send({ embeds: [crippsEmbed] });
  await botCommandsChannel.send({ embeds: [nazarEmbed] });
  await botCommandsChannel.send({ embeds: [notesEmbed] });
}

async function setupRoleSelection(channels, roles) {
  const rolesChannel = channels['roles'];
  if (!rolesChannel) return;
  
  const embed = new EmbedBuilder()
    .setTitle(ROLE_SELECTION.title)
    .setDescription(ROLE_SELECTION.description)
    .setColor(ROLE_SELECTION.color)
    .setFooter({ text: 'React below to get your roles' });
  
  const msg = await rolesChannel.send({ embeds: [embed] });
  
  // Add reactions
  for (const reaction of ROLE_SELECTION.reactions) {
    await msg.react(reaction);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Store message ID for reaction role handling
  return msg.id;
}

async function setupCounting(guild, channels, client) {
  const countingChannel = channels['counting'];
  if (!countingChannel) return;
  
  // Initialize counting in database
  await client.db.query(`
    INSERT INTO counting (guild_id, current_count, record)
    VALUES ($1, 0, 0)
    ON CONFLICT (guild_id) DO NOTHING
  `, [guild.id]);
  
  // Send instructions
  const embed = new EmbedBuilder()
    .setTitle('🔢 Counting Game')
    .setDescription(`**Rules:**
• Count up from 1
• One number per person
• Can't count twice in a row
• If you mess up, it resets to 1
• Whoever counts gets the **🏆 The #1** role

Current count: **0**
Record: **0**

*Don't screw this up.*`)
    .setColor(0x00FF00);
  
  await countingChannel.send({ embeds: [embed] });
}

async function saveConfig(guild, channels, client) {
  // Map channel names to IDs for logging
  const logChannels = {
    'mod-actions': channels['mod-actions']?.id,
    'message-logs': channels['message-logs']?.id,
    'bot-actions': channels['bot-actions']?.id,
    'join-leave': channels['join-leave']?.id,
    'voice-logs': channels['voice-logs']?.id,
    'role-changes': channels['role-changes']?.id,
    'nickname-logs': channels['nickname-logs']?.id,
    'invite-logs': channels['invite-logs']?.id,
    'scam-detection': channels['scam-detection']?.id,
    'channel-logs': channels['channel-logs']?.id,
    'audit-log': channels['audit-log']?.id,
    'gun-van': channels['gun-van']?.id,
    'counting': channels['counting']?.id
  };
  
  await client.db.query(`
    INSERT INTO server_config (guild_id, log_channels, setup_complete)
    VALUES ($1, $2, true)
    ON CONFLICT (guild_id) 
    DO UPDATE SET log_channels = $2, setup_complete = true
  `, [guild.id, JSON.stringify(logChannels)]);
}

// ============================================
// ASSIGN BOT ROLES
// ============================================
async function assignBotRoles(guild, createdRoles) {
  const botRoleMap = {
    'Lester': 'Lester Bot',
    'Pavel': 'Pavel Bot', 
    'Cripps': 'Cripps Bot',
    'Madam Nazar': 'Madam Bot'
  };
  
  try {
    // Get all bot members
    const bots = guild.members.cache.filter(m => m.user.bot);
    
    for (const [id, botMember] of bots) {
      const botName = botMember.user.username;
      
      // Find matching role
      for (const [nameKey, roleName] of Object.entries(botRoleMap)) {
        if (botName.toLowerCase().includes(nameKey.toLowerCase())) {
          const role = createdRoles[roleName];
          if (role && !botMember.roles.cache.has(role.id)) {
            await botMember.roles.add(role);
            console.log(`Assigned ${roleName} to ${botName}`);
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error assigning bot roles:', error);
  }
}

// ============================================
// UPDATE STATS CHANNELS
// ============================================
async function updateStatsChannels(guild, channels) {
  try {
    // Get member counts
    const totalMembers = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => 
      m.presence?.status === 'online' || 
      m.presence?.status === 'idle' || 
      m.presence?.status === 'dnd'
    ).size;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    
    // Find stat channels and update names
    const membersChannel = guild.channels.cache.find(c => c.name.startsWith('👥 Members:'));
    const onlineChannel = guild.channels.cache.find(c => c.name.startsWith('🟢 Online:'));
    const botsChannel = guild.channels.cache.find(c => c.name.startsWith('🤖 Bots:'));
    
    if (membersChannel) {
      await membersChannel.setName(`👥 Members: ${totalMembers}`);
    }
    if (onlineChannel) {
      await onlineChannel.setName(`🟢 Online: ${onlineMembers}`);
    }
    if (botsChannel) {
      await botsChannel.setName(`🤖 Bots: ${botCount}`);
    }
  } catch (error) {
    console.error('Error updating stats channels:', error);
  }
}

// ============================================
// RESET COMMAND - Delete everything setup created
// ============================================
async function executeReset(message, client) {
  // Only server owner can reset
  if (message.author.id !== message.guild.ownerId) {
    return message.reply("Only the server owner can reset the server. Nice try though.");
  }

  const confirmEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⚠️ SERVER RESET')
    .setDescription(`**This will DELETE everything I created:**
    
• All categories (INFO, GTA ONLINE, RED DEAD ONLINE, GENERAL, STAFF LOGS, STAFF)
• All channels inside those categories
• All roles I created (Mastermind, Enforcer, Deputy, etc.)

**This CANNOT be undone.**

React with ✅ to confirm or ❌ to cancel.`)
    .setFooter({ text: 'You have 30 seconds to decide.' });

  const confirmMsg = await message.channel.send({ embeds: [confirmEmbed] });
  await confirmMsg.react('✅');
  await confirmMsg.react('❌');

  const filter = (reaction, user) => 
    ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;

  try {
    const collected = await confirmMsg.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] });
    const reaction = collected.first();

    if (reaction.emoji.name === '❌') {
      return confirmMsg.edit({ embeds: [confirmEmbed.setTitle('Reset Cancelled').setColor('#00FF00')] });
    }

    // Start reset
    const statusMsg = await message.channel.send('🔄 Starting server reset...');
    const guild = message.guild;

    // ALL channel names to delete (by name, not by category)
    const channelNames = [
      // STATS
      '👥 Members: 0', '🟢 Online: 0', '🤖 Bots: 4',
      // INFO
      'welcome', 'rules', 'roles', 'bot-commands', 'verify',
      // GTA ONLINE
      'gun-van', 'cayo-lfg', 'gta-chat', 'talk-to-pavel', 'talk-to-lester', 'GTA Voice',
      // RED DEAD ONLINE
      'madam-nazar', 'wagon-lfg', 'bounty-lfg', 'rdo-chat', 'talk-to-cripps', 'RDO Voice',
      // GENERAL
      'general-chat', 'counting', 'clips', 'memes', 'General Voice',
      // STAFF LOGS
      'mod-actions', 'message-logs', 'bot-actions', 'join-leave', 'voice-logs', 
      'role-changes', 'nickname-logs', 'invite-logs', 'scam-detection', 'channel-logs', 'audit-log',
      // STAFF
      'staff-chat', 'staff-commands', 'Staff Voice'
    ];

    // Categories to delete
    const categoryNames = ['📊 SERVER STATS', '📌 INFO', '💰 GTA ONLINE', '🤠 RED DEAD ONLINE', '💬 GENERAL', '🔒 STAFF LOGS', '👑 STAFF'];
    
    // Roles to delete
    const roleNames = [
      '🧠 Mastermind', '🔫 Enforcer', '🤠 Deputy', '🔧 Mechanic',
      '🏆 The #1', '💎 Method Finder', '🏆 Glitch Veteran', '⭐ Patched In', '🆕 Fresh Spawn',
      '💰 Los Santos Hustler', '🐴 Frontier Outlaw',
      '🎮 PS5', '🕹️ PS4',
      '🏝️ Cayo Grinder', '🚁 Heist Crew', '🛞 Wagon Runner', '💀 Bounty Hunter',
      'Lester Bot', 'Cripps Bot', 'Pavel Bot', 'Madam Bot', 'Muted', 'Verified'
    ];

    let deletedChannels = 0;
    let deletedCategories = 0;
    let deletedRoles = 0;

    // Refresh channel cache
    await guild.channels.fetch();

    // Delete channels by NAME (more aggressive)
    await statusMsg.edit('🗑️ Deleting channels...');
    
    for (const channelName of channelNames) {
      const channels = guild.channels.cache.filter(c => c.name === channelName);
      for (const [, channel] of channels) {
        try {
          await channel.delete();
          deletedChannels++;
          await new Promise(r => setTimeout(r, 200)); // Small delay to avoid rate limits
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
    
    for (const roleName of roleNames) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        try {
          await role.delete();
          deletedRoles++;
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
    console.error('Reset error:', error);
    try {
      await message.channel.send('Reset encountered an error. Check if Lester has Administrator permission and is at the top of the roles list.');
    } catch (e) {
      console.error('Could not send error message:', e);
    }
  }
}

module.exports = { execute, executeReset, updateStatsChannels };
