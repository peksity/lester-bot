/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TALK TO SYSTEM v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Allows users to directly address specific bots:
 * ?talktolester <message>
 * ?talktopavel <message>
 * ?talktocripps <message>
 * ?talktomadam <message>
 * ?talktochief <message>
 * 
 * Also works with shorter aliases:
 * ?lester, ?pavel, ?cripps, ?madam, ?chief
 * 
 * Cross-bot feature: If you ?talktopavel in Lester's channel,
 * Lester can relay or Pavel can be summoned.
 */

const { EmbedBuilder } = require('discord.js');

// Bot configurations
const BOTS = {
  lester: {
    names: ['lester', 'talktolester', 'asklester', 'les'],
    displayName: 'Lester Crest',
    color: 0x00FF00,
    emoji: '🧠',
    personality: 'genius mastermind, socially awkward, paranoid, sarcastic'
  },
  pavel: {
    names: ['pavel', 'talktopavel', 'askpavel', 'captain', 'kapitan'],
    displayName: 'Pavel',
    color: 0x0080FF,
    emoji: '🚤',
    personality: 'loyal submarine captain, warm, supportive, slight Russian accent'
  },
  cripps: {
    names: ['cripps', 'talktocripps', 'askcripps', 'oldman'],
    displayName: 'Cripps',
    color: 0x8B4513,
    emoji: '🏕️',
    personality: 'grumpy old trader, nostalgic, tells stories, complains'
  },
  madam: {
    names: ['madam', 'nazar', 'talktomadam', 'askmadam', 'madamnazar', 'fortune'],
    displayName: 'Madam Nazar',
    color: 0x9B59B6,
    emoji: '🔮',
    personality: 'mysterious fortune teller, cryptic, mystical, all-knowing'
  },
  chief: {
    names: ['chief', 'talktochief', 'askchief', 'sheriff', 'police', 'officer'],
    displayName: 'Police Chief',
    color: 0xFFD700,
    emoji: '⭐',
    personality: 'stern law enforcement, authoritative, by-the-book, suspicious'
  }
};

class TalkToSystem {
  constructor(pool, anthropic, client, currentBotId) {
    this.pool = pool;
    this.anthropic = anthropic;
    this.client = client;
    this.currentBotId = currentBotId;
    this.currentBot = BOTS[currentBotId];
  }

  /**
   * Check if a message is a "talk to" command
   */
  isTalkToCommand(content) {
    const lower = content.toLowerCase().trim();
    
    // Check each bot's command names
    for (const [botId, config] of Object.entries(BOTS)) {
      for (const name of config.names) {
        if (lower.startsWith(`?${name} `) || lower === `?${name}`) {
          return { 
            targetBot: botId, 
            message: content.slice(content.indexOf(' ') + 1).trim() || null,
            command: name
          };
        }
      }
    }
    return null;
  }

  /**
   * Handle a "talk to" command
   */
  async handleTalkTo(message, targetBot, userMessage) {
    const config = BOTS[targetBot];
    if (!config) return null;

    // If talking to current bot, respond directly
    if (targetBot === this.currentBotId) {
      return this.generateResponse(message, userMessage, config);
    }

    // If talking to different bot, we have options:
    // 1. Relay the message (this bot acknowledges and "passes it on")
    // 2. Respond as if we're that bot (if that bot isn't in the server)
    // 3. Ping/mention the other bot

    // Check if target bot is in this server
    const targetBotInServer = await this.isTargetBotInServer(message.guild, targetBot);

    if (targetBotInServer) {
      // Option 1: Relay - our bot acknowledges
      return this.relayToOtherBot(message, targetBot, userMessage, config);
    } else {
      // Option 2: We respond "on behalf of" or explain they're not here
      return this.respondForAbsentBot(message, targetBot, userMessage, config);
    }
  }

  /**
   * Check if target bot is in this server
   */
  async isTargetBotInServer(guild, targetBotId) {
    const botEnvMap = {
      lester: process.env.LESTER_BOT_ID,
      pavel: process.env.PAVEL_BOT_ID,
      cripps: process.env.CRIPPS_BOT_ID,
      madam: process.env.MADAM_BOT_ID,
      chief: process.env.CHIEF_BOT_ID
    };

    const discordId = botEnvMap[targetBotId];
    if (!discordId) return false;

    try {
      const member = await guild.members.fetch(discordId);
      return !!member;
    } catch {
      return false;
    }
  }

  /**
   * Generate response as the current bot
   */
  async generateResponse(message, userMessage, config) {
    if (!userMessage) {
      return {
        embed: new EmbedBuilder()
          .setTitle(`${config.emoji} ${config.displayName}`)
          .setDescription(`*${config.displayName} looks at you expectantly...*\n\nYou called? Say something.`)
          .setColor(config.color)
      };
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: `You are ${config.displayName}. Personality: ${config.personality}. 
                 Keep responses conversational and in-character. 
                 Don't use emojis unless being sarcastic. 
                 Respond naturally to the user's message.`,
        messages: [{ role: 'user', content: userMessage }]
      });

      return {
        content: response.content[0].text,
        reply: true
      };
    } catch (error) {
      console.error('TalkTo AI error:', error);
      return {
        content: `*${config.displayName} seems distracted...*`,
        reply: true
      };
    }
  }

  /**
   * Relay to another bot that's in the server
   */
  async relayToOtherBot(message, targetBotId, userMessage, targetConfig) {
    const myConfig = this.currentBot;
    
    // Personality-specific relay messages
    const relays = {
      lester: {
        pavel: `*sighs* Fine, I'll get Pavel on the line. Hold on.`,
        cripps: `You want to talk to that old fossil? Your funeral.`,
        madam: `The fortune teller? She's... unsettling. But fine.`,
        chief: `The COP?! Are you trying to get us all arrested?!`
      },
      pavel: {
        lester: `Ah, you want Kapitan Lester! One moment, friend.`,
        cripps: `The old cowboy? I will signal him for you.`,
        madam: `Madam Nazar? She is mysterious one. I connect you.`,
        chief: `The lawman? *nervous* Are you sure, friend?`
      },
      cripps: {
        lester: `That computer fella? Alright, hold yer horses.`,
        pavel: `The submarine captain? Strange fellow but alright.`,
        madam: `*gets quiet* Madam Nazar? I... yes, I'll get her.`,
        chief: `The sheriff? What'd you do now?`
      },
      madam: {
        lester: `The genius in his cave of wires... I shall summon him.`,
        pavel: `The captain of the deep... he comes.`,
        cripps: `*smiles knowingly* Cripps... yes, I will call him.`,
        chief: `The arm of the law approaches...`
      },
      chief: {
        lester: `Crest? *narrows eyes* Why do you need him?`,
        pavel: `The submarine operator. Fine.`,
        cripps: `The old trader? He's harmless enough.`,
        madam: `Madam Nazar. She's... an interesting informant.`
      }
    };

    const relayMessage = relays[this.currentBotId]?.[targetBotId] || 
      `*gets ${targetConfig.displayName}'s attention*`;

    // Store the pending message for the other bot to pick up
    await this.storePendingMessage(message.guild.id, message.channel.id, 
      message.author.id, targetBotId, userMessage);

    return {
      content: relayMessage + `\n\n*Calling ${targetConfig.displayName}...*`,
      reply: true
    };
  }

  /**
   * Respond when target bot isn't in server
   */
  async respondForAbsentBot(message, targetBotId, userMessage, targetConfig) {
    const myConfig = this.currentBot;

    // Personality-specific "they're not here" messages
    const absences = {
      lester: {
        pavel: `Pavel's not in this server. Probably off doing submarine stuff.`,
        cripps: `Cripps isn't here. Probably out hunting or complaining somewhere.`,
        madam: `Madam Nazar isn't in this server. Her wagon moves mysteriously.`,
        chief: `The Chief isn't here. Count your blessings.`
      },
      pavel: {
        lester: `Kapitan Lester is not on this server, friend. He is very... selective.`,
        cripps: `The old cowboy is not here. Perhaps he is at his camp.`,
        madam: `Madam Nazar has not set up wagon here. She travels much.`,
        chief: `The lawman is not present. *relieved* This is good, yes?`
      },
      // ... etc for other bots
    };

    const absenceMessage = absences[this.currentBotId]?.[targetBotId] ||
      `${targetConfig.displayName} isn't in this server.`;

    // Offer to respond "in their style" if user wants
    if (userMessage) {
      return {
        content: absenceMessage + `\n\nBut I can try to channel their... energy, if you want. Just ask me to "pretend to be ${targetConfig.displayName}."`,
        reply: true
      };
    }

    return {
      content: absenceMessage,
      reply: true
    };
  }

  /**
   * Store pending message for cross-bot pickup
   */
  async storePendingMessage(guildId, channelId, userId, targetBotId, message) {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS pending_talkto (
          id SERIAL PRIMARY KEY,
          guild_id TEXT NOT NULL,
          channel_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          target_bot TEXT NOT NULL,
          message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          handled BOOLEAN DEFAULT FALSE
        )
      `);

      await this.pool.query(`
        INSERT INTO pending_talkto (guild_id, channel_id, user_id, target_bot, message)
        VALUES ($1, $2, $3, $4, $5)
      `, [guildId, channelId, userId, targetBotId, message]);
    } catch (e) {
      console.error('Failed to store pending talkto:', e);
    }
  }

  /**
   * Check for pending messages addressed to this bot
   */
  async checkPendingMessages(guildId, channelId) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM pending_talkto 
        WHERE guild_id = $1 AND channel_id = $2 AND target_bot = $3 AND handled = FALSE
        ORDER BY created_at ASC LIMIT 1
      `, [guildId, channelId, this.currentBotId]);

      if (result.rows.length > 0) {
        const pending = result.rows[0];
        
        // Mark as handled
        await this.pool.query('UPDATE pending_talkto SET handled = TRUE WHERE id = $1', [pending.id]);
        
        return pending;
      }
    } catch (e) {
      // Table might not exist yet
    }
    return null;
  }

  /**
   * Get help embed for talk to commands
   */
  getHelpEmbed() {
    const embed = new EmbedBuilder()
      .setTitle('💬 Talk To Commands')
      .setDescription('Directly address any bot in the ecosystem:')
      .setColor(0x00FFFF);

    for (const [botId, config] of Object.entries(BOTS)) {
      const commands = config.names.slice(0, 3).map(n => `\`?${n}\``).join(', ');
      embed.addFields({
        name: `${config.emoji} ${config.displayName}`,
        value: commands,
        inline: true
      });
    }

    embed.addFields({
      name: 'Usage',
      value: '`?talktolester Hey, need help with a heist`\n`?madam What does my future hold?`',
      inline: false
    });

    embed.setFooter({ text: 'Works across bots - they communicate!' });

    return embed;
  }
}

module.exports = { TalkToSystem, BOTS };
