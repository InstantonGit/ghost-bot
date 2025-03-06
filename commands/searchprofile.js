const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, '../data/profiles.json'); // Path to your profiles.json

module.exports = {
    data: new SlashCommandBuilder()
        .setName('searchprofile')
        .setDescription('Search and view a user\'s profile')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to search for')
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getUser('user').id;
        let profiles = {};

        if (fs.existsSync(profilePath)) {
            profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        } else {
            profiles = {};
        }

        const profile = profiles[userId] || { strikes: 0 };
        const serverNickname = interaction.guild.members.cache.get(userId)?.nickname || 'No nickname set';
        const highestRole = interaction.guild.members.cache.get(userId)?.roles.highest.name || 'No roles';

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.options.getUser('user').tag}'s Profile`)
            .setColor(0x00FF00)
            .addFields(
                { name: 'Server Nickname', value: serverNickname, inline: true },
                { name: 'Highest Role', value: highestRole, inline: true },
                { name: 'Strikes', value: `${profile.strikes}`, inline: true }
            );

        // Reply with the embed if not already replied
        if (!interaction.replied) {
            return interaction.reply({ embeds: [embed] });
        }
    },
};
