const { SlashCommandBuilder } = require('@discordjs/builders');
const Config = require('../models/config'); // Import the Config model

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
        const serverID = interaction.guild.id;

        // Fetch the global config from MongoDB
        const config = await Config.findOne();
        if (!config || !config.modRole) {
            return interaction.reply({ content: 'Bot configuration is missing. Please set the modRole first.', ephemeral: true });
        }
        const modRoleId = config.modRole;

        // Check if the user has the modRole
        if (!interaction.member.roles.cache.has(modRoleId)) {
            return interaction.reply({ content: 'You do not have the correct role to set the log channel.', ephemeral: true });
        }

        // Update or create the log channel entry in MongoDB
        try {
            await Config.findOneAndUpdate(
                {}, // Find the existing config
                { $set: { logChannel: channel.id } }, // Update or set logChannel
                { upsert: true, new: true }
            );

            await interaction.reply({ content: `Log channel has been set to <#${channel.id}> for this server.`, ephemeral: true });
        } catch (error) {
            console.error('Error updating log channel:', error);
            return interaction.reply({ content: 'An error occurred while saving the log channel. Please try again.', ephemeral: true });
        }
    },
};
