/**
 * GUN VAN HANDLER
 * Daily Gun Van location updates
 */

const { EmbedBuilder } = require('discord.js');
const cron = require('node-cron');

// ============================================
// GUN VAN LOCATIONS
// ============================================
const GUN_VAN_LOCATIONS = [
  { name: 'La Mesa', region: 'Los Santos', description: 'Behind the warehouse on Popular Street' },
  { name: 'Cypress Flats', region: 'Los Santos', description: 'Near the foundry' },
  { name: 'El Burro Heights', region: 'Los Santos', description: 'Near the oil derricks' },
  { name: 'Elysian Island', region: 'Port', description: 'By the cranes' },
  { name: 'Davis', region: 'Los Santos', description: 'Behind the apartments' },
  { name: 'Rancho', region: 'Los Santos', description: 'Under the highway overpass' },
  { name: 'Strawberry', region: 'Los Santos', description: 'Near the motel' },
  { name: 'Vespucci Beach', region: 'Los Santos', description: 'By the skate park' },
  { name: 'Del Perro', region: 'Los Santos', description: 'Under the pier' },
  { name: 'Little Seoul', region: 'Los Santos', description: 'Behind the strip mall' },
  { name: 'Pillbox Hill', region: 'Downtown', description: 'In the parking structure' },
  { name: 'Mirror Park', region: 'Los Santos', description: 'Near the lake' },
  { name: 'Vinewood Hills', region: 'Vinewood', description: 'By the mansion gates' },
  { name: 'Rockford Hills', region: 'Los Santos', description: 'Behind the golf course' },
  { name: 'Paleto Bay', region: 'Blaine County', description: 'By the cluckin bell' },
  { name: 'Sandy Shores', region: 'Blaine County', description: 'Near the airfield' },
  { name: 'Grapeseed', region: 'Blaine County', description: 'Behind the farm' },
  { name: 'Harmony', region: 'Blaine County', description: 'At the gas station' },
  { name: 'Grand Senora Desert', region: 'Blaine County', description: 'Near the quarry' },
  { name: 'Chumash', region: 'Los Santos County', description: 'By the beach' },
  { name: 'Tongva Hills', region: 'Los Santos County', description: 'Near the vineyard' },
  { name: 'Banham Canyon', region: 'Los Santos County', description: 'By the reservoir' },
  { name: 'Palomino Highlands', region: 'Los Santos County', description: 'Near the overlook' },
  { name: 'Tataviam Mountains', region: 'Los Santos County', description: 'At the ranger station' },
  { name: 'RON Alternates Wind Farm', region: 'Blaine County', description: 'Among the turbines' }
];

// ============================================
// FEATURED ITEMS (Rotates)
// ============================================
const FEATURED_ITEMS = [
  { name: 'Railgun', price: '$730,000', discount: '40%' },
  { name: 'Up-n-Atomizer', price: '$399,000', discount: '30%' },
  { name: 'Unholy Hellbringer', price: '$449,000', discount: '35%' },
  { name: 'Widowmaker', price: '$499,000', discount: '25%' },
  { name: 'Compact EMP Launcher', price: '$525,000', discount: '20%' },
  { name: 'Heavy Rifle', price: '$450,000', discount: '30%' },
  { name: 'Military Rifle', price: '$395,000', discount: '35%' },
  { name: 'Tactical SMG', price: '$325,000', discount: '25%' },
  { name: 'Assault Shotgun', price: '$295,000', discount: '30%' }
];

// ============================================
// GET TODAY'S LOCATION (Deterministic based on date)
// ============================================
function getTodaysLocation() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const locationIndex = dayOfYear % GUN_VAN_LOCATIONS.length;
  const itemIndex = dayOfYear % FEATURED_ITEMS.length;
  
  return {
    location: GUN_VAN_LOCATIONS[locationIndex],
    featuredItem: FEATURED_ITEMS[itemIndex],
    date: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  };
}

// ============================================
// GET LOCATION COMMAND
// ============================================
async function getLocation(message, client) {
  const data = getTodaysLocation();
  
  const embed = new EmbedBuilder()
    .setTitle(`🔫 GUN VAN - ${data.date}`)
    .setDescription(`*"I know a guy..."*`)
    .setColor(0x2F3136)
    .addFields(
      { name: '📍 Location', value: data.location.name, inline: true },
      { name: '🗺️ Region', value: data.location.region, inline: true },
      { name: '📝 Details', value: data.location.description, inline: false },
      { name: '⭐ Featured Item', value: `${data.featuredItem.name}`, inline: true },
      { name: '💰 Price', value: data.featuredItem.price, inline: true },
      { name: '🏷️ Discount', value: data.featuredItem.discount, inline: true }
    )
    .setFooter({ text: 'Resets daily at 6 AM UTC' })
    .setTimestamp();
  
  message.reply({ embeds: [embed] });
}

// ============================================
// POST DAILY UPDATE
// ============================================
async function postDailyUpdate(client) {
  const data = getTodaysLocation();
  
  const embed = new EmbedBuilder()
    .setTitle(`🔫 GUN VAN - ${data.date}`)
    .setDescription(`*"I know a guy..."*`)
    .setColor(0x2F3136)
    .addFields(
      { name: '📍 Location', value: data.location.name, inline: true },
      { name: '🗺️ Region', value: data.location.region, inline: true },
      { name: '📝 Details', value: data.location.description, inline: false },
      { name: '⭐ Featured Item', value: `${data.featuredItem.name}`, inline: true },
      { name: '💰 Price', value: data.featuredItem.price, inline: true },
      { name: '🏷️ Discount', value: data.featuredItem.discount, inline: true }
    )
    .setFooter({ text: 'Resets daily at 6 AM UTC' })
    .setTimestamp();
  
  // Post to all configured gun-van channels
  try {
    const configs = await client.db.query('SELECT * FROM server_config WHERE setup_complete = true');
    
    for (const config of configs.rows) {
      const channelId = config.log_channels['gun-van'];
      if (!channelId) continue;
      
      const guild = client.guilds.cache.get(config.guild_id);
      if (!guild) continue;
      
      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;
      
      // Delete previous day's message (keep channel clean)
      try {
        const messages = await channel.messages.fetch({ limit: 5 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        for (const [id, msg] of botMessages) {
          await msg.delete().catch(() => {});
        }
      } catch (e) {}
      
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error posting Gun Van update:', error);
  }
}

// ============================================
// START SCHEDULE
// ============================================
function startSchedule(client) {
  // Post at 6 AM UTC daily
  cron.schedule('0 6 * * *', () => {
    console.log('Posting daily Gun Van update...');
    postDailyUpdate(client);
  }, {
    timezone: 'UTC'
  });
  
  console.log('Gun Van schedule started (6 AM UTC daily)');
  
  // Also post immediately on startup
  setTimeout(() => postDailyUpdate(client), 5000);
}

module.exports = {
  getLocation,
  postDailyUpdate,
  startSchedule
};
