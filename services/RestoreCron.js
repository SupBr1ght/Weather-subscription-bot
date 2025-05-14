import { UserSubscriptionForecast } from "../models/userSheme.js";
import logger from "../logger.js";


export async function restoreCronJobs(bot, timezone) { 
  const users = await UserSubscriptionForecast.find({ enabled: true });

  for (const user of users) {
    if (!user.cronTime || !user.latitude || !user.longitude) continue;

    const [hh, mm] = user.cronTime.split(":");
    const cronExpression = `0 ${mm} ${hh} * * *`;

    createWeatherJob(user.chatId, cronExpression, timezone, bot);
    logger.info(`Restored job for user ${user.chatId} at ${user.cronTime}`);
  }
}