const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ignorerole')
        .setDescription('Add a role to the ignore list for dues.')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Role to ignore')
                .setRequired(true)
        ),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const member = interaction.guild.members.cache.get(interaction.user.id);

        // Ensure the member has the mod role
        const modRole = interaction.client.config.modRole;
        if (!member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        try {
            // Find profile and update ignoreRoles
            let profile = await Profile.findOne({ userId: interaction.user.id });

            if (!profile) {
                profile = new Profile({ userId: interaction.user.id });
            }

            if (!profile.ignoreRoles.includes(role.id)) {
                profile.ignoreRoles.push(role.id);
                await profile.save();
                return interaction.reply({ content: `Successfully added the role ${role.name} to the ignore list for dues.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `The role ${role.name} is already in the ignore list.`, ephemeral: true });
            }
        } catch (error) {
            console.error("Error adding role to ignore list:", error);
            return interaction.reply({ content: 'There was an error processing your request. Please try again later.', ephemeral: true });
        }
    }
};
