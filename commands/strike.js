const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strike')
        .setDescription('Give a user a strike')
        .addUserOption(option => option.setName('user').setDescription('User to strike').setRequired(true)),

    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getUser('user').id;

        try {
            // Find the user's profile in MongoDB
            let profile = await Profile.findOne({ userId });

            // If the profile doesn't exist, create a new one
            if (!profile) {
                profile = new Profile({ userId, strikes: 0 });
            }

            // Add a strike
            profile.strikes += 1;

            // Save the updated profile
            await profile.save();

            const strikes = profile.strikes;

            // Check if the user has reached 3 strikes
            if (strikes >= 3) {
                // Kick the user if they have 3 strikes
                const member = interaction.guild.members.cache.get(userId);
                if (member) {
                    await member.kick('Kicked due to 3 strikes');
                }

                // Send an embed to the channel
                const channel = interaction.guild.channels.cache.get('1343670361434357831');
                if (channel) {
                    channel.send(`<@${userId}> has been kicked due to 3 strikes, bleed out immediately.`);
                }
            }

            await interaction.reply({ content: `${interaction.options.getUser('user').tag} has been struck! They now have ${strikes} strikes.` });
        } catch (error) {
            console.error('Error processing strike command:', error);
            await interaction.reply({ content: 'An error occurred while processing the strike. Please try again later.', ephemeral: true });
        }
    }
};
