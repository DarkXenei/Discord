const { SlashCommandBuilder } = require('discord.js');

module.exports = {

    async execute(interaction) {

        await interaction.reply("?? Pong!")

    }

}