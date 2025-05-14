import dotenv from "dotenv";
import axios from "axios";
import logger from "./logger.js";
dotenv.config();
const API_KEY = process.env.WEATHER_API_KEY;

export const getWeather = async (latitude, longtitude) => {
  try {
    logger.info("🌍 Sending request to OpenWeather with:", latitude, longtitude, API_KEY.slice(0, 5) + "...");
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longtitude}&appid=${API_KEY}`
    );
    if (response.data.length === 0) {
      return "We don't have info about weather in based on your position";
    }
    const weather = response.data.weather[0];
    logger.info(`This is object weather`);
    logger.info(weather);
    const main = response.data.main.temp;
    logger.info(`This is object main`);
    logger.info(main);
    return [weather, main];
  } catch (error) {
    logger.error("❌ Axios error:", error?.response?.data || error.message);
    logger.error(error);
    return "Some error while fetching data occurred";
  }
};
