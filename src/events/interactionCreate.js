const ping = require("../commands/ping")

module.exports = (client) => {

    client.on("interactionCreate", async interaction => {

        if (!interaction.isChatInputCommand()) return

        if (interaction.commandName === "ping") {

            ping.execute(interaction)

        }

    })

}