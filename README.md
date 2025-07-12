#Weather Subscription Bot

A simple Node.js bot that lets users get current weather based on their geolocation — and subscribe to daily updates using cron.


##Tech Stack

Node.js
Axios (or fetch)
-OpenWeatherMap API 
node-cron for scheduled jobs
dotenv for config


## Features

- Get weather using user’s location
- Subscribe to daily updates
- Automated delivery via cron
- Simple CLI or bot-style interface (if applicable)



## Getting Started

1. Clone the repo
bash
-git clone https://github.com/SupBr1ght/weather-subscription-bot.git
-cd weather-subscription-bot
-npm install

2. Add .env file:
API_KEY=your_weather_api_key (from openweather.com)

3. Run the bot:
npm start
