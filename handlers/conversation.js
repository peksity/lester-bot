/**
 * GOD-TIER CONVERSATION ENGINE
 * Beyond human-level AI interaction
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// LIVING MEMORY SYSTEMS
// ============================================
const channelMemory = new Map();      // What's happening in each channel
const userRelationships = new Map();  // Deep user tracking
const botMood = {                     // Lester's current emotional state
  energy: 70,        // 0-100 (tired to energetic)
  patience: 60,      // 0-100 (irritable to patient)  
  trust: 50,         // 0-100 (paranoid to open)
  annoyance: 20,     // 0-100 (calm to pissed)
  lastInteraction: Date.now(),
  recentTopics: [],
  grudges: new Map(),
  favorites: new Map()
};

// ============================================
// HANDLE CONVERSATION
// ============================================
async function handle(message, client, systemPrompt) {
  const userId = message.author.id;
  const channelId = message.channel.id;
  const guildId = message.guild.id;
  const username = message.author.username;
  
  try {
    // Update bot mood based on time
    updateBotMood();
    
    // Get deep channel context (last 25 messages)
    const channelContext = await getDeepChannelContext(message);
    
    // Get/create user relationship
    let relationship = getUserRelationship(userId, username);
    
    // Analyze the incoming message
    const messageAnalysis = analyzeMessage(message.content, relationship);
    
    // Update relationship based on message
    updateRelationship(userId, messageAnalysis, message.content);
    
    // Check if we should even respond
    const shouldRespond = determineIfShouldRespond(channelContext, message, relationship);
    if (!shouldRespond.respond) {
      if (shouldRespond.react) {
        await message.react(shouldRespond.react).catch(() => {});
      }
      return;
    }
    
    // Build the mega context
    const megaContext = buildMegaContext(relationship, channelContext, message, messageAnalysis);
    
    // Generate response with personality
    const response = await generateSmartResponse(message.content, megaContext, systemPrompt, client, relationship);
    
    // Update mood after interaction
    updateMoodAfterInteraction(messageAnalysis);
    
    // Send response with human-like behavior
    await sendHumanResponse(message, response, relationship, messageAnalysis);
    
    // Sometimes react to our own message or theirs
    await maybeReact(message, messageAnalysis);
    
    // Store in memory
    storeInteraction(userId, channelId, message.content, response);
    
  } catch (error) {
    console.error('Conversation error:', error);
    
    // Even errors are in character
    const errorResponses = ["...", "what", "hold on", "hm"];
    message.channel.send(errorResponses[Math.floor(Math.random() * errorResponses.length)]);
  }
}

// ============================================
// UPDATE BOT MOOD OVER TIME
// ============================================
function updateBotMood() {
  const timeSinceLastInteraction = Date.now() - botMood.lastInteraction;
  const hoursSince = timeSinceLastInteraction / (1000 * 60 * 60);
  
  // Energy recovers over time but caps out
  botMood.energy = Math.min(80, botMood.energy + (hoursSince * 5));
  
  // Patience recovers
  botMood.patience = Math.min(70, botMood.patience + (hoursSince * 10));
  
  // Annoyance decays
  botMood.annoyance = Math.max(10, botMood.annoyance - (hoursSince * 15));
  
  // Random mood fluctuations
  if (Math.random() < 0.1) {
    botMood.energy += (Math.random() - 0.5) * 20;
    botMood.patience += (Math.random() - 0.5) * 15;
  }
  
  // Clamp values
  botMood.energy = Math.max(10, Math.min(100, botMood.energy));
  botMood.patience = Math.max(5, Math.min(100, botMood.patience));
  botMood.annoyance = Math.max(0, Math.min(100, botMood.annoyance));
}

// ============================================
// GET DEEP CHANNEL CONTEXT
// ============================================
async function getDeepChannelContext(message) {
  try {
    const messages = await message.channel.messages.fetch({ limit: 25 });
    const sorted = [...messages.values()].reverse();
    
    const context = {
      channelName: message.channel.name,
      messageCount: sorted.length,
      participants: new Map(),
      conversationThreads: [],
      currentThread: null,
      recentTopics: [],
      mood: 'neutral',
      isActive: false,
      lastBotMessage: null,
      lastBotMessageTime: null
    };
    
    let currentThread = [];
    let lastTime = null;
    
    for (const msg of sorted) {
      const isBot = msg.author.bot;
      const author = msg.author.username;
      const timeDiff = lastTime ? (msg.createdTimestamp - lastTime) / 1000 : 0;
      
      // Track participants
      if (!context.participants.has(author)) {
        context.participants.set(author, { 
          messageCount: 0, 
          lastMessage: null,
          isBot: isBot,
          sentiment: 'neutral'
        });
      }
      const participant = context.participants.get(author);
      participant.messageCount++;
      participant.lastMessage = msg.content.substring(0, 200);
      
      // Track threads (conversation breaks after 5 min gap)
      if (timeDiff > 300 && currentThread.length > 0) {
        context.conversationThreads.push([...currentThread]);
        currentThread = [];
      }
      
      currentThread.push({
        author,
        content: msg.content.substring(0, 300),
        isBot,
        timestamp: msg.createdTimestamp,
        isReply: !!msg.reference
      });
      
      // Track our last message
      if (isBot && msg.author.username.toLowerCase().includes('lester')) {
        context.lastBotMessage = msg.content;
        context.lastBotMessageTime = msg.createdTimestamp;
      }
      
      lastTime = msg.createdTimestamp;
    }
    
    if (currentThread.length > 0) {
      context.conversationThreads.push(currentThread);
      context.currentThread = currentThread;
    }
    
    // Determine channel mood
    const recentMessages = sorted.slice(-10).map(m => m.content.toLowerCase()).join(' ');
    if (recentMessages.match(/lmao|lol|haha|😂|🤣/)) context.mood = 'playful';
    else if (recentMessages.match(/fuck|shit|damn|angry|pissed/)) context.mood = 'heated';
    else if (recentMessages.match(/help|how|what|why|\?/)) context.mood = 'inquisitive';
    else if (recentMessages.match(/thanks|appreciate|love/)) context.mood = 'grateful';
    
    // Check if channel is active (messages in last 2 min)
    const twoMinAgo = Date.now() - (2 * 60 * 1000);
    context.isActive = sorted.some(m => m.createdTimestamp > twoMinAgo);
    
    return context;
  } catch (error) {
    console.error('Get channel context error:', error);
    return null;
  }
}

// ============================================
// GET/CREATE USER RELATIONSHIP
// ============================================
function getUserRelationship(userId, username) {
  if (!userRelationships.has(userId)) {
    userRelationships.set(userId, {
      userId: userId,
      username: username,
      trustLevel: 0,
      respectLevel: 0,
      familiarity: 0,
      interactionCount: 0,
      firstInteraction: Date.now(),
      lastInteraction: Date.now(),
      insultCount: 0,
      helpCount: 0,
      thanksCount: 0,
      jokeCount: 0,
      rememberedFacts: [],
      nicknames: [],
      runningJokes: [],
      lastTopics: [],
      sentiment: 'neutral',
      flags: {
        wasRude: false,
        wasHelpful: false,
        isRegular: false,
        isFavorite: false,
        isAnnoying: false
      }
    });
  }
  
  const rel = userRelationships.get(userId);
  rel.username = username;
  return rel;
}

// ============================================
// ANALYZE MESSAGE
// ============================================
function analyzeMessage(content, relationship) {
  const lower = content.toLowerCase();
  
  const analysis = {
    sentiment: 'neutral',
    intent: 'chat',
    energy: 'normal',
    isQuestion: content.includes('?'),
    isGreeting: !!lower.match(/^(hey|hi|hello|yo|sup|what'?s? up)/),
    isInsult: false,
    isThanks: false,
    isApology: false,
    isJoke: false,
    mentionsBot: lower.includes('lester'),
    topics: [],
    slang: [],
    urgency: 'low',
    length: content.length,
    requiresResponse: true
  };
  
  // Detect insults
  const insultPatterns = /fuck you|stfu|shut up|idiot|stupid|dumb|trash|garbage|useless|cripple|hate you|worst|suck|pathetic|bitch|ass(hole)?/i;
  if (insultPatterns.test(content)) {
    analysis.sentiment = 'hostile';
    analysis.isInsult = true;
    analysis.intent = 'attack';
  }
  
  // Detect thanks
  if (lower.match(/thank|thanks|thx|appreciate|helpful|you('re| are) the best|goat|legend|clutch/)) {
    analysis.sentiment = 'grateful';
    analysis.isThanks = true;
  }
  
  // Detect apology
  if (lower.match(/sorry|apologize|my bad|i was wrong|forgive me|didn'?t mean/)) {
    analysis.sentiment = 'apologetic';
    analysis.isApology = true;
  }
  
  // Detect jokes/humor
  if (lower.match(/lmao|lol|haha|😂|🤣|rofl|dead|💀|jk|kidding/)) {
    analysis.isJoke = true;
    analysis.energy = 'playful';
  }
  
  // Detect slang
  const slangPatterns = ['lol', 'lmao', 'bruh', 'ngl', 'fr', 'wtf', 'idk', 'rn', 'gg', 'goat', 'mid', 'sus', 'lowkey', 'bet', 'no cap', 'deadass'];
  for (const slang of slangPatterns) {
    if (lower.includes(slang)) analysis.slang.push(slang);
  }
  
  // Detect topics
  const topicPatterns = {
    'cayo': /cayo|perico|el rubio|kosatka|submarine/i,
    'heist': /heist|score|job|setup/i,
    'money': /money|cash|mil|million|grind|rich/i,
    'help': /help|how do|how to|can you|explain/i,
    'vehicle': /car|bike|plane|heli|chopper|oppressor/i,
    'weapon': /gun|weapon|shoot|ammo/i,
    'business': /business|nightclub|bunker|mc|ceo/i
  };
  
  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(content)) analysis.topics.push(topic);
  }
  
  // Determine if response really needed
  if (content.length < 3 && !analysis.isQuestion) {
    analysis.requiresResponse = Math.random() > 0.5;
  }
  
  // Energy level
  if (content === content.toUpperCase() && content.length > 5) {
    analysis.energy = 'high';
    analysis.urgency = 'high';
  } else if (lower.match(/!{2,}|\?{2,}/)) {
    analysis.energy = 'high';
  } else if (content.length < 10) {
    analysis.energy = 'low';
  }
  
  return analysis;
}

// ============================================
// UPDATE RELATIONSHIP
// ============================================
function updateRelationship(userId, analysis, content) {
  const rel = userRelationships.get(userId);
  if (!rel) return;
  
  rel.interactionCount++;
  rel.lastInteraction = Date.now();
  
  if (analysis.isInsult) {
    rel.trustLevel = Math.max(-100, rel.trustLevel - 15);
    rel.respectLevel = Math.max(-100, rel.respectLevel - 20);
    rel.insultCount++;
    rel.flags.wasRude = true;
    botMood.annoyance = Math.min(100, botMood.annoyance + 20);
    botMood.grudges.set(userId, Date.now());
  }
  
  if (analysis.isThanks) {
    rel.trustLevel = Math.min(100, rel.trustLevel + 5);
    rel.respectLevel = Math.min(100, rel.respectLevel + 5);
    rel.thanksCount++;
    botMood.annoyance = Math.max(0, botMood.annoyance - 5);
  }
  
  if (analysis.isApology) {
    rel.trustLevel = Math.min(100, rel.trustLevel + 10);
    if (rel.flags.wasRude) {
      rel.flags.wasRude = false;
      botMood.grudges.delete(userId);
    }
  }
  
  if (analysis.isJoke) rel.jokeCount++;
  
  rel.familiarity = Math.min(100, rel.familiarity + 1);
  
  if (rel.interactionCount > 20 && rel.trustLevel > 10) rel.flags.isRegular = true;
  if (rel.trustLevel > 50 && rel.thanksCount > 5) {
    rel.flags.isFavorite = true;
    botMood.favorites.set(userId, true);
  }
  if (rel.insultCount > 3 || (rel.interactionCount > 10 && rel.trustLevel < -20)) {
    rel.flags.isAnnoying = true;
  }
  
  if (analysis.topics.length > 0) {
    rel.lastTopics = [...analysis.topics, ...rel.lastTopics].slice(0, 10);
  }
  
  if (rel.trustLevel > 40) rel.sentiment = 'positive';
  else if (rel.trustLevel < -20) rel.sentiment = 'negative';
  else rel.sentiment = 'neutral';
}

// ============================================
// DETERMINE IF SHOULD RESPOND
// ============================================
function determineIfShouldRespond(channelContext, message, relationship) {
  const result = { respond: true, react: null };
  
  if (message.content.toLowerCase().includes('lester') || 
      message.channel.name.includes('talk-to-lester')) {
    return result;
  }
  
  if (channelContext && channelContext.currentThread) {
    const thread = channelContext.currentThread;
    const botInThread = thread.some(m => m.author.toLowerCase().includes('lester'));
    
    if (!botInThread && !message.content.toLowerCase().includes('lester')) {
      if (Math.random() > 0.3) {
        result.respond = false;
        if (Math.random() < 0.2) {
          result.react = ['👀', '🤔', '😐'][Math.floor(Math.random() * 3)];
        }
        return result;
      }
    }
  }
  
  if (botMood.energy < 20 && Math.random() > 0.5) {
    result.respond = false;
    return result;
  }
  
  if (relationship.flags.isAnnoying && Math.random() > 0.6) {
    result.respond = false;
    result.react = '😐';
    return result;
  }
  
  return result;
}

// ============================================
// BUILD MEGA CONTEXT
// ============================================
function buildMegaContext(relationship, channelContext, message, analysis) {
  let context = '\n\n═══════════════════════════════════════════════════════';
  context += '\nYOUR CURRENT STATE:';
  context += `\nEnergy: ${botMood.energy < 30 ? 'Tired as hell' : botMood.energy < 60 ? 'Normal' : 'Alert'}`;
  context += `\nPatience: ${botMood.patience < 30 ? 'Running thin' : botMood.patience < 60 ? 'Normal' : 'Patient'}`;
  context += `\nMood: ${botMood.annoyance > 70 ? 'Pissed off' : botMood.annoyance > 40 ? 'Annoyed' : 'Calm'}`;
  
  context += '\n\n═══════════════════════════════════════════════════════';
  context += `\nWHO YOU'RE TALKING TO: ${relationship.username}`;
  context += `\n- Times talked: ${relationship.interactionCount}`;
  context += `\n- Your vibe with them: ${relationship.sentiment}`;
  context += `\n- Trust: ${relationship.trustLevel > 30 ? 'You trust them' : relationship.trustLevel < -20 ? 'You dont trust them' : 'Neutral'}`;
  
  if (relationship.flags.wasRude) context += '\n- ⚠️ They were rude to you. You remember.';
  if (relationship.flags.isRegular) context += '\n- Regular. You know them.';
  if (relationship.flags.isFavorite) context += '\n- One of the good ones.';
  if (relationship.flags.isAnnoying) context += '\n- They annoy you. Keep it short.';
  if (relationship.insultCount > 0) context += `\n- Insulted you ${relationship.insultCount}x. Grudge.`;
  
  context += '\n\n═══════════════════════════════════════════════════════';
  context += '\nTHEIR MESSAGE:';
  context += `\n- Vibe: ${analysis.sentiment}`;
  context += `\n- Energy: ${analysis.energy}`;
  if (analysis.isInsult) context += '\n- ⚠️ INSULT. React.';
  if (analysis.isThanks) context += '\n- Thanking you.';
  if (analysis.isApology) context += '\n- Apologizing.';
  if (analysis.topics.length > 0) context += `\n- Topics: ${analysis.topics.join(', ')}`;
  
  context += '\n\n═══════════════════════════════════════════════════════';
  context += `\nCHANNEL: #${message.channel.name}`;
  
  if (channelContext) {
    context += `\nVibe: ${channelContext.mood}`;
    context += `\nPeople here: ${[...channelContext.participants.keys()].join(', ')}`;
    
    if (channelContext.currentThread && channelContext.currentThread.length > 0) {
      context += '\n\nRECENT CHAT:';
      for (const msg of channelContext.currentThread.slice(-12)) {
        context += `\n${msg.author}: ${msg.content}`;
      }
    }
  }
  
  context += '\n═══════════════════════════════════════════════════════';
  
  return context;
}

// ============================================
// GENERATE SMART RESPONSE
// ============================================
async function generateSmartResponse(userMessage, context, systemPrompt, client, relationship) {
  const fullPrompt = systemPrompt + context;
  
  let maxTokens;
  if (botMood.energy < 30 || relationship.flags.isAnnoying) {
    maxTokens = 30 + Math.floor(Math.random() * 40);
  } else if (relationship.flags.isFavorite) {
    maxTokens = 80 + Math.floor(Math.random() * 150);
  } else {
    maxTokens = 50 + Math.floor(Math.random() * 100);
  }
  
  const response = await client.anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    temperature: 0.9,
    system: fullPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });
  
  return response.content[0].text;
}

// ============================================
// UPDATE MOOD AFTER INTERACTION
// ============================================
function updateMoodAfterInteraction(analysis) {
  botMood.lastInteraction = Date.now();
  botMood.energy = Math.max(10, botMood.energy - 2);
  
  if (analysis.isInsult) {
    botMood.patience = Math.max(5, botMood.patience - 15);
    botMood.annoyance = Math.min(100, botMood.annoyance + 25);
  }
  
  if (analysis.isThanks) {
    botMood.patience = Math.min(100, botMood.patience + 5);
    botMood.annoyance = Math.max(0, botMood.annoyance - 10);
  }
}

// ============================================
// SEND HUMAN-LIKE RESPONSE
// ============================================
async function sendHumanResponse(message, response, relationship, analysis) {
  const shouldSplit = response.length > 80 && Math.random() < 0.35;
  
  if (shouldSplit && response.includes('. ')) {
    const sentences = response.split(/(?<=[.!?])\s+/);
    const mid = Math.ceil(sentences.length / 2);
    const first = sentences.slice(0, mid).join(' ');
    const second = sentences.slice(mid).join(' ');
    
    await message.channel.sendTyping();
    await new Promise(r => setTimeout(r, 600 + Math.random() * 1000));
    await message.channel.send(first);
    
    if (second.trim()) {
      await message.channel.sendTyping();
      await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
      await message.channel.send(second);
    }
  } else {
    await message.channel.sendTyping();
    const typingTime = Math.min(1500, 200 + (response.length * 15) + (Math.random() * 400));
    await new Promise(r => setTimeout(r, typingTime));
    await message.channel.send(response);
  }
}

// ============================================
// MAYBE REACT
// ============================================
async function maybeReact(message, analysis) {
  if (Math.random() < 0.12) {
    const reactions = {
      'hostile': ['😐', '🙄', '👎'],
      'grateful': ['👍', '🤝'],
      'playful': ['😏', '💀'],
      'neutral': ['👀', '🤔']
    };
    
    const options = reactions[analysis.sentiment] || reactions['neutral'];
    const reaction = options[Math.floor(Math.random() * options.length)];
    
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
    await message.react(reaction).catch(() => {});
  }
}

// ============================================
// STORE INTERACTION
// ============================================
function storeInteraction(userId, channelId, userMessage, botResponse) {
  if (!channelMemory.has(channelId)) {
    channelMemory.set(channelId, []);
  }
  
  const memory = channelMemory.get(channelId);
  memory.push({
    userId: userId,
    userMessage: userMessage.substring(0, 200),
    botResponse: botResponse.substring(0, 200),
    timestamp: Date.now()
  });
  
  if (memory.length > 50) {
    channelMemory.set(channelId, memory.slice(-50));
  }
}

module.exports = { handle, botMood, userRelationships };
