/**
 * ACTIVITY RANKING SYSTEM
 * Tracks completions and awards activity-based roles
 * Includes anti-abuse measures
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// ROLE DEFINITIONS WITH HEX COLORS
// ============================================

const ROLES = {
  // Staff Roles
  staff: {
    'owner': { name: '👑 Owner', color: '#FFD700', hoist: true, permissions: 'ADMIN' },
    'mastermind': { name: '🧠 Mastermind', color: '#FF0000', hoist: true, permissions: 'ADMIN' },
    'enforcer': { name: '🔫 Enforcer', color: '#FF4500', hoist: true, permissions: 'ADMIN' },
    'deputy': { name: '🤠 Deputy', color: '#FFA500', hoist: true, permissions: 'MOD' },
    'mechanic': { name: '🔧 Mechanic', color: '#00CED1', hoist: true, permissions: 'MOD' }
  },
  
  // VIP
  vip: {
    'vip': { name: '💜 VIP', color: '#FF73FA', hoist: true, permissions: 'MEMBER' }
  },
  
  // Bot Roles
  bots: {
    'lester': { name: 'Lester', color: '#FFA500', hoist: true, permissions: 'BOT' },
    'pavel': { name: 'Pavel', color: '#FFD700', hoist: true, permissions: 'BOT' },
    'cripps': { name: 'Cripps', color: '#8B4513', hoist: true, permissions: 'BOT' },
    'madam_nazar': { name: 'Madam Nazar', color: '#9B59B6', hoist: true, permissions: 'BOT' },
    'police_chief': { name: 'Police Chief', color: '#C0392B', hoist: true, permissions: 'BOT' }
  },
  
  // Time-Based Progression
  progression: {
    'method_finder': { name: '💎 Method Finder', color: '#E91E63', hoist: true, days: 90 },
    'glitch_veteran': { name: '🏆 Glitch Veteran', color: '#9C27B0', hoist: true, days: 30 },
    'patched_in': { name: '⭐ Patched In', color: '#4CAF50', hoist: false, days: 7 },
    'fresh_spawn': { name: '🆕 Fresh Spawn', color: '#607D8B', hoist: false, days: 0 }
  },
  
  // GTA Cayo Activity Ranks
  cayo: {
    'el_rubios_nightmare': { name: '👑 El Rubio\'s Nightmare', color: '#FFD700', hoist: true, completions: 100 },
    'whale_hunter': { name: '🐋 Whale Hunter', color: '#0097A7', hoist: true, completions: 50 },
    'shark_card_killer': { name: '🦈 Shark Card Killer', color: '#00CED1', hoist: false, completions: 25 },
    'small_fry': { name: '🐟 Small Fry', color: '#87CEEB', hoist: false, completions: 5 }
  },
  
  // RDO Wagon Activity Ranks
  wagon: {
    'cripps_partner': { name: '🏰 Cripps\' Partner', color: '#8B4513', hoist: true, completions: 100 },
    'trade_baron': { name: '🚚 Trade Baron', color: '#A0522D', hoist: true, completions: 50 },
    'supply_runner': { name: '🛒 Supply Runner', color: '#CD853F', hoist: false, completions: 25 },
    'delivery_boy': { name: '📦 Delivery Boy', color: '#D2691E', hoist: false, completions: 5 }
  },
  
  // RDO Bounty Activity Ranks
  bounty: {
    'grim_reaper': { name: '💀 Grim Reaper', color: '#4A0000', hoist: true, completions: 100 },
    'manhunter': { name: '⚔️ Manhunter', color: '#8B0000', hoist: true, completions: 50 },
    'sharpshooter': { name: '🎯 Sharpshooter', color: '#B22222', hoist: false, completions: 25 },
    'rookie_hunter': { name: '🔫 Rookie Hunter', color: '#DC143C', hoist: false, completions: 5 }
  },
  
  // Special Achievement Roles
  achievements: {
    'the_one': { name: '🏆 The #1', color: '#FFD700', hoist: true },
    'helping_hand': { name: '🌟 Helping Hand', color: '#FF69B4', hoist: true, helperSessions: 50 },
    'veteran_grinder': { name: '🎖️ Veteran Grinder', color: '#DAA520', hoist: true, totalCompletions: 500 },
    'on_fire': { name: '🔥 On Fire', color: '#FF4500', hoist: false } // 10 in 24hrs - temporary
  },
  
  // Game Roles (unlock categories)
  games: {
    'los_santos_hustler': { name: '💰 Los Santos Hustler', color: '#2ECC71', hoist: false },
    'frontier_outlaw': { name: '🐴 Frontier Outlaw', color: '#8B4513', hoist: false }
  },
  
  // Platform Roles
  platform: {
    'primary_ps5': { name: '⭐ Primary: PS5', color: '#00D4FF', hoist: true },
    'primary_ps4': { name: '⭐ Primary: PS4', color: '#00BFFF', hoist: true },
    'ps5': { name: '🎮 PlayStation 5', color: '#003087', hoist: false },
    'ps4': { name: '🎮 PlayStation 4', color: '#003087', hoist: false }
  },
  
  // LFG Ping Roles
  lfg: {
    'cayo_grinder': { name: '🏝️ Cayo Grinder', color: '#00BCD4', hoist: false },
    'heist_crew': { name: '🚁 Heist Crew', color: '#FF9800', hoist: false },
    'wagon_runner': { name: '🛞 Wagon Runner', color: '#795548', hoist: false },
    'bounty_hunter_ping': { name: '💀 Bounty Hunter', color: '#F44336', hoist: false }
  },
  
  // Utility Roles
  utility: {
    'verified': { name: '✅ Verified', color: '#2ECC71', hoist: false },
    'muted': { name: 'Muted', color: '#000000', hoist: false }
  }
};

// ============================================
// ANTI-ABUSE CONFIGURATION
// ============================================

const ANTI_ABUSE = {
  // Minimum time (in minutes) before a session can be completed
  minSessionTime: {
    cayo: 15,      // Cayo takes ~15 mins minimum
    casino: 20,    // Casino takes longer
    heist: 15,     // Generic heist
    wagon: 8,      // Wagon delivery ~8 mins
    bounty: 5,     // Bounty can be quick
    moonshine: 5,  // Moonshine delivery
    default: 10
  },
  
  // Cooldown between completions (minutes)
  cooldown: {
    cayo: 10,
    wagon: 5,
    bounty: 3,
    default: 5
  },
  
  // Maximum completions per day per activity
  dailyLimit: {
    cayo: 15,
    wagon: 20,
    bounty: 25,
    default: 20
  },
  
  // Minimum crew size for completion to count
  minCrewSize: 2,
  
  // Percentage of crew that must confirm completion
  confirmationThreshold: 0.5, // 50% must confirm
  
  // Flag if same 2 people complete X times together in a day
  farmingThreshold: 5
};

// ============================================
// SESSION TRACKING
// ============================================

// In-memory session tracking (should be moved to database for persistence)
const activeSessions = new Map(); // sessionId -> session data
const userCooldowns = new Map();  // userId -> { activityType: lastCompletionTime }
const dailyCompletions = new Map(); // userId -> { activityType: count, date: dateString }
const pairTracking = new Map();   // userId1-userId2 -> { count, date }

/**
 * Start a new LFG session
 */
function startSession(sessionId, hostId, activityType, channelId, guildId) {
  const session = {
    id: sessionId,
    hostId,
    activityType,
    channelId,
    guildId,
    startTime: Date.now(),
    participants: new Set([hostId]),
    confirmations: new Set(),
    status: 'recruiting', // recruiting, in_progress, pending_confirmation, completed, cancelled
    createdAt: new Date()
  };
  
  activeSessions.set(sessionId, session);
  console.log(`[ACTIVITY] Session ${sessionId} started by ${hostId} for ${activityType}`);
  
  return session;
}

/**
 * Add participant to session
 */
function joinSession(sessionId, userId) {
  const session = activeSessions.get(sessionId);
  if (!session) return { success: false, error: 'Session not found' };
  
  if (session.status !== 'recruiting') {
    return { success: false, error: 'Session is no longer recruiting' };
  }
  
  session.participants.add(userId);
  console.log(`[ACTIVITY] User ${userId} joined session ${sessionId}`);
  
  return { success: true, session };
}

/**
 * Attempt to complete a session
 * Returns validation result
 */
async function attemptCompletion(sessionId, userId, client) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found', code: 'NO_SESSION' };
  }
  
  // Only host can initiate completion
  if (session.hostId !== userId) {
    return { success: false, error: 'Only the host can complete the session', code: 'NOT_HOST' };
  }
  
  // Check minimum crew size
  if (session.participants.size < ANTI_ABUSE.minCrewSize) {
    return { 
      success: false, 
      error: `Need at least ${ANTI_ABUSE.minCrewSize} people to complete. Currently: ${session.participants.size}`,
      code: 'NOT_ENOUGH_PLAYERS'
    };
  }
  
  // Check minimum time
  const minTime = (ANTI_ABUSE.minSessionTime[session.activityType] || ANTI_ABUSE.minSessionTime.default) * 60 * 1000;
  const elapsed = Date.now() - session.startTime;
  
  if (elapsed < minTime) {
    const remaining = Math.ceil((minTime - elapsed) / 60000);
    return {
      success: false,
      error: `Session too short! Wait ${remaining} more minute(s). This prevents abuse.`,
      code: 'TOO_FAST',
      remaining
    };
  }
  
  // Check host cooldown
  const cooldownResult = checkCooldown(userId, session.activityType);
  if (!cooldownResult.allowed) {
    return {
      success: false,
      error: `You're on cooldown! Wait ${cooldownResult.remaining} minute(s) before completing another ${session.activityType}.`,
      code: 'COOLDOWN',
      remaining: cooldownResult.remaining
    };
  }
  
  // Check daily limit
  const dailyResult = checkDailyLimit(userId, session.activityType);
  if (!dailyResult.allowed) {
    return {
      success: false,
      error: `Daily limit reached! You've completed ${dailyResult.count}/${dailyResult.limit} ${session.activityType} sessions today.`,
      code: 'DAILY_LIMIT'
    };
  }
  
  // Set session to pending confirmation
  session.status = 'pending_confirmation';
  session.confirmations.add(userId); // Host auto-confirms
  
  return {
    success: true,
    needsConfirmation: true,
    session,
    participantsToConfirm: [...session.participants].filter(p => p !== userId)
  };
}

/**
 * Confirm completion (called by participants)
 */
async function confirmCompletion(sessionId, userId, client) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found' };
  }
  
  if (!session.participants.has(userId)) {
    return { success: false, error: 'You are not part of this session' };
  }
  
  if (session.status !== 'pending_confirmation') {
    return { success: false, error: 'Session is not awaiting confirmation' };
  }
  
  session.confirmations.add(userId);
  
  // Check if enough confirmations
  const required = Math.ceil(session.participants.size * ANTI_ABUSE.confirmationThreshold);
  
  if (session.confirmations.size >= required) {
    // Complete the session!
    return await finalizeCompletion(session, client);
  }
  
  return {
    success: true,
    confirmed: true,
    waiting: true,
    confirmations: session.confirmations.size,
    required
  };
}

/**
 * Finalize a completed session - award rep and track activity
 */
async function finalizeCompletion(session, client) {
  session.status = 'completed';
  
  const results = {
    success: true,
    completed: true,
    participants: [],
    flagged: false,
    flags: []
  };
  
  // Check for farming (same pairs)
  const farmingFlags = checkForFarming(session);
  if (farmingFlags.length > 0) {
    results.flagged = true;
    results.flags = farmingFlags;
  }
  
  // Award completions to all participants
  for (const userId of session.participants) {
    try {
      // Record completion
      await recordCompletion(userId, session.activityType, session.hostId === userId, client);
      
      // Set cooldown
      setCooldown(userId, session.activityType);
      
      // Increment daily count
      incrementDailyCount(userId, session.activityType);
      
      // Track pairs for farming detection
      trackPairs(session);
      
      results.participants.push({
        userId,
        isHost: session.hostId === userId,
        credited: true
      });
      
    } catch (error) {
      console.error(`[ACTIVITY] Error crediting ${userId}:`, error);
      results.participants.push({
        userId,
        credited: false,
        error: error.message
      });
    }
  }
  
  // Check for rank ups
  for (const userId of session.participants) {
    await checkAndAwardActivityRanks(userId, session.activityType, session.guildId, client);
  }
  
  // Clean up session
  activeSessions.delete(session.id);
  
  return results;
}

/**
 * Record a completion in the database
 */
async function recordCompletion(userId, activityType, isHost, client) {
  const query = `
    INSERT INTO activity_completions (user_id, activity_type, is_host, completed_at)
    VALUES ($1, $2, $3, NOW())
  `;
  
  try {
    await client.db.query(query, [userId, activityType, isHost]);
  } catch (error) {
    // If table doesn't exist, create it
    if (error.message.includes('does not exist')) {
      await createActivityTables(client);
      await client.db.query(query, [userId, activityType, isHost]);
    } else {
      throw error;
    }
  }
}

/**
 * Get user's completion count for an activity
 */
async function getCompletionCount(userId, activityType, client) {
  try {
    const result = await client.db.query(
      `SELECT COUNT(*) as count FROM activity_completions WHERE user_id = $1 AND activity_type = $2`,
      [userId, activityType]
    );
    return parseInt(result.rows[0]?.count || 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Get user's total completions across all activities
 */
async function getTotalCompletions(userId, client) {
  try {
    const result = await client.db.query(
      `SELECT COUNT(*) as count FROM activity_completions WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Get user's helper sessions (non-host completions)
 */
async function getHelperSessions(userId, client) {
  try {
    const result = await client.db.query(
      `SELECT COUNT(*) as count FROM activity_completions WHERE user_id = $1 AND is_host = false`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Check and award activity-based ranks
 */
async function checkAndAwardActivityRanks(userId, activityType, guildId, client) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  
  // Get relevant rank category
  let rankCategory;
  if (['cayo', 'casino', 'heist', 'bogdan', 'doomsday'].includes(activityType)) {
    rankCategory = ROLES.cayo;
  } else if (['wagon', 'delivery', 'trader', 'moonshine'].includes(activityType)) {
    rankCategory = ROLES.wagon;
  } else if (['bounty', 'legendary'].includes(activityType)) {
    rankCategory = ROLES.bounty;
  } else {
    return; // Unknown activity type
  }
  
  const count = await getCompletionCount(userId, activityType, client);
  
  // Find highest eligible rank
  const sortedRanks = Object.values(rankCategory).sort((a, b) => b.completions - a.completions);
  
  for (const rank of sortedRanks) {
    if (count >= rank.completions) {
      const role = guild.roles.cache.find(r => r.name === rank.name);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        console.log(`[ACTIVITY] Awarded ${rank.name} to ${member.user.tag} (${count} completions)`);
        
        // Send DM
        await sendRankUpDM(member, rank.name, activityType, count);
        
        // Remove lower ranks in same category
        for (const lowerRank of sortedRanks) {
          if (lowerRank.completions < rank.completions) {
            const lowerRole = guild.roles.cache.find(r => r.name === lowerRank.name);
            if (lowerRole && member.roles.cache.has(lowerRole.id)) {
              await member.roles.remove(lowerRole);
            }
          }
        }
      }
      break; // Only award highest eligible
    }
  }
  
  // Check special achievements
  await checkSpecialAchievements(member, client);
}

/**
 * Check for special achievement roles
 */
async function checkSpecialAchievements(member, client) {
  const userId = member.user.id visé;
  const guild = member.guild;
  
  // Veteran Grinder - 500+ total completions
  const total = await getTotalCompletions(userId, client);
  if (total >= 500) {
    const role = guild.roles.cache.find(r => r.name === ROLES.achievements.veteran_grinder.name);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      await sendRankUpDM(member, ROLES.achievements.veteran_grinder.name, 'total', total);
    }
  }
  
  // Helping Hand - 50+ helper sessions
  const helperCount = await getHelperSessions(userId, client);
  if (helperCount >= 50) {
    const role = guild.roles.cache.find(r => r.name === ROLES.achievements.helping_hand.name);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      await sendRankUpDM(member, ROLES.achievements.helping_hand.name, 'helper', helperCount);
    }
  }
}

/**
 * Send rank up DM
 */
async function sendRankUpDM(member, rankName, activityType, count) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🎉 NEW RANK UNLOCKED!')
      .setDescription(`Congratulations ${member.user.username}!`)
      .addFields(
        { name: '🏅 New Rank', value: rankName, inline: true },
        { name: '📊 Completions', value: `${count}`, inline: true }
      )
      .setColor('#FFD700')
      .setFooter({ text: 'Keep grinding!' })
      .setTimestamp();
    
    await member.send({ embeds: [embed] });
  } catch (e) {
    // DMs disabled
  }
}

// ============================================
// ANTI-ABUSE HELPERS
// ============================================

function checkCooldown(userId, activityType) {
  const userCd = userCooldowns.get(userId);
  if (!userCd || !userCd[activityType]) {
    return { allowed: true };
  }
  
  const cooldownMs = (ANTI_ABUSE.cooldown[activityType] || ANTI_ABUSE.cooldown.default) * 60 * 1000;
  const elapsed = Date.now() - userCd[activityType];
  
  if (elapsed < cooldownMs) {
    return {
      allowed: false,
      remaining: Math.ceil((cooldownMs - elapsed) / 60000)
    };
  }
  
  return { allowed: true };
}

function setCooldown(userId, activityType) {
  if (!userCooldowns.has(userId)) {
    userCooldowns.set(userId, {});
  }
  userCooldowns.get(userId)[activityType] = Date.now();
}

function checkDailyLimit(userId, activityType) {
  const today = new Date().toDateString();
  const userDaily = dailyCompletions.get(userId);
  
  if (!userDaily || userDaily.date !== today) {
    return { allowed: true, count: 0, limit: ANTI_ABUSE.dailyLimit[activityType] || ANTI_ABUSE.dailyLimit.default };
  }
  
  const count = userDaily[activityType] || 0;
  const limit = ANTI_ABUSE.dailyLimit[activityType] || ANTI_ABUSE.dailyLimit.default;
  
  return {
    allowed: count < limit,
    count,
    limit
  };
}

function incrementDailyCount(userId, activityType) {
  const today = new Date().toDateString();
  
  if (!dailyCompletions.has(userId) || dailyCompletions.get(userId).date !== today) {
    dailyCompletions.set(userId, { date: today });
  }
  
  const userDaily = dailyCompletions.get(userId);
  userDaily[activityType] = (userDaily[activityType] || 0) + 1;
}

function trackPairs(session) {
  const today = new Date().toDateString();
  const participants = [...session.participants];
  
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const pairKey = [participants[i], participants[j]].sort().join('-');
      
      if (!pairTracking.has(pairKey) || pairTracking.get(pairKey).date !== today) {
        pairTracking.set(pairKey, { count: 0, date: today });
      }
      
      pairTracking.get(pairKey).count++;
    }
  }
}

function checkForFarming(session) {
  const today = new Date().toDateString();
  const flags = [];
  const participants = [...session.participants];
  
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const pairKey = [participants[i], participants[j]].sort().join('-');
      const pairData = pairTracking.get(pairKey);
      
      if (pairData && pairData.date === today && pairData.count >= ANTI_ABUSE.farmingThreshold) {
        flags.push({
          users: [participants[i], participants[j]],
          count: pairData.count,
          message: `Potential farming: ${pairData.count} sessions together today`
        });
      }
    }
  }
  
  return flags;
}

// ============================================
// DATABASE SETUP
// ============================================

async function createActivityTables(client) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS activity_completions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(32) NOT NULL,
      activity_type VARCHAR(32) NOT NULL,
      is_host BOOLEAN DEFAULT false,
      completed_at TIMESTAMP DEFAULT NOW(),
      flagged BOOLEAN DEFAULT false,
      flag_reason TEXT
    )`,
    `CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_completions(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_completions(activity_type)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_completions(completed_at)`
  ];
  
  for (const query of queries) {
    try {
      await client.db.query(query);
    } catch (e) {
      console.error('[ACTIVITY] Error creating table:', e.message);
    }
  }
}

/**
 * Get user's activity stats
 */
async function getUserStats(userId, client) {
  try {
    const stats = {
      cayo: await getCompletionCount(userId, 'cayo', client),
      wagon: await getCompletionCount(userId, 'wagon', client),
      bounty: await getCompletionCount(userId, 'bounty', client),
      total: await getTotalCompletions(userId, client),
      helper: await getHelperSessions(userId, client)
    };
    
    // Add other heist types to cayo count
    stats.cayo += await getCompletionCount(userId, 'casino', client);
    stats.cayo += await getCompletionCount(userId, 'heist', client);
    stats.cayo += await getCompletionCount(userId, 'bogdan', client);
    
    // Add other wagon types
    stats.wagon += await getCompletionCount(userId, 'delivery', client);
    stats.wagon += await getCompletionCount(userId, 'trader', client);
    stats.wagon += await getCompletionCount(userId, 'moonshine', client);
    
    // Add legendary to bounty
    stats.bounty += await getCompletionCount(userId, 'legendary', client);
    
    return stats;
  } catch (error) {
    return { cayo: 0, wagon: 0, bounty: 0, total: 0, helper: 0 };
  }
}

/**
 * Get leaderboard
 */
async function getLeaderboard(activityType, limit, client) {
  try {
    let types;
    if (activityType === 'cayo') {
      types = ['cayo', 'casino', 'heist', 'bogdan', 'doomsday'];
    } else if (activityType === 'wagon') {
      types = ['wagon', 'delivery', 'trader', 'moonshine'];
    } else if (activityType === 'bounty') {
      types = ['bounty', 'legendary'];
    } else {
      types = [activityType];
    }
    
    const result = await client.db.query(
      `SELECT user_id, COUNT(*) as count 
       FROM activity_completions 
       WHERE activity_type = ANY($1)
       GROUP BY user_id 
       ORDER BY count DESC 
       LIMIT $2`,
      [types, limit]
    );
    
    return result.rows;
  } catch (error) {
    return [];
  }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  ROLES,
  ANTI_ABUSE,
  startSession,
  joinSession,
  attemptCompletion,
  confirmCompletion,
  getCompletionCount,
  getTotalCompletions,
  getUserStats,
  getLeaderboard,
  checkAndAwardActivityRanks,
  createActivityTables,
  activeSessions
};
