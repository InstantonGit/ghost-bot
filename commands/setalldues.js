const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setalldues')
        .setDescription('Assign a due to all users in the guild')
        .addStringOption(option => option.setName('duename').setDescription('Name of the due').setRequired(true))
        .addIntegerOption(option => option.setName('dueamount').setDescription('Amount due').setRequired(true)),

    async execute(interaction) {
        const modRole = interaction.client.config.modRole; // Get modRole from the config
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const dueName = interaction.options.getString('duename');
        const dueAmount = interaction.options.getInteger('dueamount');

        try {
            // Fetch all profiles from MongoDB
            const profiles = await Profile.find();
            let affectedUsers = 0;

            // Loop through each profile and assign the due
            for (const profile of profiles) {
                // Skip users with roles in the ignoreRoles array
                const member = await interaction.guild.members.fetch(profile.userId).catch(() => null);
                if (!member) continue; // Skip if user is not in guild

                const ignoreRoles = profile.ignoreRoles || [];
                const hasIgnoredRole = member.roles.cache.some(role => ignoreRoles.includes(role.id));
                if (hasIgnoredRole) continue; // Skip if the user has an ignored role

                if (!profile.dues) {
                    profile.dues = []; // If no dues exist, initialize them
                }

                // Add the new due to the user's dues array
                profile.dues.push({ name: dueName, amount: dueAmount, status: '❌' });
                await profile.save(); // Save the updated profile
                affectedUsers++;
            }

            return interaction.reply({ content: `Due **${dueName}** of **${dueAmount}** assigned to **${affectedUsers}** users.`, ephemeral: false });

        } catch (error) {
            console.error("Error assigning dues:", error);
            return interaction.reply({ content: 'There was an error assigning the due. Please try again later.', ephemeral: true });
        }
    }
};
