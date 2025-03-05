const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addstorage')
        .setDescription('Modify storage category count')
        .addStringOption(option => 
            option.setName('storage_name')
                .setDescription('Name of the storage')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('category_name')
                .setDescription('Category to modify')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Amount to add or subtract')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('operation')
                .setDescription('Choose add or subtract')
                .setRequired(true)
                .addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Subtract', value: 'subtract' }
                )),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const storageName = interaction.options.getString('storage_name');
        const categoryName = interaction.options.getString('category_name');
        const amount = interaction.options.getInteger('amount');
        const operation = interaction.options.getString('operation');

        let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const storage = config.storages.find(s => s.name.toLowerCase() === storageName.toLowerCase());

        if (!storage) {
            return interaction.editReply({ content: `Storage "${storageName}" not found.` });
        }

        // Check if the user has the correct modifyRole for this storage
        const memberRoles = interaction.member.roles.cache;
        if (!memberRoles.has(storage.modifyRole)) {
            return interaction.editReply({ content: `You do not have the required permissions to modify this storage.` });
        }

        const category = storage.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!category) {
            return interaction.editReply({ content: `Category "${categoryName}" not found in "${storageName}".` });
        }

        // Update category count
        if (operation === 'add') {
            category.count += amount;
        } else {
            category.count = Math.max(0, category.count - amount);
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        // Fetch the channel and update the embed
        const channel = interaction.client.channels.cache.get(storage.channelId);
        if (!channel) {
            return interaction.editReply({ content: `Could not find storage channel.` });
        }

        const messages = await channel.messages.fetch({ limit: 10 });
        const storageMessage = messages.find(msg => msg.embeds.length > 0 && msg.embeds[0].title === storage.name);

        if (!storageMessage) {
            return interaction.editReply({ content: `Storage embed not found in channel.` });
        }

        // Create updated embed
        const updatedEmbed = new EmbedBuilder()
            .setTitle(storage.name)
            .setDescription('Manage categories in this storage.')
            .setColor(storage.color);

        storage.categories.forEach(cat => {
            updatedEmbed.addFields({ name: `${cat.emoji} ${cat.name}`, value: `${cat.count} items`, inline: true });
        });

        await storageMessage.edit({ embeds: [updatedEmbed] });

        return interaction.editReply({ content: `Updated ${categoryName} in ${storageName}. New count: ${category.count}` });
    }
};
