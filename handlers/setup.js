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
    // Staff Roles (highest)
    { name: '🧠 Mastermind', color: '#FF0000', permissions: 'ADMIN', hoist: true },
    { name: '🔫 Enforcer', color: '#FF4500', permissions: 'ADMIN', hoist: true },
    { name: '🤠 Deputy', color: '#FFA500', permissions: 'MOD', hoist: true },
    { name: '🔧 Mechanic', color: '#00CED1', permissions: 'MOD', hoist: true },
    
    // Bot Roles (right under staff, admin perms, hoisted)
    { name: 'Lester', color: '#FFD700', permissions: 'BOT', hoist: true },
    { name: 'Pavel', color: '#FFD700', permissions: 'BOT', hoist: true },
    { name: 'Cripps', color: '#FFD700', permissions: 'BOT', hoist: true },
    { name: 'Madam Nazar', color: '#FFD700', permissions: 'BOT', hoist: true },
    { name: 'Police Chief', color: '#FFD700', permissions: 'BOT', hoist: true },
    
    // Verified Role - Required to see channels
    { name: '✅ Verified', color: '#2ECC71', permissions: 'VERIFIED', hoist: false },
    
    // Special Roles
    { name: '🏆 The #1', color: '#FFD700', permissions: 'MEMBER', hoist: true },
    
    // Activity/Trust Roles
    { name: '💎 Method Finder', color: '#E91E63', permissions: 'MEMBER', hoist: true },
    { name: '🏆 Glitch Veteran', color: '#9C27B0', permissions: 'MEMBER', hoist: true },
    { name: '⭐ Patched In', color: '#4CAF50', permissions: 'MEMBER', hoist: false },
    { name: '🆕 Fresh Spawn', color: '#607D8B', permissions: 'MEMBER', hoist: false },
    
    // Game Roles
    { name: '💰 Los Santos Hustler', color: '#4CAF50', permissions: 'MEMBER', hoist: false },
    { name: '🐴 Frontier Outlaw', color: '#8B4513', permissions: 'MEMBER', hoist: false },
    
    // Platform Roles - Primary shown above regular (for dual-console users)
    { name: '⭐ Primary: PS5', color: '#00D4FF', permissions: 'MEMBER', hoist: true },
    { name: '⭐ Primary: PS4', color: '#00D4FF', permissions: 'MEMBER', hoist: true },
    { name: '🎮 PlayStation 5', color: '#003087', permissions: 'MEMBER', hoist: true },
    { name: '🎮 PlayStation 4', color: '#003087', permissions: 'MEMBER', hoist: true },
    
    // Ping Roles
    { name: '🏝️ Cayo Grinder', color: '#00BCD4', permissions: 'MEMBER', hoist: false },
    { name: '🚁 Heist Crew', color: '#FF9800', permissions: 'MEMBER', hoist: false },
    { name: '🛞 Wagon Runner', color: '#795548', permissions: 'MEMBER', hoist: false },
    { name: '💀 Bounty Hunter', color: '#F44336', permissions: 'MEMBER', hoist: false },
    
    // Muted Role (lowest)
    { name: 'Muted', color: '#000000', permissions: 'MUTED', hoist: false }
  ],
  
  categories: [
    {
      name: '📊 SERVER STATS',
      channels: [
        { name: '👥 Members: 0', type: 'voice', permissions: 'verified-stats' },
        { name: '🟢 Online: 0', type: 'voice', permissions: 'verified-stats' },
        { name: '🤖 Bots: 5', type: 'voice', permissions: 'verified-stats' }
      ]
    },
    {
      name: '📌 INFO',
      channels: [
        { name: 'welcome', type: 'text', permissions: 'public-readonly' },
        { name: 'verify', type: 'text', permissions: 'public-readonly' },
        { name: 'rules', type: 'text', permissions: 'public-readonly' },
        { name: 'roles', type: 'text', permissions: 'verified-react' },
        { name: 'bot-commands', type: 'text', permissions: 'verified-readonly' }
      ]
    },
    {
      name: '💬 GENERAL',
      channels: [
        { name: 'general-chat', type: 'text', permissions: 'verified' },
        { name: 'counting', type: 'text', permissions: 'verified-counting' },
        { name: 'clips', type: 'text', permissions: 'verified' },
        { name: 'memes', type: 'text', permissions: 'verified' },
        { name: 'General Voice', type: 'voice', permissions: 'verified' }
      ]
    },
    {
      name: '💰 GTA ONLINE',
      channels: [
        { name: 'gun-van', type: 'text', permissions: 'verified-readonly' },
        { name: 'cayo-lfg', type: 'text', permissions: 'verified' },
        { name: 'gta-chat', type: 'text', permissions: 'verified' },
        { name: 'talk-to-lester', type: 'text', permissions: 'verified' },
        { name: 'talk-to-pavel', type: 'text', permissions: 'verified' },
        { name: 'GTA Voice', type: 'voice', permissions: 'verified' }
      ]
    },
    {
      name: '🤠 RED DEAD ONLINE',
      channels: [
        { name: 'madam-nazar', type: 'text', permissions: 'verified-readonly' },
        { name: 'wagon-lfg', type: 'text', permissions: 'verified' },
        { name: 'bounty-lfg', type: 'text', permissions: 'verified' },
        { name: 'rdo-chat', type: 'text', permissions: 'verified' },
        { name: 'talk-to-cripps', type: 'text', permissions: 'verified' },
        { name: 'talk-to-madam', type: 'text', permissions: 'verified' },
        { name: 'talk-to-police-chief', type: 'text', permissions: 'verified' },
        { name: 'RDO Voice', type: 'voice', permissions: 'verified' }
      ]
    },
    {
      name: '🔒 STAFF LOGS',
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
1️⃣ Read the rules
2️⃣ Grab your roles
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
  description: `**React to get your roles:**

**What do you play?**
💰 - GTA Online
🐴 - Red Dead Online

**Platform?**
5️⃣ - PlayStation 5
4️⃣ - PlayStation 4
*If you have both, I'll DM you to ask which is your primary!*

**Ping me for:**
🏝️ - Cayo Perico runs
🚁 - Other Heists
🛞 - Wagon deliveries
💀 - Bounty hunting

*Pick what applies to you. You can have multiple.*`,
  color: 0x00FF00,
  reactions: ['💰', '🐴', '5️⃣', '4️⃣', '🏝️', '🚁', '🛞', '💀']
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
    
    // Send verification embed
    await updateStatus(statusChannel, '🔐 Setting up verification...');
    await setupVerification(createdChannels);
    
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
        PermissionFlagsBits.Administrator
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
  const botRoles = [roles['Lester'], roles['Pavel'], roles['Cripps'], roles['Madam Nazar'], roles['Police Chief']].filter(Boolean);
  
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
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
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
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
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
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
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
          
          case 'public-readonly':
            // Everyone can see (including unverified), but only staff/bots can send
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions],
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
              },
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
              }))
            ]);
            break;
          
          case 'verified':
            // Only verified users can see and send
            const verifiedRole = roles['✅ Verified'];
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              ...(verifiedRole ? [{
                id: verifiedRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions]
              }] : []),
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
              })),
              ...(mutedRole ? [{
                id: mutedRole.id,
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
              }] : [])
            ]);
            break;
          
          case 'verified-readonly':
            // Only verified users can see, but only staff/bots can send
            const verifiedRoleRO = roles['✅ Verified'];
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              ...(verifiedRoleRO ? [{
                id: verifiedRoleRO.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
              }] : []),
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
              }))
            ]);
            break;
          
          case 'verified-stats':
            // Only verified users can see stats, no one can connect
            const verifiedRoleStats = roles['✅ Verified'];
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
              },
              ...(verifiedRoleStats ? [{
                id: verifiedRoleStats.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.Connect]
              }] : []),
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.Connect]
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.Connect]
              }))
            ]);
            break;
          
          case 'verified-react':
            // Only verified users can see and react, only staff/bots can send
            const verifiedRoleReact = roles['✅ Verified'];
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              ...(verifiedRoleReact ? [{
                id: verifiedRoleReact.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions],
                deny: [PermissionFlagsBits.SendMessages]
              }] : []),
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks]
              }))
            ]);
            break;
          
          case 'verified-counting':
            // Only verified users can see/send, no reactions
            const verifiedRoleCount = roles['✅ Verified'];
            await channel.permissionOverwrites.set([
              {
                id: everyoneRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              ...(verifiedRoleCount ? [{
                id: verifiedRoleCount.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                deny: [PermissionFlagsBits.AddReactions]
              }] : []),
              ...staffRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
              })),
              ...botRoles.map(role => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
              }))
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
    .setImage('https://i.imgur.com/nVNwMAJ.png')
    .setFooter({ text: 'The Unpatched Method' })
    .setTimestamp();
  
  await welcomeChannel.send({ embeds: [embed] });
}

async function setupVerification(channels) {
  const verifyChannel = channels['verify'];
  if (!verifyChannel) return;
  
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
    .setColor(0x5865F2)
    .setFooter({ text: 'Verification is quick and automatic' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('verify_user')
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
  const talkMadam = channels['talk-to-madam']?.id || 'talk-to-madam';
  const talkChief = channels['talk-to-police-chief']?.id || 'talk-to-police-chief';
  const madamNazar = channels['madam-nazar']?.id || 'madam-nazar';
  const rolesChannel = channels['roles']?.id || 'roles';
  
  // NEXUS Header
  const nexusEmbed = new EmbedBuilder()
    .setTitle('🧠 NEXUS AI-POWERED BOTS')
    .setDescription(`**All 5 bots are powered by NEXUS - they understand natural language.**

You don't need commands. Just talk normally:
• *"anyone wanna do cayo?"* → Creates LFG automatically
• *"need help with wagon"* → Creates LFG automatically
• *"where is nazar?"* → Shows location

Commands still work if you prefer them. The bots also chat freely - they have real personalities. Just talk to them!`)
    .setColor(0x5865F2)
    .setFooter({ text: 'NEXUS AI • Every decision powered by AI' });

  // Lester Commands
  const lesterEmbed = new EmbedBuilder()
    .setTitle('🧠 Lester - The Mastermind')
    .setDescription(`**Server Management & AI Moderation**\nLester runs NEXUS moderation - he watches everything and handles problems automatically.`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Chat', value: `<#${talkLester}> - Talk to Lester anytime`, inline: true },
      { name: '🛡️ Moderation', value: 'Fully automatic. No commands needed.', inline: true },
      { name: '📊 Utility Commands', value: '`?help` - Show commands\n`?ping` - Bot latency\n`?serverinfo` - Server stats\n`?userinfo @user` - User info', inline: false },
      { name: '🔫 Gun Van', value: '`?gunvan` - Today\'s Gun Van location & stock', inline: true },
      { name: '🔢 Counting', value: '`?countrecord` - View record', inline: true },
      { name: '⚙️ Admin', value: '`?setup` - Server setup\n`?reset` - Reset server', inline: true }
    )
    .setFooter({ text: 'Lester handles moderation, appeals, and daily reports automatically' });
  
  // Pavel Commands
  const pavelEmbed = new EmbedBuilder()
    .setTitle('🚁 Pavel - The Submarine Captain')
    .setDescription(`**GTA Online Heist LFG**\n*"Ah, Kapitan! Let us make some money, yes?"*`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Chat', value: `<#${talkPavel}> - Talk to Pavel`, inline: true },
      { name: '📍 LFG Channel', value: '#cayo-lfg', inline: true },
      { name: '🗣️ Natural Language', value: 'Just say *"anyone wanna do cayo?"* or *"need 2 for heist"* - Pavel understands!', inline: false },
      { name: '🎮 LFG Commands', value: '`?cayo` - Cayo Perico heist\n`?casino` - Casino heist\n`?heist` - Any heist\n`?bogdan` - Act 2 Bogdan', inline: false },
      { name: '📊 Reputation', value: '`?rep [@user]` - Check player reputation', inline: true },
      { name: '✅ Session', value: '`?done` - Complete (+rep)\n`?cancel` - Cancel session', inline: true }
    )
    .setFooter({ text: 'Reputation system tracks reliable players • Voice channels auto-created' });
  
  // Cripps Commands
  const crippsEmbed = new EmbedBuilder()
    .setTitle('🐎 Cripps - The Old Trader')
    .setDescription(`**Red Dead Online Wagon LFG**\n*"Did I ever tell you about the time I... never mind."*`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Chat', value: `<#${talkCripps}> - Talk to Cripps`, inline: true },
      { name: '📍 LFG Channel', value: '#wagon-lfg', inline: true },
      { name: '🗣️ Natural Language', value: 'Just say *"need help with wagon"* or *"running deliveries"* - Cripps understands!', inline: false },
      { name: '🚚 LFG Commands', value: '`?wagon` - Wagon delivery\n`?delivery` - Same as wagon\n`?trader` - Trader activities\n`?moonshine` - Moonshine delivery\n`?posse` - General posse', inline: false },
      { name: '📊 Reputation', value: '`?rep [@user]` - Check reputation', inline: true },
      { name: '✅ Session', value: '`?done` - Complete (+rep)\n`?cancel` - Cancel', inline: true }
    )
    .setFooter({ text: 'Reputation system tracks reliable players • Voice channels auto-created' });
  
  // Police Chief Commands
  const chiefEmbed = new EmbedBuilder()
    .setTitle('⭐ Police Chief - The Lawman')
    .setDescription(`**Red Dead Online Bounty LFG**\n*"The law always needs good hunters."*`)
    .setColor(0xFFD700)
    .addFields(
      { name: '💬 Chat', value: `<#${talkChief}> - Talk to the Chief`, inline: true },
      { name: '📍 LFG Channel', value: '#bounty-lfg', inline: true },
      { name: '🗣️ Natural Language', value: 'Just say *"anyone down for etta doyle?"* or *"need bounty crew"* - the Chief understands!', inline: false },
      { name: '🎯 LFG Commands', value: '`?bounty` - Bounty hunting\n`?legendary [name]` - Legendary bounty\n`?etta` `?owlhoot` `?cecil` - Specific legendaries\n`?posse` - General posse', inline: false },
      { name: '📊 Reputation', value: '`?rep [@user]` - Check reputation', inline: true },
      { name: '✅ Session', value: '`?done` - Complete (+rep)\n`?cancel` - Cancel', inline: true }
    )
    .setFooter({ text: 'Reputation system tracks reliable players • Voice channels auto-created' });
  
  // Madam Nazar Commands
  const nazarEmbed = new EmbedBuilder()
    .setTitle('🔮 Madam Nazar - The Fortune Teller')
    .setDescription(`**Daily Location & Collector Guide**\n*"The spirits have guided me here today..."*`)
    .setColor(0x800080)
    .addFields(
      { name: '💬 Chat', value: `<#${talkMadam}> - Consult with Nazar`, inline: true },
      { name: '📍 Daily Post', value: `<#${madamNazar}>`, inline: true },
      { name: '🗣️ Natural Language', value: 'Just ask *"where is nazar?"* or *"nazar location"* - she\'ll tell you!', inline: false },
      { name: '📍 Location Commands', value: '`?nazar` - Today\'s location\n`?where` - Same thing', inline: false },
      { name: '🗺️ Collector Map', value: '[Jean Ropke Map](https://jeanropke.github.io/RDR2CollectorsMap/) - Best tool for collectibles', inline: false }
    )
    .setFooter({ text: 'Location changes daily at midnight UTC' });
  
  // Reputation System
  const repEmbed = new EmbedBuilder()
    .setTitle('📊 Player Reputation System')
    .setDescription(`**NEXUS tracks every player's reliability.**`)
    .setColor(0x00FF00)
    .addFields(
      { name: '⬆️ Gain Reputation', value: '• Complete sessions: **+5 rep**\n• Be reliable and show up', inline: true },
      { name: '⬇️ Lose Reputation', value: '• Cancel/abandon: **-5 rep**\n• Get reported: **-10 to -30 rep**', inline: true },
      { name: '⚠️ Consequences', value: '• Low rep (<50): Warning shown when you join\n• Very low rep (<30): **LFG banned**', inline: false },
      { name: '🔍 Check Reputation', value: '`?rep` - Your rep\n`?rep @user` - Someone else\'s rep', inline: false }
    )
    .setFooter({ text: 'Be reliable. Show up. Complete sessions.' });

  // Appeals
  const appealsEmbed = new EmbedBuilder()
    .setTitle('⚖️ Appeals System')
    .setDescription(`**Got muted or banned? AI reviews your appeal.**`)
    .setColor(0xFF6B6B)
    .addFields(
      { name: 'How to Appeal', value: 'DM any bot with **"appeal"** followed by your explanation.\n\nExample: *"appeal I was just joking with my friend, we always talk like that"*', inline: false },
      { name: 'What Happens', value: '• AI reviews your full history\n• AI considers context and patterns\n• Decision: **Approved**, **Reduced**, or **Denied**\n• You get a DM with the result', inline: false }
    )
    .setFooter({ text: 'Appeals are reviewed by AI, not humans • Be honest in your appeal' });
  
  // Important Notes
  const notesEmbed = new EmbedBuilder()
    .setTitle('📋 Quick Start')
    .setDescription(`**Get started in 3 steps:**
    
1️⃣ **Get Roles** → <#${rolesChannel}>
   Pick your game, platform, and what you want pings for

2️⃣ **Find Crew** → Use LFG channels
   Commands work, but natural language works too!

3️⃣ **Complete Sessions** → Use \`?done\`
   This gives everyone +5 reputation

**The bots are AI-powered.** They understand context, remember conversations, and have real personalities. Just talk to them!`)
    .setColor(0x5865F2)
    .setFooter({ text: 'Questions? Just ask any bot.' });
  
  await botCommandsChannel.send({ embeds: [nexusEmbed] });
  await botCommandsChannel.send({ embeds: [lesterEmbed] });
  await botCommandsChannel.send({ embeds: [pavelEmbed] });
  await botCommandsChannel.send({ embeds: [crippsEmbed] });
  await botCommandsChannel.send({ embeds: [chiefEmbed] });
  await botCommandsChannel.send({ embeds: [nazarEmbed] });
  await botCommandsChannel.send({ embeds: [repEmbed] });
  await botCommandsChannel.send({ embeds: [appealsEmbed] });
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
    'madam-nazar': channels['madam-nazar']?.id,
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
  // Map bot IDs to their role names
  const botIdRoleMap = {
    '1451411731271385163': 'Cripps',           // Cripps
    '1451411607342022831': 'Madam Nazar',      // Madam Nazar
    '1451411814226071552': 'Pavel',            // Pavel
    '1451847841583595593': 'Police Chief'      // Police Chief
  };
  
  // Also match by name as fallback
  const botNameRoleMap = {
    'lester': 'Lester',
    'pavel': 'Pavel', 
    'cripps': 'Cripps',
    'madam': 'Madam Nazar',
    'nazar': 'Madam Nazar',
    'police': 'Police Chief',
    'chief': 'Police Chief',
    'sheriff': 'Police Chief'
  };
  
  try {
    // Fetch all members to make sure we have bots
    await guild.members.fetch();
    
    const bots = guild.members.cache.filter(m => m.user.bot);
    console.log(`Found ${bots.size} bots in server`);
    
    for (const [id, botMember] of bots) {
      const botName = botMember.user.username.toLowerCase();
      let roleName = null;
      
      // First try by ID
      if (botIdRoleMap[id]) {
        roleName = botIdRoleMap[id];
      } else {
        // Then try by name
        for (const [nameKey, role] of Object.entries(botNameRoleMap)) {
          if (botName.includes(nameKey)) {
            roleName = role;
            break;
          }
        }
      }
      
      if (roleName) {
        const role = createdRoles[roleName];
        if (role && !botMember.roles.cache.has(role.id)) {
          await botMember.roles.add(role);
          console.log(`✅ Assigned ${roleName} to ${botMember.user.username}`);
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
      // INFO
      'welcome', 'rules', 'roles', 'bot-commands', 'verify',
      // GTA ONLINE
      'gun-van', 'cayo-lfg', 'heist-lfg', 'gta-chat', 'talk-to-pavel', 'talk-to-lester', 'GTA Voice',
      // RED DEAD ONLINE
      'madam-nazar', 'wagon-lfg', 'bounty-lfg', 'rdo-chat', 'talk-to-cripps', 'talk-to-madam', 'talk-to-police-chief', 'RDO Voice',
      // GENERAL
      'general-chat', 'counting', 'clips', 'memes', 'General Voice',
      // STAFF LOGS
      'nexus-log', 'mod-actions', 'message-logs', 'bot-actions', 'join-leave', 'voice-logs', 
      'role-changes', 'nickname-logs', 'invite-logs', 'scam-detection', 'channel-logs', 'audit-log',
      // STAFF
      'staff-chat', 'staff-commands', 'Staff Voice'
    ];
    
    // Stats channel patterns (match by prefix)
    const statsPatterns = ['👥 Members:', '🟢 Online:', '🤖 Bots:'];

    // Categories to delete
    const categoryNames = ['📊 SERVER STATS', '📌 INFO', '💰 GTA ONLINE', '🤠 RED DEAD ONLINE', '💬 GENERAL', '🔒 STAFF LOGS', '👑 STAFF'];
    
    // Roles to delete
    const roleNames = [
      '🧠 Mastermind', '🔫 Enforcer', '🤠 Deputy', '🔧 Mechanic',
      '🏆 The #1', '💎 Method Finder', '🏆 Glitch Veteran', '⭐ Patched In', '🆕 Fresh Spawn',
      '💰 Los Santos Hustler', '🐴 Frontier Outlaw',
      '🎮 PlayStation 5', '🎮 PlayStation 4', '⭐ Primary: PS5', '⭐ Primary: PS4', '🎮 PS5', '🕹️ PS4',
      '🏝️ Cayo Grinder', '🚁 Heist Crew', '🛞 Wagon Runner', '💀 Bounty Hunter',
      'Lester', 'Cripps', 'Pavel', 'Madam Nazar', 'Police Chief', 'Muted', 'Verified',
      'Counter', '🔢 Counter', 'counter'
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
    
    // Delete stats channels by pattern (Members: X, Online: X, Bots: X)
    for (const pattern of statsPatterns) {
      const statsChannels = guild.channels.cache.filter(c => c.name.startsWith(pattern));
      for (const [, channel] of statsChannels) {
        try {
          await channel.delete();
          deletedChannels++;
          await new Promise(r => setTimeout(r, 200));
        } catch (e) {
          console.error(`Failed to delete stats channel ${channel.name}:`, e.message);
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
    await guild.roles.fetch(); // Refresh role cache
    
    for (const roleName of roleNames) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        try {
          await role.delete();
          deletedRoles++;
          await new Promise(r => setTimeout(r, 300)); // Delay to avoid rate limits
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

// ============================================
// NUKE COMMAND - Delete EVERYTHING
// ============================================
async function executeNuke(message, client) {
  // Only server owner can nuke
  if (message.author.id !== message.guild.ownerId) {
    return message.reply("Only the server owner can nuke the server.");
  }

  const confirmEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('☢️ NUCLEAR OPTION')
    .setDescription(`**THIS WILL DELETE EVERYTHING:**
    
• ALL channels (except this one temporarily)
• ALL categories
• ALL roles (except @everyone and bot roles)

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

    // Refresh caches
    await guild.channels.fetch();
    await guild.roles.fetch();

    // Delete ALL channels except the current one
    await statusMsg.edit('🗑️ Deleting all channels...');
    
    const allChannels = guild.channels.cache.filter(c => 
      c.id !== currentChannelId && 
      c.type !== 4 // Not a category (delete those separately)
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
    
    const allCategories = guild.channels.cache.filter(c => c.type === 4);
    
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
      !r.managed && // Not a bot integration role
      r.position < guild.members.me.roles.highest.position // Can actually delete it
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
