import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { message } from "telegraf/filters";
import { session } from "telegraf";
import * as cron from 'cron';
import { CronJob } from 'cron';
import ngrok from 'ngrok';
import mongoose from "mongoose";
import express from "express"
import { UserSubscriptionForecast } from "./models/userSheme";


dotenv.config();


// === ЗМІННІ З ОТОЧЕННЯ ===
const token = process.env.TELEGRAM_BOT_TOKEN;
const ngrokToken = process.env.NGROK_TOKEN;
const URI = process.env.MONGO_DB_URI
const port = Number(process.env.PORT) || 3000;
const enabledSubscription = true;

// === CONNECT TO MONGO BD ===
try {
  await mongoose.connect(URI);
} catch (error) {
  handleError(error);
}



// === CONNECT TO NGROK ===
await ngrok.authtoken(ngrokToken);
const url = await ngrok.connect({addr: 3000});

console.log("✅ NGROK запущено:", url);
console.log("✅ token:", token.slice(0, 10) + "...");
console.log("✅ port:", port);

// === ІНІЦІАЛІЗАЦІЯ БОТА ===
const bot = new Telegraf(token);

await bot.telegram.setWebhook(`${url}/webhook`);

if (!token) {
  console.error("Error : TELEGRAM_BOT_TOKEN або WEB_HOOK_URL don't set!");
  process.exit(1);
}

bot.use(session({
    defaultSession: () => ({
      step: null,
      name: null
    })
  }));

// === ОБРОБКА ПОВІДОМЛЕНЬ ===
bot.command("start", (ctx) => {
    ctx.session.step = "wait_name";
    ctx.reply(`Hello, I’m forecasting weather-bot! My name is Weathy!

I can send you weather updates anytime you want — it’s awesome, isn’t it?

Please type /time to set time when I can send you forecast update. I’ll guide you through all the settings!`);
});

bot.command("time", (ctx) => {
    ctx.session.step = "wait time"
    ctx.reply("Хочеш дізнатися точний час? Напиши будь-що, і я його виведу.");
    console.log(ctx.message.text)
})

bot.on(message("text"), (ctx)=>{
    if (ctx.session.step === "wait time") {
        const user_chat_id = ctx.chat.id
        const user_msg = ctx.message.text


        const userSubscription  = new UserSubscriptionForecast({
          chatId: ctx.chat.id,
          userTime: ctx.message.text,
          enabled: enabledSubscription
        })

        userSubscription.save()
          .then(() => console.log('User created'))
          .catch((err) => console.log(err));

        const [hh, mm] = user_msg.split(':')
        const validation = cron.validateCronExpression(`0 ${mm} ${hh} * * *`);

        console.log("Відповідь користувача для cron:", `0 ${mm} ${hh} * * *`); 
        console.log(`Is the cron expression valid? ${validation.valid}`);

        if (!validation.valid) {
	        console.error(`Validation error: ${validation.error}`);
        } else {
            const job = CronJob.from({
            cronTime: `*/10 * * * * *`,
            onTick: () =>  {
              console.log("OnTick triggered");
              bot.telegram.sendMessage(user_chat_id, `You will see this on ${hh}: ${mm}`);
            },
            start: true,
            timeZone: 'Europe/Kyiv'
        });
        }

        ctx.session.step = null;
        return;
    }

    ctx.reply("Напиши /start або /time");
})



await new Promise((res) => setTimeout(res, 1000));

// === ЗАПУСК БОТА ===
bot.launch({
  webhook: {
    domain: url.replace(/^https?:\/\//, ''),
    port: port,
    hookPath: "/webhook"
  }
}).then(() => {
  console.log("🚀 Бот запущено з webhook!");
}).catch((err) => {
  console.error("❌ Помилка запуску:", err);
});
