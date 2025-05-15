import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { message } from "telegraf/filters";
import { session } from "telegraf";
import { UserSubscriptionForecast } from "./models/userSheme.js";
import logger from "./logger.js";
import mongoose from "mongoose";
import express from "express";
import { createWeatherJob } from "./services/CronService.js";
import { restoreCronJobs } from "./services/RestoreCron.js";

dotenv.config();

// === CRON JOB ===
const jobs = new Map();

// === ENVS ===
const token = process.env.TELEGRAM_BOT_TOKEN;
const URI = process.env.MONGO_DB_URI;
const port = Number(process.env.PORT) || 3000;
const timezone = process.env.TZ;
const url = process.env.RAILWAY_PUBLIC_DOMAIN;

// === BOT INITIALIZATION ===
const bot = new Telegraf(token);
const app = express();
app.use(express.json());



// === CONNECT TO MONGO BD ===
try {
  await mongoose.connect(URI);
  logger.info("Succsessfuly connected to mongo db!");
  //Restore cron jobs
   await restoreCronJobs(bot, timezone);
} catch (error) {
  logger.info(error);
}



async function setupWebhook() {
  await bot.telegram.setWebhook(`${url}/webhook`);
  console.log("Webhook set to", `${url}/webhook`);
}

setupWebhook().catch(console.error);

// 5. start server
app.get("/", (_req, res) => res.send("OK"));

if (!token) {
  console.error("Error : TELEGRAM_BOT_TOKEN або WEB_HOOK_URL don't set!");
  process.exit(1);
}

bot.use(
  // add ctx and ctx.session persist between user's messages
  session({
    defaultSession: () => ({
      // You can use this to track the current step in a conversation
      step: null,
      // Store the user's name or any other data
      name: null,
    }),
  })
);

// === HANDLE MESSAGES ===
bot.command("start", async (ctx) => {
  const user = await UserSubscriptionForecast.findOne({ chatId: ctx.chat.id });
  if (user && user.enabled === true) {
    ctx.reply(
      "You've already subscribed!, If you want unsubscribe please send /unsubscribe"
    );
  } else {
    ctx.reply(`Hello, I’m forecasting weather-bot! My name is Weathy!

I can send you weather updates anytime you want — it’s awesome, isn’t it?

First I need to know where I need to send weather please type command - /geo and share your location
Then I need to know when I'll sent you geo so please type /time and I set you time notification
And then boom! You will get your desired message on time!
`);
  }
});

bot.command("geo", async (ctx) => {
  const user = await UserSubscriptionForecast.findOne({ chatId: ctx.chat.id });
    ctx.reply(
      "Please share with me your geolocation that I can define what weather you need for based on your location"
    );
  })

bot.command("time", (ctx) => {
  ctx.reply(
    "Please send message like 12:30 for example. And I'll send you message every day about your forecast at this time!"
  );
  logger.info(ctx.message.text);
});

bot.command("unsubscribe", async (ctx) => {
  logger.info("/unsubscribe triggered");
  const chatId = ctx.chat.id;

  // Always try to update DB
  const updatedUser = await UserSubscriptionForecast.findOneAndUpdate(
    { chatId },
    { enabled: false },
    { new: true }
  );

  if (!updatedUser) {
    ctx.reply("You don't have a subscription in the database.");
    return;
  }

  logger.info("Updated user in DB:", updatedUser);

  const job = jobs.get(chatId);

  if (job) {
    job.stop();
    jobs.delete(chatId);
    logger.info("Cron job stopped and deleted from memory");
  } else {
    logger.info("No job found in memory. Only DB updated.");
  }

  ctx.reply(
    "You've successfully unsubscribed. Send /resubscribe to start again."
  );
});

bot.command("resubscribe", async (ctx) => {
  await UserSubscriptionForecast.findOneAndUpdate(
    { chatId: ctx.chat.id },
    { enabled: true }
  );
  const job = jobs.get(ctx.chat.id);

  if (job) {
    job.start();
    ctx.reply("You've succsesfully resubscribed.");
  } else {
    ctx.reply("You won't resubscribe.");
  }
});

bot.on("location", async (ctx) => {
  const { latitude, longitude } = ctx.message.location;

  // Сесія зберігає координати тимчасово
  ctx.session.location = { latitude, longitude };

  ctx.reply("Great! Now type /time and send your desired notification time.");
});

bot.on(message("text"), async (ctx) => {
    const user_chat_id = ctx.chat.id;
    const user_msg = ctx.message.text;
    const { latitude, longitude } = ctx.session.location ?? {};
    if (!latitude || !longitude) {
      ctx.reply("Please send your location using /geo first.");
      return;
    }
    // create user
    const userSubscription = new UserSubscriptionForecast({
      chatId: ctx.chat.id,
      cronTime: ctx.message.text,
      enabled: true,
      latitude: latitude,
      longitude: longitude,
    });


    await userSubscription
      .save()
      .then(() => logger.info("User created"))
      .catch((err) => logger.info(err));

    // Validate time format
    const [hh, mm] = user_msg.split(":");
    if (
      !hh ||
      !mm ||
      isNaN(Number(hh)) ||
      isNaN(Number(mm)) ||
      Number(hh) < 0 ||
      Number(hh) > 23 ||
      Number(mm) < 0 ||
      Number(mm) > 59
    ) {
      ctx.reply("Invalid time format. Please use HH:MM (e.g., 12:30).");
      ctx.session.step = null;
      return;
    }

    createWeatherJob(user_chat_id, user_msg, timezone, bot);
  })
  

await new Promise((res) => setTimeout(res, 1000));

// === LAUNCH BOT ===
bot
  .launch({
    webhook: {
      domain: url,
      port: port,
      hookPath: "/webhook",
    },
  })
  .then(() => {
    logger.info("Bot launched with webhook!");
  })
  .catch((err) => {
    console.error("Error launchу:", err);
  });
