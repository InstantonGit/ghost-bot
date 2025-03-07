const { SlashCommandBuilder } = require('@discordjs/builders');
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
        .setName('logchannel')
        .setDescription('Sets the log channel for this server.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to log command executions in')
                .setRequired(true)
                .addChannelTypes(0) // 0 = Text Channel
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const serverID = interaction.guild.id; // Get the server's ID

        // Check if the user has the modRole
        if (!interaction.member.roles.cache.has(config.modRole)) {
            return interaction.reply({ content: 'You do not have the correct role to set the log channel.', ephemeral: true });
        }

        // Load the existing logs.json file
        const logsPath = path.join(__dirname, '../data/logs.json');
        let logsData = {};

        if (fs.existsSync(logsPath)) {
            logsData = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
        }

        // Update or add the server's log channel
        logsData[serverID] = { logChannel: channel.id };

        // Save the updated data back to the file
        fs.writeFileSync(logsPath, JSON.stringify(logsData, null, 2), 'utf-8');

        await interaction.reply({ content: `Log channel has been set to <#${channel.id}> for this server.`, ephemeral: true });
    },
};
