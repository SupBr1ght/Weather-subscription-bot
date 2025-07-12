import { CronJob } from "cron";
import { getWeather } from "../WeatherAPI.js";
import { UserSubscriptionForecast } from "../models/userSheme.js";
import logger from "../logger.js";

const cronJobs = new Map(); 
    //dependency invertion in the action!
 export function createWeatherJob(chatId, cronExpression, timezone, bot) {
     // Stop and delete existing job if exists
    const existingJob = cronJobs.get(chatId);
    if (existingJob) {
      existingJob.stop();
      cronJobs.delete(chatId);
      logger.info(`Stopped existing cron job for chatId: ${chatId}`);
    }

    const job = new CronJob(
      cronExpression,
      async () => {
        try {
          const user = await UserSubscriptionForecast.findOne({
            chatId: chatId,
          });

          if (!user || !user.latitude || !user.longitude) {
            await bot.telegram.sendMessage(
              chatId,
              "Please send your location using /geo before setting the time."
            );
            return;
          }
          const { latitude, longitude } = user;
          logger.info(latitude, longitude + " Before getting forecast");
          logger.info(`CRON TRIGGERED for chatId ${chatId}`);
          const weather_data = await getWeather(latitude, longitude);
          logger.info("Weather data:", weather_data);
          logger.info(typeof weather_data);
          const [weather, main] = weather_data;
          const iconUrl = `http://openweathermap.org/img/wn/${weather.icon}@2x.png`;
          const celcius = main - 273.15;
          await bot.telegram.sendPhoto(chatId, iconUrl, {
            caption: `🌡️ Temperature: ${celcius.toFixed(2)}°C\n Condition: ${
              weather.main
            }\n📝 Description: ${weather.description}`,
          });
          logger.info(typeof weather);
          logger.info(weather);
          logger.info(
            `Location sent: ${latitude}, ${longitude} Weather sent: ${weather.main}`
          );
        } catch (error) {
          await bot.telegram.sendMessage(
            chatId,
            `Sorry, I couldn't retrieve the weather for your location.`
          );
        }
      },
      null,
      true,
      timezone
    );

    cronJobs.set(chatId, job);
    logger.info(`Cron job scheduled for chatId: ${chatId} with expression: ${cronExpression}`);
    return job;

 }