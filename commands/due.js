const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
        .setName('due')
        .setDescription('Assign a due to a user')
        .addUserOption(option => option.setName('user').setDescription('User to assign the due to').setRequired(true))
        .addStringOption(option => option.setName('duename').setDescription('Name of the due').setRequired(true))
        .addIntegerOption(option => option.setName('dueamount').setDescription('Amount due').setRequired(true)),

    async execute(interaction) {
        const modRole = config.modRole;
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const dueName = interaction.options.getString('duename');
        const dueAmount = interaction.options.getInteger('dueamount');

        let profiles = getProfiles();
        if (!profiles[user.id]) {
            profiles[user.id] = { strikes: 0, dues: [] };
        }

        profiles[user.id].dues.push({ name: dueName, amount: dueAmount, status: '❌' });
        saveProfiles(profiles);

        return interaction.reply({ content: `Due **${dueName}** of **${dueAmount}** assigned to ${user.tag}.`, ephemeral: false });
    }
};
