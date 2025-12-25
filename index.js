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
const conversationMemory = new Map();
const activeConversations = new Map();

client.once(Events.ClientReady, async () => {
  console.log(`\n[LESTER ULTIMATE] Logged in as ${client.user.tag} | ${client.guilds.cache.size} servers\n`);

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
        
        for (const channel of statsCategory.children.cache.values()) {
          if (channel.type !== 2) continue; // Voice channels only
          try {
            if (channel.name.startsWith('👥')) {
              await channel.setName(`👥 Members: ${memberCount}`);
            } else if (channel.name.startsWith('🟢')) {
              await channel.setName(`🟢 Online: ${onlineCount}`);
            } else if (channel.name.startsWith('🤖')) {
              await channel.setName(`🤖 Bots: ${botCount}`);
            }
          } catch (e) {}
        }
        
        console.log(`[STATS] Updated: ${memberCount} members, ${onlineCount} online, ${botCount} bots`);
      }
    } catch (e) { console.error('Stats update error:', e.message); }
  }, 5 * 60 * 1000); // Every 5 minutes
  
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
  // NEVER respond in counting channel
  if (message.channel.name === 'counting') return false;
  
  // NEVER respond in OTHER bots' talk-to channels
  const channelName = message.channel.name;
  if (channelName.startsWith('talk-to-') && channelName !== 'talk-to-lester') return false;
  
  if (channelName === 'talk-to-lester') return true;
  if (isInActiveConversation(message.channel.id, message.author.id)) return true;
  if (message.mentions.has(client.user)) return true;
  const content = message.content.toLowerCase();
  if (content.includes('lester') || content.includes('mastermind') || content.includes('heist')) return true;
  if (channelName.includes('log') || channelName.includes('staff')) return false;
  if (freeRoam) { const d = await freeRoam.shouldRespond(message); if (d.respond) return true; }
  if (isOtherBot(message.author.id)) return Math.random() < 0.35;
  return Math.random() < 0.15;
}

async function generateResponse(message) {
  const history = conversationMemory.get(message.author.id) || [];
  history.push({ role: 'user', content: message.content });
  while (history.length > 20) history.shift();
  try {
    await message.channel.sendTyping();
    let intelligencePrompt = '', ctx = null;
    if (intelligence) { ctx = await intelligence.processIncoming(message); intelligencePrompt = intelligence.buildPromptContext(ctx); }
    
    const response = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 200, system: LESTER_SYSTEM + (intelligencePrompt ? '\n\n' + intelligencePrompt : ''), messages: history });
    let reply = response.content[0].text;
    
    if (intelligence && ctx) { reply = await intelligence.processOutgoing(message, reply, ctx); await intelligence.storeConversationMemory(message, reply); }
    history.push({ role: 'assistant', content: reply });
    conversationMemory.set(message.author.id, history);
    
    await new Promise(r => setTimeout(r, Math.min(reply.length * 30, 3000)));
    const sent = await message.reply(reply);
    trackConversation(message.channel.id, message.author.id);
    
    if (intelligence?.learning) await intelligence.learning.recordResponse(sent.id, message.channel.id, message.author.id, 'reply', 'general', reply.length);
    if (mediaGenerator) try { await mediaGenerator.handleBotMedia(MY_BOT_ID, reply, message.channel); } catch (e) {}
  } catch (e) { console.error('Response error:', e); await message.reply("*keyboard smashing* Something broke."); }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot && !isOtherBot(message.author.id)) return;
  if (message.author.id === client.user.id) return;
  if (!message.guild) { await generateResponse(message); return; }

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
      'deletestats': () => handleDeleteStats(message)
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
      { name: '🔨 Moderation', value: '`?kick` `?ban` `?unban` `?mute` `?unmute` `?timeout`\n`?warn` `?warnings` `?clearwarnings` `?purge` `?slowmode`\n`?lock` `?unlock`' },
      { name: '🔍 Investigation', value: '`?investigate` `?evidence` `?record` `?watchlist` `?predict`' },
      { name: '🛡️ Scam', value: '`?addscam` `?removescam` `?scamlist` `?checklink`' },
      { name: '📊 Info', value: '`?serverinfo` `?userinfo` `?avatar` `?stats` `?leaderboard`' },
      { name: '🔫 Gun Van', value: '`?gunvan`' },
      { name: '🔢 Counting', value: '`?countrecord`' },
      { name: '🧠 Memory', value: '`?memory` `?forgetme`' },
      { name: '🎙️ Voice', value: '`?voice join/leave` `?speak` `?shutup`' }
    )
    .setColor(0x00FF00)
    .setFooter({ text: 'ULTIMATE Edition + Activity Systems' });
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
client.on(Events.GuildMemberUpdate, async (o, n) => { try { await loggingHandler.memberUpdated(o, n, client); } catch (e) {} });
client.on(Events.VoiceStateUpdate, async (o, n) => { 
  if (intelligence?.contextAwareness && n.guild) intelligence.contextAwareness.updateVoiceState(n.guild.id, n);
  try { await loggingHandler.voiceStateUpdate(o, n, client); } catch (e) {}
});
client.on(Events.MessageReactionAdd, async (r, u) => { if (u.bot) return; if (intelligence && r.message.author?.id === client.user.id) await intelligence.handleReaction(r.message.id, r.emoji.name, u.id); });

// ═══════════════════════════════════════════════════════════════
// STATS CATEGORY SETUP
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
    
    await message.reply(`✅ **Stats category created!**\n\n📊 SERVER STATS\n├ 👥 Members: ${memberCount}\n├ 🟢 Online: ${onlineCount}\n└ 🤖 Bots: ${botCount}\n\n*Updates every 5 minutes automatically.*`);
    
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

client.on('error', console.error);
process.on('unhandledRejection', console.error);
client.login(process.env.DISCORD_TOKEN);
