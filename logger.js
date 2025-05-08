const pino = require('pino')
const dotenv = require('dotenv')
dotenv.config();
const isPretty = process.env.PRETTY_LOGGING === "true";

const logger = isPretty
  ? pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: "HH:MM:ss",
        },
      },
    })
  : pino();

module.exports = logger;
