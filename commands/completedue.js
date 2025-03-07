const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../data/config.json');

const profilesPath = path.join(__dirname, '../data/profiles.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('completedue')
        .setDescription('Mark a due as complete for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to update the due for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duename')
                .setDescription('The name of the due to mark as complete')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check if the user has the required modRole
        const modRole = config.modRole;
        if (!interaction.member.roles.cache.has(modRole)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const dueName = interaction.options.getString('duename');

        // Load profiles data
        let profiles = {};
        if (fs.existsSync(profilesPath)) {
            profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
        }

        // Ensure the user has a profile
        if (!profiles[user.id] || !profiles[user.id].dues) {
            return interaction.reply({ content: 'This user has no recorded dues.', ephemeral: true });
        }

        // Find and update the due
        const dueIndex = profiles[user.id].dues.findIndex(d => d.name === dueName);
        if (dueIndex === -1) {
            return interaction.reply({ content: `No due found with the name "${dueName}".`, ephemeral: true });
        }

        profiles[user.id].dues[dueIndex].status = '✅'; // Mark as complete

        // Save the updated profiles
        fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));

        // Confirmation embed
        const embed = new EmbedBuilder()
            .setTitle('Due Completed')
            .setColor(0x00FF00)
            .setDescription(`**${dueName}** for ${user.username} has been marked as ✅ complete.`);

        return interaction.reply({ embeds: [embed] });
    },
};
