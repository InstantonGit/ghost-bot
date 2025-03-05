const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strikeout')
        .setDescription('Immediately give a user 3 strikes')
        .addUserOption(option => option.setName('user').setDescription('User to strike out').setRequired(true)),

    async execute(interaction) {
        // Check if the user has admin permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getUser('user').id;

        let profileData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

        // Ensure the user has a profile entry
        if (!profileData[userId]) {
            profileData[userId] = { strikes: 0 };
        }

        // Set the user's strikes to 3
        profileData[userId].strikes = 3;

        // Write the updated profile back to profiles.json
        fs.writeFileSync(profilesPath, JSON.stringify(profileData, null, 2));

        // Kick the user if they have 3 strikes
        const member = interaction.guild.members.cache.get(userId);
        if (member) {
            await member.kick('Kicked due to 3 strikes');
        }

        // Send an embed to the channel
        const channel = interaction.guild.channels.cache.get('1343670361434357831');
        if (channel) {
            channel.send(`<@${userId}> has been kicked due to 3 strikes, bleed out immediately.`);
        }

        await interaction.reply({ content: `${interaction.options.getUser('user').tag} has been struck out and kicked immediately!` });
    }
};
