const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/config.json');

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
        // Load config.json to get modRole
        if (!fs.existsSync(configPath)) {
            return interaction.reply({ content: 'Configuration file not found.', ephemeral: true });
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const modRoleId = config.modRole; // Ensure modRole is set in config.json

        // Check if user has the modRole
        if (!interaction.member.roles.cache.has(modRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');

        try {
            // Retrieve the profile from MongoDB
            let profile = await Profile.findOne({ userId: user.id });

            if (!profile) {
                // If no profile is found, create a new one with default values
                profile = new Profile({ userId: user.id, strikes: 0, dues: [] });
                await profile.save();
            }

            const strikes = profile.strikes;
            const dues = profile.dues || [];

            // Get user information
            const member = interaction.guild.members.cache.get(user.id);
            const serverNickname = member ? member.nickname || member.user.username : 'No nickname set';
            const highestRole = member ? member.roles.highest.name : 'No roles';
            const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

            // Set embed color based on strikes
            let embedColor = 0x00FF00; // Green (default)
            if (strikes === 1) embedColor = 0xFFA500; // Orange (warning)
            if (strikes >= 2) embedColor = 0xFF0000; // Red (danger)

            // Format dues list
            const duesList = dues.length > 0
                ? dues.map(d => `• **${d.name}:** ${d.amount} ${d.status}`).join('\n')
                : 'No dues recorded.';

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`${user.username}'s Profile`)
                .setThumbnail(avatarURL)
                .setDescription('User server profile details')
                .addFields(
                    { name: '💠 Server Nickname', value: `\`${serverNickname}\``, inline: true },
                    { name: '🔰 Highest Role', value: `\`${highestRole}\``, inline: true },
                    { name: '⚠️ Strikes', value: `\`${strikes}\``, inline: true },
                    { name: '📜 Dues', value: duesList }
                )
                .setFooter({ text: 'Monitor users responsibly.', iconURL: avatarURL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error retrieving profile:', error);
            await interaction.reply({ content: 'There was an error while fetching the profile. Please try again later.', ephemeral: true });
        }
    }
};
