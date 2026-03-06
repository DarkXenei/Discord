// src/shard.js
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const connectMongo = require("./config/database");
const redis = require("./config/redis");
const pubsub = require("./utils/pubsub");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

global.client = client;

// Eventy
require("./events/ready")(client);
require("./events/interactionCreate")(client);
require("./events/guildMemberAdd")(client);

connectMongo();

client.once("ready", async () => {
  console.log(`? Bot zalogowany jako ${client.user.tag}`);

  // Status botów zapis do Redis co 5s
  setInterval(async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      const key = `botGuild:${guildId}`;
      const value = JSON.stringify({ online: true, members: guild.memberCount });
      await redis.set(key, value, "EX", 15);
    }
  }, 5000);
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;