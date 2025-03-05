const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removestrike')
        .setDescription('Remove a strike from a user')
        .addUserOption(option => option.setName('user').setDescription('User to remove strike from').setRequired(true)),

    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getUser('user').id;

        let profileData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

        if (!profileData[userId]) {
            return interaction.reply({ content: 'This user does not have a profile.' });
        }

        // Remove a strike
        if (profileData[userId].strikes > 0) {
            profileData[userId].strikes -= 1;
        }

        // Write the updated profile back to profiles.json
        fs.writeFileSync(profilesPath, JSON.stringify(profileData, null, 2));

        const strikes = profileData[userId].strikes;

        await interaction.reply({ content: `${interaction.options.getUser('user').tag} now has ${strikes} strikes.` });
    }
};
