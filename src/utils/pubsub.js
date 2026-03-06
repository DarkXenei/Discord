const Redis = require('ioredis');
require('dotenv').config();

const pub = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

const sub = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

module.exports = { pub, sub };
