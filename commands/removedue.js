const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removedue')
        .setDescription('Remove a due from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove due from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duename')
                .setDescription('The name of the due to remove')
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
            const dueIndex = userProfile.dues.findIndex(d => d.name.toLowerCase() === dueName.toLowerCase());
            if (dueIndex === -1) {
                return interaction.reply({ content: `No due found with the name "${dueName}" for this user.`, ephemeral: true });
            }

            // Remove the due from the array
            userProfile.dues.splice(dueIndex, 1);

            // Save the updated profile to MongoDB
            await userProfile.save();

            // Confirmation embed
            const embed = new EmbedBuilder()
                .setTitle('Due Removed')
                .setColor(0xFF0000)
                .setDescription(`**${dueName}** has been removed from ${user.username}'s dues.`);

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error removing due:', error);
            return interaction.reply({ content: 'There was an error removing the due. Please try again later.', ephemeral: true });
        }
    },
};
