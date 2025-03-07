require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required to fetch all members
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Load all command files
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// Deploy slash commands to Discord
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('Slash commands registered.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }

    // Initialize profiles on startup
    const guild = client.guilds.cache.first(); // Assumes bot is in one server
    if (guild) {
        await initializeProfiles(guild);
    }
});

// Path for profiles.json
const profilesPath = path.join(__dirname, 'data/profiles.json');

// Function to initialize profiles for all members
async function initializeProfiles() {
    console.log('🔍 Initializing user profiles...');

    // Ensure profiles.json exists and is valid
    if (!fs.existsSync(profilesPath)) {
        fs.writeFileSync(profilesPath, JSON.stringify({}, null, 2));
    }

    let profiles;
    try {
        const rawData = fs.readFileSync(profilesPath, 'utf-8');
        profiles = rawData.trim() ? JSON.parse(rawData) : {};
    } catch (error) {
        console.error('❌ Error reading profiles.json:', error);
        profiles = {};
    }

    let newProfilesAdded = 0;

    // Create an array of promises for fetching members from all guilds
    const fetchMemberPromises = client.guilds.cache.map(async (guild) => {
        try {
            // Force fetch all members, including offline ones
            const members = await guild.members.fetch({ force: true });

            console.log(`✅ Fetching members from guild: ${guild.name} (${members.size} members)`);

            // Loop through each member and add a profile if not a bot and doesn't exist
            members.forEach(member => {
                if (!member.user.bot && !profiles[member.id]) {
                    profiles[member.id] = { strikes: 0, dues: [] };
                    newProfilesAdded++;
                    console.log(`➕ Added profile for: ${member.user.tag} (${member.id})`);
                }
            });
        } catch (error) {
            console.error(`❌ Error fetching members for guild: ${guild.name}`, error);
        }
    });

    // Wait for all promises to resolve
    await Promise.all(fetchMemberPromises);

    // If any profiles were added, update profiles.json
    if (newProfilesAdded > 0) {
        fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
        console.log(`✅ Initialized ${newProfilesAdded} new profiles.`);
    } else {
        console.log('✅ No new profiles needed.');
    }
}

// Handle user interactions with commands and logs
const logsPath = path.join(__dirname, 'data/logs.json');
let logsData = {};

// Load existing logs data if file exists
if (fs.existsSync(logsPath)) {
    logsData = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Log the command execution if logChannel is set for this server
    if (logsData[interaction.guild.id] && logsData[interaction.guild.id].logChannel) {
        logCommand(interaction, logsData[interaction.guild.id].logChannel);
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
        }
    }
});

// Function to log command execution as an embed
function logCommand(interaction, logChannelID) {
    const user = interaction.user.tag;
    const commandName = interaction.commandName;
    const targetUser = interaction.options.getUser('user')?.tag || 'N/A';

    const logEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Command Executed')
        .addFields(
            { name: 'Command User', value: user, inline: true },
            { name: 'Command Used', value: `/${commandName}`, inline: true },
            { name: 'Target User', value: targetUser, inline: true },
            { name: 'Channel', value: interaction.channel.name, inline: true },
            { name: 'Date', value: new Date().toLocaleString(), inline: true }
        );

    const logChannel = interaction.guild.channels.cache.get(logChannelID);
    if (logChannel) {
        logChannel.send({ embeds: [logEmbed] })
            .catch(error => console.error('Error sending log embed:', error));
    }

    const logMessage = `${new Date().toLocaleString()} - Command: /${commandName} | Author: ${user} | Target: ${targetUser} | Channel: ${interaction.channel.name}\n`;
    fs.appendFile('command_logs.txt', logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        } else {
            console.log('Command logged.');
        }
    });
}

// Log in the bot using the token from the .env file
client.login(process.env.TOKEN);
