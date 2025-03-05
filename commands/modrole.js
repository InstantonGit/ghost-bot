const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../data/config.json');

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
        
        let config = {};
        
        // Check if config.json exists, if not, initialize it
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } else {
            config = { storages: [] }; // Initialize empty config if it doesn't exist
        }

        // Update or set the modRole in the config
        config.modRole = role.id;

        // Ensure storages array exists before saving config
        if (!config.storages) {
            config.storages = [];
        }

        // Write the updated config back to the config.json file
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        // Send confirmation message
        await interaction.reply({ content: `Moderator role set to ${role.name}.`, ephemeral: true });
    }
};
