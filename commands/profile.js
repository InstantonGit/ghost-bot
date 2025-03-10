const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Profile = require('../models/profile'); // Import the Profile model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile with server nickname, highest role, strikes, and dues'),

    async execute(interaction) {
        const userId = interaction.user.id;

        try {
            // Retrieve profile from MongoDB
            let profile = await Profile.findOne({ userId });

            if (!profile) {
                // If no profile is found, create a new one with default values
                profile = new Profile({ userId, strikes: 0, dues: [] });
                await profile.save();
            }

            const strikes = profile.strikes;
            const dues = profile.dues || [];

            // Get user information
            const member = interaction.guild.members.cache.get(userId);
            const serverNickname = member ? member.nickname || member.user.username : 'No nickname set';
            const highestRole = member ? member.roles.highest.name : 'No roles';
            const avatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });

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
                .setTitle(`${interaction.user.username}'s Profile`)
                .setThumbnail(avatarURL)
                .setDescription('Your server profile details')
                .addFields(
                    { name: '💠 Server Nickname', value: `\`${serverNickname}\``, inline: true },
                    { name: '🔰 Highest Role', value: `\`${highestRole}\``, inline: true },
                    { name: '⚠️ Strikes', value: `\`${strikes}\``, inline: true },
                    { name: '📜 Dues', value: duesList }
                )
                .setFooter({ text: 'Stay on your best behavior!', iconURL: avatarURL })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error retrieving profile:', error);
            await interaction.reply({ content: 'There was an error while fetching your profile. Please try again later.', ephemeral: true });
        }
    }
};
