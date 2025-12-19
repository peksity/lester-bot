/**
 * REACTION ROLES HANDLER
 * Handles role assignment via reactions in the roles channel
 */

const { Events } = require('discord.js');

// Emoji to Role mapping
const EMOJI_ROLE_MAP = {
  '💰': '💰 Los Santos Hustler',
  '🐴': '🐴 Frontier Outlaw',
  '🎮': '🎮 PS5',
  '🕹️': '🕹️ PS4',
  '🏝️': '🏝️ Cayo Grinder',
  '🚁': '🚁 Heist Crew',
  '🛞': '🛞 Wagon Runner',
  '💀': '💀 Bounty Hunter'
};

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
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  });
  
  console.log('✅ Reaction roles handler initialized');
}

module.exports = { setupReactionRoles, EMOJI_ROLE_MAP };
