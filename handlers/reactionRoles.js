/**
 * REACTION ROLES HANDLER
 * Handles:
 * - Verification button clicks
 * - Role selection reactions
 * - PS4/PS5 conflict detection (DMs user to pick primary)
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Role mappings for reactions
const REACTION_ROLES = {
  '💰': '💰 Los Santos Hustler',      // GTA
  '🐴': '🐴 Frontier Outlaw',          // RDO
  '5️⃣': '🎮 PlayStation 5',
  '4️⃣': '🎮 PlayStation 4',
  '🏝️': '🏝️ Cayo Grinder',
  '🚁': '🚁 Heist Crew',
  '🛞': '🛞 Wagon Runner',
  '💀': '💀 Bounty Hunter'
};

// Platform roles for conflict detection
const PLATFORM_ROLES = ['🎮 PlayStation 5', '🎮 PlayStation 4'];
const PRIMARY_ROLES = ['⭐ Primary: PS5', '⭐ Primary: PS4'];

/**
 * Initialize reaction roles handler
 */
function initialize(client) {
  console.log('✅ Reaction roles handler initialized');
  
  // Handle button interactions (verification)
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    // Verification button
    if (interaction.customId.startsWith('verify_')) {
      await handleVerification(interaction, client);
    }
    
    // Primary platform selection buttons
    if (interaction.customId === 'primary_ps5' || interaction.customId === 'primary_ps4') {
      await handlePrimarySelection(interaction, client);
    }
  });
  
  // Handle reaction adds
  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    
    // Fetch partial reaction if needed
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        console.error('Failed to fetch reaction:', e);
        return;
      }
    }
    
    await handleReactionAdd(reaction, user, client);
  });
  
  // Handle reaction removes
  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        return;
      }
    }
    
    await handleReactionRemove(reaction, user, client);
  });
}

/**
 * Handle verification button click
 */
async function handleVerification(interaction, client) {
  const roleId = interaction.customId.split('_')[1];
  const member = interaction.member;
  const guild = interaction.guild;
  
  try {
    // Check if already verified
    const verifiedRole = guild.roles.cache.get(roleId) || 
                         guild.roles.cache.find(r => r.name === '✅ Verified');
    
    if (!verifiedRole) {
      return interaction.reply({ 
        content: '❌ Verification role not found. Please contact staff.', 
        ephemeral: true 
      });
    }
    
    if (member.roles.cache.has(verifiedRole.id)) {
      return interaction.reply({ 
        content: '✅ You are already verified!', 
        ephemeral: true 
      });
    }
    
    // Account age check (optional - 7 days)
    const accountAge = Date.now() - member.user.createdTimestamp;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (accountAge < sevenDays) {
      // Log suspicious new account but still verify
      try {
        const logChannel = guild.channels.cache.find(c => c.name === 'join-leave');
        if (logChannel) {
          const warnEmbed = new EmbedBuilder()
            .setTitle('⚠️ New Account Verified')
            .setDescription(`${member.user.tag} verified with account less than 7 days old.`)
            .addFields(
              { name: 'Account Age', value: `${Math.floor(accountAge / (24 * 60 * 60 * 1000))} days`, inline: true },
              { name: 'User ID', value: member.user.id, inline: true }
            )
            .setColor(0xFFA500)
            .setTimestamp();
          
          await logChannel.send({ embeds: [warnEmbed] });
        }
      } catch (e) {
        console.error('Failed to log new account:', e);
      }
    }
    
    // Add verified role
    await member.roles.add(verifiedRole);
    
    // Also give Fresh Spawn role if it exists
    const freshSpawnRole = guild.roles.cache.find(r => r.name === '🆕 Fresh Spawn');
    if (freshSpawnRole) {
      await member.roles.add(freshSpawnRole);
    }
    
    // Reply success
    await interaction.reply({ 
      content: `✅ **Welcome to The Unpatched Method!**\n\nYou now have access to the server. Head to <#${guild.channels.cache.find(c => c.name === 'roles')?.id || 'roles'}> to pick your game and platform roles!`,
      ephemeral: true 
    });
    
    // Log verification
    try {
      const logChannel = guild.channels.cache.find(c => c.name === 'join-leave');
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('✅ Member Verified')
          .setDescription(`${member.user.tag} has verified.`)
          .setColor(0x00FF00)
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();
        
        await logChannel.send({ embeds: [logEmbed] });
      }
    } catch (e) {
      console.error('Failed to log verification:', e);
    }
    
  } catch (error) {
    console.error('Verification error:', error);
    await interaction.reply({ 
      content: '❌ Verification failed. Please try again or contact staff.', 
      ephemeral: true 
    });
  }
}

/**
 * Handle reaction add for role assignment
 */
async function handleReactionAdd(reaction, user, client) {
  const emoji = reaction.emoji.name;
  const roleName = REACTION_ROLES[emoji];
  
  if (!roleName) return;
  
  // Check if this is the roles channel
  const guild = reaction.message.guild;
  const channel = reaction.message.channel;
  
  // Verify it's in a roles channel
  if (channel.name !== 'roles') return;
  
  try {
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.find(r => r.name === roleName);
    
    if (!role) {
      console.error(`Role not found: ${roleName}`);
      return;
    }
    
    // Add the role
    await member.roles.add(role);
    console.log(`Added ${roleName} to ${user.tag}`);
    
    // Check for PS4/PS5 conflict
    if (PLATFORM_ROLES.includes(roleName)) {
      await checkPlatformConflict(member, client);
    }
    
    // Log role change
    await logRoleChange(guild, member, role, 'added');
    
  } catch (error) {
    console.error('Error adding role:', error);
  }
}

/**
 * Handle reaction remove for role removal
 */
async function handleReactionRemove(reaction, user, client) {
  const emoji = reaction.emoji.name;
  const roleName = REACTION_ROLES[emoji];
  
  if (!roleName) return;
  
  const guild = reaction.message.guild;
  const channel = reaction.message.channel;
  
  if (channel.name !== 'roles') return;
  
  try {
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.find(r => r.name === roleName);
    
    if (!role) return;
    
    // Remove the role
    await member.roles.remove(role);
    console.log(`Removed ${roleName} from ${user.tag}`);
    
    // If removing a platform role, also remove the primary role
    if (roleName === '🎮 PlayStation 5') {
      const primaryPS5 = guild.roles.cache.find(r => r.name === '⭐ Primary: PS5');
      if (primaryPS5 && member.roles.cache.has(primaryPS5.id)) {
        await member.roles.remove(primaryPS5);
      }
    } else if (roleName === '🎮 PlayStation 4') {
      const primaryPS4 = guild.roles.cache.find(r => r.name === '⭐ Primary: PS4');
      if (primaryPS4 && member.roles.cache.has(primaryPS4.id)) {
        await member.roles.remove(primaryPS4);
      }
    }
    
    // Log role change
    await logRoleChange(guild, member, role, 'removed');
    
  } catch (error) {
    console.error('Error removing role:', error);
  }
}

/**
 * Check if user has both PS4 and PS5 roles and DM them to pick primary
 */
async function checkPlatformConflict(member, client) {
  const hasPS5 = member.roles.cache.find(r => r.name === '🎮 PlayStation 5');
  const hasPS4 = member.roles.cache.find(r => r.name === '🎮 PlayStation 4');
  
  // Only trigger if they have BOTH platforms
  if (!hasPS5 || !hasPS4) return;
  
  // Check if they already have a primary set
  const hasPrimaryPS5 = member.roles.cache.find(r => r.name === '⭐ Primary: PS5');
  const hasPrimaryPS4 = member.roles.cache.find(r => r.name === '⭐ Primary: PS4');
  
  if (hasPrimaryPS5 || hasPrimaryPS4) return; // Already set
  
  // DM user to pick primary
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎮 Multiple Platforms Detected')
      .setDescription(`Hey ${member.user.username}!

I noticed you selected both **PlayStation 5** and **PlayStation 4**.

That's cool - some of us have both. But I need to know which one is your **PRIMARY** console for matchmaking purposes.

**Which console do you play on the most?**`)
      .setColor(0x5865F2)
      .setFooter({ text: 'The Unpatched Method' });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('primary_ps5')
          .setLabel('🎮 PS5 is Primary')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('primary_ps4')
          .setLabel('🎮 PS4 is Primary')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await member.send({ embeds: [embed], components: [row] });
    console.log(`Sent platform conflict DM to ${member.user.tag}`);
    
  } catch (error) {
    // User might have DMs disabled
    console.log(`Could not DM ${member.user.tag} about platform conflict (DMs disabled?)`);
  }
}

/**
 * Handle primary platform selection from DM button
 */
async function handlePrimarySelection(interaction, client) {
  const member = interaction.member || await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
  
  // If this is a DM, we need to find the member in all guilds
  let targetMember = member;
  let targetGuild = interaction.guild;
  
  if (!targetGuild) {
    // This is a DM - find the guild
    for (const [, guild] of client.guilds.cache) {
      try {
        const foundMember = await guild.members.fetch(interaction.user.id);
        if (foundMember) {
          targetMember = foundMember;
          targetGuild = guild;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!targetMember || !targetGuild) {
    return interaction.reply({ content: '❌ Could not find you in the server.', ephemeral: true });
  }
  
  try {
    if (interaction.customId === 'primary_ps5') {
      // Set PS5 as primary
      const primaryPS5 = targetGuild.roles.cache.find(r => r.name === '⭐ Primary: PS5');
      const primaryPS4 = targetGuild.roles.cache.find(r => r.name === '⭐ Primary: PS4');
      
      if (primaryPS5) await targetMember.roles.add(primaryPS5);
      if (primaryPS4 && targetMember.roles.cache.has(primaryPS4.id)) {
        await targetMember.roles.remove(primaryPS4);
      }
      
      await interaction.update({ 
        content: '✅ **PS5 set as your primary console!**\n\nYou\'ll be prioritized for PS5 matchmaking in LFGs.',
        embeds: [],
        components: []
      });
      
    } else if (interaction.customId === 'primary_ps4') {
      // Set PS4 as primary
      const primaryPS5 = targetGuild.roles.cache.find(r => r.name === '⭐ Primary: PS5');
      const primaryPS4 = targetGuild.roles.cache.find(r => r.name === '⭐ Primary: PS4');
      
      if (primaryPS4) await targetMember.roles.add(primaryPS4);
      if (primaryPS5 && targetMember.roles.cache.has(primaryPS5.id)) {
        await targetMember.roles.remove(primaryPS5);
      }
      
      await interaction.update({ 
        content: '✅ **PS4 set as your primary console!**\n\nYou\'ll be prioritized for PS4 matchmaking in LFGs.',
        embeds: [],
        components: []
      });
    }
    
    console.log(`${interaction.user.tag} set primary platform: ${interaction.customId}`);
    
  } catch (error) {
    console.error('Error setting primary platform:', error);
    await interaction.reply({ content: '❌ Failed to set primary platform. Try again or contact staff.', ephemeral: true });
  }
}

/**
 * Log role changes
 */
async function logRoleChange(guild, member, role, action) {
  try {
    const logChannel = guild.channels.cache.find(c => c.name === 'role-changes');
    if (!logChannel) return;
    
    const embed = new EmbedBuilder()
      .setTitle(`🎭 Role ${action === 'added' ? 'Added' : 'Removed'}`)
      .setDescription(`${member.user.tag} ${action === 'added' ? 'received' : 'lost'} **${role.name}**`)
      .setColor(action === 'added' ? 0x00FF00 : 0xFF0000)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: `User ID: ${member.user.id}` })
      .setTimestamp();
    
    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    // Silently fail - logging shouldn't break functionality
  }
}

module.exports = { initialize, setupReactionRoles: initialize };
