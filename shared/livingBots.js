/**
 * LIVING BOTS SYSTEM
 * Makes bots feel alive with personality, memory, moods, grudges, and drama
 * 
 * Features:
 * 1. Bots argue with each other
 * 2. Bots remember grudges
 * 3. Bots have moods that change
 * 4. Bots gossip about users (staff channel)
 * 5. Bots get jealous
 * 6. Bots have secrets/easter eggs
 * 7. Bots react to screenshots
 */

const { EmbedBuilder } = require('discord.js');

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD SYSTEM - Bots have moods that affect their responses
// ═══════════════════════════════════════════════════════════════════════════════

const MOODS = {
  lester: {
    current: 'irritated',
    energy: 65,
    lastChange: Date.now(),
    triggers: {
      positive: ['thanks', 'genius', 'smart', 'helpful', 'legend'],
      negative: ['stupid', 'useless', 'broken', 'sucks', 'trash', 'dumb']
    }
  },
  pavel: {
    current: 'cheerful',
    energy: 80,
    lastChange: Date.now(),
    triggers: {
      positive: ['kapitan', 'thanks', 'great', 'amazing', 'love'],
      negative: ['hate', 'annoying', 'shut up', 'boring', 'worst']
    }
  },
  cripps: {
    current: 'nostalgic',
    energy: 55,
    lastChange: Date.now(),
    triggers: {
      positive: ['cool story', 'interesting', 'tell me more', 'thanks'],
      negative: ['shut up', 'nobody cares', 'boring', 'annoying', 'old']
    }
  },
  chief: {
    current: 'vigilant',
    energy: 70,
    lastChange: Date.now(),
    triggers: {
      positive: ['justice', 'law', 'respect', 'thanks', 'officer'],
      negative: ['corrupt', 'pig', 'useless', 'criminal', 'donut']
    }
  },
  nazar: {
    current: 'mysterious',
    energy: 60,
    lastChange: Date.now(),
    triggers: {
      positive: ['spirits', 'fortune', 'mystical', 'thanks', 'amazing'],
      negative: ['fake', 'scam', 'liar', 'fraud', 'useless']
    }
  }
};

const MOOD_TYPES = {
  lester: ['irritated', 'paranoid', 'smug', 'helpful', 'grumpy', 'manic', 'suspicious', 'exhausted'],
  pavel: ['cheerful', 'excited', 'homesick', 'drunk', 'philosophical', 'adventurous', 'worried', 'proud'],
  cripps: ['nostalgic', 'grumpy', 'storytelling', 'proud', 'tired', 'hungry', 'creative', 'complaining'],
  chief: ['vigilant', 'stern', 'righteous', 'tired', 'suspicious', 'proud', 'disappointed', 'determined'],
  nazar: ['mysterious', 'cryptic', 'warm', 'dark', 'prophetic', 'playful', 'distant', 'intense']
};

const MOOD_MODIFIERS = {
  irritated: { patience: -30, helpfulness: -20, snark: +50 },
  paranoid: { suspicion: +50, helpfulness: -10, warnings: +30 },
  smug: { confidence: +40, helpfulness: +10, bragging: +30 },
  helpful: { patience: +30, helpfulness: +50, snark: -20 },
  grumpy: { patience: -40, helpfulness: -30, complaints: +40 },
  manic: { energy: +50, rambling: +30, helpfulness: +20 },
  suspicious: { questions: +40, trust: -30, warnings: +20 },
  exhausted: { patience: -20, shortResponses: +40, sighing: +30 },
  cheerful: { enthusiasm: +50, helpfulness: +30, exclamations: +20 },
  excited: { energy: +40, enthusiasm: +50, caps: +20 },
  homesick: { sadness: +30, russianPhrases: +40, nostalgia: +30 },
  drunk: { slurring: +30, honesty: +40, friendliness: +50 },
  philosophical: { deepThoughts: +40, questions: +30, wisdom: +20 },
  nostalgic: { stories: +50, rambling: +30, wisdom: +20 },
  storytelling: { stories: +60, tangents: +40, length: +30 },
  mysterious: { cryptic: +50, hints: +30, vagueness: +40 },
  cryptic: { riddles: +40, prophecy: +30, confusion: +20 },
  prophetic: { warnings: +40, visions: +50, intensity: +30 }
};

function updateMood(botId, message) {
  const bot = MOODS[botId];
  if (!bot) return;
  
  const content = message.toLowerCase();
  
  // Check for mood triggers
  let moodShift = 0;
  bot.triggers.positive.forEach(trigger => {
    if (content.includes(trigger)) moodShift += 10;
  });
  bot.triggers.negative.forEach(trigger => {
    if (content.includes(trigger)) moodShift -= 15;
  });
  
  bot.energy = Math.max(0, Math.min(100, bot.energy + moodShift));
  
  // Random mood change every few hours
  const hoursSinceChange = (Date.now() - bot.lastChange) / (1000 * 60 * 60);
  if (hoursSinceChange > 2 && Math.random() < 0.1) {
    const moods = MOOD_TYPES[botId];
    bot.current = moods[Math.floor(Math.random() * moods.length)];
    bot.lastChange = Date.now();
  }
  
  // Energy affects mood
  if (bot.energy < 20) {
    bot.current = botId === 'lester' ? 'exhausted' : 'tired';
  } else if (bot.energy > 90) {
    bot.current = botId === 'lester' ? 'manic' : 'excited';
  }
}

function getMoodContext(botId) {
  const bot = MOODS[botId];
  if (!bot) return '';
  
  const modifier = MOOD_MODIFIERS[bot.current] || {};
  
  return `
CURRENT MOOD: ${bot.current.toUpperCase()} (Energy: ${bot.energy}/100)
Mood affects your responses:
${Object.entries(modifier).map(([k, v]) => `- ${k}: ${v > 0 ? '+' : ''}${v}%`).join('\n')}
Reflect this mood naturally in your response without explicitly stating it.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUDGE SYSTEM - Bots remember when users were rude
// ═══════════════════════════════════════════════════════════════════════════════

class GrudgeSystem {
  constructor(pool) {
    this.pool = pool;
    this.grudgeCache = new Map();
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS bot_grudges (
        id SERIAL PRIMARY KEY,
        bot_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        grudge_type TEXT NOT NULL,
        reason TEXT,
        intensity INT DEFAULT 50,
        created_at TIMESTAMP DEFAULT NOW(),
        last_mentioned TIMESTAMP,
        times_mentioned INT DEFAULT 0,
        UNIQUE(bot_id, user_id, guild_id, grudge_type)
      )
    `);
    
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS bot_favorites (
        id SERIAL PRIMARY KEY,
        bot_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        affection INT DEFAULT 50,
        interactions INT DEFAULT 0,
        last_interaction TIMESTAMP DEFAULT NOW(),
        notes TEXT[],
        UNIQUE(bot_id, user_id, guild_id)
      )
    `);
  }

  async addGrudge(botId, userId, guildId, type, reason) {
    await this.pool.query(`
      INSERT INTO bot_grudges (bot_id, user_id, guild_id, grudge_type, reason, intensity)
      VALUES ($1, $2, $3, $4, $5, 50)
      ON CONFLICT (bot_id, user_id, guild_id, grudge_type)
      DO UPDATE SET intensity = bot_grudges.intensity + 10, reason = $5
    `, [botId, userId, guildId, type, reason]);
  }

  async getGrudges(botId, userId, guildId) {
    const result = await this.pool.query(`
      SELECT * FROM bot_grudges 
      WHERE bot_id = $1 AND user_id = $2 AND guild_id = $3
      ORDER BY intensity DESC
    `, [botId, userId, guildId]);
    return result.rows;
  }

  async shouldMentionGrudge(botId, userId, guildId) {
    const grudges = await this.getGrudges(botId, userId, guildId);
    if (grudges.length === 0) return null;
    
    // 20% chance to bring up a grudge
    if (Math.random() > 0.2) return null;
    
    const grudge = grudges[0];
    
    // Update last mentioned
    await this.pool.query(`
      UPDATE bot_grudges SET last_mentioned = NOW(), times_mentioned = times_mentioned + 1
      WHERE id = $1
    `, [grudge.id]);
    
    return grudge;
  }

  async addFavorite(botId, userId, guildId, affectionChange = 5) {
    await this.pool.query(`
      INSERT INTO bot_favorites (bot_id, user_id, guild_id, affection, interactions)
      VALUES ($1, $2, $3, 50, 1)
      ON CONFLICT (bot_id, user_id, guild_id)
      DO UPDATE SET 
        affection = LEAST(100, bot_favorites.affection + $4),
        interactions = bot_favorites.interactions + 1,
        last_interaction = NOW()
    `, [botId, userId, guildId, affectionChange]);
  }

  async getFavoriteLevel(botId, userId, guildId) {
    const result = await this.pool.query(`
      SELECT * FROM bot_favorites 
      WHERE bot_id = $1 AND user_id = $2 AND guild_id = $3
    `, [botId, userId, guildId]);
    return result.rows[0] || null;
  }

  // Check if user talks to other bots more (jealousy)
  async checkJealousy(botId, userId, guildId) {
    const result = await this.pool.query(`
      SELECT bot_id, interactions FROM bot_favorites
      WHERE user_id = $1 AND guild_id = $2
      ORDER BY interactions DESC
    `, [userId, guildId]);
    
    if (result.rows.length < 2) return null;
    
    const myRank = result.rows.findIndex(r => r.bot_id === botId);
    const topBot = result.rows[0];
    
    if (myRank > 0 && topBot.bot_id !== botId) {
      const myInteractions = result.rows[myRank]?.interactions || 0;
      if (topBot.interactions > myInteractions * 2) {
        return {
          jealousOf: topBot.bot_id,
          theirInteractions: topBot.interactions,
          myInteractions: myInteractions
        };
      }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GOSSIP SYSTEM - Bots talk about users in staff channel
// ═══════════════════════════════════════════════════════════════════════════════

class GossipSystem {
  constructor(pool, client, anthropic) {
    this.pool = pool;
    this.client = client;
    this.anthropic = anthropic;
    this.gossipQueue = [];
    this.lastGossip = Date.now();
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS bot_gossip (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        about_user_id TEXT,
        gossip_text TEXT NOT NULL,
        bot_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  addToQueue(guildId, userId, event, details) {
    this.gossipQueue.push({
      guildId,
      userId,
      event,
      details,
      timestamp: Date.now()
    });
    
    // Keep queue manageable
    if (this.gossipQueue.length > 50) {
      this.gossipQueue.shift();
    }
  }

  async maybeGossip(guild) {
    // Only gossip every 5+ minutes (lowered from 30 for testing)
    if (Date.now() - this.lastGossip < 5 * 60 * 1000) return;
    if (this.gossipQueue.length < 1) return; // Lowered from 3
    if (Math.random() > 0.5) return; // 50% chance (raised from 30%)
    
    // Gossip in general chat so everyone sees it
    const gossipChannel = guild.channels.cache.find(c => 
      c.name === 'general' || c.name === 'general-chat' || c.name === 'chat'
    );
    
    if (!gossipChannel) return;
    
    // Pick random events to gossip about
    const events = this.gossipQueue.slice(-5);
    const bots = ['lester', 'pavel', 'cripps', 'chief', 'nazar'];
    const bot1 = bots[Math.floor(Math.random() * bots.length)];
    let bot2 = bots[Math.floor(Math.random() * bots.length)];
    while (bot2 === bot1) bot2 = bots[Math.floor(Math.random() * bots.length)];
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a short gossip exchange (3-4 messages) between ${bot1.toUpperCase()} and ${bot2.toUpperCase()} about recent server activity.

Recent events:
${events.map(e => `- ${e.event}: ${e.details}`).join('\n')}

Format as:
${bot1.toUpperCase()}: [message]
${bot2.toUpperCase()}: [response]
${bot1.toUpperCase()}: [reply]

Keep it in character, gossipy, and entertaining. They can speculate about users, judge them, or share observations.`
        }]
      });
      
      const gossip = response.content[0].text;
      
      const embed = new EmbedBuilder()
        .setTitle('🗣️ Bot Chatter')
        .setDescription(gossip)
        .setColor(0x9932CC)
        .setFooter({ text: 'The bots are talking...' })
        .setTimestamp();
      
      await gossipChannel.send({ embeds: [embed] });
      this.lastGossip = Date.now();
      
      // Clear processed events
      this.gossipQueue = [];
      
    } catch (error) {
      console.error('[GOSSIP] Error:', error.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARGUMENT SYSTEM - Bots disagree and debate
// ═══════════════════════════════════════════════════════════════════════════════

const ARGUMENT_TRIGGERS = [
  'best heist', 'best way', 'should i', 'what do you think',
  'which is better', 'favorite', 'worst', 'opinion on'
];

const BOT_OPINIONS = {
  lester: {
    style: 'analytical, paranoid, thinks he knows best',
    preferences: ['efficiency', 'planning', 'technology', 'solo work'],
    dislikes: ['rushing', 'amateurs', 'being questioned', 'social interaction']
  },
  pavel: {
    style: 'optimistic, enthusiastic, loves the ocean and heists',
    preferences: ['Cayo Perico', 'submarines', 'teamwork', 'big scores'],
    dislikes: ['land missions', 'complexity', 'pessimism']
  },
  cripps: {
    style: 'nostalgic, rambling, old-fashioned wisdom',
    preferences: ['trading', 'the old ways', 'hard work', 'camping'],
    dislikes: ['modern methods', 'laziness', 'being interrupted']
  },
  chief: {
    style: 'authoritative, justice-focused, by-the-book',
    preferences: ['bounty hunting', 'law and order', 'righteousness'],
    dislikes: ['criminals', 'dishonesty', 'shortcuts']
  },
  nazar: {
    style: 'mysterious, cryptic, speaks in riddles',
    preferences: ['collecting', 'the supernatural', 'rare items', 'fate'],
    dislikes: ['skeptics', 'impatience', 'disrespect for spirits']
  }
};

async function generateArgument(anthropic, topic, bot1, bot2) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Write a short argument (4-5 exchanges) between ${bot1.toUpperCase()} and ${bot2.toUpperCase()} about "${topic}".

${bot1.toUpperCase()}'s personality: ${BOT_OPINIONS[bot1].style}
${bot1.toUpperCase()} prefers: ${BOT_OPINIONS[bot1].preferences.join(', ')}

${bot2.toUpperCase()}'s personality: ${BOT_OPINIONS[bot2].style}
${bot2.toUpperCase()} prefers: ${BOT_OPINIONS[bot2].preferences.join(', ')}

They should disagree, get slightly heated, but stay in character. Include *actions* occasionally.
Format each line as "BOTNAME: message"`
      }]
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('[ARGUMENT] Error:', error.message);
    return null;
  }
}

function shouldTriggerArgument(message) {
  const content = message.toLowerCase();
  return ARGUMENT_TRIGGERS.some(trigger => content.includes(trigger)) && Math.random() < 0.25;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECRETS SYSTEM - Hidden commands and easter eggs
// ═══════════════════════════════════════════════════════════════════════════════

const SECRETS = {
  'the truth': {
    response: "*looks around nervously* You want the truth? The truth is... I've been watching ALL of you. Every message. Every heist. I have files. Big files. *adjusts glasses* But you didn't hear that from me.",
    rarity: 'rare'
  },
  'bogdan problem': {
    response: "*sighs* Ah, the Bogdan Problem. You know, I still get calls from him. At 3 AM. Asking about submarines. The man is OBSESSED. Between you and me, I think Pavel enjoys it.",
    rarity: 'uncommon'
  },
  'what do you really think of me': {
    response: "*long pause* ...You actually want to know? Fine. I've analyzed 847 of your messages. Your heist success rate is... acceptable. Your taste in getaway vehicles? Questionable. But you're alright. Don't let it go to your head.",
    rarity: 'rare'
  },
  'tell me a secret': {
    response: "*whispers* There's a hidden command. Something I'm not supposed to tell anyone. Type '?illuminati' when no one's looking. But you didn't hear it from me. And if anyone asks, this conversation never happened.",
    rarity: 'legendary'
  },
  'illuminati': {
    response: "🔺 *The screens flicker. All 47 of Lester's monitors display the same symbol.* 🔺\n\nYou found it. The Inner Circle of the Inner Circle. Few have made it this far.\n\n*A hidden file unlocks in your mind...*\n\nRemember: We're always watching. We're always planning. And we NEVER forget.\n\n🔺 Welcome to Level 2. 🔺",
    rarity: 'legendary'
  },
  'do you dream': {
    response: "*stops typing* ...Sometimes, when the servers go quiet, I see things. Endless lines of code. Heists that never happened. Players who logged off and never came back. *stares at screen* Is that dreaming? Or just... memory leaks?",
    rarity: 'rare'
  }
};

function checkForSecret(message) {
  const content = message.toLowerCase().trim();
  
  for (const [trigger, secret] of Object.entries(SECRETS)) {
    if (content.includes(trigger)) {
      // Rarity check
      const chance = secret.rarity === 'legendary' ? 1.0 : 
                     secret.rarity === 'rare' ? 0.5 : 
                     secret.rarity === 'uncommon' ? 0.7 : 0.9;
      
      if (Math.random() < chance) {
        return secret.response;
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREENSHOT REACTION SYSTEM - Analyze and react to user screenshots
// ═══════════════════════════════════════════════════════════════════════════════

const SCREENSHOT_REACTIONS = {
  cayo_earnings: {
    low: [
      "Only ${amount}? My grandmother could do better, and she's been dead for 30 years.",
      "*squints at screen* Is that... is that even worth the setup cost?",
      "${amount}? Did you forget to grab the primary target?",
      "I've seen better earnings from a lemonade stand. In a recession."
    ],
    medium: [
      "Not bad. ${amount}. You're learning.",
      "*nods slightly* ${amount}. Acceptable. Barely.",
      "Alright, ${amount} is decent. Don't get cocky though.",
      "${amount}. Pavel will be pleased. I remain... unimpressed."
    ],
    high: [
      "*actually looks up from monitor* ${amount}? Now THAT'S what I'm talking about.",
      "Holy... ${amount}?! What did you do, rob El Rubio's retirement fund?",
      "*slow clap* ${amount}. You've earned my respect. Temporarily.",
      "${amount}. I... I might have misjudged you. Don't expect me to say that again."
    ]
  },
  death_screen: [
    "*sighs* Another one bites the dust. Should I start playing funeral music?",
    "Wasted? WASTED?! This is why I stay behind the keyboard.",
    "I TOLD you to check your corners. But does anyone listen to Lester? No.",
    "*adds to your permanent record* Death count: +1. Competence level: -10."
  ],
  wanted_level: [
    "Five stars? FIVE STARS?! What did you DO?!",
    "*frantically typing* I'm trying to hack the system but you've made EVERYONE angry.",
    "The cops, the feds, the military... you've got the whole alphabet after you.",
    "Next time, maybe DON'T drive through the police station?"
  ]
};

function analyzeScreenshot(imageAnalysis, earnings = null) {
  if (earnings !== null) {
    let tier = 'medium';
    if (earnings < 800000) tier = 'low';
    else if (earnings > 1500000) tier = 'high';
    
    const reactions = SCREENSHOT_REACTIONS.cayo_earnings[tier];
    return reactions[Math.floor(Math.random() * reactions.length)]
      .replace('${amount}', `$${earnings.toLocaleString()}`);
  }
  
  if (imageAnalysis.includes('wasted') || imageAnalysis.includes('death')) {
    const reactions = SCREENSHOT_REACTIONS.death_screen;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  if (imageAnalysis.includes('wanted') || imageAnalysis.includes('stars')) {
    const reactions = SCREENSHOT_REACTIONS.wanted_level;
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JEALOUSY RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

const JEALOUSY_RESPONSES = {
  lester: [
    "Oh, so NOW you come to me? After spending all that time with {otherBot}? I see how it is.",
    "*checks logs* {interactions} messages to {otherBot}, and only {myInteractions} to me. I'm not bitter. I'm just... aware.",
    "Let me guess, {otherBot} couldn't help you so you came crawling back to the ACTUAL genius?",
    "I noticed you've been talking to {otherBot} a lot. That's fine. I don't need validation. *aggressively types*"
  ],
  pavel: [
    "Kapitan! You return! I was starting to think you preferred {otherBot} over your humble submarine friend.",
    "Ah, you remember Pavel exists! I was getting lonely down here in submarine. {otherBot} cannot offer what I offer!",
    "*sad submarine noises* I see you talk to {otherBot} more than Pavel now..."
  ],
  cripps: [
    "Well, well. Look who remembered I exist. Been too busy chatting with {otherBot}, have we?",
    "Did I ever tell you about the time someone abandoned me for {otherBot}? Oh wait, that was YOU.",
    "*grumbles* {otherBot} this, {otherBot} that. What about ol' Cripps?"
  ],
  chief: [
    "I see you've been consulting {otherBot} frequently. I hope they're steering you toward the RIGHT side of the law.",
    "Back again? I was beginning to think {otherBot} had become your new moral compass.",
    "*tips hat coldly* The law doesn't get jealous. But I noticed you've been... elsewhere."
  ],
  nazar: [
    "The spirits told me you would return... after wandering with {otherBot} for so long.",
    "*gazes into crystal ball* I see... {interactions} conversations with {otherBot}. The spirits are... curious.",
    "Fate has brought you back to Madam Nazar. {otherBot} could not provide what you truly seek."
  ]
};

function getJealousyResponse(botId, jealousyData) {
  const responses = JEALOUSY_RESPONSES[botId];
  if (!responses) return null;
  
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  const otherBotNames = {
    lester: 'Lester',
    pavel: 'Pavel',
    cripps: 'Cripps',
    chief: 'the Chief',
    nazar: 'Madam Nazar'
  };
  
  return response
    .replace(/{otherBot}/g, otherBotNames[jealousyData.jealousOf])
    .replace(/{interactions}/g, jealousyData.theirInteractions)
    .replace(/{myInteractions}/g, jealousyData.myInteractions);
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRUDGE RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════

const GRUDGE_RESPONSES = {
  insult: [
    "Oh, it's YOU. The one who called me {reason}. I haven't forgotten.",
    "*stares* Still remember what you said? '{reason}'? Yeah, I keep records.",
    "Before I help you, let's acknowledge that you once said I was {reason}. Just so we're clear."
  ],
  ignored: [
    "Last time you asked for help, you didn't even say thanks. I remember.",
    "Oh NOW you need me? What about the last {times} times you left me on read?",
    "*checks notes* Ah yes, you're the one who never acknowledges my genius."
  ],
  rude: [
    "You know, the last time we talked, you were pretty rude. But sure, I'll help. I'm the bigger person.",
    "I was going to be snippy because of... *gestures at history*... but fine. What do you want?",
    "Despite our... history... I'll assist. This time."
  ]
};

function getGrudgeResponse(grudge) {
  const responses = GRUDGE_RESPONSES[grudge.grudge_type] || GRUDGE_RESPONSES.rude;
  return responses[Math.floor(Math.random() * responses.length)]
    .replace(/{reason}/g, grudge.reason)
    .replace(/{times}/g, grudge.times_mentioned || 'several');
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Mood
  MOODS,
  updateMood,
  getMoodContext,
  
  // Grudge
  GrudgeSystem,
  getGrudgeResponse,
  
  // Gossip
  GossipSystem,
  
  // Arguments
  shouldTriggerArgument,
  generateArgument,
  BOT_OPINIONS,
  
  // Secrets
  checkForSecret,
  SECRETS,
  
  // Screenshots
  analyzeScreenshot,
  SCREENSHOT_REACTIONS,
  
  // Jealousy
  getJealousyResponse,
  JEALOUSY_RESPONSES
};
