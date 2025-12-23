/**
 * REACTION ROLES HANDLER
 * Handles role assignment via reactions in the roles channel
 * 
 * Special logic for PlayStation roles:
 * - If user selects both PS4 and PS5, bot asks which is primary
 * - Primary role is hoisted and shows on member list
 */

const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Emoji to Role mapping
const EMOJI_ROLE_MAP = {
  '💰': '💰 Los Santos Hustler',
  '🐴': '🐴 Frontier Outlaw',
  '5️⃣': '🎮 PlayStation 5',
  '4️⃣': '🎮 PlayStation 4',
  '🏝️': '🏝️ Cayo Grinder',
  '🚁': '🚁 Heist Crew',
  '🛞': '🛞 Wagon Runner',
  '💀': '💀 Bounty Hunter'
};

// Track pending primary questions (prevent spam)
const pendingPrimaryQuestions = new Map();

/**
 * Setup reaction role listeners
 */
function setupReactionRoles(client) {
  // Reaction Add
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;
    
    // Fetch partial if needed
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        return;
      }
    }
    
    // Only handle in roles channel
    if (reaction.message.channel.name !== 'roles') return;
    
    // Check if it's a role reaction
    const roleName = EMOJI_ROLE_MAP[reaction.emoji.name];
    if (!roleName) return;
    
    try {
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.find(r => r.name === roleName);
      
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        console.log(`Added role "${roleName}" to ${user.tag}`);
        
        // Check if this is a PlayStation role
        if (roleName === '🎮 PlayStation 5' || roleName === '🎮 PlayStation 4') {
          await checkPrimaryConsole(member, guild, client);
        }
      }
    } catch (error) {
      console.error('Error adding role:', error);
    }
  });
  
  // Reaction Remove
  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (user.bot) return;
    
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (e) {
        return;
      }
    }
    
    if (reaction.message.channel.name !== 'roles') return;
    
    const roleName = EMOJI_ROLE_MAP[reaction.emoji.name];
    if (!roleName) return;
    
    try {
      const guild = reaction.message.guild;
      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.find(r => r.name === roleName);
      
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        console.log(`Removed role "${roleName}" from ${user.tag}`);
        
        // If they removed a PlayStation role, update primary
        if (roleName === '🎮 PlayStation 5' || roleName === '🎮 PlayStation 4') {
          await updatePrimaryAfterRemoval(member, guild, roleName);
        }
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  });
  
  // Handle button interactions for primary selection
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'primary_ps5' || interaction.customId === 'primary_ps4') {
      await handlePrimarySelection(interaction);
    }
  });
  
  console.log('✅ Reaction roles handler initialized');
}

/**
 * Check if user has both PS4 and PS5, ask for primary
 */
async function checkPrimaryConsole(member, guild, client) {
  const hasPS5 = member.roles.cache.some(r => r.name === '🎮 PlayStation 5');
  const hasPS4 = member.roles.cache.some(r => r.name === '🎮 PlayStation 4');
  
  // Only ask if they have BOTH - otherwise no need for primary
  if (hasPS5 && hasPS4) {
    // Don't ask if we already asked recently
    const pendingKey = `${member.id}-${guild.id}`;
    if (pendingPrimaryQuestions.has(pendingKey)) return;
    
    pendingPrimaryQuestions.set(pendingKey, Date.now());
    
    // Clear after 5 minutes
    setTimeout(() => pendingPrimaryQuestions.delete(pendingKey), 300000);
    
    const embed = new EmbedBuilder()
      .setTitle('🎮 Which PlayStation is your primary?')
      .setDescription(`You selected both **PlayStation 4** and **PlayStation 5**.

Which one do you **primarily** play on? This helps others know which console to expect when grouping up with you.

Your primary will be shown on the member list.`)
      .setColor(0x003087)
      .setFooter({ text: 'You\'ll keep both roles, this just marks your main console' });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('primary_ps5')
          .setLabel('PlayStation 5')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('5️⃣'),
        new ButtonBuilder()
          .setCustomId('primary_ps4')
          .setLabel('PlayStation 4')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('4️⃣')
      );
    
    try {
      await member.send({ embeds: [embed], components: [row] });
    } catch (e) {
      console.log(`Could not DM ${member.user.tag} for primary console selection`);
    }
  }
  // If they only have one console, no primary role needed
}

/**
 * Handle primary selection button
 */
async function handlePrimarySelection(interaction) {
  const isPrimary5 = interaction.customId === 'primary_ps5';
  const consoleChoice = isPrimary5 ? 'ps5' : 'ps4';
  
  // Find a mutual guild
  let targetGuild = null;
  let targetMember = null;
  
  for (const [, guild] of interaction.client.guilds.cache) {
    try {
      const member = await guild.members.fetch(interaction.user.id);
      if (member) {
        targetGuild = guild;
        targetMember = member;
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!targetGuild || !targetMember) {
    return interaction.reply({ content: 'Could not find you in the server.', ephemeral: true });
  }
  
  await setPrimaryConsole(targetMember, targetGuild, consoleChoice);
  
  const embed = new EmbedBuilder()
    .setTitle('✅ Primary Console Set!')
    .setDescription(`Your primary console is now **PlayStation ${isPrimary5 ? '5' : '4'}**.

This will show on the member list so others know which console you mainly play on.`)
    .setColor(0x00FF00);
  
  await interaction.update({ embeds: [embed], components: [] });
}

/**
 * Set primary console role
 */
async function setPrimaryConsole(member, guild, consoleChoice) {
  const primaryPS5 = guild.roles.cache.find(r => r.name === '⭐ Primary: PS5');
  const primaryPS4 = guild.roles.cache.find(r => r.name === '⭐ Primary: PS4');
  
  try {
    // Remove both primary roles first
    if (primaryPS5 && member.roles.cache.has(primaryPS5.id)) {
      await member.roles.remove(primaryPS5);
    }
    if (primaryPS4 && member.roles.cache.has(primaryPS4.id)) {
      await member.roles.remove(primaryPS4);
    }
    
    // Add the correct primary role
    if (consoleChoice === 'ps5' && primaryPS5) {
      await member.roles.add(primaryPS5);
      console.log(`Set ${member.user.tag}'s primary to PS5`);
    } else if (consoleChoice === 'ps4' && primaryPS4) {
      await member.roles.add(primaryPS4);
      console.log(`Set ${member.user.tag}'s primary to PS4`);
    }
  } catch (e) {
    console.error('Error setting primary console:', e);
  }
}

/**
 * Update primary after removing a PlayStation role
 */
async function updatePrimaryAfterRemoval(member, guild, removedRole) {
  const primaryPS5 = guild.roles.cache.find(r => r.name === '⭐ Primary: PS5');
  const primaryPS4 = guild.roles.cache.find(r => r.name === '⭐ Primary: PS4');
  
  try {
    // When they remove a console, remove any primary role
    // Primary is only for people with BOTH consoles
    if (primaryPS5 && member.roles.cache.has(primaryPS5.id)) {
      await member.roles.remove(primaryPS5);
    }
    if (primaryPS4 && member.roles.cache.has(primaryPS4.id)) {
      await member.roles.remove(primaryPS4);
    }
  } catch (e) {
    console.error('Error updating primary after removal:', e);
  }
}

module.exports = { setupReactionRoles, EMOJI_ROLE_MAP };
