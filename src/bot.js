require("dotenv").config()

const { ShardingManager } = require("discord.js")
const path = require("path")

const manager = new ShardingManager(
    path.join(__dirname, "shard.js"),
    {
        token: process.env.DISCORD_TOKEN
    }
)

manager.on("shardCreate", shard => {

    console.log(`?? Shard ${shard.id} uruchomiony`)

})

manager.spawn()