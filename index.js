const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content === '!ping') {
    message.reply('Pong!');
  }
  
  if (message.content.startsWith('!floor ')) {
    const collection = message.content.slice(7);
    if (!collection) {
      message.reply('Please specify a collection name. Usage: !floor <collection>');
      return;
    }
    
    message.reply(`Getting floor price for ${collection}... (not implemented yet)`);
  }
  
  if (message.content === '!help') {
    message.reply('Available commands:\n!ping - Test bot\n!floor <collection> - Get floor price\n!help - Show this message');
  }
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);

process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  client.destroy();
  process.exit(0);
});