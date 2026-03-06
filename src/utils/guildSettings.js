const redis = require('../config/redis');
const Guild = require('../models/Guild');
require('dotenv').config(); // wczytuje zmienne z .env
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("? MongoDB connected"))
  .catch(err => console.error("? MongoDB connection error:", err));

// dodatkowe logi statusu po³¹czenia
mongoose.connection.on('disconnected', () => console.log("?? MongoDB disconnected"));
mongoose.connection.on('reconnected', () => console.log("?? MongoDB reconnected"));

async function getGuildSettings(guildId) {
    console.log(`?? [getGuildSettings] Pobieram ustawienia dla guildId=${guildId}`);

    // 1?? SprawdŸ Redis
    try {
        const cached = await redis.get(`guild:${guildId}`);
        if (cached) {
            console.log(`?? [getGuildSettings] Znalaz³em w Redis: guild:${guildId}`);
            return JSON.parse(cached);
        } else {
            console.log(`? [getGuildSettings] Brak w Redis: guild:${guildId}`);
        }
    } catch (err) {
        console.error(`?? [getGuildSettings] B³¹d Redis: ${err.message}`);
    }

    // 2?? Fallback Mongo
    let guild;
    try {
        guild = await Guild.findOne({ guildId });
        if (guild) {
            console.log(`?? [getGuildSettings] Znalaz³em w Mongo: guildId=${guildId}`);
        } else {
            console.log(`? [getGuildSettings] Brak w Mongo, tworzê nowy`);
            guild = await Guild.create({ guildId });
            console.log(`?? [getGuildSettings] Nowy rekord stworzony: ${guildId}`);
        }
    } catch (err) {
        console.error(`?? [getGuildSettings] B³¹d Mongo: ${err.message}`);
        throw err;
    }

    // 3?? Zapis do Redis (cache 1h)
    try {
        await redis.set(`guild:${guildId}`, JSON.stringify(guild), "EX", 3600);
        console.log(`?? [getGuildSettings] Zapisano do Redis: guild:${guildId}`);
    } catch (err) {
        console.error(`?? [getGuildSettings] Nie uda³o siê zapisaæ do Redis: ${err.message}`);
    }

    return guild;
}

async function updateGuildSettings(guildId, data) {
    console.log(`?? [updateGuildSettings] Aktualizujê ustawienia dla guildId=${guildId}`, data);

    let guild;
    try {
        guild = await Guild.findOneAndUpdate(
            { guildId },
            { $set: data },
            { new: true, upsert: true }
        );
        console.log(`?? [updateGuildSettings] Zaktualizowano w Mongo: ${guildId}`);
    } catch (err) {
        console.error(`?? [updateGuildSettings] B³¹d Mongo: ${err.message}`);
        throw err;
    }

    try {
        await redis.del(`guild:${guildId}`);
        console.log(`?? [updateGuildSettings] Usuniêto cache z Redis: guild:${guildId}`);
    } catch (err) {
        console.error(`?? [updateGuildSettings] Nie uda³o siê usun¹æ cache z Redis: ${err.message}`);
    }

    return guild;
}

module.exports = {
    getGuildSettings,
    updateGuildSettings
};