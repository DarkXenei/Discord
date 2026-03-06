const DashboardLog = require("../models/DashboardLog")

async function logDashboardAction(guildId, user, action){

try{

await DashboardLog.create({
guildId,
userId: user.id,
userName: user.username,
action
})

}catch(err){

console.error("Dashboard log error:", err)

}

}

module.exports = { logDashboardAction }