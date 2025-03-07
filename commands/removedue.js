const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');
const configPath = path.join(__dirname, '../data/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removedue')
        .setDescription('Remove a due from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove due from')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('duename')
                .setDescription('The name of the due to remove')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Load config.json to get modRole
        if (!fs.existsSync(configPath)) {
            return interaction.reply({ content: 'Configuration file not found.', ephemeral: true });
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const modRoleId = config.modRole;

        // Check if user has the modRole
        if (!interaction.member.roles.cache.has(modRoleId)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const dueName = interaction.options.getString('duename');

        // Load profile data
        if (!fs.existsSync(profilesPath)) {
            return interaction.reply({ content: 'No profile data found.', ephemeral: true });
        }

        let profileData = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

        // Check if the user has a profile
        if (!profileData[user.id] || !profileData[user.id].dues) {
            return interaction.reply({ content: 'This user has no dues recorded.', ephemeral: true });
        }

        let userDues = profileData[user.id].dues;
        const initialLength = userDues.length;

        // Filter out the due to remove it
        userDues = userDues.filter(due => due.name.toLowerCase() !== dueName.toLowerCase());

        // Check if a due was removed
        if (userDues.length === initialLength) {
            return interaction.reply({ content: `No due named **${dueName}** found for this user.`, ephemeral: true });
        }

        // Update profile data
        profileData[user.id].dues = userDues;
        fs.writeFileSync(profilesPath, JSON.stringify(profileData, null, 4));

        await interaction.reply({ content: `Successfully removed due **${dueName}** from <@${user.id}>.`, ephemeral: false });
    }
};
