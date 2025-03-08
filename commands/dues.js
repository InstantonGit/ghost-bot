const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/config.json'); // Load modRole from config.json

const profilesPath = path.join(__dirname, '../data/profiles.json');

// Function to read profiles
function getProfiles() {
    if (!fs.existsSync(profilesPath)) return {};
    return JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dues')
        .setDescription('Displays all users and their dues'),

    async execute(interaction) {
        const modRole = config.modRole; // Get modRole from config.json
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const profiles = getProfiles();
        let duesList = [];

        // Loop through each user's profile to find dues
        for (const [userId, profile] of Object.entries(profiles)) {
            if (profile.dues && profile.dues.length > 0) {
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                if (!member) continue; // Skip if user is not in guild

                const displayName = member.nickname || member.user.username; // Use nickname if available, otherwise username

                let duesText = profile.dues.map(due => 
                    `**${due.name}**: ${due.amount} | ${due.status}`
                ).join("\n");

                duesList.push(`**${displayName}**\n${duesText}`);
            }
        }

        if (duesList.length === 0) {
            return interaction.reply({ content: "No dues have been assigned yet.", ephemeral: true });
        }

        // Embed to display dues
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('All Users Dues')
            .setDescription(duesList.join("\n\n"))
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
