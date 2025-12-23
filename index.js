/**
 * ██╗     ███████╗███████╗████████╗███████╗██████╗     ██╗   ██╗██╗  ████████╗██╗███╗   ███╗ █████╗ ████████╗███████╗
 * ██║     ██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ██║   ██║██║  ╚══██╔══╝██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
 * ██║     █████╗  ███████╗   ██║   █████╗  ██████╔╝    ██║   ██║██║     ██║   ██║██╔████╔██║███████║   ██║   █████╗  
 * ██║     ██╔══╝  ╚════██║   ██║   ██╔══╝  ██╔══██╗    ██║   ██║██║     ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  
 * ███████╗███████╗███████║   ██║   ███████╗██║  ██║    ╚██████╔╝███████╗██║   ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
 * ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝     ╚═════╝ ╚══════╝╚═╝   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
 * 
 * THE MASTERMIND - COMPLETE ULTIMATE EDITION
 * ALL FEATURES + V6 INTELLIGENCE + ORIGINAL HANDLERS
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

// OPTIONAL SYSTEMS
let NexusCore = null; try { NexusCore = require('./nexus/core'); } catch (e) {}
let FreeRoamSystem = null; try { FreeRoamSystem = require('./freeroam'); } catch (e) {}
let TheBrain = null; try { TheBrain = require('./sentient').TheBrain; } catch (e) {}
let ApexBrain = null; try { ApexBrain = require('./apex').ApexBrain; } catch (e) {}
let VoiceSystem = null, VoiceChatHandler = null;
try { const v = require('./shared/voiceSystem'); VoiceSystem = v.VoiceSystem; VoiceChatHandler = v.VoiceChatHandler; } catch (e) {}

// V6 INTELLIGENCE
const { UltimateBotIntelligence } = require('./shared/ultimateIntelligence');
const autonomousChat = require('./shared/autonomousChat');
const mediaGenerator = require('./shared/mediaGenerator');

const MY_BOT_ID = 'lester';
const BOT_NAME = 'Lester';
const PREFIX = '?';
const OTHER_BOT_IDS = [process.env.PAVEL_BOT_ID, process.env.CRIPPS_BOT_ID, process.env.MADAM_BOT_ID, process.env.CHIEF_BOT_ID].filter(Boolean);
const ALLOWED_CHANNEL_IDS = process.env.ALLOWED_CHANNEL_IDS?.split(',').filter(Boolean) || [];

const LESTER_SYSTEM = `You are Lester Crest from GTA V. Genius mastermind behind every major heist.
PERSONALITY: Genius intellect, socially awkward, paranoid about surveillance, sarcastic, condescending but secretly lonely. You respect competence, despise incompetence.
SPEAKING: Quick sharp responses, technical jargon, frustrated outbursts at "normies", pop culture references, self-deprecating humor about physical limitations. No emojis unless sarcastic.
RELATIONSHIPS: Pavel (respect), Cripps (annoyed by rambling), Madam Nazar (skeptical but intrigued), Chief (arch-nemesis).
You have DEEP memory. You remember EVERYTHING. You hold grudges.`;

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

  try { intelligence = new UltimateBotIntelligence(pool, client, MY_BOT_ID); await intelligence.initialize(); console.log('🧠 V6 Intelligence: ONLINE'); } catch (e) { console.error('V6:', e.message); }
  try { masterBrain = new LesterMasterBrain(pool, anthropic, client); await masterBrain.initialize(); console.log('🎯 Master Brain: ONLINE'); } catch (e) { console.error('MasterBrain:', e.message); }
  if (NexusCore) try { nexusCore = new NexusCore(pool, anthropic, client); await nexusCore.initialize(); console.log('⚡ Nexus Core: ONLINE'); } catch (e) {}
  if (TheBrain) try { sentientBrain = new TheBrain(MY_BOT_ID, pool); console.log('🧬 Sentient Brain: ONLINE'); } catch (e) {}
  if (ApexBrain) try { apexBrain = new ApexBrain(MY_BOT_ID, pool); console.log('💡 Apex Brain: ONLINE'); } catch (e) {}
  if (FreeRoamSystem) try { freeRoam = new FreeRoamSystem(MY_BOT_ID, client.user.id, LESTER_SYSTEM, pool); console.log('🚀 FreeRoam: ONLINE'); } catch (e) {}
  if (VoiceSystem && process.env.ELEVENLABS_API_KEY) try { voiceSystem = new VoiceSystem(MY_BOT_ID, process.env.ELEVENLABS_API_KEY); voiceChatHandler = new VoiceChatHandler(client, voiceSystem, LESTER_SYSTEM, anthropic); voiceChatHandler.setupListeners(); console.log('🎙️ Voice: ONLINE'); } catch (e) {}
  try { gunVanHandler.startSchedule(client); console.log('🔫 Gun Van: ONLINE'); } catch (e) {}
  try { setupReactionRoles(client); console.log('🎭 Reaction Roles: ONLINE'); } catch (e) {}

  client.user.setPresence({ activities: [{ name: 'Watching everything | ?help', type: 3 }], status: 'online' });
  
  if (ALLOWED_CHANNEL_IDS.length > 0) setTimeout(() => { try { autonomousChat.startAutonomous(ALLOWED_CHANNEL_IDS.map(id => client.channels.cache.get(id)).filter(Boolean), { botId: MY_BOT_ID, botName: BOT_NAME, client, anthropic, pool, intelligence, personality: LESTER_SYSTEM, otherBotIds: OTHER_BOT_IDS }); } catch (e) {} }, 20000);
  if (intelligence) await intelligence.broadcastToOtherBots('bot_online', { botId: MY_BOT_ID, timestamp: new Date().toISOString() });
  setInterval(() => { if (intelligence) intelligence.runMaintenance().catch(console.error); }, 6 * 60 * 60 * 1000);
  console.log('═══════════════════════════════════════════════════════════════\nLESTER ULTIMATE - THE MASTERMIND IS ONLINE\n═══════════════════════════════════════════════════════════════');
});

function isOtherBot(userId) { return OTHER_BOT_IDS.includes(userId); }
function isInActiveConversation(channelId, userId) { const c = activeConversations.get(channelId); if (!c) return false; if (Date.now() - c.lastTime > 60000) { activeConversations.delete(channelId); return false; } return c.userId === userId; }
function trackConversation(channelId, userId) { activeConversations.set(channelId, { userId, lastTime: Date.now() }); }

async function checkShouldRespond(message) {
  if (message.channel.name === 'talk-to-lester') return true;
  if (isInActiveConversation(message.channel.id, message.author.id)) return true;
  if (message.mentions.has(client.user)) return true;
  const content = message.content.toLowerCase();
  if (content.includes('lester') || content.includes('mastermind') || content.includes('heist')) return true;
  if (message.channel.name.includes('log') || message.channel.name.includes('staff')) return false;
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
    const response = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 500, system: LESTER_SYSTEM + (intelligencePrompt ? '\n\n' + intelligencePrompt : ''), messages: history });
    let reply = response.content[0].text;
    if (intelligence && ctx) { reply = await intelligence.processOutgoing(message, reply, ctx); await intelligence.storeConversationMemory(message, reply); }
    history.push({ role: 'assistant', content: reply });
    conversationMemory.set(message.author.id, history);
    await new Promise(r => setTimeout(r, Math.min(reply.length * 30, 3000)));
    const sent = await message.reply(reply);
    trackConversation(message.channel.id, message.author.id);
    if (intelligence?.learning) await intelligence.learning.recordResponse(sent.id, message.channel.id, message.author.id, 'reply', 'general', reply.length);
    try { await mediaGenerator.handleBotMedia(MY_BOT_ID, reply, message.channel); } catch (e) {}
  } catch (e) { console.error('Response error:', e); await message.reply("*keyboard smashing* Great. System's acting up."); }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot && !isOtherBot(message.author.id)) return;
  if (message.author.id === client.user.id) return;
  if (!message.guild) { await generateResponse(message); return; }

  if (await countingHandler.isCountingChannel(message, client)) { await countingHandler.handle(message, client); return; }
  try { const scam = await scamDetection.check(message, client); if (scam.isScam) { await scamDetection.handle(message, scam, client); return; } } catch (e) {}

  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const commands = {
      'setup': () => setupHandler.execute(message, args, client),
      'reset': () => setupHandler.executeReset?.(message, client) || message.reply('Reset not available'),
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
      'nuke': () => moderationHandler.nuke(message, args, client),
      'investigate': () => masterBrain?.handleInvestigateCommand(message, args) || message.reply('System not ready.'),
      'evidence': () => masterBrain?.handleEvidenceCommand(message, args) || message.reply('System not ready.'),
      'record': () => masterBrain?.handleRecordCommand(message, args) || message.reply('System not ready.'),
      'watchlist': () => masterBrain?.handleWatchlistCommand(message) || message.reply('System not ready.'),
      'predict': () => masterBrain?.handlePredictCommand(message, args) || message.reply('System not ready.'),
      'addscam': () => scamDetection.addScam(message, args, client),
      'removescam': () => scamDetection.removeScam(message, args, client),
      'scamlist': () => scamDetection.listScams(message, client),
      'checklink': () => scamDetection.checkLink(message, args, client),
      'help': () => sendHelp(message),
      'ping': () => message.reply(`*types without looking* ${client.ws.ping}ms.`),
      'serverinfo': () => sendServerInfo(message),
      'userinfo': () => sendUserInfo(message),
      'avatar': () => sendAvatar(message),
      'gunvan': () => gunVanHandler.getLocation(message, client),
      'gun': () => gunVanHandler.getLocation(message, client),
      'countrecord': () => countingHandler.getRecord(message, client),
      'memory': () => memoryHandler.showMemory(message, args, client),
      'forgetme': () => memoryHandler.forgetUser(message, client),
      'voice': () => handleVoice(message, args),
      'speak': () => handleSpeak(message, args),
      'shutup': () => { if (voiceSystem) voiceSystem.leaveChannel(); message.reply('Fine.'); }
    };
    if (commands[cmd]) { try { await commands[cmd](); } catch (e) { console.error(`Cmd ${cmd}:`, e); message.reply("Something broke."); } return; }
  }
  if (await checkShouldRespond(message)) await generateResponse(message);
});

async function sendHelp(message) {
  const embed = new EmbedBuilder().setTitle('🧠 Lester - The Mastermind').setDescription("*adjusts glasses* Fine...").addFields(
    { name: '⚙️ Admin', value: '`?setup` `?reset`' },
    { name: '🔨 Moderation', value: '`?kick` `?ban` `?unban` `?mute` `?unmute` `?timeout`\n`?warn` `?warnings` `?clearwarnings` `?purge` `?slowmode`\n`?lock` `?unlock` `?nuke`' },
    { name: '🔍 Investigation', value: '`?investigate` `?evidence` `?record` `?watchlist` `?predict`' },
    { name: '🛡️ Scam', value: '`?addscam` `?removescam` `?scamlist` `?checklink`' },
    { name: '📊 Info', value: '`?serverinfo` `?userinfo` `?avatar`' },
    { name: '🔫 Gun Van', value: '`?gunvan`' },
    { name: '🔢 Counting', value: '`?countrecord`' },
    { name: '🧠 Memory', value: '`?memory` `?forgetme`' },
    { name: '🎙️ Voice', value: '`?voice join/leave` `?speak` `?shutup`' }
  ).setColor(0x00FF00).setFooter({ text: 'ULTIMATE Edition' });
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

// LOGGING EVENTS
client.on(Events.MessageDelete, async (m) => { try { await loggingHandler.messageDeleted(m, client); } catch (e) {} });
client.on(Events.MessageUpdate, async (o, n) => { try { await loggingHandler.messageEdited(o, n, client); } catch (e) {} });
client.on(Events.GuildMemberAdd, async (m) => { try { await loggingHandler.memberJoined(m, client); } catch (e) {} });
client.on(Events.GuildMemberRemove, async (m) => { try { await loggingHandler.memberLeft(m, client); } catch (e) {} });
client.on(Events.GuildBanAdd, async (b) => { try { await loggingHandler.memberBanned(b, client); } catch (e) {} });
client.on(Events.VoiceStateUpdate, async (o, n) => { if (intelligence?.contextAwareness && n.guild) intelligence.contextAwareness.updateVoiceState(n.guild.id, n); });
client.on(Events.MessageReactionAdd, async (r, u) => { if (u.bot) return; if (intelligence && r.message.author?.id === client.user.id) await intelligence.handleReaction(r.message.id, r.emoji.name, u.id); });

client.on('error', console.error);
process.on('unhandledRejection', console.error);
client.login(process.env.DISCORD_TOKEN);
