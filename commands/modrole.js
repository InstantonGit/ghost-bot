const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Config = require('../models/config'); // Import the Config model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modrole')
        .setDescription('Sets the moderator role that can use restricted commands.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to set as moderator.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Only administrators can set the mod role

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        
        try {
            // Fetch the global config from MongoDB
            const config = await Config.findOne();
            if (!config) {
                return interaction.reply({ content: 'Bot configuration is missing. Please initialize the bot configuration first.', ephemeral: true });
            }

            // Update the modRole in the database
            config.modRole = role.id;
            await config.save(); // Save changes to MongoDB

            // Send confirmation message
            await interaction.reply({ content: `Moderator role has been set to ${role.name}.`, ephemeral: true });
        } catch (error) {
            console.error('Error updating mod role:', error);
            return interaction.reply({ content: 'An error occurred while updating the moderator role. Please try again.', ephemeral: true });
        }
    }
};
