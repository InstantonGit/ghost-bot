const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dues')
        .setDescription('Displays all users and their dues'),

    async execute(interaction) {
        const modRole = interaction.client.config.modRole; // Get modRole from the config
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        try {
            // Fetch all profiles from MongoDB
            const profiles = await Profile.find();
            if (!profiles || profiles.length === 0) {
                return interaction.reply({ content: "No dues have been assigned yet.", ephemeral: true });
            }

            let duesList = [];

            // Loop through each user's profile to find dues
            for (const profile of profiles) {
                // Skip users with roles in ignoreRoles
                const member = await interaction.guild.members.fetch(profile.userId).catch(() => null);
                if (!member) continue; // Skip if user is not in guild

                const ignoreRoles = profile.ignoreRoles || [];
                const hasIgnoredRole = member.roles.cache.some(role => ignoreRoles.includes(role.id));
                if (hasIgnoredRole) continue; // Skip if the member has an ignored role

                // Format dues
                const displayName = member.nickname || member.user.username; // Use nickname if available, otherwise username
                let duesText = profile.dues.map(due => 
                    `**${due.name}**: ${due.amount} | ${due.status}`
                ).join("\n");

                duesList.push(`**${displayName}**\n${duesText}`);
            }

            if (duesList.length === 0) {
                return interaction.reply({ content: "No dues have been assigned yet.", ephemeral: true });
            }

            // Embed to display dues
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('All Users Dues')
                .setDescription(duesList.join("\n\n"))
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Error fetching dues:", error);
            return interaction.reply({ content: 'There was an error retrieving the dues. Please try again later.', ephemeral: true });
        }
    }
};
