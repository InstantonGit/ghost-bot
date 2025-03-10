require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Required to fetch all members
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('Error connecting to MongoDB:', error);
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

// Refactor initializeProfiles to use MongoDB
const Profile = require('./models/Profile');

async function initializeProfiles() {
    console.log('🔍 Initializing user profiles...');

    let newProfilesAdded = 0;

    // Create an array of promises for fetching members from all guilds
    const fetchMemberPromises = client.guilds.cache.map(async (guild) => {
        try {
            // Force fetch all members, including offline ones
            const members = await guild.members.fetch({ force: true });

            console.log(`✅ Fetching members from guild: ${guild.name} (${members.size} members)`);

            // Loop through each member and add a profile if not a bot and doesn't exist in MongoDB
            for (const member of members.values()) {
                if (!member.user.bot) {
                    const profile = await Profile.findOne({ userId: member.id });

                    if (!profile) {
                        // If profile does not exist, create a new one
                        const newProfile = new Profile({
                            userId: member.id,
                            strikes: 0,
                            dues: []
                        });

                        await newProfile.save();
                        newProfilesAdded++;
                        console.log(`➕ Added profile for: ${member.user.tag} (${member.id})`);
                    }
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching members for guild: ${guild.name}`, error);
        }
    });

    // Wait for all promises to resolve
    await Promise.all(fetchMemberPromises);

    // If any profiles were added, log it
    if (newProfilesAdded > 0) {
        console.log(`✅ Initialized ${newProfilesAdded} new profiles.`);
    } else {
        console.log('✅ No new profiles needed.');
    }
}

// Command handling and interaction handling here...

// Log in the bot using the token from the .env file
client.login(process.env.TOKEN);
