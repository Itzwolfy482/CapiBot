// deploy-commands.js — enregistre les slash commands auprès de Discord

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  commands.push(cmd.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  console.log(`Déploiement de ${commands.length} commandes...`);
  await rest.put(
    // Pour le dev : déploiement guild-only (instantané)
    // En prod, remplacer par Routes.applicationCommands(process.env.CLIENT_ID)
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('✅ Commandes déployées.');
})();
