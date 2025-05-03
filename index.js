const { Client, GatewayIntentBits } = require('discord.js');
const OpenSeaAPI = require('./opensea');
const CollectionTracker = require('./tracker');
require('dotenv').config();

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

const openSea = new OpenSeaAPI(process.env.OPENSEA_API_KEY);
const tracker = new CollectionTracker();

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
  
  // Start price monitoring
  setInterval(checkPrices, 5 * 60 * 1000); // Check every 5 minutes
});

async function checkPrices() {
  const allTracked = tracker.getAllTracked();
  
  for (const channelId in allTracked) {
    const collections = allTracked[channelId];
    
    for (const collection in collections) {
      try {
        const priceData = await openSea.getFloorPrice(collection);
        if (!priceData || !priceData.floorPrice) continue;
        
        const oldPrice = tracker.updatePrice(channelId, collection, priceData.floorPrice);
        
        if (oldPrice && tracker.shouldNotify(channelId, collection, priceData.floorPrice, oldPrice)) {
          const change = ((priceData.floorPrice - oldPrice) / oldPrice) * 100;
          const emoji = change > 0 ? '📈' : '📉';
          const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
          
          const channel = client.channels.cache.get(channelId);
          if (channel) {
            channel.send(`${emoji} **${collection}** floor price changed!\n` +
                        `Old: ${oldPrice.toFixed(3)} ETH\n` +
                        `New: ${priceData.floorPrice.toFixed(3)} ETH\n` +
                        `Change: ${changeText}`);
          }
        }
      } catch (error) {
        console.error(`Error checking price for ${collection}:`, error);
      }
    }
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
  
  if (message.content.startsWith('!floor ')) {
    const collection = message.content.slice(7).trim();
    if (!collection) {
      message.reply('Please specify a collection name. Usage: !floor <collection>');
      return;
    }
    
    message.reply('🔍 Fetching floor price...');
    
    try {
      const priceData = await openSea.getFloorPrice(collection);
      const formattedData = openSea.formatPriceData(priceData);
      message.channel.send(formattedData);
    } catch (error) {
      console.error('Error fetching floor price:', error);
      message.reply('❌ Error fetching floor price. Please try again later.');
    }
  }
  
  if (message.content.startsWith('!track ')) {
    const args = message.content.slice(7).trim().split(' ');
    const collection = args[0];
    const threshold = args[1] ? parseFloat(args[1]) : null;
    
    if (!collection) {
      message.reply('Please specify a collection. Usage: !track <collection> [threshold%]');
      return;
    }
    
    tracker.addCollection(message.channel.id, collection, threshold);
    const thresholdText = threshold ? ` with ${threshold}% change threshold` : '';
    message.reply(`✅ Now tracking **${collection}**${thresholdText}`);
  }
  
  if (message.content.startsWith('!untrack ')) {
    const collection = message.content.slice(9).trim();
    if (!collection) {
      message.reply('Please specify a collection. Usage: !untrack <collection>');
      return;
    }
    
    const removed = tracker.removeCollection(message.channel.id, collection);
    if (removed) {
      message.reply(`❌ Stopped tracking **${collection}**`);
    } else {
      message.reply(`Collection **${collection}** was not being tracked`);
    }
  }
  
  if (message.content === '!tracked') {
    const tracked = tracker.getTrackedCollections(message.channel.id);
    const collections = Object.keys(tracked);
    
    if (collections.length === 0) {
      message.reply('No collections are being tracked in this channel');
      return;
    }
    
    let response = '**Tracked Collections:**\n';
    collections.forEach(collection => {
      const data = tracked[collection];
      const thresholdText = data.threshold ? ` (${data.threshold}% threshold)` : '';
      const priceText = data.lastPrice ? ` - Last: ${data.lastPrice} ETH` : '';
      response += `• ${collection}${thresholdText}${priceText}\n`;
    });
    
    message.reply(response);
  }

  if (message.content === '!help') {
    message.reply('Available commands:\n' +
                  '!ping - Test bot\n' +
                  '!floor <collection> - Get floor price\n' +
                  '!track <collection> [threshold%] - Track collection\n' +
                  '!untrack <collection> - Stop tracking\n' +
                  '!tracked - Show tracked collections\n' +
                  '!help - Show this message');
  }
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);

process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  client.destroy();
  process.exit(0);
});