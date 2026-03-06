require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("./passport");

const { getGuildSettings, updateGuildSettings } = require("../utils/guildSettings");
const redis = require("../config/redis");

const { REST } = require("@discordjs/rest");

const { logDashboardAction } = require("../utils/dashboardLogger")
const DashboardLog = require("../models/DashboardLog")

const client = global.client;

const app = express();

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

// Session + MongoStore
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24h
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Discord REST
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// Middleware auth
function checkAuth(req, res, next) {
  if (!req.user) return res.redirect("/");
  next();
}

////////////////////////////////////////
//// HOME / LOGIN
////////////////////////////////////////

app.get("/", (req, res) => res.render("login"));

app.get("/login", passport.authenticate("discord"));

app.get(
  "/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => res.redirect("/servers")
);

app.get("/logout", (req, res) => req.logout(() => res.redirect("/")));

////////////////////////////////////////
//// SERVER LIST
////////////////////////////////////////

app.get("/servers", async (req, res) => {
    if (!req.user) return res.redirect("/");

    const userGuilds = req.user.guilds;

    const adminGuilds = userGuilds.filter(g => (g.permissions & 0x8) === 0x8);

    const keys = adminGuilds.map(g => `botGuild:${g.id}`);

    const values = await redis.mget(keys);

    const mapped = adminGuilds.map((g, i) => {

        let botOnline = false;
        let members = 0;

        if (values[i]) {
            const data = JSON.parse(values[i]);
            botOnline = data.online;
            members = data.members;
        }

        return {
            ...g,
            botOnline,
            members
        };
    });

    res.render("servers", {
        guilds: mapped,
        clientId: process.env.CLIENT_ID
    });
});

////////////////////////////////////////
//// DASHBOARD
////////////////////////////////////////

app.get("/dashboard/:id", checkAuth, async (req, res) => {

    const guildId = req.params.id;
    
    const adminGuilds = req.user.guilds.filter(g => (g.permissions & 0x8) === 0x8);
    
    const currentGuild = adminGuilds.find(g => g.id === guildId);

    let settings = {};

    try {
        settings = await getGuildSettings(guildId);
    } catch (err) {
        console.error("B³¹d pobierania ustawieñ guild:", err);
    }

    res.render("dashboard", { 
        guildId: guildId,
        guildName: currentGuild ? currentGuild.name : "Nieznany serwer",
        guildIcon: currentGuild ? currentGuild.icon : null,
        guilds: adminGuilds, // Potrzebne do dropdowna "Jump to server"
        userName: req.user.username,
        userAvatar: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`,
        settings: settings 
    });
});

////////////////////////////////////////
//// BOT SETTINGS
////////////////////////////////////////

app.post("/dashboard/:guildId/nickname", checkAuth, async (req, res) => {

  const guildId = req.params.guildId;
  const nickname = req.body.nickname;

  await updateGuildSettings(guildId, {
    nickname
  });

if (req.body.nickname) {

  try {

    const guild = client.guilds.cache.get(guildId)

    if (guild) {

      const me = guild.members.me
      await me.setNickname(req.body.nickname)

      console.log("? Zmieniono nick bota:", req.body.nickname)

    }

  } catch (err) {

    console.error("? Nie mo¿na zmieniæ nicku:", err)

  }

}

  await logDashboardAction(
    guildId,
    req.user,
    `nickname.update (${nickname})`
  );

  res.redirect("/dashboard/" + guildId);

});

////////////////////////////////////////
//// PREFIX ADD
////////////////////////////////////////

app.post("/dashboard/:guildId/prefix/add", checkAuth, async (req, res) => {

  const guildId = req.params.guildId;
  const prefix = req.body.newPrefix;

if (!prefix || prefix.length > 5) {
  return res.redirect("/dashboard/" + guildId);
}

  const settings = await getGuildSettings(guildId);

  const prefixes = settings.prefixes || [];

  // unikamy duplikatów
  if (!prefixes.includes(prefix)) {
    prefixes.push(prefix);
  }

  await updateGuildSettings(guildId, {
    prefixes
  });

  await logDashboardAction(
    guildId,
    req.user,
    `prefix.add (${prefix})`
  );

  res.redirect("/dashboard/" + guildId);

});

////////////////////////////////////////
//// PREFIX DELETE
////////////////////////////////////////

app.post("/dashboard/:guildId/prefix/delete", checkAuth, async (req, res) => {

  const guildId = req.params.guildId;
  const prefix = req.body.prefixToDelete;

  const settings = await getGuildSettings(guildId);

  const prefixes = settings.prefixes.filter(p => p !== prefix);

  await updateGuildSettings(guildId, {
    prefixes
  });

  await logDashboardAction(
    guildId,
    req.user,
    `prefix.delete (${prefix})`
  );

  res.redirect("/dashboard/" + guildId);

});

////////////////////////////////////////
//// LOGS API
////////////////////////////////////////

app.get("/dashboard/:guildId/logs", checkAuth, async (req, res) => {

  const guildId = req.params.guildId;

  const userFilter = req.query.user;
  const actionFilter = req.query.action;

  let query = { guildId };

  if (userFilter) {
    query.userName = new RegExp(userFilter, "i");
  }

  if (actionFilter) {
    query.action = new RegExp(actionFilter, "i");
  }

  const logs = await DashboardLog
    .find(query)
    .sort({ date: -1 })
    .limit(50);

  res.json(logs);

});

////////////////////////////////////////
//// START SERVER
////////////////////////////////////////

app.listen(3000, () => {

  console.log("?? Dashboard dzia³a na :3000");

});