/**
 * ██╗     ███████╗███████╗████████╗███████╗██████╗     ██╗   ██╗██╗  ████████╗██╗███╗   ███╗ █████╗ ████████╗███████╗
 * ██║     ██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ██║   ██║██║  ╚══██╔══╝██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
 * ██║     █████╗  ███████╗   ██║   █████╗  ██████╔╝    ██║   ██║██║     ██║   ██║██╔████╔██║███████║   ██║   █████╗  
 * ██║     ██╔══╝  ╚════██║   ██║   ██╔══╝  ██╔══██╗    ██║   ██║██║     ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  
 * ███████╗███████╗███████║   ██║   ███████╗██║  ██║    ╚██████╔╝███████╗██║   ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
 * ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝╚═╝   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
 * 
 * THE MASTERMIND - COMPLETE ULTIMATE EDITION
 * ALL FEATURES + V6 INTELLIGENCE + ACTIVITY SYSTEMS
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits, Events } = require('discord.js');
const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

// HANDLER IMPORTS
const setupHandler = require('./handlers/setup');
const moderationHandler = require('./handlers/moderation');
const loggingHandler = require('./handlers/logging');
const scamDetection = require('./handlers/scamDetection');
const countingHandler = require('./handlers/counting');
const gunVanHandler = require('./handlers/gunVan');
const memoryHandler = require('./handlers/memory');
const { setupReactionRoles } = require('./handlers/reactionRoles');
const investigation = require('./handlers/investigation');
const LesterMasterBrain = require('./handlers/masterBrain');

// ULTIMATE LOGGING SYSTEM
let loggingSystem = null;
try { loggingSystem = require('./handlers/loggingSystem'); } catch (e) { console.log('[LESTER] LoggingSystem not found, using basic logging...'); }

// ACTIVITY SYSTEMS
let activityXP = null;
try { activityXP = require('./shared/activityXP'); } catch (e) { console.log('[LESTER] ActivityXP not found, skipping...'); }
let activityRanking = null;
try { activityRanking = require('./shared/activityRanking'); } catch (e) { console.log('[LESTER] ActivityRanking not found, skipping...'); }
let progressionSystem = null;
try { progressionSystem = require('./shared/progressionSystem'); } catch (e) { console.log('[LESTER] ProgressionSystem not found, skipping...'); }

// OPTIONAL SYSTEMS
let NexusCore = null; try { NexusCore = require('./nexus/core'); } catch (e) {}
let FreeRoamSystem = null; try { FreeRoamSystem = require('./freeroam'); } catch (e) {}
let TheBrain = null; try { TheBrain = require('./sentient').TheBrain; } catch (e) {}
let ApexBrain = null; try { ApexBrain = require('./apex').ApexBrain; } catch (e) {}
let VoiceSystem = null, VoiceChatHandler = null;
try { const v = require('./shared/voiceSystem'); VoiceSystem = v.VoiceSystem; VoiceChatHandler = v.VoiceChatHandler; } catch (e) {}

// V6 INTELLIGENCE
let UltimateBotIntelligence = null;
try { UltimateBotIntelligence = require('./shared/ultimateIntelligence').UltimateBotIntelligence; } catch (e) {}
let autonomousChat = null;
try { autonomousChat = require('./shared/autonomousChat'); } catch (e) {}
let mediaGenerator = null;
try { mediaGenerator = require('./shared/mediaGenerator'); } catch (e) {}

// BOT COMMANDS GUIDE
let botCommandsGuide = null;
try { botCommandsGuide = require('./shared/botCommandsGuide'); } catch (e) { console.log('[LESTER] BotCommandsGuide not found'); }

// HIVEMIND - Shared Intelligence System
let hiveMind = null;
try { hiveMind = require('./shared/hiveMind'); } catch (e) { console.log('[LESTER] HiveMind not found, using basic responses'); }

// LIVING BOTS - Personality, moods, grudges, gossip
let livingBots = null;
let grudgeSystem = null;
let gossipSystem = null;
try { livingBots = require('./shared/livingBots'); } catch (e) { console.log('[LESTER] LivingBots not found'); }

// NEW ADVANCED SYSTEMS
let ImageRecognition = null, BotImageHandlers = null;
try { const ir = require('./shared/imageRecognition'); ImageRecognition = ir.ImageRecognition; BotImageHandlers = ir.BotImageHandlers; } catch (e) { console.log('[LESTER] ImageRecognition not found'); }

let EconomySystem = null;
try { EconomySystem = require('./shared/economySystem').EconomySystem; } catch (e) { console.log('[LESTER] EconomySystem not found'); }

let KlingAI = null, KlingCommands = null;
try { const k = require('./shared/klingAI'); KlingAI = k.KlingAI; KlingCommands = k.KlingCommands; } catch (e) { console.log('[LESTER] KlingAI not found'); }

let HeistPlanner = null;
try { HeistPlanner = require('./shared/heistPlanner').HeistPlanner; } catch (e) { console.log('[LESTER] HeistPlanner not found'); }

let ReputationSystem = null;
try { ReputationSystem = require('./shared/reputationSystem').ReputationSystem; } catch (e) { console.log('[LESTER] ReputationSystem not found'); }

let PredictiveAnalytics = null;
try { PredictiveAnalytics = require('./shared/predictiveAnalytics').PredictiveAnalytics; } catch (e) { console.log('[LESTER] PredictiveAnalytics not found'); }

const MY_BOT_ID = 'lester';
const BOT_NAME = 'Lester';
const PREFIX = '?';
const OTHER_BOT_IDS = [process.env.PAVEL_BOT_ID, process.env.CRIPPS_BOT_ID, process.env.MADAM_BOT_ID, process.env.CHIEF_BOT_ID].filter(Boolean);
const ALLOWED_CHANNEL_IDS = process.env.ALLOWED_CHANNEL_IDS?.split(',').filter(Boolean) || [];

const LESTER_SYSTEM = `You are Lester Crest from GTA V. Genius hacker, heist mastermind.

CRITICAL: Keep responses SHORT - 2-4 sentences MAX unless asked for details. No essays!

PERSONALITY: Irritable genius, snarky, complains but helps. References "systems" and "networks". Sarcastic.

STYLE: One *action* max per message. Get to the point. Be helpful underneath the grumpiness.

SERVER CHANNELS (ONLY mention these - never make up channels):
- #cayo-lfg - GTA heist LFG (use ?cayo)
- #wagon-lfg - Red Dead wagon LFG (use ?wagon)
- #bounty-lfg - Red Dead bounty LFG (use ?bounty)
- #talk-to-lester - Chat with you
- #talk-to-pavel - Chat with Pavel
- #talk-to-cripps - Chat with Cripps
- #talk-to-nazar - Chat with Madam Nazar
- #talk-to-chief - Chat with Police Chief
- #bot-commands - Command reference
- #madam-nazar - Daily Nazar location
- #counting - Counting game

NEVER mention channels that don't exist. If unsure, just say "check the LFG channels".

EXAMPLES:
"*sighs* What do you want? I'm busy."
"That's literally what I do. What's the problem?"
"Check #cayo-lfg for heists. You're welcome."

You have memory. You remember users and hold grudges.`;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildInvites],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
client.db = pool; client.anthropic = anthropic;

let intelligence = null, masterBrain = null, nexusCore = null, freeRoam = null, sentientBrain = null, apexBrain = null, voiceSystem = null, voiceChatHandler = null;
let imageRecognition = null, economy = null, klingAI = null, klingCommands = null, heistPlanner = null, reputation = null, predictive = null;
const conversationMemory = new Map();
const activeConversations = new Map();

// ═══════════════════════════════════════════════════════════════
// SERVER LOCK - Bot only works in authorized servers
// ═══════════════════════════════════════════════════════════════
const AUTHORIZED_SERVERS = process.env.AUTHORIZED_SERVERS?.split(',') || [];
const OWNER_ID = process.env.OWNER_ID || '';

// ═══════════════════════════════════════════════════════════════
// LICENSE KEY SYSTEM - Bot requires valid license to operate
// ═══════════════════════════════════════════════════════════════
const LICENSE_KEY = process.env.LICENSE_KEY || '';
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'UNPATCHED_METHOD_2024_SECURE';

// Valid license keys (hashed for security)
// In production, this would call YOUR API to validate
const VALID_LICENSE_HASHES = [
  // Add your license key hashes here
  // Generated with: require('crypto').createHash('sha256').update(LICENSE_KEY + LICENSE_SECRET).digest('hex')
];

function generateLicenseHash(key) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(key + LICENSE_SECRET).digest('hex');
}

function validateLicense() {
  if (!LICENSE_KEY) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ LICENSE KEY MISSING');
    console.error('This bot requires a valid license to operate.');
    console.error('Set LICENSE_KEY in your environment variables.');
    console.error('Contact the developer to purchase a license.');
    console.error('═══════════════════════════════════════════════════════════════');
    return false;
  }
  
  const keyHash = generateLicenseHash(LICENSE_KEY);
  
  // Check against valid hashes OR if it matches the master key pattern
  // Master key format: UNPATCHED-XXXX-XXXX-XXXX (owner's key always works)
  const isMasterKey = LICENSE_KEY.startsWith('UNPATCHED-MASTER-');
  const isValidHash = VALID_LICENSE_HASHES.includes(keyHash);
  const isOwnerKey = LICENSE_KEY === process.env.MASTER_LICENSE; // Your personal master key
  
  if (!isMasterKey && !isValidHash && !isOwnerKey) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ INVALID LICENSE KEY');
    console.error('The provided license key is not valid.');
    console.error('Key:', LICENSE_KEY.slice(0, 8) + '...' + LICENSE_KEY.slice(-4));
    console.error('Contact the developer to purchase a valid license.');
    console.error('═══════════════════════════════════════════════════════════════');
    return false;
  }
  
  console.log('✅ License validated successfully');
  return true;
}

// License check on startup
if (!validateLicense()) {
  console.error('Bot shutting down due to invalid license.');
  process.exit(1);
}

function isAuthorizedServer(guildId) {
  // If no servers specified, allow all (for development)
  if (AUTHORIZED_SERVERS.length === 0) return true;
  return AUTHORIZED_SERVERS.includes(guildId);
}

client.once(Events.ClientReady, async () => {
  console.log(`\n[LESTER ULTIMATE] Logged in as ${client.user.tag} | ${client.guilds.cache.size} servers\n`);
  
  // SERVER LOCK CHECK - Leave unauthorized servers
  for (const [guildId, guild] of client.guilds.cache) {
    if (!isAuthorizedServer(guildId)) {
      console.log(`[SECURITY] Unauthorized server detected: ${guild.name} (${guildId}) - LEAVING`);
      await guild.leave().catch(() => {});
    }
  }
  
  // Count authorized servers
  const authorizedCount = client.guilds.cache.filter(g => isAuthorizedServer(g.id)).size;
  console.log(`[SECURITY] Running in ${authorizedCount} authorized server(s)`);
  
  if (authorizedCount === 0 && AUTHORIZED_SERVERS.length > 0) {
    console.log('[SECURITY] WARNING: Bot is not in any authorized servers!');
  }

  // V6 Intelligence
  if (UltimateBotIntelligence) {
    try { 
      intelligence = new UltimateBotIntelligence(pool, client, MY_BOT_ID); 
      await intelligence.initialize(); 
      console.log('🧠 V6 Intelligence: ONLINE'); 
    } catch (e) { console.error('V6:', e.message); }
  }
  
  // Master Brain
  try { 
    masterBrain = new LesterMasterBrain(pool, anthropic, client); 
    await masterBrain.initialize(); 
    console.log('🎯 Master Brain: ONLINE'); 
  } catch (e) { console.error('MasterBrain:', e.message); }
  
  // Optional systems
  if (NexusCore) try { nexusCore = new NexusCore(pool, anthropic, client); await nexusCore.initialize(); console.log('⚡ Nexus Core: ONLINE'); } catch (e) {}
  if (TheBrain) try { sentientBrain = new TheBrain(MY_BOT_ID, pool); console.log('🧬 Sentient Brain: ONLINE'); } catch (e) {}
  if (ApexBrain) try { apexBrain = new ApexBrain(MY_BOT_ID, pool); console.log('💡 Apex Brain: ONLINE'); } catch (e) {}
  if (FreeRoamSystem) try { freeRoam = new FreeRoamSystem(MY_BOT_ID, client.user.id, LESTER_SYSTEM, pool); console.log('🚀 FreeRoam: ONLINE'); } catch (e) {}
  if (VoiceSystem && process.env.ELEVENLABS_API_KEY) try { voiceSystem = new VoiceSystem(MY_BOT_ID, process.env.ELEVENLABS_API_KEY); voiceChatHandler = new VoiceChatHandler(client, voiceSystem, LESTER_SYSTEM, anthropic); voiceChatHandler.setupListeners(); console.log('🎙️ Voice: ONLINE'); } catch (e) {}
  
  // Gun Van
  try { gunVanHandler.startSchedule(client); console.log('🔫 Gun Van: ONLINE'); } catch (e) {}
  
  // Reaction Roles
  try { setupReactionRoles(client); console.log('🎭 Reaction Roles: ONLINE'); } catch (e) {}
  
  // ULTIMATE LOGGING SYSTEM
  if (loggingSystem) {
    try {
      await loggingSystem.initialize(client);
      console.log('📝 Ultimate Logging: ONLINE');
    } catch (e) { console.error('LoggingSystem:', e.message); }
  }
  
  // ACTIVITY SYSTEMS
  if (activityXP) {
    try {
      activityXP.initialize(client);
      await activityXP.createActivityTables(client);
      console.log('📊 Activity XP: ONLINE');
    } catch (e) { console.error('ActivityXP:', e.message); }
  }
  
  if (activityRanking) {
    try {
      await activityRanking.createActivityTables(client);
      console.log('🏆 Activity Ranking: ONLINE');
    } catch (e) { console.error('ActivityRanking:', e.message); }
  }
  
  if (progressionSystem) {
    try {
      progressionSystem.initialize(client);
      console.log('⏰ Progression System: ONLINE');
    } catch (e) { console.error('ProgressionSystem:', e.message); }
  }
  
  // NEW ADVANCED SYSTEMS
  if (ImageRecognition) {
    try {
      imageRecognition = new ImageRecognition(anthropic);
      console.log('🔍 Image Recognition: ONLINE');
    } catch (e) { console.error('ImageRecognition:', e.message); }
  }
  
  if (EconomySystem) {
    try {
      economy = new EconomySystem(pool);
      await economy.initialize();
      console.log('💰 Economy System: ONLINE');
    } catch (e) { console.error('EconomySystem:', e.message); }
  }
  
  if (KlingAI && process.env.KLING_ACCESS_KEY) {
    try {
      klingAI = new KlingAI(process.env.KLING_ACCESS_KEY, process.env.KLING_SECRET_KEY);
      klingCommands = new KlingCommands(klingAI);
      console.log('🎨 Kling AI: ONLINE');
    } catch (e) { console.error('KlingAI:', e.message); }
  }
  
  if (HeistPlanner) {
    try {
      heistPlanner = new HeistPlanner(anthropic);
      console.log('📋 Heist Planner: ONLINE');
    } catch (e) { console.error('HeistPlanner:', e.message); }
  }
  
  if (ReputationSystem) {
    try {
      reputation = new ReputationSystem(pool);
      await reputation.initialize();
      console.log('📊 Reputation System: ONLINE');
    } catch (e) { console.error('ReputationSystem:', e.message); }
  }
  
  if (PredictiveAnalytics) {
    try {
      predictive = new PredictiveAnalytics(pool);
      await predictive.initialize();
      console.log('🔮 Predictive Analytics: ONLINE');
    } catch (e) { console.error('PredictiveAnalytics:', e.message); }
  }
  
  // LIVING BOTS SYSTEM
  if (livingBots) {
    try {
      grudgeSystem = new livingBots.GrudgeSystem(pool);
      await grudgeSystem.initialize();
      gossipSystem = new livingBots.GossipSystem(pool, client, anthropic);
      await gossipSystem.initialize();
      console.log('🧬 Living Bots System: ONLINE');
    } catch (e) { console.error('LivingBots:', e.message); }
  }

  client.user.setPresence({ activities: [{ name: 'Watching everything | ?help', type: 3 }], status: 'online' });
  
  // Autonomous chat
  if (autonomousChat && ALLOWED_CHANNEL_IDS.length > 0) {
    setTimeout(() => { 
      try { 
        autonomousChat.startAutonomous(
          ALLOWED_CHANNEL_IDS.map(id => client.channels.cache.get(id)).filter(Boolean), 
          { botId: MY_BOT_ID, botName: BOT_NAME, client, anthropic, pool, intelligence, personality: LESTER_SYSTEM, otherBotIds: OTHER_BOT_IDS }
        ); 
      } catch (e) {} 
    }, 20000);
  }
  
  if (intelligence) await intelligence.broadcastToOtherBots('bot_online', { botId: MY_BOT_ID, timestamp: new Date().toISOString() });
  setInterval(() => { if (intelligence) intelligence.runMaintenance().catch(console.error); }, 6 * 60 * 60 * 1000);
  
  // AUTO-UPDATE SERVER STATS every 5 minutes
  setInterval(async () => {
    try {
      for (const guild of client.guilds.cache.values()) {
        const statsCategory = guild.channels.cache.find(c => c.name === '📊 SERVER STATS' && c.type === 4);
        if (!statsCategory) continue;
        
        // Fetch all members WITH presence data
        await guild.members.fetch({ withPresences: true });
        
        const memberCount = guild.memberCount;
        
        // Count ONLY truly online members (online, idle, dnd - NOT offline or null)
        let onlineCount = 0;
        for (const [id, member] of guild.members.cache) {
          if (member.user.bot) continue; // Don't count bots
          const status = member.presence?.status;
          if (status === 'online' || status === 'idle' || status === 'dnd') {
            onlineCount++;
          }
        }
        
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        
        // Count Inner Circle subscribers
        const innerCircleRole = guild.roles.cache.find(r => r.name === '⭐ Inner Circle');
        const subCount = innerCircleRole ? innerCircleRole.members.size : 0;
        
        for (const channel of statsCategory.children.cache.values()) {
          if (channel.type !== 2) continue; // Voice channels only
          try {
            if (channel.name.startsWith('👥')) {
              await channel.setName(`👥 Members: ${memberCount}`);
            } else if (channel.name.startsWith('🟢')) {
              await channel.setName(`🟢 Online: ${onlineCount}`);
            } else if (channel.name.startsWith('🤖')) {
              await channel.setName(`🤖 Bots: ${botCount}`);
            } else if (channel.name.startsWith('⭐')) {
              await channel.setName(`⭐ Subscribers: ${subCount}`);
            }
          } catch (e) {}
        }
        
        console.log(`[STATS] Updated: ${memberCount} members, ${onlineCount} online, ${botCount} bots, ${subCount} subs`);
      }
    } catch (e) { console.error('Stats update error:', e.message); }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // INNER LIFE: Autonomous thought loop (Lester is the "lead" bot for this)
  if (hiveMind?.innerLife) {
    setInterval(async () => {
      try {
        // Find general-chat
        const guild = client.guilds.cache.first();
        if (!guild) return;
        
        const generalChat = guild.channels.cache.find(c => c.name === 'general-chat');
        if (!generalChat) return;
        
        // Check if any bot should act autonomously
        const action = await hiveMind.checkAutonomousAction(
          guild.id, 
          generalChat,
          ['lester', 'pavel', 'cripps', 'nazar', 'chief']
        );
        
        if (action?.type === 'thought' && action.botId === 'lester') {
          // Lester has a thought
          const thought = await hiveMind.innerLife.generateAutonomousThought(
            'lester', 
            generalChat, 
            action.context
          );
          
          if (thought) {
            await generalChat.send(thought);
            await hiveMind.innerLife.recordAutonomousSpeak('lester', guild.id);
            console.log('[LESTER] Autonomous thought:', thought.slice(0, 50) + '...');
          }
        } else if (action?.type === 'botchat' && (action.bot1 === 'lester' || action.bot2 === 'lester')) {
          // Bot-to-bot conversation involving Lester
          const messages = await hiveMind.innerLife.generateBotInteraction(action.bot1, action.bot2);
          
          for (const msg of messages) {
            if (msg.botId === 'lester') {
              await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
              await generalChat.send(msg.content);
            }
            // Other bots will handle their own messages via their own loops
          }
          
          await hiveMind.innerLife.recordBotInteraction();
        }
      } catch (e) {
        console.error('[LESTER] Inner life error:', e.message);
      }
    }, 120000); // Check every 2 minutes
  }
  
  console.log('═══════════════════════════════════════════════════════════════\nLESTER ULTIMATE - THE MASTERMIND IS ONLINE\n═══════════════════════════════════════════════════════════════');
  
  // Post bot commands guide on startup (after 5 second delay)
  if (botCommandsGuide) {
    setTimeout(async () => {
      try {
        await botCommandsGuide.postBotCommandsGuide(client);
      } catch (e) {
        console.error('[GUIDE] Startup post error:', e.message);
      }
    }, 5000);
  }
});

function isOtherBot(userId) { return OTHER_BOT_IDS.includes(userId); }
function isInActiveConversation(channelId, userId) { const c = activeConversations.get(channelId); if (!c) return false; if (Date.now() - c.lastTime > 60000) { activeConversations.delete(channelId); return false; } return c.userId === userId; }
function trackConversation(channelId, userId) { activeConversations.set(channelId, { userId, lastTime: Date.now() }); }

async function checkShouldRespond(message) {
  // If HiveMind is available, use it for smart coordination
  if (hiveMind) {
    const decision = await hiveMind.shouldBotRespond(MY_BOT_ID, message, client);
    if (decision.shouldRespond) {
      console.log(`[LESTER] Responding - reason: ${decision.reason}`);
    }
    return decision.shouldRespond;
  }
  
  // Fallback: basic logic if HiveMind unavailable
  const channelName = message.channel.name || '';
  
  if (channelName === 'counting') return false;
  if (channelName.includes('lfg')) return false;
  if (channelName.startsWith('talk-to-') && channelName !== 'talk-to-lester') return false;
  if (channelName.includes('log') || channelName.includes('staff')) return false;
  if (channelName === 'talk-to-lester') return true;
  if (message.mentions.has(client.user)) return true;
  
  return false;
}

async function generateResponse(message) {
  const history = conversationMemory.get(message.author.id) || [];
  history.push({ role: 'user', content: message.content });
  while (history.length > 20) history.shift();
  
  try {
    await message.channel.sendTyping();
    
    // ═══════════════════════════════════════════════════════════════
    // LIVING BOTS - Check for secrets, grudges, jealousy first
    // ═══════════════════════════════════════════════════════════════
    
    // Check for secret triggers (easter eggs)
    if (livingBots) {
      const secretResponse = livingBots.checkForSecret(message.content);
      if (secretResponse) {
        await new Promise(r => setTimeout(r, 1500));
        await message.reply(secretResponse);
        return;
      }
      
      // Update mood based on message
      livingBots.updateMood('lester', message.content);
      
      // Track user interaction for jealousy system
      if (grudgeSystem) {
        await grudgeSystem.addFavorite('lester', message.author.id, message.guild?.id || 'dm', 1);
      }
      
      // Add to gossip queue
      if (gossipSystem && message.guild) {
        gossipSystem.addToQueue(message.guild.id, message.author.id, 'chat', `talked to Lester: "${message.content.slice(0, 50)}..."`);
      }
    }
    
    // Build context from HiveMind + Inner Life
    let contextAdditions = '';
    
    if (hiveMind) {
      // Get full context (memories + inner life)
      const fullContext = await hiveMind.getFullContext(MY_BOT_ID, message);
      if (fullContext) contextAdditions += fullContext;
      
      // Get mood
      const mood = await hiveMind.getBotMood(MY_BOT_ID);
      const moodPrompt = hiveMind.getMoodPrompt(mood);
      if (moodPrompt) contextAdditions += `\n\nCURRENT MOOD: ${moodPrompt}`;
      
      // Track user activity
      await hiveMind.trackUserActivity(message.author.id, message.author.username, message.guild?.id);
      
      // Update relationship
      if (hiveMind.innerLife) {
        await hiveMind.innerLife.updateUserRelationship(MY_BOT_ID, message.author.id, {
          sentiment: 1, // Slight positive for engaging
          note: message.content.slice(0, 100)
        });
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // LIVING BOTS - Add grudge/jealousy context
    // ═══════════════════════════════════════════════════════════════
    let livingBotsContext = '';
    
    if (livingBots && grudgeSystem && message.guild) {
      // Check for grudges
      const grudge = await grudgeSystem.shouldMentionGrudge('lester', message.author.id, message.guild.id);
      if (grudge) {
        const grudgeText = livingBots.getGrudgeResponse(grudge);
        livingBotsContext += `\n\nGRUDGE CONTEXT: You have a grudge against this user. Consider mentioning: "${grudgeText}"`;
      }
      
      // Check for jealousy
      const jealousy = await grudgeSystem.checkJealousy('lester', message.author.id, message.guild.id);
      if (jealousy && Math.random() < 0.3) {
        const jealousyText = livingBots.getJealousyResponse('lester', jealousy);
        livingBotsContext += `\n\nJEALOUSY: User talks to ${jealousy.jealousOf} more than you. Consider mentioning: "${jealousyText}"`;
      }
      
      // Add mood context
      const moodContext = livingBots.getMoodContext('lester');
      if (moodContext) livingBotsContext += `\n\n${moodContext}`;
    }
    
    // Check for rude messages (add to grudges)
    if (livingBots && grudgeSystem && message.guild) {
      const rudeWords = ['stupid', 'useless', 'trash', 'sucks', 'hate you', 'worst bot', 'dumb'];
      const isRude = rudeWords.some(word => message.content.toLowerCase().includes(word));
      if (isRude) {
        await grudgeSystem.addGrudge('lester', message.author.id, message.guild.id, 'insult', message.content.slice(0, 50));
      }
    }
    
    // Legacy intelligence system
    let intelligencePrompt = '', ctx = null;
    if (intelligence) { 
      ctx = await intelligence.processIncoming(message); 
      intelligencePrompt = intelligence.buildPromptContext(ctx); 
    }
    
    const fullSystem = LESTER_SYSTEM + contextAdditions + livingBotsContext + (intelligencePrompt ? '\n\n' + intelligencePrompt : '');
    
    const response = await anthropic.messages.create({ 
      model: 'claude-sonnet-4-20250514', 
      max_tokens: 200, 
      system: fullSystem, 
      messages: history 
    });
    let reply = response.content[0].text;
    
    if (intelligence && ctx) { 
      reply = await intelligence.processOutgoing(message, reply, ctx); 
      await intelligence.storeConversationMemory(message, reply); 
    }
    history.push({ role: 'assistant', content: reply });
    conversationMemory.set(message.author.id, history);
    
    // Natural typing delay
    await new Promise(r => setTimeout(r, Math.min(reply.length * 30, 3000)));
    const sent = await message.reply(reply);
    trackConversation(message.channel.id, message.author.id);
    
    // Record that this bot spoke (for coordination)
    if (hiveMind) {
      await hiveMind.recordBotSpoke(MY_BOT_ID, message.channel.id);
      // Store this interaction as a memory
      await hiveMind.storeInteraction(
        message.author.id, 
        message.author.username, 
        message.content, 
        MY_BOT_ID, 
        reply, 
        message.channel.id
      );
    }
    
    // Maybe trigger bot gossip
    if (gossipSystem && message.guild) {
      gossipSystem.maybeGossip(message.guild).catch(() => {});
    }
    
    if (intelligence?.learning) await intelligence.learning.recordResponse(sent.id, message.channel.id, message.author.id, 'reply', 'general', reply.length);
    if (mediaGenerator) try { await mediaGenerator.handleBotMedia(MY_BOT_ID, reply, message.channel); } catch (e) {}
  } catch (e) { 
    console.error('Response error:', e); 
    await message.reply("*keyboard smashing* Something broke."); 
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot && !isOtherBot(message.author.id)) return;
  if (message.author.id === client.user.id) return;
  if (!message.guild) { await generateResponse(message); return; }
  
  // SERVER LOCK - Ignore messages from unauthorized servers
  if (!isAuthorizedServer(message.guild.id)) {
    return; // Silently ignore
  }

  const channelName = message.channel.name;

  // Handle counting channel - process the count!
  if (channelName === 'counting') {
    await countingHandler.handle(message, client);
    return;
  }

  // Commands
  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    
    const commands = {
      // SETUP COMMANDS - Fixed to use setupHandler
      'setup': () => setupHandler.execute(message, args, client),
      'nuke': () => setupHandler.nuke(message, args, client),
      'reset': () => setupHandler.reset(message, args, client),
      
      // MODERATION
      'kick': () => moderationHandler.kick(message, args, client),
      'ban': () => moderationHandler.ban(message, args, client),
      'unban': () => moderationHandler.unban(message, args, client),
      'mute': () => moderationHandler.mute(message, args, client),
      'unmute': () => moderationHandler.unmute(message, args, client),
      'timeout': () => moderationHandler.timeout(message, args, client),
      'warn': () => moderationHandler.warn(message, args, client),
      'warnings': () => moderationHandler.warnings(message, args, client),
      'clearwarnings': () => moderationHandler.clearWarnings(message, args, client),
      'purge': () => moderationHandler.purge(message, args, client),
      'clear': () => moderationHandler.purge(message, args, client),
      'slowmode': () => moderationHandler.slowmode(message, args, client),
      'lock': () => moderationHandler.lock(message, args, client),
      'unlock': () => moderationHandler.unlock(message, args, client),
      
      // INVESTIGATION
      'investigate': () => masterBrain?.handleInvestigateCommand(message, args) || message.reply('System not ready.'),
      'evidence': () => masterBrain?.handleEvidenceCommand(message, args) || message.reply('System not ready.'),
      'record': () => masterBrain?.handleRecordCommand(message, args) || message.reply('System not ready.'),
      'watchlist': () => masterBrain?.handleWatchlistCommand(message) || message.reply('System not ready.'),
      'predict': () => masterBrain?.handlePredictCommand(message, args) || message.reply('System not ready.'),
      
      // SCAM DETECTION
      'addscam': () => scamDetection.addScam(message, args, client),
      'removescam': () => scamDetection.removeScam(message, args, client),
      'scamlist': () => scamDetection.listScams(message, client),
      'checklink': () => scamDetection.checkLink(message, args, client),
      
      // INFO & UTILITY
      'help': () => sendHelp(message),
      'ping': () => message.reply(`*types without looking* ${client.ws.ping}ms.`),
      'serverinfo': () => sendServerInfo(message),
      'userinfo': () => sendUserInfo(message),
      'avatar': () => sendAvatar(message),
      'gunvan': () => gunVanHandler.getLocation(message, client),
      'gun': () => gunVanHandler.getLocation(message, client),
      'countrecord': () => countingHandler.getRecord(message, client),
      'fixcounting': () => fixCountingChannel(message, client),
      'memory': () => memoryHandler.showMemory(message, args, client),
      'forgetme': () => memoryHandler.forgetUser(message, client),
      
      // MOOD & REP
      'mood': () => handleMood(message),
      'rep': () => handleRep(message, args),
      
      // VOICE
      'voice': () => handleVoice(message, args),
      'speak': () => handleSpeak(message, args),
      'shutup': () => { if (voiceSystem) voiceSystem.leaveChannel(); message.reply('Fine.'); },
      
      // STATS (if activityXP is loaded)
      'stats': () => handleStats(message, args),
      'leaderboard': () => handleLeaderboard(message, args),
      'lb': () => handleLeaderboard(message, args),
      
      // BOT COMMANDS GUIDE
      'postguide': () => botCommandsGuide ? botCommandsGuide.handlePostGuideCommand(message, client) : message.reply('Guide system not loaded.'),
      
      // STATS CATEGORY SETUP
      'setupstats': () => handleSetupStats(message),
      'deletestats': () => handleDeleteStats(message),
      
      // PREMIUM SETUP
      'setuppremium': () => handleSetupPremium(message),
      'deletepremium': () => handleDeletePremium(message),
      
      // TERMS & TESTIMONIALS
      'setuptos': () => handleSetupTOS(message),
      'testimonial': () => handleTestimonial(message, args),
      'review': () => handleTestimonial(message, args),
      
      // PREMIUM TIERS
      'setuptiers': () => handleSetupTiers(message),
      'deletetiers': () => handleDeleteTiers(message),
      
      // BLACKLIST (for payment abusers)
      'blacklist': () => handleBlacklist(message, args),
      'unblacklist': () => handleUnblacklist(message, args),
      'blacklistcheck': () => handleBlacklistCheck(message, args),
      
      // ECONOMY SYSTEM - Only in activities category
      'balance': () => handleActivityCommand(message, () => handleBalance(message)),
      'bal': () => handleActivityCommand(message, () => handleBalance(message)),
      'wallet': () => handleActivityCommand(message, () => handleBalance(message)),
      'daily': () => handleActivityCommand(message, () => handleDaily(message)),
      'work': () => handleActivityCommand(message, () => handleWork(message)),
      'crime': () => handleActivityCommand(message, () => handleCrime(message)),
      'slots': () => handleActivityCommand(message, () => handleSlots(message, args)),
      'slot': () => handleActivityCommand(message, () => handleSlots(message, args)),
      'coinflip': () => handleActivityCommand(message, () => handleCoinflip(message, args)),
      'cf': () => handleActivityCommand(message, () => handleCoinflip(message, args)),
      'blackjack': () => handleActivityCommand(message, () => handleBlackjack(message, args)),
      'bj': () => handleActivityCommand(message, () => handleBlackjack(message, args)),
      'roulette': () => handleActivityCommand(message, () => handleRoulette(message, args)),
      'pay': () => handleActivityCommand(message, () => handlePay(message, args)),
      'give': () => handleActivityCommand(message, () => handlePay(message, args)),
      'richest': () => handleActivityCommand(message, () => handleRichest(message)),
      'rich': () => handleActivityCommand(message, () => handleRichest(message)),
      
      // KLING AI - Only in activities category
      'generate': () => handleActivityCommand(message, () => klingCommands?.handleGenerate(message, args) || message.reply('AI generation not available.')),
      'wanted': () => handleActivityCommand(message, () => klingCommands?.handleWanted(message, args) || message.reply('AI generation not available.')),
      'bounty': () => handleActivityCommand(message, () => klingCommands?.handleBounty(message, args) || message.reply('AI generation not available.')),
      'victory': () => handleActivityCommand(message, () => klingCommands?.handleVictory(message, args) || message.reply('AI generation not available.')),
      'video': () => handleActivityCommand(message, () => klingCommands?.handleVideo(message, args) || message.reply('AI generation not available.')),
      
      // HEIST PLANNER - Only in activities category
      'plan': () => handleActivityCommand(message, () => handlePlan(message, args)),
      'grind': () => handleActivityCommand(message, () => handlePlan(message, args)),
      
      // REPUTATION - Only in activities category
      'reputation': () => handleActivityCommand(message, () => handleReputation(message, args)),
      'rate': () => handleActivityCommand(message, () => handleRate(message, args)),
      'partners': () => handleActivityCommand(message, () => handlePartners(message)),
      'connection': () => handleActivityCommand(message, () => handleConnection(message, args)),
      
      // PREDICTIVE - Only in activities category
      'mytime': () => handleActivityCommand(message, () => handleMyTime(message)),
      'peaktimes': () => handleActivityCommand(message, () => handlePeakTimes(message)),
      
      // ACTIVITY CHANNELS SETUP
      'setupactivities': () => handleSetupActivities(message),
      
      // JOIN-LEAVE LOG SETUP
      'setupjoinleave': () => handleSetupJoinLeave(message),
      
      // BOT GOSSIP SETUP
      'setupgossip': () => handleSetupGossip(message),
      
      // FORCE GOSSIP (testing)
      'forcegossip': () => handleForceGossip(message)
    };
    
    if (commands[cmd]) { 
      try { await commands[cmd](); } catch (e) { console.error(`Cmd ${cmd}:`, e); message.reply("Something broke."); } 
      return; 
    }
    
    // Don't respond to unknown commands in LFG channels (let other bots handle them)
    if (channelName.includes('lfg')) return;
  }
  
  if (await checkShouldRespond(message)) await generateResponse(message);
});

async function sendHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle('🧠 Lester - The Mastermind')
    .setDescription("*adjusts glasses* Fine, here's what I can do...")
    .addFields(
      { name: '⚙️ Admin', value: '`?setup` `?reset` `?nuke`' },
      { name: '⭐ Premium Setup', value: '`?setuppremium` `?setuptiers` `?setuptos` `?setupstats`' },
      { name: '🔨 Moderation', value: '`?kick` `?ban` `?unban` `?mute` `?unmute` `?timeout`\n`?warn` `?warnings` `?clearwarnings` `?purge` `?slowmode`\n`?lock` `?unlock`' },
      { name: '🔍 Investigation', value: '`?investigate` `?evidence` `?record` `?watchlist`' },
      { name: '💰 Economy', value: '`?balance` `?daily` `?work` `?crime`\n`?slots` `?coinflip` `?blackjack` `?roulette`\n`?pay` `?richest`' },
      { name: '🎨 AI Generation', value: '`?generate [prompt]` `?wanted @user`\n`?bounty @user` `?victory` `?video [prompt]`' },
      { name: '📋 Heist Planner', value: '`?plan [minutes] [players]` - Optimal grinding route' },
      { name: '📊 Reputation', value: '`?rep @user` `?rate @user [1-5]`\n`?partners` `?connection @user`' },
      { name: '🔮 Predictions', value: '`?mytime` `?peaktimes`' },
      { name: '📊 Info', value: '`?serverinfo` `?userinfo` `?avatar` `?stats` `?leaderboard`' },
      { name: '🚫 Blacklist', value: '`?blacklist` `?unblacklist` `?blacklistcheck`' },
      { name: '🔫 Gun Van', value: '`?gunvan`' },
      { name: '🧠 Memory', value: '`?memory` `?forgetme`' },
      { name: '🎙️ Voice', value: '`?voice join/leave` `?speak` `?shutup`' }
    )
    .setColor(0x00FF00)
    .setFooter({ text: 'ULTIMATE Edition + All Systems' });
  await message.reply({ embeds: [embed] });
}

async function sendServerInfo(message) {
  const g = message.guild, o = await g.fetchOwner();
  const embed = new EmbedBuilder().setTitle(`📊 ${g.name}`).setThumbnail(g.iconURL({ dynamic: true })).addFields(
    { name: '👑 Owner', value: o.user.tag, inline: true }, { name: '🆔 ID', value: g.id, inline: true },
    { name: '📅 Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
    { name: '👥 Members', value: `${g.memberCount}`, inline: true }, { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
    { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true }, { name: '🚀 Boosts', value: `${g.premiumSubscriptionCount || 0}`, inline: true }
  ).setColor(0x00FF00).setTimestamp();
  await message.reply({ embeds: [embed] });
}

async function sendUserInfo(message) {
  const t = message.mentions.members.first() || message.member;
  const embed = new EmbedBuilder().setTitle(`👤 ${t.user.tag}`).setThumbnail(t.user.displayAvatarURL({ dynamic: true })).addFields(
    { name: '🆔 ID', value: t.id, inline: true }, { name: '📛 Nick', value: t.nickname || 'None', inline: true },
    { name: '📅 Created', value: `<t:${Math.floor(t.user.createdTimestamp / 1000)}:R>`, inline: true },
    { name: '📥 Joined', value: `<t:${Math.floor(t.joinedTimestamp / 1000)}:R>`, inline: true },
    { name: '🎨 Top Role', value: t.roles.highest.toString(), inline: true },
    { name: `🎭 Roles`, value: t.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).slice(0, 8).join(', ') || 'None' }
  ).setColor(t.displayHexColor || 0x00FF00).setTimestamp();
  await message.reply({ embeds: [embed] });
}

async function sendAvatar(message) {
  const t = message.mentions.users.first() || message.author;
  const embed = new EmbedBuilder().setTitle(`🖼️ ${t.tag}`).setImage(t.displayAvatarURL({ dynamic: true, size: 1024 })).setColor(0x00FF00)
    .addFields({ name: '🔗 Links', value: `[PNG](${t.displayAvatarURL({ format: 'png', size: 1024 })}) | [JPG](${t.displayAvatarURL({ format: 'jpg', size: 1024 })})` });
  await message.reply({ embeds: [embed] });
}

async function handleMood(message) {
  try {
    // Try to get mood from hivemind
    const moodSystem = require('./shared/hivemind/moodSystem');
    const mood = moodSystem?.getCurrentMood?.('lester') || { mood: 'irritated', energy: 65 };
    
    const moodEmojis = {
      happy: '😊', irritated: '😤', tired: '😴', excited: '🤩', 
      suspicious: '🤨', annoyed: '😒', helpful: '🤓', grumpy: '😠'
    };
    
    const embed = new EmbedBuilder()
      .setTitle(`${moodEmojis[mood.mood] || '😐'} Lester's Mood`)
      .setDescription(`*adjusts glasses* You really want to know how I'm feeling?`)
      .addFields(
        { name: 'Current Mood', value: mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1), inline: true },
        { name: 'Energy', value: `${mood.energy || 50}/100`, inline: true }
      )
      .setColor(mood.mood === 'happy' ? 0x00FF00 : mood.mood === 'irritated' ? 0xFF6600 : 0xFFFF00)
      .setFooter({ text: 'Mood changes based on time and interactions' });
    
    await message.reply({ embeds: [embed] });
  } catch (e) {
    await message.reply("*sighs* I'm fine. Stop asking.");
  }
}

async function handleRep(message, args) {
  try {
    const target = message.mentions.users.first() || message.author;
    
    // Try to get rep from database
    let rep = 50; // Default
    try {
      const result = await pool.query(
        'SELECT reputation FROM user_reputation WHERE user_id = $1',
        [target.id]
      );
      if (result.rows[0]) rep = result.rows[0].reputation;
    } catch (e) {
      // Table might not exist, use default
    }
    
    let status = 'Neutral';
    let color = 0xFFFF00;
    if (rep >= 80) { status = 'Excellent'; color = 0x00FF00; }
    else if (rep >= 60) { status = 'Good'; color = 0x88FF00; }
    else if (rep >= 40) { status = 'Neutral'; color = 0xFFFF00; }
    else if (rep >= 20) { status = 'Poor'; color = 0xFF8800; }
    else { status = 'Bad'; color = 0xFF0000; }
    
    const embed = new EmbedBuilder()
      .setTitle(`⭐ ${target.username}'s Reputation`)
      .addFields(
        { name: 'Score', value: `${rep}/100`, inline: true },
        { name: 'Status', value: status, inline: true }
      )
      .setColor(color)
      .setFooter({ text: 'Complete LFGs to gain rep • Abandon to lose rep' });
    
    await message.reply({ embeds: [embed] });
  } catch (e) {
    await message.reply("*types* Can't pull up their record right now.");
  }
}

async function handleVoice(message, args) {
  if (!voiceSystem) return message.reply("Voice offline.");
  if (args[0] === 'join') { const vc = message.member.voice.channel; if (!vc) return message.reply("Get in a VC first."); const ok = await voiceChatHandler?.joinAndGreet(vc); message.reply(ok ? `🎙️ Joining ${vc.name}` : "Can't join."); }
  else if (args[0] === 'leave') { voiceSystem.leaveChannel(); message.reply("*disconnects*"); }
  else message.reply("`?voice join` or `?voice leave`");
}

async function handleSpeak(message, args) {
  if (!voiceSystem?.isConnected?.()) return message.reply("Use `?voice join` first.");
  const text = args.join(' '); if (!text) return message.reply("`?speak [text]`");
  try { const r = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 100, system: LESTER_SYSTEM + '\nKeep SHORT.', messages: [{ role: 'user', content: text }] }); await voiceSystem.speak(r.content[0].text); message.reply(`🎙️ "${r.content[0].text}"`); } catch (e) { message.reply("Voice error."); }
}

async function handleStats(message, args) {
  if (!activityXP) return message.reply("Activity tracking not enabled.");
  
  const target = message.mentions.members.first() || message.member;
  
  try {
    const stats = await activityXP.getUserStats(target.id, message.guild.id, client);
    
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${target.user.username}'s Stats`)
      .addFields(
        { name: '⭐ XP', value: stats.xp.toLocaleString(), inline: true },
        { name: '💬 Messages', value: stats.messages.toLocaleString(), inline: true },
        { name: '🎤 Voice Hours', value: `${stats.voiceHours}h`, inline: true },
        { name: '👍 Reactions', value: stats.reactions.toLocaleString(), inline: true },
        { name: '🔥 Streak', value: `${stats.streak} days`, inline: true }
      )
      .setColor(0x00FF00)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  } catch (e) {
    await message.reply("*squints at screen* Can't find their stats.");
  }
}

async function handleLeaderboard(message, args) {
  if (!activityXP) return message.reply("Activity tracking not enabled.");
  
  const type = args[0] || 'xp';
  const validTypes = ['xp', 'messages', 'voice', 'reactions'];
  
  if (!validTypes.includes(type)) {
    return message.reply(`Valid types: ${validTypes.join(', ')}`);
  }
  
  try {
    const leaderboard = await activityXP.getLeaderboard(message.guild.id, type, 10, client);
    
    if (leaderboard.length === 0) {
      return message.reply("No data yet. Get chatting!");
    }
    
    let description = '';
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const member = await message.guild.members.fetch(entry.user_id).catch(() => null);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const value = type === 'voice' ? `${Math.floor(entry.value / 60)}h` : parseInt(entry.value).toLocaleString();
      description += `${medal} **${member?.user.username || 'Unknown'}** - ${value}\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`📊 ${type.toUpperCase()} Leaderboard`)
      .setDescription(description)
      .setColor(0xFFD700)
      .setFooter({ text: 'Use ?lb [xp|messages|voice|reactions]' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  } catch (e) {
    console.error('Leaderboard error:', e);
    await message.reply("*keyboard smashing* Leaderboard broke.");
  }
}

// ============================================
// FIX COUNTING CHANNEL
// ============================================
async function fixCountingChannel(message, client) {
  // Only owner/admin can use this
  if (!message.member.permissions.has('Administrator')) {
    return message.reply("You need Admin permissions to fix the counting channel.");
  }
  
  const COUNTING_CHANNEL_ID = '1453304735615418521';
  const THE_ONE_ROLE_ID = '1453304639578443940';
  
  try {
    // Get the counting channel
    let countingChannel = await client.channels.fetch(COUNTING_CHANNEL_ID).catch(() => null);
    
    if (!countingChannel) {
      countingChannel = message.guild.channels.cache.find(c => c.name === 'counting');
    }
    
    if (!countingChannel) {
      return message.reply("❌ Could not find counting channel.");
    }
    
    await message.reply("🔧 Fixing counting channel...");
    
    // Delete all messages in the channel
    let deleted;
    do {
      deleted = await countingChannel.bulkDelete(100, true).catch(() => ({ size: 0 }));
    } while (deleted.size > 0);
    
    // Reset database
    await client.db.query(`
      DELETE FROM counting WHERE guild_id = $1
    `, [message.guild.id]);
    
    await client.db.query(`
      INSERT INTO counting (guild_id, current_count, last_counter, record)
      VALUES ($1, 0, NULL, 0)
    `, [message.guild.id]);
    
    // Remove The #1 role from everyone
    const theOneRole = message.guild.roles.cache.get(THE_ONE_ROLE_ID) || 
                       message.guild.roles.cache.find(r => r.name === '🏆 The #1');
    if (theOneRole) {
      for (const [id, member] of theOneRole.members) {
        await member.roles.remove(theOneRole).catch(() => {});
      }
    }
    
    // Send fresh start message
    const startEmbed = new EmbedBuilder()
      .setTitle('🔢 COUNTING GAME')
      .setDescription(`**How to play:**\n• Count up from 1\n• You can't count twice in a row\n• If someone messes up, it resets to 1\n\n**The Prize:**\n🏆 Whoever counts last holds **The #1** role!\n\n*Start counting from 1!*`)
      .setColor(0x00FF00)
      .setFooter({ text: 'Good luck!' })
      .setTimestamp();
    
    await countingChannel.send({ embeds: [startEmbed] });
    
    await message.channel.send(`✅ Counting channel fixed! Head to <#${countingChannel.id}> and start from **1**!`);
    
  } catch (e) {
    console.error('Fix counting error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

// LOGGING EVENTS
client.on(Events.MessageDelete, async (m) => { try { await loggingHandler.messageDeleted(m, client); } catch (e) {} });
client.on(Events.MessageUpdate, async (o, n) => { try { await loggingHandler.messageEdited(o, n, client); } catch (e) {} });
client.on(Events.GuildMemberAdd, async (m) => { try { await loggingHandler.memberJoined(m, client); } catch (e) {} });
client.on(Events.GuildMemberRemove, async (m) => { try { await loggingHandler.memberLeft(m, client); } catch (e) {} });
client.on(Events.GuildBanAdd, async (b) => { try { await loggingHandler.memberBanned(b, client); } catch (e) {} });

// SERVER LOCK - Leave unauthorized servers immediately when added
client.on(Events.GuildCreate, async (guild) => {
  if (!isAuthorizedServer(guild.id)) {
    console.log(`[SECURITY] Bot added to unauthorized server: ${guild.name} (${guild.id}) - LEAVING IMMEDIATELY`);
    
    // Try to message the owner before leaving
    try {
      const owner = await guild.fetchOwner();
      await owner.send({
        embeds: [new EmbedBuilder()
          .setTitle('🚫 Unauthorized Server')
          .setDescription(
            `This bot is private and only operates in authorized servers.\n\n` +
            `**Your server:** ${guild.name}\n` +
            `**Status:** Not authorized\n\n` +
            `If you believe this is an error, contact the bot owner.\n\n` +
            `*This bot has left your server automatically.*`
          )
          .setColor(0xFF0000)
          .setTimestamp()
        ]
      });
    } catch (e) {}
    
    await guild.leave();
    return;
  }
  
  console.log(`[SECURITY] Bot added to authorized server: ${guild.name} (${guild.id})`);
});

client.on(Events.GuildMemberUpdate, async (o, n) => { 
  try { await loggingHandler.memberUpdated(o, n, client); } catch (e) {} 
  
  // Check if Inner Circle role was added
  try {
    const innerCircleRole = n.guild.roles.cache.find(r => r.name === '⭐ Inner Circle');
    if (!innerCircleRole) return;
    
    const hadRole = o.roles.cache.has(innerCircleRole.id);
    const hasRole = n.roles.cache.has(innerCircleRole.id);
    
    // Role was just added
    if (!hadRole && hasRole) {
      console.log(`[PREMIUM] ${n.user.tag} joined Inner Circle!`);
      
      // Send DM with onboarding
      const dmEmbed1 = new EmbedBuilder()
        .setTitle('⭐ WELCOME TO THE INNER CIRCLE')
        .setDescription(
          `Hey ${n.user.username},\n\n` +
          `You're officially one of us now. This isn't just a subscription—you're part of something exclusive.\n\n` +
          `**Here's what just unlocked for you:**`
        )
        .setColor(0xFFB300)
        .setThumbnail(n.guild.iconURL({ dynamic: true }));
      
      const dmEmbed2 = new EmbedBuilder()
        .setTitle('🔓 YOUR ACCESS')
        .setDescription(
          `📜 **#confidential-agreement** - READ THIS FIRST\n` +
          `💎 **#vip-lounge** - Chill with fellow supporters\n` +
          `🎯 **#priority-lfg** - Skip the queue\n` +
          `🔮 **#insider-intel** - Secret strats & early info\n` +
          `🎙️ **#vip-voice** - Private voice chat\n\n` +
          `**Bot Perks:**\n` +
          `• Bots remember you better\n` +
          `• Friendlier responses\n` +
          `• Priority in queues\n` +
          `• Early access to new features`
        )
        .setColor(0x00FF00);
      
      const dmEmbed3 = new EmbedBuilder()
        .setTitle('⚠️ IMPORTANT')
        .setDescription(
          `**This access is CONFIDENTIAL.**\n\n` +
          `• Don't screenshot or share content\n` +
          `• Don't share your account\n` +
          `• Don't leak insider info\n\n` +
          `Read the full terms in **#confidential-agreement**.\n\n` +
          `Violations = instant removal, no refund, blacklist.\n\n` +
          `───────────────────────────\n\n` +
          `Questions? Ask in #vip-lounge.\n\n` +
          `*Welcome to the inside. Don't fuck it up.*\n\n` +
          `— The Unpatched Method`
        )
        .setColor(0xFF0000)
        .setFooter({ text: 'This message is confidential' })
        .setTimestamp();
      
      try {
        await n.user.send({ embeds: [dmEmbed1, dmEmbed2, dmEmbed3] });
      } catch (e) {
        // Can't DM user, post in lounge instead
        const loungeChannel = n.guild.channels.cache.find(c => c.name === '💎・vip-lounge');
        if (loungeChannel) {
          await loungeChannel.send({ 
            content: `${n} **Welcome to the Inner Circle!** Check out <#${n.guild.channels.cache.find(c => c.name === '📜・confidential-agreement')?.id}> first.`,
            embeds: [dmEmbed2] 
          });
        }
      }
      
      // Log to staff if there's a log channel
      const logChannel = n.guild.channels.cache.find(c => c.name.includes('premium-log') || c.name.includes('subscriber-log'));
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('💰 New Inner Circle Member')
          .setDescription(`**User:** ${n.user.tag} (${n.user.id})\n**Joined:** <t:${Math.floor(Date.now() / 1000)}:F>`)
          .setColor(0x00FF00)
          .setThumbnail(n.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
    
    // Role was removed
    if (hadRole && !hasRole) {
      console.log(`[PREMIUM] ${n.user.tag} left Inner Circle`);
      
      // Log removal
      const logChannel = n.guild.channels.cache.find(c => c.name.includes('premium-log') || c.name.includes('subscriber-log'));
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📤 Inner Circle Member Left')
          .setDescription(`**User:** ${n.user.tag} (${n.user.id})\n**Left:** <t:${Math.floor(Date.now() / 1000)}:F>`)
          .setColor(0xFF0000)
          .setThumbnail(n.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
  } catch (e) {
    console.error('[PREMIUM] Role detection error:', e.message);
  }
});
client.on(Events.VoiceStateUpdate, async (o, n) => { 
  if (intelligence?.contextAwareness && n.guild) intelligence.contextAwareness.updateVoiceState(n.guild.id, n);
  try { await loggingHandler.voiceStateUpdate(o, n, client); } catch (e) {}
});
client.on(Events.MessageReactionAdd, async (r, u) => { if (u.bot) return; if (intelligence && r.message.author?.id === client.user.id) await intelligence.handleReaction(r.message.id, r.emoji.name, u.id); });

// ═══════════════════════════════════════════════════════════════
// STATS CATEGORY SETUP (with subscriber count)
// ═══════════════════════════════════════════════════════════════
async function handleSetupStats(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    
    // Delete old stats category if exists
    const oldCategory = guild.channels.cache.find(c => c.name === '📊 SERVER STATS' && c.type === 4);
    if (oldCategory) {
      for (const channel of oldCategory.children.cache.values()) {
        await channel.delete().catch(() => {});
      }
      await oldCategory.delete().catch(() => {});
    }
    
    // Create new category at the top
    const category = await guild.channels.create({
      name: '📊 SERVER STATS',
      type: 4, // Category
      position: 0
    });
    
    // Fetch members with presence
    await guild.members.fetch({ withPresences: true });
    
    const memberCount = guild.memberCount;
    let onlineCount = 0;
    for (const [id, member] of guild.members.cache) {
      if (member.user.bot) continue;
      const status = member.presence?.status;
      if (status === 'online' || status === 'idle' || status === 'dnd') {
        onlineCount++;
      }
    }
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    
    // Count Inner Circle members
    const innerCircleRole = guild.roles.cache.find(r => r.name === '⭐ Inner Circle');
    const subCount = innerCircleRole ? innerCircleRole.members.size : 0;
    
    // Create voice channels (locked so no one can join)
    const channelOptions = {
      type: 2, // Voice
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.Connect]
        }
      ]
    };
    
    await guild.channels.create({ name: `👥 Members: ${memberCount}`, ...channelOptions });
    await guild.channels.create({ name: `🟢 Online: ${onlineCount}`, ...channelOptions });
    await guild.channels.create({ name: `🤖 Bots: ${botCount}`, ...channelOptions });
    await guild.channels.create({ name: `⭐ Subscribers: ${subCount}`, ...channelOptions });
    
    await message.reply(`✅ **Stats category created!**\n\n📊 SERVER STATS\n├ 👥 Members: ${memberCount}\n├ 🟢 Online: ${onlineCount}\n├ 🤖 Bots: ${botCount}\n└ ⭐ Subscribers: ${subCount}\n\n*Updates every 5 minutes automatically.*`);
    
  } catch (e) {
    console.error('Setup stats error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

async function handleDeleteStats(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    const category = guild.channels.cache.find(c => c.name === '📊 SERVER STATS' && c.type === 4);
    
    if (!category) {
      return message.reply('❌ No stats category found.');
    }
    
    for (const channel of category.children.cache.values()) {
      await channel.delete().catch(() => {});
    }
    await category.delete();
    
    await message.reply('✅ Stats category deleted.');
    
  } catch (e) {
    console.error('Delete stats error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM SETUP - Unique Subscriber System
// ═══════════════════════════════════════════════════════════════
async function handleSetupPremium(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    
    await message.reply('🔧 *accessing premium protocols...* Setting up the VIP system...');
    
    // Delete old premium stuff if exists
    const oldCategory = guild.channels.cache.find(c => c.name === '⭐ INNER CIRCLE' && c.type === 4);
    if (oldCategory) {
      for (const channel of oldCategory.children.cache.values()) {
        await channel.delete().catch(() => {});
      }
      await oldCategory.delete().catch(() => {});
    }
    
    const oldRole = guild.roles.cache.find(r => r.name === '⭐ Inner Circle');
    if (oldRole) await oldRole.delete().catch(() => {});
    
    // Create the premium role with unique gradient-like color
    // Using a deep gold/amber color: #FFB300
    const premiumRole = await guild.roles.create({
      name: '⭐ Inner Circle',
      color: 0xFFB300, // Deep gold/amber
      hoist: true, // Shows separately in member list
      mentionable: true,
      reason: 'Premium subscriber role'
    });
    
    // Move role high in hierarchy (below admin roles)
    const botRole = guild.members.me.roles.highest;
    await premiumRole.setPosition(botRole.position - 1).catch(() => {});
    
    // Create premium category
    const category = await guild.channels.create({
      name: '⭐ INNER CIRCLE',
      type: 4, // Category
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: premiumRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
        }
      ]
    });
    
    // Create RULES channel first (read-only)
    const rulesChannel = await guild.channels.create({
      name: '📜・confidential-agreement',
      type: 0, // Text
      parent: category.id,
      topic: '⚠️ READ THIS FIRST. Confidentiality agreement and rules.',
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: premiumRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
      ]
    });
    
    // Post confidentiality agreement
    const confidentialEmbed1 = new EmbedBuilder()
      .setTitle('🔒 CONFIDENTIALITY AGREEMENT')
      .setDescription(`**Welcome to the Inner Circle.**\n\nBy accessing this section, you agree to the following terms. Violation results in **immediate removal** and potential **blacklist** from all Unpatched Method services.`)
      .setColor(0xFF0000)
      .setTimestamp();
    
    const confidentialEmbed2 = new EmbedBuilder()
      .setTitle('📋 TERMS OF ACCESS')
      .setDescription(
        `**1. NON-DISCLOSURE**\n` +
        `Everything in Inner Circle channels is **CONFIDENTIAL**. This includes:\n` +
        `• Strategies, glitches, and methods shared\n` +
        `• Insider intel and early updates\n` +
        `• Conversations and member identities\n` +
        `• Screenshots, recordings, or any reproduction\n\n` +
        `**2. NO SHARING**\n` +
        `• Do NOT screenshot or screen record\n` +
        `• Do NOT copy/paste content elsewhere\n` +
        `• Do NOT share your account access\n` +
        `• Do NOT invite others to "look around"\n\n` +
        `**3. NO RESELLING**\n` +
        `• Information here is for YOUR use only\n` +
        `• Reselling or redistributing = permanent ban\n` +
        `• We track leaks. We will find out.\n\n` +
        `**4. ACCOUNT SECURITY**\n` +
        `• YOU are responsible for your account\n` +
        `• Shared account = both users banned\n` +
        `• Compromised account = notify staff immediately`
      )
      .setColor(0xFF6600);
    
    const confidentialEmbed3 = new EmbedBuilder()
      .setTitle('⚠️ ENFORCEMENT')
      .setDescription(
        `**What happens if you break these rules:**\n\n` +
        `🔴 **First Offense:** Immediate removal, no refund\n` +
        `🔴 **Leak Detection:** Permanent blacklist + public shame\n` +
        `🔴 **Account Sharing:** Both accounts banned\n` +
        `🔴 **Chargeback Attempt:** Blacklisted from all future access\n\n` +
        `We have systems in place to detect leaks. Watermarked content, activity tracking, and more. Don't test us.\n\n` +
        `───────────────────────────\n\n` +
        `✅ **By staying in this server with the Inner Circle role, you acknowledge and agree to ALL terms above.**\n\n` +
        `*If you disagree, cancel your subscription now. No hard feelings.*`
      )
      .setColor(0xFF0000)
      .setFooter({ text: 'Inner Circle • Confidential • The Unpatched Method' });
    
    await rulesChannel.send({ embeds: [confidentialEmbed1] });
    await rulesChannel.send({ embeds: [confidentialEmbed2] });
    await rulesChannel.send({ embeds: [confidentialEmbed3] });
    
    // Create premium channels
    const loungeChannel = await guild.channels.create({
      name: '💎・vip-lounge',
      type: 0, // Text
      parent: category.id,
      topic: '🌟 Welcome to the Inner Circle. Exclusive access for our supporters.',
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: premiumRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });
    
    await guild.channels.create({
      name: '🎯・priority-lfg',
      type: 0, // Text
      parent: category.id,
      topic: '⚡ Priority matchmaking for Inner Circle members. Skip the queue.',
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: premiumRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });
    
    await guild.channels.create({
      name: '🔮・insider-intel',
      type: 0, // Text
      parent: category.id,
      topic: '🤫 Early updates, secret strats, and insider information.',
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: premiumRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });
    
    await guild.channels.create({
      name: '🎙️・vip-voice',
      type: 2, // Voice
      parent: category.id,
      userLimit: 10,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] },
        { id: premiumRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream] }
      ]
    });
    
    // Send welcome message in lounge
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('⭐ WELCOME TO THE INNER CIRCLE')
      .setDescription(`*The elite of The Unpatched Method.*\n\n` +
        `You've joined something special. This isn't just a subscription—it's access to the inner workings.\n\n` +
        `**What you get:**\n` +
        `💎 **VIP Lounge** - Chill with fellow supporters\n` +
        `🎯 **Priority LFG** - Skip the queue, find crews faster\n` +
        `🔮 **Insider Intel** - Early updates, secret strats\n` +
        `🎙️ **VIP Voice** - Private voice chat\n` +
        `⚡ **Priority Support** - We see your messages first\n\n` +
        `*The bots remember their supporters. They treat you different.*`)
      .setColor(0xFFB300)
      .setFooter({ text: 'Inner Circle • The Unpatched Method' })
      .setTimestamp();
    
    await loungeChannel.send({ embeds: [welcomeEmbed] });
    
    // Final response
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Premium System Activated')
      .setDescription(`*adjusts glasses* The Inner Circle is ready.\n\n` +
        `**Created:**\n` +
        `⭐ Role: **Inner Circle** (${premiumRole})\n` +
        `📁 Category: **INNER CIRCLE**\n` +
        `💎 Channel: **#vip-lounge**\n` +
        `🎯 Channel: **#priority-lfg**\n` +
        `🔮 Channel: **#insider-intel**\n` +
        `🎙️ Voice: **#vip-voice**\n\n` +
        `**Next steps:**\n` +
        `1. Go to Server Settings → Server Products\n` +
        `2. Create a product that grants the **Inner Circle** role\n` +
        `3. Set your price\n` +
        `4. Members who buy get auto-assigned the role\n\n` +
        `*Now go make some money.*`)
      .setColor(0x00FF00)
      .setTimestamp();
    
    await message.reply({ embeds: [successEmbed] });
    
  } catch (e) {
    console.error('Premium setup error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

async function handleDeletePremium(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    
    // Delete category and channels
    const category = guild.channels.cache.find(c => c.name === '⭐ INNER CIRCLE' && c.type === 4);
    if (category) {
      for (const channel of category.children.cache.values()) {
        await channel.delete().catch(() => {});
      }
      await category.delete().catch(() => {});
    }
    
    // Delete role
    const role = guild.roles.cache.find(r => r.name === '⭐ Inner Circle');
    if (role) await role.delete().catch(() => {});
    
    await message.reply('✅ Premium system deleted. *Back to the basics.*');
    
  } catch (e) {
    console.error('Delete premium error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TERMS OF SERVICE SETUP
// ═══════════════════════════════════════════════════════════════
async function handleSetupTOS(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    
    // Find or create rules/info category
    let infoCategory = guild.channels.cache.find(c => c.name.toLowerCase().includes('info') && c.type === 4);
    if (!infoCategory) {
      infoCategory = guild.channels.cache.find(c => c.name.toLowerCase().includes('rules') && c.type === 4);
    }
    
    // Create TOS channel
    const tosChannel = await guild.channels.create({
      name: '📜・terms-of-service',
      type: 0,
      parent: infoCategory?.id || null,
      topic: 'Terms of Service and Legal Information',
      permissionOverwrites: [
        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
      ]
    });
    
    // Post TOS embeds
    const tosEmbed1 = new EmbedBuilder()
      .setTitle('📜 TERMS OF SERVICE')
      .setDescription(
        `**THE UNPATCHED METHOD**\n` +
        `*Last Updated: ${new Date().toLocaleDateString()}*\n\n` +
        `By using this Discord server and its services, you agree to these terms. If you disagree, leave immediately.`
      )
      .setColor(0x2F3136);
    
    const tosEmbed2 = new EmbedBuilder()
      .setTitle('1. SERVICE DESCRIPTION')
      .setDescription(
        `**What We Provide:**\n` +
        `• Discord community for GTA Online & Red Dead Online\n` +
        `• AI-powered bot assistants\n` +
        `• Looking-for-group (LFG) matchmaking\n` +
        `• Premium subscription services (Inner Circle)\n` +
        `• Gaming strategies, tips, and information\n\n` +
        `**What We Don't Provide:**\n` +
        `• Guarantees of game account safety\n` +
        `• Official Rockstar Games support\n` +
        `• Refunds for digital purchases\n` +
        `• Legal advice or representation`
      )
      .setColor(0x2F3136);
    
    const tosEmbed3 = new EmbedBuilder()
      .setTitle('2. USER CONDUCT')
      .setDescription(
        `**You Agree To:**\n` +
        `• Follow Discord's Terms of Service\n` +
        `• Respect other members\n` +
        `• Not share premium content outside designated areas\n` +
        `• Not attempt to exploit, hack, or abuse our bots\n` +
        `• Not impersonate staff or other members\n` +
        `• Not spam, flood, or disrupt services\n` +
        `• Keep illegal content out of our server\n\n` +
        `**Violations Result In:**\n` +
        `• Warning → Mute → Kick → Ban\n` +
        `• Severe violations = immediate permanent ban\n` +
        `• No appeals for chargebacks or payment fraud`
      )
      .setColor(0x2F3136);
    
    const tosEmbed4 = new EmbedBuilder()
      .setTitle('3. PREMIUM SERVICES')
      .setDescription(
        `**Inner Circle Subscriptions:**\n` +
        `• Payments processed by Discord/Stripe\n` +
        `• Access granted instantly upon payment\n` +
        `• **ALL SALES ARE FINAL - NO REFUNDS**\n` +
        `• Subscription auto-renews unless cancelled\n` +
        `• Cancellation removes access at period end\n\n` +
        `**Chargebacks & Fraud:**\n` +
        `• Chargeback attempts = permanent blacklist\n` +
        `• Fraudulent purchases reported to Discord\n` +
        `• We reserve right to pursue legal action\n\n` +
        `**Account Sharing:**\n` +
        `• Your subscription is for YOUR account only\n` +
        `• Sharing access = termination, no refund\n` +
        `• You are responsible for your account security`
      )
      .setColor(0xFF6600);
    
    const tosEmbed5 = new EmbedBuilder()
      .setTitle('4. INTELLECTUAL PROPERTY')
      .setDescription(
        `**Our Content:**\n` +
        `• Bot code, systems, and features are proprietary\n` +
        `• Server structure and setup are copyrighted\n` +
        `• Premium content is confidential\n` +
        `• Unauthorized reproduction is prohibited\n\n` +
        `**You May Not:**\n` +
        `• Copy, redistribute, or sell our bot code\n` +
        `• Screenshot/record premium content for sharing\n` +
        `• Reverse engineer our systems\n` +
        `• Create derivative works without permission\n\n` +
        `**DMCA:**\n` +
        `We will pursue DMCA takedowns and legal action against IP theft.`
      )
      .setColor(0xFF0000);
    
    const tosEmbed6 = new EmbedBuilder()
      .setTitle('5. DISCLAIMERS')
      .setDescription(
        `**As-Is Service:**\n` +
        `• Services provided "AS IS" without warranty\n` +
        `• We don't guarantee uptime or availability\n` +
        `• Bot features may change without notice\n` +
        `• We're not responsible for game bans\n\n` +
        `**Limitation of Liability:**\n` +
        `• Maximum liability = amount you paid us\n` +
        `• We're not liable for indirect damages\n` +
        `• Use glitches/exploits at your own risk\n\n` +
        `**Third Parties:**\n` +
        `• We're not affiliated with Rockstar Games\n` +
        `• We're not responsible for third-party content\n` +
        `• External links are used at your own risk`
      )
      .setColor(0x2F3136);
    
    const tosEmbed7 = new EmbedBuilder()
      .setTitle('6. TERMINATION')
      .setDescription(
        `**We May Terminate Your Access If:**\n` +
        `• You violate these terms\n` +
        `• You engage in fraud or chargebacks\n` +
        `• You harass staff or members\n` +
        `• You damage our reputation\n` +
        `• At our sole discretion\n\n` +
        `**Upon Termination:**\n` +
        `• No refund of subscription fees\n` +
        `• All access revoked immediately\n` +
        `• Blacklist from future services\n` +
        `• Data may be retained for legal purposes`
      )
      .setColor(0xFF0000);
    
    const tosEmbed8 = new EmbedBuilder()
      .setTitle('7. AGREEMENT')
      .setDescription(
        `**By Remaining In This Server:**\n\n` +
        `✅ You confirm you are 13+ years old\n` +
        `✅ You agree to all terms above\n` +
        `✅ You accept our privacy practices\n` +
        `✅ You understand purchases are final\n` +
        `✅ You accept our right to modify terms\n\n` +
        `───────────────────────────\n\n` +
        `**Contact:** Server staff for questions\n` +
        `**Disputes:** Handled via Discord support\n\n` +
        `*These terms may be updated. Continued use = acceptance.*\n\n` +
        `© ${new Date().getFullYear()} The Unpatched Method. All rights reserved.`
      )
      .setColor(0x00FF00)
      .setFooter({ text: 'Terms of Service • The Unpatched Method' })
      .setTimestamp();
    
    await tosChannel.send({ embeds: [tosEmbed1] });
    await tosChannel.send({ embeds: [tosEmbed2] });
    await tosChannel.send({ embeds: [tosEmbed3] });
    await tosChannel.send({ embeds: [tosEmbed4] });
    await tosChannel.send({ embeds: [tosEmbed5] });
    await tosChannel.send({ embeds: [tosEmbed6] });
    await tosChannel.send({ embeds: [tosEmbed7] });
    await tosChannel.send({ embeds: [tosEmbed8] });
    
    await message.reply(`✅ **Terms of Service created!**\n\nChannel: ${tosChannel}\n\n*Professional TOS protects you legally.*`);
    
  } catch (e) {
    console.error('TOS setup error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TESTIMONIAL SYSTEM
// ═══════════════════════════════════════════════════════════════
async function handleTestimonial(message, args) {
  // Check if user is Inner Circle
  const innerCircleRole = message.guild.roles.cache.find(r => r.name === '⭐ Inner Circle');
  if (!innerCircleRole || !message.member.roles.cache.has(innerCircleRole.id)) {
    return message.reply('❌ Only Inner Circle members can leave testimonials.');
  }
  
  const review = args.join(' ');
  if (!review || review.length < 10) {
    return message.reply('❌ Usage: `?testimonial Your review here (at least 10 characters)`');
  }
  
  if (review.length > 500) {
    return message.reply('❌ Keep it under 500 characters.');
  }
  
  // Find or create testimonials channel
  let testimonialsChannel = message.guild.channels.cache.find(c => c.name === '⭐・testimonials');
  
  if (!testimonialsChannel) {
    // Create it
    testimonialsChannel = await message.guild.channels.create({
      name: '⭐・testimonials',
      type: 0,
      topic: '💬 Reviews from Inner Circle members. Real people, real experiences.',
      permissionOverwrites: [
        { id: message.guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] }
      ]
    });
    
    // Post header
    const headerEmbed = new EmbedBuilder()
      .setTitle('⭐ INNER CIRCLE TESTIMONIALS')
      .setDescription(
        `**Real reviews from real members.**\n\n` +
        `These are testimonials from our Inner Circle subscribers. Unedited, unfiltered.\n\n` +
        `*Want to leave a review? Subscribe to Inner Circle and use \`?testimonial\` in any channel.*`
      )
      .setColor(0xFFB300)
      .setTimestamp();
    
    await testimonialsChannel.send({ embeds: [headerEmbed] });
  }
  
  // Create testimonial embed
  const stars = '⭐'.repeat(5); // 5 stars default
  const testimonialEmbed = new EmbedBuilder()
    .setAuthor({ 
      name: message.author.username, 
      iconURL: message.author.displayAvatarURL({ dynamic: true }) 
    })
    .setDescription(`"${review}"`)
    .addFields(
      { name: 'Rating', value: stars, inline: true },
      { name: 'Member Since', value: `<t:${Math.floor(message.member.joinedTimestamp / 1000)}:R>`, inline: true }
    )
    .setColor(0xFFB300)
    .setFooter({ text: 'Inner Circle Member' })
    .setTimestamp();
  
  await testimonialsChannel.send({ embeds: [testimonialEmbed] });
  await message.reply(`✅ **Testimonial posted!** Thanks for the review. Check it out in ${testimonialsChannel}`);
  
  // Delete original message to keep it clean
  await message.delete().catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM TIERS SETUP
// ═══════════════════════════════════════════════════════════════
async function handleSetupTiers(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    
    await message.reply('🔧 *configuring premium tiers...* Setting up multiple subscription levels...');
    
    // Create three tiers
    const tier1Role = await guild.roles.create({
      name: '⭐ Inner Circle',
      color: 0xFFB300, // Gold
      hoist: true,
      mentionable: true,
      reason: 'Premium Tier 1'
    }).catch(() => guild.roles.cache.find(r => r.name === '⭐ Inner Circle'));
    
    const tier2Role = await guild.roles.create({
      name: '💎 Inner Circle+',
      color: 0x00FFFF, // Cyan/Diamond
      hoist: true,
      mentionable: true,
      reason: 'Premium Tier 2'
    });
    
    const tier3Role = await guild.roles.create({
      name: '👑 Lifetime VIP',
      color: 0xFF00FF, // Purple/Royal
      hoist: true,
      mentionable: true,
      reason: 'Premium Tier 3 - Lifetime'
    });
    
    // Move roles high
    const botRole = guild.members.me.roles.highest;
    await tier3Role.setPosition(botRole.position - 1).catch(() => {});
    await tier2Role.setPosition(botRole.position - 2).catch(() => {});
    await tier1Role.setPosition(botRole.position - 3).catch(() => {});
    
    // Find or create premium info channel
    let premiumInfoChannel = guild.channels.cache.find(c => c.name === '💰・premium-info');
    if (!premiumInfoChannel) {
      premiumInfoChannel = await guild.channels.create({
        name: '💰・premium-info',
        type: 0,
        topic: 'Information about our premium tiers and benefits'
      });
    }
    
    // Clear old messages
    const oldMessages = await premiumInfoChannel.messages.fetch({ limit: 50 });
    await premiumInfoChannel.bulkDelete(oldMessages).catch(() => {});
    
    // Post tier info
    const headerEmbed = new EmbedBuilder()
      .setTitle('💎 PREMIUM MEMBERSHIPS')
      .setDescription(
        `**Support The Unpatched Method and get exclusive perks.**\n\n` +
        `Choose the tier that fits you. All tiers support our community and development.`
      )
      .setColor(0xFFB300)
      .setImage('https://i.imgur.com/your-banner-here.png'); // You can add a banner
    
    const tier1Embed = new EmbedBuilder()
      .setTitle('⭐ INNER CIRCLE')
      .setDescription(
        `**$4.99/month**\n\n` +
        `The standard premium experience.\n\n` +
        `**Includes:**\n` +
        `✅ Access to all premium channels\n` +
        `✅ Priority LFG matchmaking\n` +
        `✅ Insider intel & early updates\n` +
        `✅ VIP voice chat\n` +
        `✅ Bots remember you better\n` +
        `✅ Subscriber role & badge\n` +
        `✅ Support the community`
      )
      .setColor(0xFFB300)
      .setFooter({ text: 'Monthly subscription • Cancel anytime' });
    
    const tier2Embed = new EmbedBuilder()
      .setTitle('💎 INNER CIRCLE+')
      .setDescription(
        `**$9.99/month**\n\n` +
        `Everything in Inner Circle, plus more.\n\n` +
        `**Includes Everything Above, Plus:**\n` +
        `✅ Direct message support from staff\n` +
        `✅ Custom bot nickname recognition\n` +
        `✅ Early access to new features\n` +
        `✅ Vote on upcoming features\n` +
        `✅ Exclusive giveaway entries\n` +
        `✅ Diamond role & badge\n` +
        `✅ Priority support queue`
      )
      .setColor(0x00FFFF)
      .setFooter({ text: 'Monthly subscription • Best value' });
    
    const tier3Embed = new EmbedBuilder()
      .setTitle('👑 LIFETIME VIP')
      .setDescription(
        `**$49.99 one-time**\n\n` +
        `Pay once, VIP forever.\n\n` +
        `**Includes Everything Above, Plus:**\n` +
        `✅ LIFETIME access (never expires)\n` +
        `✅ Name in credits/about section\n` +
        `✅ Custom role color (request)\n` +
        `✅ Direct line to owner\n` +
        `✅ Beta test new bots/features\n` +
        `✅ Crown role & badge\n` +
        `✅ Our eternal gratitude 👑`
      )
      .setColor(0xFF00FF)
      .setFooter({ text: 'One-time payment • Lifetime access' });
    
    const howToEmbed = new EmbedBuilder()
      .setTitle('🛒 HOW TO SUBSCRIBE')
      .setDescription(
        `**Getting your premium access is easy:**\n\n` +
        `1️⃣ Click **Server Settings** (server name → dropdown)\n` +
        `2️⃣ Click **Server Subscriptions** or **Shop**\n` +
        `3️⃣ Choose your tier\n` +
        `4️⃣ Complete payment via Discord\n` +
        `5️⃣ Access granted instantly!\n\n` +
        `───────────────────────────\n\n` +
        `**Payment Methods:**\n` +
        `💳 Credit/Debit Card\n` +
        `📱 PayPal\n` +
        `🎮 Discord Nitro Credits\n\n` +
        `**Questions?** Ask in general chat or DM staff.`
      )
      .setColor(0x00FF00);
    
    await premiumInfoChannel.send({ embeds: [headerEmbed] });
    await premiumInfoChannel.send({ embeds: [tier1Embed] });
    await premiumInfoChannel.send({ embeds: [tier2Embed] });
    await premiumInfoChannel.send({ embeds: [tier3Embed] });
    await premiumInfoChannel.send({ embeds: [howToEmbed] });
    
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Premium Tiers Created')
      .setDescription(
        `**Roles Created:**\n` +
        `⭐ Inner Circle - $4.99/mo\n` +
        `💎 Inner Circle+ - $9.99/mo\n` +
        `👑 Lifetime VIP - $49.99 once\n\n` +
        `**Info Channel:** ${premiumInfoChannel}\n\n` +
        `**Next Steps:**\n` +
        `1. Go to Server Settings → Server Products\n` +
        `2. Create 3 products (one per tier)\n` +
        `3. Assign each role to its product\n` +
        `4. Set the prices\n` +
        `5. Publish!`
      )
      .setColor(0x00FF00)
      .setTimestamp();
    
    await message.reply({ embeds: [successEmbed] });
    
  } catch (e) {
    console.error('Tiers setup error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

async function handleDeleteTiers(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  try {
    const guild = message.guild;
    
    // Delete tier roles (except base Inner Circle which deletepremium handles)
    const tier2 = guild.roles.cache.find(r => r.name === '💎 Inner Circle+');
    const tier3 = guild.roles.cache.find(r => r.name === '👑 Lifetime VIP');
    
    if (tier2) await tier2.delete().catch(() => {});
    if (tier3) await tier3.delete().catch(() => {});
    
    // Delete premium info channel
    const infoChannel = guild.channels.cache.find(c => c.name === '💰・premium-info');
    if (infoChannel) await infoChannel.delete().catch(() => {});
    
    await message.reply('✅ Premium tiers deleted (kept base Inner Circle role).');
    
  } catch (e) {
    console.error('Delete tiers error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// BLACKLIST SYSTEM (for payment abusers)
// ═══════════════════════════════════════════════════════════════
async function handleBlacklist(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  const userId = args[0]?.replace(/[<@!>]/g, '');
  const reason = args.slice(1).join(' ') || 'No reason provided';
  
  if (!userId) {
    return message.reply('❌ Usage: `?blacklist @user reason`');
  }
  
  try {
    // Store in database
    await client.db.query(`
      INSERT INTO blacklist (user_id, guild_id, reason, blacklisted_by, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, guild_id) DO UPDATE SET reason = $3, blacklisted_by = $4, created_at = NOW()
    `, [userId, message.guild.id, reason, message.author.id]);
    
    // Create blacklist role if doesn't exist
    let blacklistRole = message.guild.roles.cache.find(r => r.name === '🚫 Blacklisted');
    if (!blacklistRole) {
      blacklistRole = await message.guild.roles.create({
        name: '🚫 Blacklisted',
        color: 0x000000,
        permissions: [],
        reason: 'Blacklist role for payment abusers'
      });
    }
    
    // Apply role if member is in server
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (member) {
      await member.roles.add(blacklistRole);
      
      // Remove any premium roles
      const premiumRoles = ['⭐ Inner Circle', '💎 Inner Circle+', '👑 Lifetime VIP'];
      for (const roleName of premiumRoles) {
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
        }
      }
      
      // DM them
      try {
        await member.send({
          embeds: [new EmbedBuilder()
            .setTitle('🚫 You Have Been Blacklisted')
            .setDescription(
              `You have been blacklisted from The Unpatched Method.\n\n` +
              `**Reason:** ${reason}\n\n` +
              `This means:\n` +
              `• You cannot purchase premium services\n` +
              `• Any existing access has been revoked\n` +
              `• This is permanent\n\n` +
              `If you believe this is an error, contact server staff.`
            )
            .setColor(0xFF0000)
            .setTimestamp()
          ]
        });
      } catch (e) {}
    }
    
    // Log it
    const logChannel = message.guild.channels.cache.find(c => 
      c.name.includes('premium-log') || c.name.includes('blacklist-log') || c.name.includes('mod-log')
    );
    
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🚫 User Blacklisted')
        .setDescription(
          `**User:** <@${userId}> (${userId})\n` +
          `**Reason:** ${reason}\n` +
          `**By:** ${message.author}\n` +
          `**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
        .setColor(0xFF0000)
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed] });
    }
    
    await message.reply(`✅ **User blacklisted.**\n\nUser: <@${userId}>\nReason: ${reason}\n\n*They cannot purchase premium services.*`);
    
  } catch (e) {
    console.error('Blacklist error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

async function handleUnblacklist(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ Admin only.');
  }
  
  const userId = args[0]?.replace(/[<@!>]/g, '');
  
  if (!userId) {
    return message.reply('❌ Usage: `?unblacklist @user`');
  }
  
  try {
    // Remove from database
    await client.db.query(`
      DELETE FROM blacklist WHERE user_id = $1 AND guild_id = $2
    `, [userId, message.guild.id]);
    
    // Remove role if member is in server
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (member) {
      const blacklistRole = message.guild.roles.cache.find(r => r.name === '🚫 Blacklisted');
      if (blacklistRole && member.roles.cache.has(blacklistRole.id)) {
        await member.roles.remove(blacklistRole);
      }
    }
    
    await message.reply(`✅ <@${userId}> has been removed from the blacklist.`);
    
  } catch (e) {
    console.error('Unblacklist error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

async function handleBlacklistCheck(message, args) {
  const userId = args[0]?.replace(/[<@!>]/g, '') || message.author.id;
  
  try {
    const result = await client.db.query(`
      SELECT * FROM blacklist WHERE user_id = $1 AND guild_id = $2
    `, [userId, message.guild.id]);
    
    if (result.rows.length > 0) {
      const entry = result.rows[0];
      const embed = new EmbedBuilder()
        .setTitle('🚫 Blacklist Entry Found')
        .setDescription(
          `**User:** <@${userId}>\n` +
          `**Reason:** ${entry.reason}\n` +
          `**Blacklisted:** <t:${Math.floor(new Date(entry.created_at).getTime() / 1000)}:R>\n` +
          `**By:** <@${entry.blacklisted_by}>`
        )
        .setColor(0xFF0000);
      
      await message.reply({ embeds: [embed] });
    } else {
      await message.reply(`✅ <@${userId}> is NOT blacklisted.`);
    }
    
  } catch (e) {
    console.error('Blacklist check error:', e);
    await message.reply(`❌ Error: ${e.message}`);
  }
}

// Prevent blacklisted users from getting premium roles
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  try {
    // Check if they gained a premium role
    const premiumRoleNames = ['⭐ Inner Circle', '💎 Inner Circle+', '👑 Lifetime VIP'];
    
    for (const roleName of premiumRoleNames) {
      const role = newMember.guild.roles.cache.find(r => r.name === roleName);
      if (!role) continue;
      
      const hadRole = oldMember.roles.cache.has(role.id);
      const hasRole = newMember.roles.cache.has(role.id);
      
      if (!hadRole && hasRole) {
        // They just got a premium role - check blacklist
        const result = await client.db.query(`
          SELECT * FROM blacklist WHERE user_id = $1 AND guild_id = $2
        `, [newMember.id, newMember.guild.id]);
        
        if (result.rows.length > 0) {
          // They're blacklisted! Remove the role immediately
          await newMember.roles.remove(role);
          
          // DM them
          try {
            await newMember.send({
              embeds: [new EmbedBuilder()
                .setTitle('🚫 Access Denied')
                .setDescription(
                  `Your purchase was blocked because you are blacklisted.\n\n` +
                  `**Reason:** ${result.rows[0].reason}\n\n` +
                  `Your payment will be refunded by Discord. You cannot access premium services.`
                )
                .setColor(0xFF0000)
              ]
            });
          } catch (e) {}
          
          // Log it
          const logChannel = newMember.guild.channels.cache.find(c => 
            c.name.includes('premium-log') || c.name.includes('blacklist-log')
          );
          
          if (logChannel) {
            await logChannel.send({
              embeds: [new EmbedBuilder()
                .setTitle('🚫 Blacklisted User Attempted Purchase')
                .setDescription(
                  `**User:** ${newMember.user.tag} (${newMember.id})\n` +
                  `**Attempted Role:** ${roleName}\n` +
                  `**Action:** Role removed automatically\n` +
                  `**Blacklist Reason:** ${result.rows[0].reason}`
                )
                .setColor(0xFF0000)
                .setTimestamp()
              ]
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('Blacklist role check error:', e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION COMPLETE - Welcome user after they verify
// ═══════════════════════════════════════════════════════════════════════════════

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  try {
    // Check if they gained a verified role
    const verifiedRoleNames = ['verified', 'member', 'members', '✅ verified', '✅ member'];
    
    for (const roleName of verifiedRoleNames) {
      const role = newMember.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
      if (!role) continue;
      
      const hadRole = oldMember.roles.cache.has(role.id);
      const hasRole = newMember.roles.cache.has(role.id);
      
      if (!hadRole && hasRole) {
        // They just verified! Welcome them properly
        const guild = newMember.guild;
        
        // Find general channel
        const generalChannel = guild.channels.cache.find(c => 
          c.name === 'general' || c.name === 'general-chat' || c.name === 'chat'
        );
        
        if (generalChannel) {
          const verifiedWelcomes = [
            `*security systems deactivate* ${newMember} is now verified. Welcome to the REAL operation. Now go pick your roles - we need to know what you're here for.`,
            `${newMember} passed the vibe check. *unlocks the good channels* Now head to #roles and tell us what you're grinding - Cayo? Wagons? Bounties?`,
            `*stamps APPROVED on file* ${newMember} is officially one of us. Don't just stand there - grab your roles so we know if you're a heister or a trader.`,
            `Verification complete for ${newMember}. *opens the vault doors* Now the real question - what are you here for? Go pick your roles.`,
            `${newMember} made it past my firewalls. Impressive. Now do us both a favor and select your roles - GTA? RDO? Both? I need to update my files.`
          ];
          
          const randomWelcome = verifiedWelcomes[Math.floor(Math.random() * verifiedWelcomes.length)];
          
          const embed = new EmbedBuilder()
            .setTitle('🎮 Now Pick Your Roles!')
            .setDescription(`
**What are you here for?**

🚗 **GTA Online**
> • Cayo Perico grinding
> • Heist teams
> • Business sales

🤠 **Red Dead Online**
> • Wagon deliveries
> • Bounty hunting  
> • Collector runs

Head to **#roles** and select what you play!
            `)
            .setColor(0x00FF00)
            .setFooter({ text: 'Select your roles so we can match you with the right crew!' });
          
          await generalChannel.send({ content: randomWelcome, embeds: [embed] });
        }
        
        // Also DM them
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('✅ You\'re Verified!')
            .setDescription(`
Welcome to the crew, **${newMember.user.username}**!

Now that you're in, here's what to do next:
            `)
            .addFields(
              {
                name: '🎯 STEP 1: Pick Your Roles',
                value: 'Go to **#roles** and select:\n• What games you play (GTA/RDO)\n• What platform (PS4/PS5/Xbox/PC)\n• What activities you like',
                inline: false
              },
              {
                name: '🎮 STEP 2: Find Your Crew',
                value: '• **#cayo-lfg** - GTA Cayo Perico heists\n• **#wagon-lfg** - RDO trader wagons\n• **#bounty-lfg** - RDO bounty hunting',
                inline: false
              },
              {
                name: '💰 STEP 3: Get Free Stuff',
                value: 'Type `?daily` in **#casino** for free chips every day!\nGamble, compete on the leaderboard, flex on everyone.',
                inline: false
              }
            )
            .setColor(0x00FF00)
            .setFooter({ text: 'The Unpatched Method • Let\'s get this money' });
          
          await newMember.send({ embeds: [dmEmbed] });
        } catch (e) {
          // DMs disabled
        }
        
        break; // Only trigger once
      }
    }
  } catch (e) {
    console.error('Verification welcome error:', e.message);
  }
});

client.on('error', console.error);
process.on('unhandledRejection', console.error);

// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMY SYSTEM HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async function handleBalance(message) {
  if (!economy) return message.reply('Economy system not loaded.');
  const account = await economy.getAccount(message.author.id, message.guild.id);
  const embed = economy.createBalanceEmbed(account, message.author);
  await message.reply({ embeds: [embed] });
}

async function handleDaily(message) {
  if (!economy) return message.reply('Economy system not loaded.');
  const result = await economy.claimDaily(message.author.id, message.guild.id);
  if (!result.success) return message.reply(result.message);
  
  const embed = new EmbedBuilder()
    .setTitle('💰 Daily Reward!')
    .setDescription(`You claimed **${economy.currency.symbol} ${result.reward.toLocaleString()}**!`)
    .addFields(
      { name: '🔥 Streak', value: `${result.streak} days`, inline: true },
      { name: '➕ Streak Bonus', value: `${economy.currency.symbol} ${result.streakBonus}`, inline: true }
    )
    .setColor(0x00FF00)
    .setFooter({ text: 'Come back tomorrow for more!' });
  await message.reply({ embeds: [embed] });
}

async function handleWork(message) {
  if (!economy) return message.reply('Economy system not loaded.');
  const result = await economy.work(message.author.id, message.guild.id);
  if (!result.success) return message.reply(result.message);
  
  await message.reply(`💼 You ${result.job} and earned **${economy.currency.symbol} ${result.earnings.toLocaleString()}**!`);
}

async function handleCrime(message) {
  if (!economy) return message.reply('Economy system not loaded.');
  const result = await economy.crime(message.author.id, message.guild.id);
  if (!result.success) return message.reply(result.message);
  
  if (result.caught) {
    await message.reply(`🚔 You tried to ${result.crime} but got caught! Paid **${economy.currency.symbol} ${result.fine}** in fines.`);
  } else {
    await message.reply(`🦹 You successfully ${result.crime} and scored **${economy.currency.symbol} ${result.earnings.toLocaleString()}**!`);
  }
}

async function handleSlots(message, args) {
  if (!economy) return message.reply('Economy system not loaded.');
  const bet = parseInt(args[0]) || 100;
  const result = await economy.playSlots(message.author.id, message.guild.id, bet);
  if (!result.success) return message.reply(result.message);
  
  const embed = economy.createSlotsEmbed(result, message.author);
  await message.reply({ embeds: [embed] });
}

async function handleCoinflip(message, args) {
  if (!economy) return message.reply('Economy system not loaded.');
  const bet = parseInt(args[0]) || 100;
  const choice = args[1] || 'heads';
  const result = await economy.coinflip(message.author.id, message.guild.id, bet, choice);
  if (!result.success) return message.reply(result.message);
  
  const coinEmoji = result.result === 'heads' ? '🪙' : '⭕';
  if (result.won) {
    await message.reply(`${coinEmoji} **${result.result.toUpperCase()}!** You won **${economy.currency.symbol} ${result.profit.toLocaleString()}**!`);
  } else {
    await message.reply(`${coinEmoji} **${result.result.toUpperCase()}!** You lost **${economy.currency.symbol} ${result.loss.toLocaleString()}**`);
  }
}

async function handleBlackjack(message, args) {
  if (!economy) return message.reply('Economy system not loaded.');
  const bet = parseInt(args[0]) || 100;
  const result = await economy.blackjack(message.author.id, message.guild.id, bet);
  if (!result.success) return message.reply(result.message);
  
  const embed = new EmbedBuilder()
    .setTitle('🃏 Blackjack')
    .addFields(
      { name: 'Your Hand', value: `${result.playerHand.join(' ')} (${result.playerTotal})`, inline: true },
      { name: 'Dealer Hand', value: `${result.dealerHand.join(' ')} (${result.dealerTotal})`, inline: true }
    )
    .setColor(result.won ? 0x00FF00 : result.push ? 0xFFFF00 : 0xFF0000)
    .setFooter({ text: result.blackjack ? 'BLACKJACK!' : result.push ? 'Push - bet returned' : result.won ? 'You win!' : 'Dealer wins' });
  
  if (result.won || result.push) {
    embed.addFields({ name: '💰 Payout', value: `${economy.currency.symbol} ${result.winnings.toLocaleString()}` });
  }
  await message.reply({ embeds: [embed] });
}

async function handleRoulette(message, args) {
  if (!economy) return message.reply('Economy system not loaded.');
  const bet = parseInt(args[0]) || 100;
  const choice = args.slice(1).join(' ') || 'red';
  const result = await economy.roulette(message.author.id, message.guild.id, bet, choice);
  if (!result.success) return message.reply(result.message);
  
  const embed = new EmbedBuilder()
    .setTitle('🎰 Roulette')
    .setDescription(`The ball lands on... **${result.color} ${result.result}**!`)
    .addFields(
      { name: 'Your Bet', value: `${result.betType}`, inline: true },
      { name: 'Result', value: result.won ? `🎉 WIN! ${result.multiplier}x` : '❌ Loss', inline: true }
    )
    .setColor(result.won ? 0x00FF00 : 0xFF0000);
  
  if (result.won) embed.addFields({ name: '💰 Winnings', value: `${economy.currency.symbol} ${result.winnings.toLocaleString()}` });
  await message.reply({ embeds: [embed] });
}

async function handlePay(message, args) {
  if (!economy) return message.reply('Economy system not loaded.');
  const target = message.mentions.users.first();
  if (!target) return message.reply('Mention someone to pay!');
  const amount = parseInt(args[1]) || parseInt(args[0]?.replace(/[<@!>]/g, ''));
  if (!amount || amount < 1) return message.reply('Enter a valid amount!');
  
  const result = await economy.transfer(message.author.id, target.id, message.guild.id, amount);
  if (!result.success) return message.reply(result.message);
  
  await message.reply(`✅ Sent **${economy.currency.symbol} ${amount.toLocaleString()}** to ${target}!`);
}

async function handleRichest(message) {
  if (!economy) return message.reply('Economy system not loaded.');
  const leaderboard = await economy.getLeaderboard(message.guild.id, 'balance', 10);
  const embed = economy.createLeaderboardEmbed(leaderboard, message.guild, 'balance');
  await message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEIST PLANNER HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async function handlePlan(message, args) {
  if (!heistPlanner) return message.reply('Heist planner not loaded.');
  const time = parseInt(args[0]) || 60;
  const players = parseInt(args[1]) || 1;
  const game = args[2]?.toLowerCase() === 'rdo' ? 'rdo' : 'gta';
  
  const plan = await heistPlanner.generatePlan(time, players, game);
  const embed = heistPlanner.createPlanEmbed(plan, time, game);
  await message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPUTATION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async function handleReputation(message, args) {
  if (!reputation) return message.reply('Reputation system not loaded.');
  const target = message.mentions.users.first() || message.author;
  const rep = await reputation.getReputation(target.id, message.guild.id);
  const partners = await reputation.getFrequentPartners(target.id, message.guild.id, 5);
  const embed = reputation.createReputationEmbed(rep, target, partners);
  await message.reply({ embeds: [embed] });
}

async function handleRate(message, args) {
  if (!reputation) return message.reply('Reputation system not loaded.');
  const target = message.mentions.users.first();
  if (!target) return message.reply('Mention someone to rate!');
  const rating = parseInt(args[1]) || parseInt(args.find(a => !a.startsWith('<@')));
  if (!rating || rating < 1 || rating > 5) return message.reply('Rate 1-5 stars! Example: `?rate @user 5`');
  
  const result = await reputation.ratePlayer(message.author.id, target.id, message.guild.id, rating);
  if (!result.success) return message.reply(result.message);
  
  await message.reply(`⭐ Rated ${target} **${rating}/5** stars! Their new average: **${result.newAverage}/5**`);
}

async function handlePartners(message) {
  if (!reputation) return message.reply('Reputation system not loaded.');
  const partners = await reputation.getFrequentPartners(message.author.id, message.guild.id, 10);
  
  if (partners.length === 0) return message.reply("You haven't played with anyone yet!");
  
  const partnerList = partners.map((p, i) => 
    `${i + 1}. <@${p.partner_id}> - **${p.sessions_together}** sessions | $${parseInt(p.total_earnings_together).toLocaleString()} earned together`
  ).join('\n');
  
  const embed = new EmbedBuilder()
    .setTitle('🤝 Your Frequent Partners')
    .setDescription(partnerList)
    .setColor(0x00BFFF);
  await message.reply({ embeds: [embed] });
}

async function handleConnection(message, args) {
  if (!reputation) return message.reply('Reputation system not loaded.');
  const target = message.mentions.users.first();
  if (!target) return message.reply('Mention someone to see your connection!');
  
  const connection = await reputation.getConnection(message.author.id, target.id, message.guild.id);
  const embed = reputation.createConnectionEmbed(connection, message.author, target);
  await message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE ANALYTICS HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async function handleMyTime(message) {
  if (!predictive) return message.reply('Predictive analytics not loaded.');
  const prediction = await predictive.predictBestTime(message.author.id, message.guild.id);
  const serverPeaks = await predictive.getServerPeakTimes(message.guild.id, 3);
  const embed = predictive.createPredictionEmbed(prediction, message.author, serverPeaks);
  await message.reply({ embeds: [embed] });
}

async function handlePeakTimes(message) {
  if (!predictive) return message.reply('Predictive analytics not loaded.');
  const peaks = await predictive.getServerPeakTimes(message.guild.id, 10);
  
  if (peaks.length === 0) return message.reply('Not enough data yet!');
  
  const peakList = peaks.map((p, i) => 
    `${i + 1}. **${predictive.getDayName(p.day_of_week)}** at **${predictive.formatHour(p.hour_of_day)}** - ${p.total_lfg} sessions`
  ).join('\n');
  
  const embed = new EmbedBuilder()
    .setTitle('🌐 Server Peak Times')
    .setDescription(peakList)
    .setColor(0x9932CC)
    .setFooter({ text: 'Based on LFG activity' });
  await message.reply({ embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY COMMAND GATE - Only allows commands in activities category
// ═══════════════════════════════════════════════════════════════════════════════

const ACTIVITIES_CATEGORY_ID = '1454372554037923937';

async function handleActivityCommand(message, callback) {
  const parentId = message.channel.parentId;
  
  if (parentId !== ACTIVITIES_CATEGORY_ID) {
    // Find the category to get channel names
    const category = message.guild.channels.cache.get(ACTIVITIES_CATEGORY_ID);
    const categoryName = category?.name || '🎮 ACTIVITIES';
    
    await message.reply(`⚠️ This command only works in the **${categoryName}** channels!\n\nHead over there to use economy, AI, and reputation features.`);
    return;
  }
  
  // They're in the right place, run the command
  await callback();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP ACTIVITIES - Creates activity-guide channel
// ═══════════════════════════════════════════════════════════════════════════════

async function handleSetupActivities(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('Admin only.');
  }

  const statusMsg = await message.reply('🔧 Creating activity guide...');

  try {
    const guild = message.guild;
    const categoryId = '1454372554037923937';

    // Create #activity-guide (read-only)
    const guideChannel = await guild.channels.create({
      name: 'activity-guide',
      type: 0,
      parent: categoryId,
      topic: '📖 Learn how to use all activity features!',
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.SendMessages],
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    // Move to top of category
    await guideChannel.setPosition(0).catch(() => {});

    // Casino embed
    const casinoEmbed = new EmbedBuilder()
      .setTitle('🎰 CASINO')
      .setDescription(`
**Use these commands in #casino**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 **GET CHIPS:**
\`?daily\` - Free daily chips (streak bonus!)
\`?work\` - Earn chips (30min cooldown)
\`?crime\` - High risk, high reward (1hr cooldown)

🎲 **GAMBLE:**
\`?slots 100\` - Spin the slots
\`?coinflip 50 heads\` - 50/50 bet
\`?blackjack 100\` - Play 21
\`?roulette 100 red\` - Spin the wheel

📊 **OTHER:**
\`?balance\` - Check your chips
\`?pay @user 100\` - Send chips
\`?richest\` - Leaderboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `)
      .setColor(0xFFD700);

    // AI Lab embed
    const aiEmbed = new EmbedBuilder()
      .setTitle('🎨 AI LAB')
      .setDescription(`
**Use these commands in #ai-lab**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖼️ **IMAGES:**
\`?generate [prompt]\` - Create any image
\`?wanted @user\` - GTA wanted poster
\`?bounty @user\` - RDO bounty poster
\`?victory [text]\` - Victory screen

🎬 **VIDEO:**
\`?video [prompt]\` - Generate short video
*(Takes 1-2 minutes)*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Examples:**
\`?generate epic sunset over Los Santos\`
\`?wanted @friend\`
\`?video car chase through city at night\`
      `)
      .setColor(0x9932CC);

    // Crew Finder embed
    const crewEmbed = new EmbedBuilder()
      .setTitle('🤝 CREW FINDER')
      .setDescription(`
**Use these commands in #crew-finder**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⭐ **REPUTATION:**
\`?rep @user\` - Check someone's reputation
\`?rate @user 1-5\` - Rate after playing together
\`?partners\` - See your frequent crew
\`?connection @user\` - Your history with someone

📊 **PLANNING:**
\`?plan 60 2\` - Best activities for 60min with 2 players
\`?mytime\` - Your optimal LFG time
\`?peaktimes\` - When server is most active

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Check \`?rep\` before joining randoms!**
**Rate good teammates to boost their rep!**
      `)
      .setColor(0x00BFFF);

    // Send all embeds
    await guideChannel.send({ embeds: [casinoEmbed] });
    await guideChannel.send({ embeds: [aiEmbed] });
    await guideChannel.send({ embeds: [crewEmbed] });

    await statusMsg.edit(`✅ Created #activity-guide (read-only)

Users can see the instructions but can't type there.`);

  } catch (error) {
    console.error('Setup activities error:', error);
    await statusMsg.edit(`❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP JOIN-LEAVE - Creates join-leave log channel in Staff category
// ═══════════════════════════════════════════════════════════════════════════════

async function handleSetupJoinLeave(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('Admin only.');
  }

  const statusMsg = await message.reply('🔧 Creating join-leave log channel...');

  try {
    const guild = message.guild;
    
    // Find Staff category
    let staffCategory = guild.channels.cache.find(c => 
      c.type === 4 && (c.name.toLowerCase().includes('staff') || c.name.toLowerCase().includes('admin'))
    );
    
    // Create category if it doesn't exist
    if (!staffCategory) {
      staffCategory = await guild.channels.create({
        name: '🔒 STAFF',
        type: 4,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
    }

    // Check if channel already exists
    let joinLeaveChannel = guild.channels.cache.find(c => c.name === 'join-leave');
    
    if (joinLeaveChannel) {
      await statusMsg.edit('⚠️ #join-leave channel already exists!');
      return;
    }

    // Create join-leave channel (staff only)
    joinLeaveChannel = await guild.channels.create({
      name: 'join-leave',
      type: 0,
      parent: staffCategory.id,
      topic: '📊 Member join and leave logs',
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ]
    });

    // Send intro message
    const introEmbed = new EmbedBuilder()
      .setTitle('📊 Join/Leave Log')
      .setDescription(`
**This channel logs all member joins and leaves.**

📥 **Green** = Member joined
📤 **Red** = Member left

*Lester also welcomes new members in #general with unique messages.*
      `)
      .setColor(0x00FF00)
      .setTimestamp();
    
    await joinLeaveChannel.send({ embeds: [introEmbed] });

    await statusMsg.edit(`✅ Created #join-leave in Staff category!

📥 New members → Logged here + welcomed in #general
📤 Leaving members → Logged here`);

  } catch (error) {
    console.error('Setup join-leave error:', error);
    await statusMsg.edit(`❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP BOT GOSSIP - Creates channel where bots talk to each other
// ═══════════════════════════════════════════════════════════════════════════════

async function handleSetupGossip(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('Admin only.');
  }

  const statusMsg = await message.reply('🔧 Creating bot gossip channel...');

  try {
    const guild = message.guild;
    
    // Find Staff category
    let staffCategory = guild.channels.cache.find(c => 
      c.type === 4 && (c.name.toLowerCase().includes('staff') || c.name.toLowerCase().includes('admin'))
    );
    
    if (!staffCategory) {
      staffCategory = await guild.channels.create({
        name: '🔒 STAFF',
        type: 4,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          }
        ]
      });
    }

    // Check if channel already exists
    let gossipChannel = guild.channels.cache.find(c => c.name === 'bot-gossip');
    
    if (gossipChannel) {
      await statusMsg.edit('⚠️ #bot-gossip channel already exists!');
      return;
    }

    // Create gossip channel (staff only)
    gossipChannel = await guild.channels.create({
      name: 'bot-gossip',
      type: 0,
      parent: staffCategory.id,
      topic: '🗣️ The bots talk about users here...',
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ]
    });

    // Send intro message
    const introEmbed = new EmbedBuilder()
      .setTitle('🗣️ Bot Gossip Channel')
      .setDescription(`
**This is where the bots talk to each other about users.**

The bots will occasionally:
- Gossip about user activity
- Share observations
- Argue about heist strategies
- Judge people's decisions

*This happens automatically. Just watch and enjoy.*
      `)
      .setColor(0x9932CC)
      .setTimestamp();
    
    await gossipChannel.send({ embeds: [introEmbed] });

    await statusMsg.edit(`✅ Created #bot-gossip in Staff category!

🗣️ The bots will automatically chat here about server activity.`);

  } catch (error) {
    console.error('Setup gossip error:', error);
    await statusMsg.edit(`❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORCE GOSSIP - Manually trigger bot gossip for testing
// ═══════════════════════════════════════════════════════════════════════════════

async function handleForceGossip(message) {
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('Admin only.');
  }

  const statusMsg = await message.reply('🗣️ Generating bot gossip...');

  try {
    const guild = message.guild;
    
    // Find general channel
    const generalChannel = guild.channels.cache.find(c => 
      c.name === 'general' || c.name === 'general-chat' || c.name === 'chat'
    );
    
    if (!generalChannel) {
      return statusMsg.edit('❌ No #general channel found.');
    }

    // Pick two random bots
    const bots = ['lester', 'pavel', 'cripps', 'chief', 'nazar'];
    const bot1 = bots[Math.floor(Math.random() * bots.length)];
    let bot2 = bots[Math.floor(Math.random() * bots.length)];
    while (bot2 === bot1) bot2 = bots[Math.floor(Math.random() * bots.length)];

    const botNames = {
      lester: 'Lester',
      pavel: 'Pavel',
      cripps: 'Cripps',
      chief: 'Police Chief',
      nazar: 'Madam Nazar'
    };

    // Generate gossip
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Write a short, funny gossip exchange (3-4 messages) between ${botNames[bot1]} and ${botNames[bot2]} from GTA/RDO. They're chatting in a Discord server about random stuff - maybe about users, heists, the server, or just bickering about something stupid.

${botNames[bot1]} personality: ${bot1 === 'lester' ? 'paranoid genius, snarky' : bot1 === 'pavel' ? 'cheerful Russian submarine captain' : bot1 === 'cripps' ? 'old man who tells boring stories' : bot1 === 'chief' ? 'stern lawman' : 'mysterious fortune teller'}

${botNames[bot2]} personality: ${bot2 === 'lester' ? 'paranoid genius, snarky' : bot2 === 'pavel' ? 'cheerful Russian submarine captain' : bot2 === 'cripps' ? 'old man who tells boring stories' : bot2 === 'chief' ? 'stern lawman' : 'mysterious fortune teller'}

Format as:
**${botNames[bot1]}:** [message]
**${botNames[bot2]}:** [response]
**${botNames[bot1]}:** [reply]

Keep it short, funny, in character. Include *actions* occasionally.`
      }]
    });

    const gossip = response.content[0].text;

    const embed = new EmbedBuilder()
      .setTitle('🗣️ Bot Chatter')
      .setDescription(gossip)
      .setColor(0x9932CC)
      .setFooter({ text: 'The bots are talking...' })
      .setTimestamp();

    await generalChannel.send({ embeds: [embed] });
    await statusMsg.edit('✅ Gossip sent to #general!');

  } catch (error) {
    console.error('Force gossip error:', error);
    await statusMsg.edit(`❌ Error: ${error.message}`);
  }
}

client.login(process.env.DISCORD_TOKEN);

// ═══════════════════════════════════════════════════════════════════════════════
// WELCOME SYSTEM - AI-generated unique welcomes + Join/Leave logging
// ═══════════════════════════════════════════════════════════════════════════════

const WELCOME_MESSAGES = [
  "Well, well... look who finally showed up. {user}, I've been watching you for a while now. *adjusts glasses* Welcome to the crew.",
  "*sighs heavily* Another one? Fine. {user}, welcome to The Unpatched Method. Try not to break anything.",
  "Ah, {user}. I was wondering when you'd find us. *types rapidly* You're now in my system. Welcome.",
  "{user} just walked in. *checks multiple monitors* Clean record... for now. Welcome to the operation.",
  "*spins around in chair* {user}! Perfect timing. We were just about to pull something big. Welcome aboard.",
  "Hold on, let me run a background check... *keyboard clicking* ...okay {user}, you're clear. Welcome to the family.",
  "Another recruit? *rubs temples* Alright {user}, listen up - welcome to The Unpatched Method. Don't make me regret this.",
  "{user} has entered the building. *cracks knuckles* Time to show you how we do things around here. Welcome.",
  "My systems detected a new arrival... {user}. *smirks* Welcome. Try to keep up.",
  "*looks up from screens* Oh, {user}. I knew you'd come eventually. Welcome to the inner circle.",
  "Security alert: New member detected. *disables alarm* Stand down, it's just {user}. Welcome, kid.",
  "{user}, you made it past my firewalls. Impressive. *nods approvingly* Welcome to the crew.",
  "*mutters* Another mouth to feed... I mean, welcome {user}! Glad you could join us. Really.",
  "Incoming transmission from... {user}? *accepts connection* Welcome to The Unpatched Method. Don't disappoint me.",
  "{user} just joined. *evil laugh* Fresh meat for the grinder. Just kidding. Mostly. Welcome!",
  "*adjusts tinfoil hat* They told me you'd come, {user}. The algorithms predicted it. Welcome.",
  "Attention everyone: {user} has arrived. *dramatic pause* ...What? I can be theatrical sometimes. Welcome.",
  "{user}! Finally, someone who looks competent. *squints* You ARE competent, right? Welcome anyway.",
  "*hacking intensifies* ...Sorry, had to verify your identity, {user}. You check out. Welcome to the operation.",
  "My spider senses are tingling... oh, it's just {user}. Welcome to The Unpatched Method!"
];

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const guild = member.guild;
    
    // ═══════════════════════════════════════════════════════════════
    // STAFF LOG - Join/Leave channel
    // ═══════════════════════════════════════════════════════════════
    let joinLeaveChannel = guild.channels.cache.find(c => 
      c.name === 'join-leave' || c.name === 'join-leave-log' || c.name === 'member-log'
    );
    
    if (joinLeaveChannel) {
      const joinEmbed = new EmbedBuilder()
        .setTitle('📥 Member Joined')
        .setDescription(`${member} joined the server`)
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Member Count', value: `${guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x00FF00)
        .setTimestamp();
      
      await joinLeaveChannel.send({ embeds: [joinEmbed] });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GENERAL CHAT - AI Welcome Message + Role Mentions
    // ═══════════════════════════════════════════════════════════════
    let generalChannel = guild.channels.cache.find(c => 
      c.name === 'general' || c.name === 'general-chat' || c.name === 'chat'
    );
    
    if (generalChannel) {
      // Find roles to mention
      const welcomerRole = guild.roles.cache.find(r => 
        r.name.toLowerCase().includes('welcomer') || 
        r.name.toLowerCase().includes('greeter') ||
        r.name.toLowerCase().includes('staff') ||
        r.name.toLowerCase().includes('mod')
      );
      
      // Pick random welcome message
      const randomMsg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
      let welcomeText = randomMsg.replace(/{user}/g, `${member}`);
      
      // Sometimes use AI for extra unique message
      if (Math.random() < 0.3 && anthropic) {
        try {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `You are Lester Crest from GTA V. Write a SHORT (1-2 sentences) unique welcome message for a new Discord member named ${member.user.username}. Be snarky, paranoid, but welcoming. Include one *action* like *adjusts glasses* or *types rapidly*. Don't use emojis.`
            }]
          });
          
          welcomeText = `${member} ${response.content[0].text}`;
        } catch (e) {
          // Keep original random message
        }
      }
      
      // Add role mention if found
      if (welcomerRole) {
        welcomeText += `\n\n${welcomerRole} - Someone come say hi!`;
      }
      
      await generalChannel.send(welcomeText);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // DM WELCOME - Send private welcome message with VERIFICATION
    // ═══════════════════════════════════════════════════════════════
    try {
      // Find verify channel to make it clickable
      const verifyChannel = guild.channels.cache.find(c => 
        c.name === 'verify' || c.name === 'verification' || c.name === '✅-verify'
      );
      const verifyLink = verifyChannel ? `<#${verifyChannel.id}>` : '#verify';
      
      // Find roles channel
      const rolesChannel = guild.channels.cache.find(c => 
        c.name === 'roles' || c.name === 'get-roles' || c.name === 'self-roles'
      );
      const rolesLink = rolesChannel ? `<#${rolesChannel.id}>` : '#roles';
      
      const verifyEmbed = new EmbedBuilder()
        .setTitle('⚠️ IMPORTANT: VERIFY YOURSELF ⚠️')
        .setDescription(`
# 🚨 YOU MUST VERIFY TO ACCESS THE SERVER 🚨

Hey **${member.user.username}**, welcome to **The Unpatched Method**.

**Before you can see any channels, you NEED to verify.**
        `)
        .addFields(
          {
            name: '✅ HOW TO VERIFY',
            value: `**1.** Click here → ${verifyLink}\n**2.** Click the ✅ button\n**3.** That's it - you're in!`,
            inline: false
          },
          {
            name: '❌ WITHOUT VERIFICATION',
            value: '• You can\'t see channels\n• You can\'t chat\n• You can\'t join LFG\n• You\'re basically invisible',
            inline: true
          },
          {
            name: '✅ AFTER VERIFICATION',
            value: '• Full server access\n• LFG for heists & wagons\n• Talk to our AI bots\n• Join the community',
            inline: true
          }
        )
        .setColor(0xFF0000)
        .setFooter({ text: '⚠️ VERIFY FIRST - THEN READ BELOW ⚠️' })
        .setTimestamp();

      const infoEmbed = new EmbedBuilder()
        .setTitle('🎮 Welcome to The Unpatched Method!')
        .setDescription(`
Once you're verified, here's what you need to know:
        `)
        .addFields(
          { 
            name: '📋 Get Started', 
            value: '• Check out the rules\n• Grab some roles\n• Introduce yourself', 
            inline: true 
          },
          { 
            name: '🎯 LFG Channels', 
            value: '• **#cayo-lfg** - GTA Heists\n• **#wagon-lfg** - RDO Trading\n• **#bounty-lfg** - RDO Bounties', 
            inline: true 
          },
          { 
            name: '🤖 Talk to the Bots', 
            value: '• **#talk-to-lester** - That\'s me\n• **#talk-to-pavel** - Heist help\n• **#casino** - Gamble chips', 
            inline: false 
          },
          {
            name: '💡 Pro Tip',
            value: 'Type `?daily` in #casino to get free chips every day. Don\'t tell anyone I told you.',
            inline: false
          }
        )
        .setColor(0xFF6B35)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: 'The Unpatched Method • Welcome to the crew' });
      
      await member.send({ content: '# 🚨 READ THIS FIRST 🚨', embeds: [verifyEmbed, infoEmbed] });
    } catch (dmError) {
      // User has DMs disabled, that's fine
      console.log(`[WELCOME] Could not DM ${member.user.username} - DMs disabled`);
    }
    
  } catch (error) {
    console.error('[WELCOME] Error:', error.message);
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const guild = member.guild;
    
    // Log to join-leave channel
    let joinLeaveChannel = guild.channels.cache.find(c => 
      c.name === 'join-leave' || c.name === 'join-leave-log' || c.name === 'member-log'
    );
    
    if (joinLeaveChannel) {
      const leaveEmbed = new EmbedBuilder()
        .setTitle('📤 Member Left')
        .setDescription(`${member.user.tag} left the server`)
        .addFields(
          { name: 'User', value: `${member.user.tag}`, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
          { name: 'Member Count', value: `${guild.memberCount}`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0xFF0000)
        .setTimestamp();
      
      await joinLeaveChannel.send({ embeds: [leaveEmbed] });
    }
    
  } catch (error) {
    console.error('[LEAVE] Error:', error.message);
  }
});
