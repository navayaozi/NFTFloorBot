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
  
  // TODO: Add NFT floor price commands
});

client.login(process.env.DISCORD_TOKEN).catch(console.error);

process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  client.destroy();
  process.exit(0);
});