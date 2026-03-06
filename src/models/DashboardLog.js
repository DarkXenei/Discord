const mongoose = require("mongoose")

const dashboardLogSchema = new mongoose.Schema({

guildId: String,

userId: String,
userName: String,

action: String,

date: {
type: Date,
default: Date.now
}

})

module.exports = mongoose.model("DashboardLog", dashboardLogSchema)