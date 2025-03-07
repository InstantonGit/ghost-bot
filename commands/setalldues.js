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
        .setName('setalldues')
        .setDescription('Assign a due to all users in the guild')
        .addStringOption(option => option.setName('duename').setDescription('Name of the due').setRequired(true))
        .addIntegerOption(option => option.setName('dueamount').setDescription('Amount due').setRequired(true)),

    async execute(interaction) {
        const modRole = config.modRole;
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const dueName = interaction.options.getString('duename');
        const dueAmount = interaction.options.getInteger('dueamount');

        let profiles = getProfiles();
        let affectedUsers = 0;

        // Loop through all stored profiles and assign the due
        Object.keys(profiles).forEach(userId => {
            if (!profiles[userId].dues) {
                profiles[userId].dues = [];
            }
            profiles[userId].dues.push({ name: dueName, amount: dueAmount, status: '❌' });
            affectedUsers++;
        });

        saveProfiles(profiles);

        return interaction.reply({ content: `Due **${dueName}** of **${dueAmount}** assigned to **${affectedUsers}** users.`, ephemeral: false });
    }
};
