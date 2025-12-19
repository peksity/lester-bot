# THE UNPATCHED METHOD
## Discord Bot System

### What's Inside:
```
TheUnpatchedMethod/
├── lester-bot/    ← Main bot (moderation, ?setup)
├── pavel-bot/     ← GTA LFG (?cayo, ?heist)
├── cripps-bot/    ← RDO LFG (?wagon, ?bounty)
├── madam-bot/     ← RDO info (?nazar)
└── TOKENS.txt     ← Put your tokens here
```

### Railway Setup:
Each bot needs these environment variables:
```
DISCORD_TOKEN = (that bot's token)
ANTHROPIC_API_KEY = (your API key)
DATABASE_URL = (from Railway PostgreSQL)
NODE_ENV = production
```

### After Deployment:
1. Make sure all 4 bots are online in your server
2. Type `?setup` in any channel
3. Confirm with ✅
4. Done!

### Commands:
- `?setup` - Create entire server structure
- `?help` - Show all commands
- `?kick @user` - Kick
- `?ban @user` - Ban
- `?cayo 2 PSN` - Cayo LFG
- `?nazar` - Madam Nazar location
