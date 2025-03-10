const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

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

        try {
            // Find the user's profile in MongoDB
            let profile = await Profile.findOne({ userId });

            // If no profile is found, inform the user
            if (!profile) {
                return interaction.reply({ content: 'This user does not have a profile.', ephemeral: true });
            }

            // If the user has strikes, remove one
            if (profile.strikes > 0) {
                profile.strikes -= 1;
                await profile.save();
            }

            const strikes = profile.strikes;

            // Respond with the updated strike count
            await interaction.reply({ content: `${interaction.options.getUser('user').tag} now has ${strikes} strikes.` });
        } catch (error) {
            console.error('Error removing strike:', error);
            await interaction.reply({ content: 'An error occurred while processing the command. Please try again later.', ephemeral: true });
        }
    }
};
