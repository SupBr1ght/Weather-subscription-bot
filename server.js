import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { message } from "telegraf/filters";
import { session } from "telegraf";
import * as cron from 'cron';
import { CronJob } from 'cron';

dotenv.config();

// === ЗМІННІ З ОТОЧЕННЯ ===
const token = process.env.TELEGRAM_BOT_TOKEN;
const port = Number(process.env.PORT) || 3000;
const webhookDomain = process.env.WEB_HOOK_URL;

if (!token || !webhookDomain) {
  console.error("Error : TELEGRAM_BOT_TOKEN або WEB_HOOK_URL don't set!");
  process.exit(1);
}

console.log("✅ token:", token.slice(0, 10) + "...");
console.log("✅ port:", port);
console.log("✅ Webhook URL:", webhookDomain);

// === ІНІЦІАЛІЗАЦІЯ БОТА ===
const bot = new Telegraf(token);
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
        const user_msg = ctx.message.text;
        const [hours, minutes] = user_msg.split(':')
        console.log("Відповідь користувача для cron:", `0 ${minutes} ${hours} * * *`); // ← тут буде 30:12
        const validation = cron.validateCronExpression(`0 ${minutes} ${hours} * * *`);
        console.log(`Is the cron expression valid? ${validation.valid}`);
        if (!validation.valid) {
	        console.error(`Validation error: ${validation.error}`);
        } 
        ctx.session.step = null;
        return;
    }

    ctx.reply("Напиши /start або /time");
})




// === ЗАПУСК БОТА ===
bot.launch({
  webhook: {
    domain: webhookDomain,
    port: port,
    hookPath: "/webhook"
  }
}).then(() => {
  console.log("🚀 Бот запущено з webhook!");
}).catch((err) => {
  console.error("❌ Помилка запуску:", err);
});
