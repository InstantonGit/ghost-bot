const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetdues')
        .setDescription('Removes all dues from all users in the guild'),

    async execute(interaction) {
        const modRole = interaction.client.config.modRole; // Get modRole from the config
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        try {
            // Fetch all profiles from MongoDB
            const profiles = await Profile.find();
            let affectedUsers = 0;

            // Loop through all profiles and clear dues
            for (const profile of profiles) {
                if (profile.dues && profile.dues.length > 0) {
                    profile.dues = []; // Clear all dues
                    await profile.save(); // Save the updated profile
                    affectedUsers++;
                }
            }

            return interaction.reply({ content: `✅ All dues have been cleared for **${affectedUsers}** users.`, ephemeral: false });

        } catch (error) {
            console.error("Error clearing dues:", error);
            return interaction.reply({ content: 'There was an error clearing the dues. Please try again later.', ephemeral: true });
        }
    }
};
