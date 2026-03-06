const { getGuildSettings } = require("../utils/guildSettings")

module.exports = (client) => {

client.on("guildMemberAdd", async (member) => {

    try{

        const settings = await getGuildSettings(member.guild.id)

        if(!settings.welcomeChannel) return

        const channel = member.guild.channels.cache.get(settings.welcomeChannel)

        if(!channel) return

        channel.send(`?? Witaj ${member} na **${member.guild.name}**!`)

    }catch(err){

        console.error("Welcome error:", err)

    }

})

}