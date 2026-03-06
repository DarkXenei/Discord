const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Wysyła testowy embed'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("Test Embed")
            .setDescription("To jest embed z Twojego bota 🚀")
            .setColor(0x5865F2);

        await interaction.reply({ embeds: [embed] });
    }
};
