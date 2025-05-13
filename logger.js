import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const isPretty = process.env.PRETTY_LOGGING === "true";

let logger;

if (isPretty) {
  const prettyTransport = pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
    },
  });

  logger = pino(prettyTransport);
} else {
  logger = pino(); // стандартне логування в JSON
}

logger.info("✅ Bot started");

export default logger;
