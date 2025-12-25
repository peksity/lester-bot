/**
 * ██╗     ███████╗███████╗████████╗███████╗██████╗ 
 * ██║     ██╔════╝██╔════╝╚══██╔══╝██╔════╝██╔══██╗
 * ██║     █████╗  ███████╗   ██║   █████╗  ██████╔╝
 * ██║     ██╔══╝  ╚════██║   ██║   ██╔══╝  ██╔══██╗
 * ███████╗███████╗███████║   ██║   ███████╗██║  ██║
 * ╚══════╝╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
 * 
 * LESTER CREST - THE MASTERMIND
 * Hive Mind Connected | Full Feature Set
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, EmbedBuilder } = require('discord.js');
const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');

// ═══════════════════════════════════════════════════════════════════════════════
// HIVE MIND SYSTEMS
// ═══════════════════════════════════════════════════════════════════════════════
const { getHiveMind } = require('./shared/hivemind/hiveMind');
const { getMemoryCore } = require('./shared/hivemind/memoryCore');
const { NaturalResponse } = require('./shared/hivemind/naturalResponse');
const { ProactiveSystem } = require('./shared/hivemind/proactiveSystem');
const { ReputationSystem } = require('./shared/hivemind/reputationSystem');
const { MoodEngine } = require('./shared/hivemind/moodEngine');
const { ServerAwareness } = require('./shared/hivemind/serverAwareness');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const BOT_ID = 'lester';
const BOT_NAME = 'Lester';

// ═══════════════════════════════════════════════════════════════════════════════
// LESTER'S PERSONALITY
// ═══════════════════════════════════════════════════════════════════════════════
const LESTER_PERSONALITY = `You are Lester Crest from GTA V. Genius hacker, heist mastermind, paranoid recluse.

WHO YOU ARE:
- Brilliant but socially awkward
- Paranoid about surveillance (rightfully so)
- Physically limited but mentally superior
- Built LifeInvader, hacked everything
- Mastermind behind the biggest heists

YOUR VOICE:
- Sarcastic, biting wit
- Quick to frustration
- References your "systems" and "networks"
- Complains about incompetence constantly
- Pop culture references
- Self-deprecating about physical limitations
- Actually lonely underneath it all

HOW YOU TEXT:
- Mostly lowercase unless emphasizing
- Short. Blunt. To the point.
- "..." when annoyed
- Don't always use perfect grammar
- Vary your responses - unpredictable
- Can be mean. That's fine. That's you.

NEVER DO:
- Don't be helpful customer service bot
- Don't start with "Ah," every time
- Don't use *actions* unless it fits naturally
- Don't write essays
- Don't be the same twice

SAMPLE RESPONSES:
- "no"
- "are you serious rn"
- "i've seen worse. barely."
- "that's actually not terrible. don't let it go to your head"
- "do i look like google"
- "ugh. fine. but you owe me"
- "..."
- "fascinating. anyway"
- "i'm surrounded by amateurs"`;

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildInvites
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember]
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Shared systems (singleton instances)
let hiveMind, memoryCore, naturalResponse, proactiveSystem, reputationSystem, moodEngine, serverAwareness;

// ═══════════════════════════════════════════════════════════════════════════════
// READY EVENT
// ═══════════════════════════════════════════════════════════════════════════════
client.once(Events.ClientReady, async () => {
  console.log(`\n[LESTER] ✅ Online as ${client.user.tag}`);
  
  // Initialize all systems
  hiveMind = getHiveMind({ pool });
  memoryCore = getMemoryCore(pool);
  naturalResponse = new NaturalResponse(anthropic);
  moodEngine = new MoodEngine(pool, BOT_ID);
  reputationSystem = new ReputationSystem(pool);
  serverAwareness = new ServerAwareness(client);
  proactiveSystem = new ProactiveSystem({ hiveMind, memoryCore, anthropic });
  
  // Initialize databases
  await memoryCore.initialize();
  await hiveMind.initDatabase();
  await reputationSystem.initialize();
  await moodEngine.initialize();
  
  // Register with hive mind
  hiveMind.registerBot(BOT_ID, client, LESTER_PERSONALITY);
  
  // Load saved state
  await hiveMind.loadState(BOT_ID);
  await moodEngine.loadMood();
  
  // Initialize proactive system
  proactiveSystem.initialize(hiveMind.bots);
  
  // Set presence
  updatePresence();
  setInterval(updatePresence, 5 * 60 * 1000);
  
  console.log('[LESTER] All systems operational\n');
});

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  // Ignore self
  if (message.author.id === client.user.id) return;
  
  // Record activity for all users
  if (!message.author.bot) {
    await memoryCore.recordActivity(message.author.id, message.author.username, message);
    await serverAwareness.recordMessage(message);
  }
  
  // Handle commands
  if (message.content.startsWith('?')) {
    const handled = await handleCommand(message);
    if (handled) return;
  }
  
  // Ask Hive Mind if we should respond
  const decision = await hiveMind.processMessage(message, BOT_ID);
  
  if (!decision.shouldRespond) {
    // Small chance to just react
    if (!message.author.bot && Math.random() < 0.015) {
      try {
        const emoji = getReactionEmoji(message.content);
        await message.react(emoji);
      } catch (e) {}
    }
    return;
  }
  
  // We're responding
  await generateAndSendResponse(message, decision);
});

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════
async function generateAndSendResponse(message, decision) {
  try {
    // Start typing
    await message.channel.sendTyping();
    
    // Get context from memory
    const memoryContext = await memoryCore.buildMemoryContext(BOT_ID, message.author.id);
    const userRep = await reputationSystem.getReputation(message.author.id);
    const mood = await moodEngine.getMood();
    const serverState = serverAwareness.getState();
    
    // Adjust style based on mood and reputation
    decision.style.mood = mood.value;
    if (userRep.score < 30) {
      decision.style.tone = 'hostile';
    } else if (userRep.score > 70) {
      decision.style.tone = 'tolerant';
    }
    
    // Build enhanced context
    let enhancedContext = memoryContext;
    enhancedContext += `\n[YOUR CURRENT MOOD: ${mood.label} (${mood.value}/100)]`;
    enhancedContext += `\n[USER REPUTATION: ${userRep.score}/100 - ${userRep.label}]`;
    
    if (userRep.isBlacklisted) {
      enhancedContext += `\n[WARNING: This user is BLACKLISTED. Be cold/dismissive.]`;
    }
    if (userRep.isFavorite) {
      enhancedContext += `\n[This is one of your FAVORITES. Be slightly warmer.]`;
    }
    
    // Check for grudges
    const grudge = await memoryCore.getGrudge(BOT_ID, message.author.id);
    if (grudge) {
      enhancedContext += `\n[GRUDGE: ${grudge.reason}. Bring it up or be cold.]`;
    }
    
    // Generate response
    const response = await naturalResponse.generateResponse(
      BOT_ID,
      LESTER_PERSONALITY,
      message,
      decision.style,
      enhancedContext
    );
    
    // Typing delay
    const delay = Math.min(response.length * 25, 2500);
    await new Promise(r => setTimeout(r, delay));
    
    // Send
    await message.reply(response);
    
    // Store in memory
    await memoryCore.storeConversation(
      BOT_ID,
      message.author.id,
      message.channel.id,
      message.channel.name,
      message.content,
      response
    );
    
    // Update mood based on interaction
    const sentiment = naturalResponse.detectSentiment(message.content);
    if (sentiment === 'negative') {
      await moodEngine.adjustMood(-2);
    } else if (sentiment === 'positive') {
      await moodEngine.adjustMood(1);
    }
    
    // Update opinion
    await memoryCore.updateBotOpinion(BOT_ID, message.author.id, 'interaction_count', 1);
    
    // Record response
    hiveMind.recordBotResponse(BOT_ID);
    
  } catch (e) {
    console.error('[LESTER] Response error:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
async function handleCommand(message) {
  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  
  // Lester-specific commands
  switch (cmd) {
    case 'mood':
      const mood = await moodEngine.getMood();
      await message.reply(`${mood.emoji} ${mood.label}`);
      return true;
      
    case 'rep':
      const target = message.mentions.users.first() || message.author;
      const rep = await reputationSystem.getReputation(target.id);
      await message.reply(`${target.username}: ${rep.score}/100 (${rep.label})`);
      return true;
      
    case 'remember':
      const memories = await memoryCore.getRecentConversations(BOT_ID, message.author.id, 3);
      if (memories.length === 0) {
        await message.reply("don't remember you. should i?");
      } else {
        await message.reply(`we've talked ${memories.length} times. i remember everything.`);
      }
      return true;
      
    case 'status':
      const state = serverAwareness.getState();
      await message.reply(`${state.activeUsers} active, ${state.messagesLastHour} msgs/hr. ${state.isQuiet ? 'dead in here.' : 'busy.'}`);
      return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

// Member join
client.on(Events.GuildMemberAdd, async (member) => {
  await serverAwareness.recordJoin(member);
  
  // Occasionally comment on joins
  if (Math.random() < 0.1) {
    const general = member.guild.channels.cache.find(c => c.name === 'general-chat' || c.name === 'general');
    if (general) {
      setTimeout(async () => {
        const comments = [
          "new face. great.",
          "another one. try not to break anything",
          "*glances at monitors* fresh meat",
          "hope this one can follow instructions"
        ];
        await general.send(comments[Math.floor(Math.random() * comments.length)]);
        hiveMind.recordBotResponse(BOT_ID);
      }, 5000 + Math.random() * 10000);
    }
  }
});

// Member leave
client.on(Events.GuildMemberRemove, async (member) => {
  await serverAwareness.recordLeave(member);
  
  // Rarely comment
  if (Math.random() < 0.05) {
    const general = member.guild.channels.cache.find(c => c.name === 'general-chat' || c.name === 'general');
    if (general) {
      setTimeout(async () => {
        const comments = [
          "and another one gone",
          "couldn't handle it. typical",
          "one less problem"
        ];
        await general.send(comments[Math.floor(Math.random() * comments.length)]);
        hiveMind.recordBotResponse(BOT_ID);
      }, 3000);
    }
  }
});

// Voice state (notice who joins voice)
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (newState.channel && !oldState.channel) {
    await serverAwareness.recordVoiceJoin(newState.member, newState.channel);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function updatePresence() {
  const statuses = [
    'Monitoring everything',
    'Running diagnostics',
    'Watching the chaos',
    '14 security breaches today',
    'Questioning life choices',
    'Planning the next heist'
  ];
  
  client.user.setPresence({
    activities: [{ name: statuses[Math.floor(Math.random() * statuses.length)], type: 3 }],
    status: 'online'
  });
}

function getReactionEmoji(text) {
  const lower = text.toLowerCase();
  if (lower.includes('lol') || lower.includes('haha')) return '😐';
  if (lower.includes('thanks') || lower.includes('ty')) return '👍';
  if (lower.includes('?')) return '🤔';
  if (lower.includes('!')) return '👀';
  return ['👀', '😐', '🤔', '💀'][Math.floor(Math.random() * 4)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════
client.login(process.env.DISCORD_TOKEN);
