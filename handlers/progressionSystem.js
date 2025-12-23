/**
 * PROGRESSION SYSTEM
 * Handles:
 * - Fresh Spawn removal after 7 days
 * - Time-based rank promotions
 * - Booster detection and VIP role
 * - Activity tracking
 */

const { EmbedBuilder } = require('discord.js');
const cron = require('node-cron');

// Rank thresholds (in days)
const RANKS = {
  FRESH_SPAWN: { name: '🆕 Fresh Spawn', days: 0, remove: true },      // Removed after 7 days
  PATCHED_IN: { name: '⭐ Patched In', days: 7 },                       // 7+ days
  GLITCH_VETERAN: { name: '🏆 Glitch Veteran', days: 30 },             // 30+ days
  METHOD_FINDER: { name: '💎 Method Finder', days: 90 }                // 90+ days
};

// VIP role name
const VIP_ROLE = '💜 VIP';

/**
 * Initialize progression system
 */
function initialize(client) {
  console.log('[PROGRESSION] Initializing progression system...');
  
  // Run rank check every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[PROGRESSION] Running hourly rank check...');
    await checkAllMemberRanks(client);
  });
  
  // Run daily at midnight for full check
  cron.schedule('0 0 * * *', async () => {
    console.log('[PROGRESSION] Running daily full rank check...');
    await checkAllMemberRanks(client);
  });
  
  // Check boosters on guild member update
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    await handleBoosterUpdate(oldMember, newMember);
  });
  
  // Check new members
  client.on('guildMemberAdd', async (member) => {
    await assignFreshSpawn(member);
  });
  
  console.log('[PROGRESSION] ✅ Progression system initialized');
}

/**
 * Assign Fresh Spawn role to new members
 */
async function assignFreshSpawn(member) {
  try {
    const freshSpawnRole = member.guild.roles.cache.find(r => r.name === '🆕 Fresh Spawn');
    if (freshSpawnRole && !member.roles.cache.has(freshSpawnRole.id)) {
      await member.roles.add(freshSpawnRole);
      console.log(`[PROGRESSION] Assigned Fresh Spawn to ${member.user.tag}`);
      
      // Store join date in database for tracking
      // (The member.joinedAt is already available, but we can track it for reliability)
    }
  } catch (error) {
    console.error('[PROGRESSION] Error assigning Fresh Spawn:', error);
  }
}

/**
 * Check and update ranks for all members in all guilds
 */
async function checkAllMemberRanks(client) {
  for (const [, guild] of client.guilds.cache) {
    try {
      // Fetch all members
      await guild.members.fetch();
      
      const roles = {
        freshSpawn: guild.roles.cache.find(r => r.name === RANKS.FRESH_SPAWN.name),
        patchedIn: guild.roles.cache.find(r => r.name === RANKS.PATCHED_IN.name),
        glitchVeteran: guild.roles.cache.find(r => r.name === RANKS.GLITCH_VETERAN.name),
        methodFinder: guild.roles.cache.find(r => r.name === RANKS.METHOD_FINDER.name),
        vip: guild.roles.cache.find(r => r.name === VIP_ROLE)
      };
      
      let promoted = 0;
      let freshSpawnRemoved = 0;
      
      for (const [, member] of guild.members.cache) {
        if (member.user.bot) continue;
        
        const daysInServer = getDaysInServer(member);
        
        // Remove Fresh Spawn after 7 days
        if (roles.freshSpawn && member.roles.cache.has(roles.freshSpawn.id) && daysInServer >= 7) {
          await member.roles.remove(roles.freshSpawn);
          freshSpawnRemoved++;
          
          // Give Patched In if they don't have it
          if (roles.patchedIn && !member.roles.cache.has(roles.patchedIn.id)) {
            await member.roles.add(roles.patchedIn);
            promoted++;
            await sendPromotionDM(member, RANKS.PATCHED_IN.name, 'You can now post in #clips!');
          }
        }
        
        // Promote to Patched In at 7 days
        if (roles.patchedIn && daysInServer >= 7 && !member.roles.cache.has(roles.patchedIn.id)) {
          // Make sure they don't still have Fresh Spawn
          if (roles.freshSpawn && member.roles.cache.has(roles.freshSpawn.id)) {
            await member.roles.remove(roles.freshSpawn);
          }
          await member.roles.add(roles.patchedIn);
          promoted++;
          await sendPromotionDM(member, RANKS.PATCHED_IN.name, 'You can now post in #clips!');
        }
        
        // Promote to Glitch Veteran at 30 days
        if (roles.glitchVeteran && daysInServer >= 30 && !member.roles.cache.has(roles.glitchVeteran.id)) {
          await member.roles.add(roles.glitchVeteran);
          promoted++;
          await sendPromotionDM(member, RANKS.GLITCH_VETERAN.name, 'You\'re now a trusted member of the community!');
        }
        
        // Promote to Method Finder at 90 days
        if (roles.methodFinder && daysInServer >= 90 && !member.roles.cache.has(roles.methodFinder.id)) {
          await member.roles.add(roles.methodFinder);
          promoted++;
          await sendPromotionDM(member, RANKS.METHOD_FINDER.name, 'You\'re now a senior member! Thanks for being part of the community.');
        }
        
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
      }
      
      if (promoted > 0 || freshSpawnRemoved > 0) {
        console.log(`[PROGRESSION] ${guild.name}: ${promoted} promoted, ${freshSpawnRemoved} Fresh Spawn removed`);
        
        // Log to bot-actions if it exists
        const logChannel = guild.channels.cache.find(c => c.name === 'bot-actions');
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('📊 Daily Progression Update')
            .setDescription(`**Promotions:** ${promoted} members\n**Fresh Spawn Removed:** ${freshSpawnRemoved} members`)
            .setColor(0x00FF00)
            .setTimestamp();
          
          await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
      
    } catch (error) {
      console.error(`[PROGRESSION] Error checking ranks for ${guild.name}:`, error);
    }
  }
}

/**
 * Calculate days a member has been in the server
 */
function getDaysInServer(member) {
  if (!member.joinedAt) return 0;
  const now = Date.now();
  const joined = member.joinedAt.getTime();
  return Math.floor((now - joined) / (1000 * 60 * 60 * 24));
}

/**
 * Send promotion DM to member
 */
async function sendPromotionDM(member, rankName, message) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎉 You\'ve Been Promoted!')
      .setDescription(`Congratulations! You've earned the **${rankName}** role in **The Unpatched Method**!`)
      .addFields({ name: 'What\'s New', value: message })
      .setColor(0xFFD700)
      .setFooter({ text: 'Keep grinding!' })
      .setTimestamp();
    
    await member.send({ embeds: [embed] });
    console.log(`[PROGRESSION] Sent promotion DM to ${member.user.tag} for ${rankName}`);
  } catch (error) {
    // User has DMs disabled - that's fine
    console.log(`[PROGRESSION] Could not DM ${member.user.tag} (DMs disabled)`);
  }
}

/**
 * Handle booster status changes
 */
async function handleBoosterUpdate(oldMember, newMember) {
  const wasBooster = oldMember.premiumSince !== null;
  const isBooster = newMember.premiumSince !== null;
  
  const vipRole = newMember.guild.roles.cache.find(r => r.name === VIP_ROLE);
  if (!vipRole) return;
  
  try {
    // User started boosting
    if (!wasBooster && isBooster) {
      if (!newMember.roles.cache.has(vipRole.id)) {
        await newMember.roles.add(vipRole);
        console.log(`[PROGRESSION] Added VIP to booster ${newMember.user.tag}`);
        
        // Send thank you DM
        await sendBoosterThankYou(newMember);
        
        // Announce in general
        await announceBooster(newMember);
      }
    }
    
    // User stopped boosting
    if (wasBooster && !isBooster) {
      if (newMember.roles.cache.has(vipRole.id)) {
        await newMember.roles.remove(vipRole);
        console.log(`[PROGRESSION] Removed VIP from ex-booster ${newMember.user.tag}`);
      }
    }
  } catch (error) {
    console.error('[PROGRESSION] Error handling booster update:', error);
  }
}

/**
 * Send thank you DM to new booster
 */
async function sendBoosterThankYou(member) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('💜 THANK YOU FOR BOOSTING!')
      .setDescription(`You're amazing, ${member.user.username}! Your boost helps keep The Unpatched Method running.`)
      .addFields(
        { name: '🎁 Your VIP Perks', value: 
          '• 💜 **VIP Role** - Hoisted above regular members\n' +
          '• 🏠 **VIP Lounge** - Exclusive booster chat\n' +
          '• ⚡ **Priority LFG** - You get matched first\n' +
          '• 🎨 **Custom Color** - Stand out in chat\n' +
          '• 🎭 **Exclusive Reactions** - Special emoji access'
        }
      )
      .setColor(0xFF73FA)
      .setFooter({ text: 'You\'re a real one. 💜' })
      .setTimestamp();
    
    await member.send({ embeds: [embed] });
  } catch (error) {
    // DMs disabled
  }
}

/**
 * Announce new booster in general chat
 */
async function announceBooster(member) {
  try {
    const generalChannel = member.guild.channels.cache.find(c => c.name === 'general-chat');
    if (!generalChannel) return;
    
    const embed = new EmbedBuilder()
      .setTitle('💜 NEW SERVER BOOSTER!')
      .setDescription(`**${member.user.tag}** just boosted the server!\n\nThank you for supporting The Unpatched Method! 🎉`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(0xFF73FA)
      .setTimestamp();
    
    await generalChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('[PROGRESSION] Error announcing booster:', error);
  }
}

/**
 * Manual command to check a user's progression
 */
async function checkUserProgression(member) {
  const daysInServer = getDaysInServer(member);
  
  let currentRank = 'None';
  let nextRank = RANKS.PATCHED_IN.name;
  let daysUntilNext = RANKS.PATCHED_IN.days - daysInServer;
  
  if (daysInServer >= 90) {
    currentRank = RANKS.METHOD_FINDER.name;
    nextRank = 'MAX RANK';
    daysUntilNext = 0;
  } else if (daysInServer >= 30) {
    currentRank = RANKS.GLITCH_VETERAN.name;
    nextRank = RANKS.METHOD_FINDER.name;
    daysUntilNext = 90 - daysInServer;
  } else if (daysInServer >= 7) {
    currentRank = RANKS.PATCHED_IN.name;
    nextRank = RANKS.GLITCH_VETERAN.name;
    daysUntilNext = 30 - daysInServer;
  } else {
    currentRank = RANKS.FRESH_SPAWN.name;
    daysUntilNext = 7 - daysInServer;
  }
  
  return {
    daysInServer,
    currentRank,
    nextRank,
    daysUntilNext,
    isBooster: member.premiumSince !== null,
    joinedAt: member.joinedAt
  };
}

/**
 * Force check ranks for a specific guild (for ?setup or manual trigger)
 */
async function forceCheckGuild(guild) {
  const client = { guilds: { cache: new Map([[guild.id, guild]]) } };
  await checkAllMemberRanks(client);
}

module.exports = { 
  initialize, 
  assignFreshSpawn, 
  checkUserProgression, 
  forceCheckGuild,
  getDaysInServer,
  RANKS,
  VIP_ROLE
};
