const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const app = express();
const port = 3000;

const count = 3;

app.use(cors());
app.use(express.json());

const googleAI = new GoogleGenerativeAI("AIzaSyCL0hgJ6ppzgPrI7Xm9Q0f8GmLP3XZl59k");
const googleModel = googleAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// /api/gemini/ endpoint
app.post('/api/gemini/', async (req, res) => {
    const { prompt, audience, count } = req.body;

    const finalAudience = (audience && audience.trim()) ? audience : '抖音用户';

    const content = `为${finalAudience}生成一个短视频剧本，主题是：${prompt}`;
    const scripts = [];

    try {
        for (let i = 0; i < count; i++) {
            const result = await googleModel.generateContent(content);
            scripts.push(result.response.text());
        }
        res.json({ scripts });
    } catch (error) {
        console.error('Error calling Google Generative AI:', error);
        res.status(500).json({ error: 'Failed to generate content using Google AI' });
    }
});

// /api/chatgpt/ endpoint
app.post('/api/chatgpt/', async (req, res) => {
    const { prompt, audience, count } = req.body;

    const finalAudience = (audience && audience.trim()) ? audience : '抖音用户';

    const content = `为${finalAudience}生成一个短视频剧本，主题是：${prompt}`;
    const scripts = [];

    try {
        for (let i = 0; i < count; i++) {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: content }],
            }, {
                headers: {
                    'Authorization': `Bearer YOUR_OPENAI_API_KEY`, // Replace with your OpenAI API key
                    'Content-Type': 'application/json',
                },
            });

            const script = response.data.choices[0].message.content;
            scripts.push(script);
        }
        res.json({ scripts });
    } catch (error) {
        console.error('Error calling ChatGPT API:', error);
        res.status(500).json({ error: 'Failed to generate content using ChatGPT' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running now' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});