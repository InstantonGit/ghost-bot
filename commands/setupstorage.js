const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Storage = require('../models/storage'); // Import the MongoDB Storage model
const Config = require('../models/config'); // Import global config model (for modRole)

// Manually define your color library
const colorLibrary = {
    RED: 0xFF0000,
    BLUE: 0x0000FF,
    GREEN: 0x00FF00,
    YELLOW: 0xFFFF00,
    ORANGE: 0xFFA500,
    PURPLE: 0x800080,
    PINK: 0xFFC0CB,
    CYAN: 0x00FFFF,
    WHITE: 0xFFFFFF,
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupstorage')
        .setDescription('Set up a storage system with categories')
        .addStringOption(option => 
            option.setName('storage_name')
                .setDescription('Name of the storage')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('color')
                .setDescription('Color of the storage embed (e.g., RED, #FF5733)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('category_names')
                .setDescription('Comma-separated list of category names (e.g., Category 1, Category 2)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('category_emojis')
                .setDescription('Comma-separated list of emojis for categories (e.g., 🍎, 🍌)')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('modifyrole')
                .setDescription('Role that can modify the storage')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel where the storage embed will be sent')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const storageName = interaction.options.getString('storage_name');
        const color = interaction.options.getString('color').toUpperCase();
        const categoryNames = interaction.options.getString('category_names').split(',').map(name => name.trim());
        const categoryEmojis = interaction.options.getString('category_emojis').split(',').map(emoji => emoji.trim());
        const modifyRole = interaction.options.getRole('modifyrole');
        const channel = interaction.options.getChannel('channel');

        // Get modRole from the database
        const config = await Config.findOne();
        if (!config || !config.modRole) {
            return interaction.editReply({ content: 'Bot configuration is missing. Please set the modRole first.' });
        }
        const modRoleId = config.modRole;

        // Check if the user has the modRole
        if (!interaction.member.roles.cache.has(modRoleId)) {
            return interaction.editReply({ content: 'You do not have the required mod role to use this command.' });
        }

        // Validate color input
        if (!colorLibrary[color] && !/^#[0-9A-F]{6}$/i.test(color)) {
            return interaction.editReply({ content: 'Invalid color. Please choose a valid color name or hex code.' });
        }
        const storageColor = colorLibrary[color] || color;

        if (categoryNames.length !== categoryEmojis.length) {
            return interaction.editReply({ content: 'The number of category names must match the number of category emojis.' });
        }

        // Create and save storage in MongoDB
        try {
            const newStorage = new Storage({
                name: storageName,
                color: storageColor,
                categories: categoryNames.map((name, index) => ({
                    name,
                    emoji: categoryEmojis[index],
                    count: 0
                })),
                channelId: channel.id,
                modifyRole: modifyRole.id
            });

            await newStorage.save();
        } catch (error) {
            console.error('Error saving storage:', error);
            return interaction.editReply({ content: 'An error occurred while saving the storage. Please try again.' });
        }

        // Create the storage embed
        const embed = new EmbedBuilder()
            .setTitle(storageName)
            .setDescription('Manage categories in this storage.')
            .setColor(storageColor);

        categoryNames.forEach((name, index) => {
            embed.addFields({
                name: `${categoryEmojis[index]} ${name}`,
                value: `0 items`,
                inline: true
            });
        });

        await channel.send({ embeds: [embed] });

        return interaction.editReply({ content: `Storage "${storageName}" has been set up successfully!` });
    }
};
