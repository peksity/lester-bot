/**
 * ADVANCED CONVERSATION HANDLER
 * Context-aware AI that understands the full environment
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// CONVERSATION MEMORY - Per channel tracking
// ============================================
const channelConversations = new Map(); // channelId -> { lastSpeaker, lastBot, messages[] }
const userHistory = new Map(); // oderId -> array of messages

// ============================================
// HANDLE CONVERSATION
// ============================================
async function handle(message, client, systemPrompt) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  const channelId = message.channel.id;
  
  try {
    // Fetch recent channel messages to understand context
    const channelContext = await getChannelContext(message);
    
    // Get user profile from database
    let userProfile = await getUserProfile(userId, guildId, client);
    
    // Get personal conversation history with this user
    let history = userHistory.get(userId) || [];
    
    // Build comprehensive context
    const context = buildSmartContext(userProfile, history, message, channelContext);
    
    // Generate response
    const response = await generateResponse(message.content, context, systemPrompt, client);
    
    // Update history
    history.push({ role: 'user', content: message.content, timestamp: Date.now() });
    history.push({ role: 'assistant', content: response, timestamp: Date.now() });
    
    // Limit history to last 20 messages
    if (history.length > 20) {
      history = history.slice(-20);
    }
    userHistory.set(userId, history);
    
    // Update channel tracking
    updateChannelTracking(channelId, message.author.username, 'Lester', message.content, response);
    
    // Update user profile
    await updateUserProfile(userId, guildId, message.content, response, client);
    
    // Send response - use channel.send, not reply (more natural)
    if (response.length > 2000) {
      const chunks = response.match(/.{1,2000}/gs);
      for (const chunk of chunks) {
        await message.channel.send(chunk);
      }
    } else {
      await message.channel.send(response);
    }
    
  } catch (error) {
    console.error('Conversation error:', error);
    
    const fallbacks = [
      "...",
      "hm",
      "systems acting up. what",
      "yeah hold on"
    ];
    
    message.channel.send(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
  }
}

// ============================================
// GET CHANNEL CONTEXT - Fetch recent messages
// ============================================
async function getChannelContext(message) {
  try {
    const messages = await message.channel.messages.fetch({ limit: 15 });
    const sorted = [...messages.values()].reverse(); // Oldest first
    
    const context = {
      channelName: message.channel.name,
      recentMessages: [],
      participants: new Set(),
      lastBotMessage: null,
      conversationFlow: []
    };
    
    for (const msg of sorted) {
      const isBot = msg.author.bot;
      const speaker = isBot ? msg.author.username : msg.author.username;
      
      context.participants.add(speaker);
      context.recentMessages.push({
        author: speaker,
        content: msg.content.substring(0, 300),
        isBot: isBot,
        timestamp: msg.createdTimestamp
      });
      
      if (isBot && msg.author.username.toLowerCase().includes('lester')) {
        context.lastBotMessage = msg.content;
      }
      
      context.conversationFlow.push(`${speaker}: ${msg.content.substring(0, 100)}`);
    }
    
    return context;
  } catch (error) {
    console.error('Get channel context error:', error);
    return null;
  }
}

// ============================================
// BUILD SMART CONTEXT
// ============================================
function buildSmartContext(userProfile, history, message, channelContext) {
  let context = '';
  
  // Environment awareness
  context += `\n\nENVIRONMENT:`;
  context += `\nChannel: #${message.channel.name}`;
  context += `\nServer: ${message.guild.name}`;
  context += `\nCurrent speaker: ${message.author.username} (display: ${message.member?.displayName || message.author.username})`;
  
  // Channel context - what's been happening
  if (channelContext) {
    context += `\nPeople in this conversation: ${[...channelContext.participants].join(', ')}`;
    
    // Show recent conversation flow
    if (channelContext.conversationFlow.length > 0) {
      context += `\n\nRECENT CHANNEL ACTIVITY (last ${channelContext.conversationFlow.length} messages):`;
      for (const msg of channelContext.conversationFlow.slice(-10)) {
        context += `\n${msg}`;
      }
    }
    
    // Detect if someone is interrupting
    const recentNonBotMessages = channelContext.recentMessages.filter(m => !m.isBot);
    if (recentNonBotMessages.length >= 2) {
      const lastTwo = recentNonBotMessages.slice(-2);
      if (lastTwo[0].author !== lastTwo[1].author) {
        context += `\n\nNOTE: ${lastTwo[1].author} just joined the conversation (was ${lastTwo[0].author} talking before)`;
      }
    }
  }
  
  // User relationship context
  if (userProfile) {
    context += `\n\nMY HISTORY WITH ${message.author.username.toUpperCase()}:`;
    context += `\n- Total conversations: ${userProfile.total_messages}`;
    context += `\n- Our relationship: ${getTrustDescription(userProfile.lester_trust)}`;
    context += `\n- Times they insulted me: ${userProfile.times_insulted}`;
    context += `\n- Times they thanked me: ${userProfile.times_thanked}`;
    
    if (userProfile.lester_trust < -30) {
      context += '\n- I remember they were rude to me. I hold grudges.';
    } else if (userProfile.lester_trust > 40) {
      context += '\n- They\'ve been good to me. I respect them.';
    }
    
    if (userProfile.personal_info && Object.keys(userProfile.personal_info).length > 0) {
      context += `\n- Things I remember about them: ${JSON.stringify(userProfile.personal_info)}`;
    }
  }
  
  // Our personal history
  if (history.length > 0) {
    context += '\n\nMY DIRECT HISTORY WITH THIS PERSON:';
    for (const msg of history.slice(-6)) {
      const speaker = msg.role === 'user' ? message.author.username : 'Me';
      context += `\n${speaker}: "${msg.content.substring(0, 150)}"`;
    }
  }
  
  return context;
}

// ============================================
// GET TRUST DESCRIPTION
// ============================================
function getTrustDescription(trust) {
  if (trust < -50) return "I don't like this person";
  if (trust < -20) return "They've annoyed me before";
  if (trust < 0) return "Neutral, slightly negative";
  if (trust < 20) return "Neutral";
  if (trust < 50) return "Decent person";
  return "One of the good ones";
}

// ============================================
// UPDATE CHANNEL TRACKING
// ============================================
function updateChannelTracking(channelId, speaker, bot, userMessage, botResponse) {
  let tracking = channelConversations.get(channelId) || {
    lastSpeaker: null,
    lastBot: null,
    messages: []
  };
  
  tracking.lastSpeaker = speaker;
  tracking.lastBot = bot;
  tracking.messages.push({ speaker, content: userMessage, timestamp: Date.now() });
  tracking.messages.push({ speaker: bot, content: botResponse, timestamp: Date.now() });
  
  // Keep only last 30 messages
  if (tracking.messages.length > 30) {
    tracking.messages = tracking.messages.slice(-30);
  }
  
  channelConversations.set(channelId, tracking);
}

// ============================================
// GENERATE RESPONSE
// ============================================
async function generateResponse(userMessage, context, systemPrompt, client) {
  const fullPrompt = systemPrompt + context;
  
  // Randomly vary max tokens to get more natural response lengths
  const maxTokens = Math.random() < 0.4 ? 100 : Math.random() < 0.7 ? 200 : 350;
  
  const response = await client.anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: fullPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ]
  });
  
  return response.content[0].text;
}

// ============================================
// GET USER PROFILE
// ============================================
async function getUserProfile(userId, guildId, client) {
  try {
    const result = await client.db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1 AND guild_id = $2',
      [userId, guildId]
    );
    
    if (result.rows[0]) {
      return result.rows[0];
    }
    
    await client.db.query(`
      INSERT INTO user_profiles (user_id, guild_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, guildId]);
    
    return {
      user_id: userId,
      total_messages: 0,
      lester_trust: 0,
      lester_respect: 0,
      times_insulted: 0,
      times_apologized: 0,
      times_thanked: 0,
      personal_info: {}
    };
    
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

// ============================================
// UPDATE USER PROFILE
// ============================================
async function updateUserProfile(userId, guildId, userMessage, botResponse, client) {
  try {
    const lowerMessage = userMessage.toLowerCase();
    
    let trustChange = 0;
    let respectChange = 0;
    let insulted = false;
    let apologized = false;
    let thanked = false;
    
    // Insults
    const insultPatterns = [
      'fuck you', 'stfu', 'shut up', 'useless', 'stupid', 'idiot', 
      'dumb', 'hate you', 'worst', 'suck', 'trash', 'garbage',
      'cripple', 'disabled', 'pathetic'
    ];
    
    for (const pattern of insultPatterns) {
      if (lowerMessage.includes(pattern)) {
        trustChange -= 15;
        insulted = true;
        break;
      }
    }
    
    // Apologies
    const apologyPatterns = ['sorry', 'apologize', 'my bad', 'i was wrong', 'forgive me'];
    for (const pattern of apologyPatterns) {
      if (lowerMessage.includes(pattern)) {
        trustChange += 10;
        apologized = true;
        break;
      }
    }
    
    // Thanks
    const thanksPatterns = ['thank', 'thanks', 'appreciate', 'helpful', 'youre the best', 'goat', 'legend'];
    for (const pattern of thanksPatterns) {
      if (lowerMessage.includes(pattern)) {
        trustChange += 5;
        respectChange += 3;
        thanked = true;
        break;
      }
    }
    
    // Positive interactions
    const positivePatterns = ['love', 'great', 'awesome', 'amazing', 'cool', 'nice'];
    for (const pattern of positivePatterns) {
      if (lowerMessage.includes(pattern) && !lowerMessage.includes('not')) {
        trustChange += 2;
        break;
      }
    }
    
    await client.db.query(`
      UPDATE user_profiles SET
        total_messages = total_messages + 1,
        lester_trust = GREATEST(-100, LEAST(100, lester_trust + $1)),
        lester_respect = GREATEST(-100, LEAST(100, lester_respect + $2)),
        times_insulted = times_insulted + $3,
        times_apologized = times_apologized + $4,
        times_thanked = times_thanked + $5,
        last_interaction = NOW()
      WHERE user_id = $6 AND guild_id = $7
    `, [trustChange, respectChange, insulted ? 1 : 0, apologized ? 1 : 0, thanked ? 1 : 0, userId, guildId]);
    
    await client.db.query(`
      INSERT INTO conversation_memory (user_id, guild_id, bot_name, user_message, bot_response)
      VALUES ($1, $2, 'lester', $3, $4)
    `, [userId, guildId, userMessage.substring(0, 500), botResponse.substring(0, 500)]);
    
  } catch (error) {
    console.error('Update user profile error:', error);
  }
}

module.exports = {
  handle
};
