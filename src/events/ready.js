module.exports = (client) => {

    client.once("ready", async () => {

        console.log(`Zalogowano jako ${client.user.tag}`)

        const Guild = require("../models/guild")

        const guilds = await Guild.find()

        for (const g of guilds) {

            const guild = client.guilds.cache.get(g.guildId)
            if (!guild) continue

            if (g.nickname) {

                try {

                    await guild.members.me.setNickname(g.nickname)
                    console.log(`Nickname ustawiony na ${g.nickname}`)

                } catch (err) {

                    console.log("B³¹d nickname:", err)

                }

            }

        }

    })

}