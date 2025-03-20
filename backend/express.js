const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const stream = require('stream');
const app = express();
const port = 3000;

const count = 3;

// 配置 Multer
const upload = multer({
  storage: multer.memoryStorage(), // 使用内存存储
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只支持 CSV/Excel 文件'), false);
    }
  }
});

app.use(cors());
app.use(express.json());

const googleAI = new GoogleGenerativeAI("AIzaSyCL0hgJ6ppzgPrI7Xm9Q0f8GmLP3XZl59k");
const googleModel = googleAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

// 文件分析端点
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未收到文件' });
    }

    // 解析文件内容
    let content = '';
    if (req.file.mimetype === 'text/csv') {
      content = await parseCSV(req.file.buffer);
    } else if (req.file.mimetype === 'application/vnd.ms-excel') {
      content = await parseExcel(req.file.buffer);
    }

    // 调用AI分析内容
    const analysisPrompt = `请从以下内容中提取主要话题标签，要求：
    1. 返回JSON数组格式，包含10-15个话题
    2. 话题应反映内容的核心主题
    3. 使用中文标签
    4. 按热度排序
    
    内容：
    ${content.substring(0, 10000)}`; // 限制内容长度

    const result = await googleModel.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();
    
    // 解析AI响应
    const jsonMatch = text.match(/\[.*?\]/s);
    if (!jsonMatch) {
      throw new Error('AI响应格式错误');
    }
    const topics = JSON.parse(jsonMatch[0]);

    res.json({ 
      status: 'success',
      topics: topics.slice(0, 10) // 返回前10个话题
    });

  } catch (error) {
    console.error('分析错误:', error);
    res.status(500).json({ 
      error: '文件分析失败',
      details: error.message 
    });
  }
});

// CSV解析函数
async function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(JSON.stringify(results));
      })
      .on('error', reject);
  });
}

// Excel解析函数
async function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet)
    .map(row => JSON.stringify(row))
    .join('\n');
}
// 生成端点
app.post('/api/generate', async (req, res) => {
  const { topics, model, audience } = req.body;
  
  try {
    // 这里添加实际的生成逻辑
    const mockScripts = topics.map(topic => 
      `关于${topic}的示例剧本内容...`
    );
    
    res.json({ 
      status: 'success',
      scripts: mockScripts 
    });
  } catch (error) {
    res.status(500).json({ error: '内容生成失败' });
  }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running now' });
});

// 在 app 初始化后添加
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 404 处理（必须放在所有路由之后）
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

