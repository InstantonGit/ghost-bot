const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load the config.json to get the modRole
const configPath = path.join(__dirname, '../data/config.json');
let config = {};
if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears a specified number of messages from the channel.')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        ),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        // Check if the bot has permission to manage messages
        if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: 'I do not have permission to manage messages in this channel.', ephemeral: true });
        }

        // Check if the user has the modRole
        if (!interaction.member.roles.cache.has(config.modRole)) {
            return interaction.reply({ content: 'You do not have the required modRole to use this command.', ephemeral: true });
        }

        // Delete the messages
        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            await interaction.channel.bulkDelete(messages, true);  // Bulk delete messages, using 'true' to remove them even if they're older than 14 days
            await interaction.reply({ content: `Successfully deleted ${amount} message(s).`, ephemeral: true });
        } catch (error) {
            console.error('Error deleting messages:', error);
            await interaction.reply({ content: 'There was an error while trying to delete messages.', ephemeral: true });
        }
    },
};
