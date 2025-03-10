const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('completedue')
        .setDescription('Mark a due as complete for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to update the due for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duename')
                .setDescription('The name of the due to mark as complete')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check if the user has the required modRole
        const modRole = interaction.client.config.modRole; // Get modRole from the config
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const dueName = interaction.options.getString('duename');

        try {
            // Find the user's profile in the database
            let userProfile = await Profile.findOne({ userId: user.id });
            if (!userProfile) {
                return interaction.reply({ content: 'This user does not have a profile.', ephemeral: true });
            }

            // Find the due in the user's profile
            const due = userProfile.dues.find(d => d.name === dueName);
            if (!due) {
                return interaction.reply({ content: `No due found with the name "${dueName}".`, ephemeral: true });
            }

            // Mark the due as complete
            due.status = '✅';

            // Save the updated profile to MongoDB
            await userProfile.save();

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setTitle('Due Completed')
                .setColor(0x00FF00)
                .setDescription(`**${dueName}** for ${user.username} has been marked as ✅ complete.`);

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error marking due as complete:', error);
            return interaction.reply({ content: 'There was an error marking the due as complete. Please try again later.', ephemeral: true });
        }
    },
};
