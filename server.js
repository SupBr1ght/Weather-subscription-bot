const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT || 3000;
const url = 'https://api.telegram.org/bot';
const token = process.env.TELEGRAM_BOT_TOKEN;

app.use(bodyParser.json());

app.post('/', async (req, res) => {
    const chatId = req.body.message?.chat?.id;
    const sentMessage = req.body.message?.text;

    if (!chatId || !sentMessage) {
        return res.sendStatus(400); 
    }

    let textToSend = 'I am not sure what you mean. Can you please rephrase?';
    if (sentMessage.match(/start/gi)) {
        textToSend = 'Hello, I’m forecaste weather-bot! My name is Weathy!🌞\nI can send any messages about the weather anytime you want! It’s awesome, isnt?🌨️ Please type /info to get more info about bot, and I’ll go with you through all settings!'
    }

    try {
        const response = await axios.post(`${url}${token}/sendMessage`, {
            chat_id: chatId,
            text: textToSend
        });

        res.sendStatus(200); 
    } catch (err) {
        console.error('Telegram API error:', err.message);
        res.sendStatus(500);
    }
        
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});