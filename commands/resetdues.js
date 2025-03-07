const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/config.json');

const profilesPath = path.join(__dirname, '../data/profiles.json');

// Function to read profiles
function getProfiles() {
    if (!fs.existsSync(profilesPath)) return {};
    return JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
}

// Function to save profiles
function saveProfiles(profiles) {
    fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetdues')
        .setDescription('Removes all dues from all users in the guild'),

    async execute(interaction) {
        const modRole = config.modRole;
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        let profiles = getProfiles();
        let affectedUsers = 0;

        // Loop through all stored profiles and remove dues
        Object.keys(profiles).forEach(userId => {
            if (profiles[userId].dues && profiles[userId].dues.length > 0) {
                delete profiles[userId].dues;
                affectedUsers++;
            }
        });

        saveProfiles(profiles);

        return interaction.reply({ content: `✅ All dues have been cleared for **${affectedUsers}** users.`, ephemeral: false });
    }
};
