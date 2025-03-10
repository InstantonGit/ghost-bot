const { SlashCommandBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remignorerole')
        .setDescription('Remove a role from the ignore list for dues.')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Role to remove from ignore list')
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
                return interaction.reply({ content: 'You do not have a profile to remove roles from.', ephemeral: true });
            }

            const roleIndex = profile.ignoreRoles.indexOf(role.id);
            if (roleIndex !== -1) {
                profile.ignoreRoles.splice(roleIndex, 1);
                await profile.save();
                return interaction.reply({ content: `Successfully removed the role ${role.name} from the ignore list.`, ephemeral: true });
            } else {
                return interaction.reply({ content: `The role ${role.name} is not in the ignore list.`, ephemeral: true });
            }
        } catch (error) {
            console.error("Error removing role from ignore list:", error);
            return interaction.reply({ content: 'There was an error processing your request. Please try again later.', ephemeral: true });
        }
    }
};
