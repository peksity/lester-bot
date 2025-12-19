/**
 * CONVERSATION HANDLER
 * AI-powered conversations as Lester
 */

const { EmbedBuilder } = require('discord.js');

// ============================================
// CONVERSATION MEMORY
// ============================================
const conversationHistory = new Map(); // userId -> array of messages

// ============================================
// HANDLE CONVERSATION
// ============================================
async function handle(message, client, systemPrompt) {
  const userId = message.author.id;
  const guildId = message.guild.id;
  
  try {
    // Get user profile from database
    let userProfile = await getUserProfile(userId, guildId, client);
    
    // Get conversation history
    let history = conversationHistory.get(userId) || [];
    
    // Build context
    const context = buildContext(userProfile, history, message);
    
    // Generate response
    const response = await generateResponse(message.content, context, systemPrompt, client);
    
    // Update history
    history.push({ role: 'user', content: message.content });
    history.push({ role: 'assistant', content: response });
    
    // Limit history to last 20 messages
    if (history.length > 20) {
      history = history.slice(-20);
    }
    conversationHistory.set(userId, history);
    
    // Update user profile
    await updateUserProfile(userId, guildId, message.content, response, client);
    
    // Send response
    // Split if too long
    if (response.length > 2000) {
      const chunks = response.match(/.{1,2000}/gs);
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(response);
    }
    
  } catch (error) {
    console.error('Conversation error:', error);
    
    // Fallback responses in character
    const fallbacks = [
      "Something's wrong with my systems. Try again.",
      "Hold on, got some interference. What were you saying?",
      "Technical difficulties. Even I have them sometimes.",
      "Connection issues. And no, it's not my basement wifi."
    ];
    
    message.reply(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
  }
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
    
    // Create new profile
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
// BUILD CONTEXT
// ============================================
function buildContext(userProfile, history, message) {
  let context = '';
  
  if (userProfile) {
    context += `\n\nUSER CONTEXT:
- Messages with me: ${userProfile.total_messages}
- Trust level: ${userProfile.lester_trust} (-100 to 100)
- Times they insulted me: ${userProfile.times_insulted}
- Times they apologized: ${userProfile.times_apologized}
- Times they thanked me: ${userProfile.times_thanked}`;
    
    if (userProfile.lester_trust < -20) {
      context += '\n- I have a grudge against this person.';
    } else if (userProfile.lester_trust > 50) {
      context += '\n- This person has earned my respect.';
    }
    
    if (userProfile.personal_info && Object.keys(userProfile.personal_info).length > 0) {
      context += `\n- Things I know about them: ${JSON.stringify(userProfile.personal_info)}`;
    }
  }
  
  // Recent conversation
  if (history.length > 0) {
    context += '\n\nRECENT CONVERSATION:';
    for (const msg of history.slice(-6)) {
      const speaker = msg.role === 'user' ? 'Them' : 'Me';
      context += `\n${speaker}: "${msg.content.substring(0, 200)}"`;
    }
  }
  
  return context;
}

// ============================================
// GENERATE RESPONSE
// ============================================
async function generateResponse(userMessage, context, systemPrompt, client) {
  const fullPrompt = systemPrompt + context;
  
  const response = await client.anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: fullPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ]
  });
  
  return response.content[0].text;
}

// ============================================
// UPDATE USER PROFILE
// ============================================
async function updateUserProfile(userId, guildId, userMessage, botResponse, client) {
  try {
    const lowerMessage = userMessage.toLowerCase();
    
    // Detect sentiment changes
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
    
    // Update database
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
    
    // Store conversation memory
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
