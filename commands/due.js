const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('due')
        .setDescription('Assign a due to a user')
        .addUserOption(option => option.setName('user').setDescription('User to assign the due to').setRequired(true))
        .addStringOption(option => option.setName('duename').setDescription('Name of the due').setRequired(true))
        .addIntegerOption(option => option.setName('dueamount').setDescription('Amount due').setRequired(true)),

    async execute(interaction) {
        const modRole = interaction.client.config.modRole; // Get modRole from MongoDB config
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const dueName = interaction.options.getString('duename');
        const dueAmount = interaction.options.getInteger('dueamount');

        try {
            // Find or create the user's profile in the database
            let userProfile = await Profile.findOne({ userId: user.id });
            if (!userProfile) {
                userProfile = new Profile({
                    userId: user.id,
                    strikes: 0,
                    dues: [],
                });
            }

            // Add the new due to the user's profile
            userProfile.dues.push({ name: dueName, amount: dueAmount, status: '❌' });
            await userProfile.save(); // Save the updated profile to MongoDB

            return interaction.reply({ content: `Due **${dueName}** of **${dueAmount}** assigned to ${user.tag}.`, ephemeral: false });
        } catch (error) {
            console.error('Error assigning due:', error);
            return interaction.reply({ content: 'There was an error assigning the due. Please try again later.', ephemeral: true });
        }
    }
};
