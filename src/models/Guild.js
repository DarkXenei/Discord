const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({

    guildId: {
        type: String,
        required: true,
        unique: true
    },

    prefixes: {
        type: [String],
        default: ["!"]
    },

    nickname: {
        type: String,
        default: ""
    },

    logChannel: {
        type: String,
        default: null
    },

    welcomeChannel: {
        type: String,
        default: null
    },
    nickname: String

});

module.exports = mongoose.model("Guild", guildSchema);