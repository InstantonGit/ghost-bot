const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile with server nickname, highest role, and strikes'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const profileData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

        const strikes = profileData[userId]?.strikes || 0;

        // Get user nickname and highest role
        const member = interaction.guild.members.cache.get(userId);
        const serverNickname = member ? member.nickname || member.user.username : 'No nickname set';
        const highestRole = member ? member.roles.highest.name : 'No roles';

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.tag}'s Profile`)
            .setDescription('Profile information')
            .addFields(
                { name: 'Server Nickname', value: serverNickname, inline: true },
                { name: 'Highest Role', value: highestRole, inline: true },
                { name: 'Strikes', value: `${strikes}`, inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
