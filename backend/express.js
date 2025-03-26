const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const stream = require('stream');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
require('dotenv').config();

const count = 3;
const numberOfScripts = 1;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 配置 Multer
const upload = multer({
  storage: multer.memoryStorage(), // 使用内存存储
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('only accept CSV/Excel files'), false);
    }
  }
});

app.use(cors());
app.use(express.json());

const googleAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const googleModel = googleAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SCRIPT_DIR = path.join(__dirname, 'generated_scripts');
if (!fs.existsSync(SCRIPT_DIR)) {
  fs.mkdirSync(SCRIPT_DIR);
}

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
                    'Authorization': `Bearer ${OPENAI_API_KEY}`, // Replace with your OpenAI API key
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

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未收到文件' });
    }

    let content = '';
    if (req.file.mimetype === 'text/csv') {
      content = await parseCSV(req.file.buffer);
    } else if (req.file.mimetype === 'application/vnd.ms-excel') {
      content = await parseExcel(req.file.buffer);
    }

    const analysisPrompt = `请从以下内容中提取主要话题标签，要求：
    1. 返回JSON数组格式, 包含20个话题关键词
    2. 话题应反映内容的核心主题
    3. 使用中文标签
    
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
    const topics = JSON.parse(jsonMatch[0]).map(item => 
      typeof item === 'string' ? item : item.标签
    );

    res.json({ 
      status: 'success',
      topics: topics.slice(0, 20)
    });

  } catch (error) {
    console.error('分析错误:', error);
    res.status(500).json({ 
      error: '文件分析失败',
      details: error.message 
    });
  }
});

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

async function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet)
    .map(row => JSON.stringify(row))
    .join('\n');
}

app.post('/api/generate', async (req, res) => {
  const { topics, model, audience } = req.body;
  
  try {
    const controller = new AbortController();
    req.on('close', () => controller.abort());

    if (!topics || topics.length < 3) {
      return res.status(400).json({ error: '至少需要3个主题' });
    }

    const scripts = [];
    const getRandomTopics = () => {
      const shuffled = [...topics].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    };

    for (let i = 0; i < numberOfScripts; i++) {
      const selectedTopics = getRandomTopics();
      const prompt = `为${audience || '抖音用户'}生成一个短视频剧本，要求：
1. 有机融合以下3个主题: ${selectedTopics.join('、')}
2. 包含场景描述和对话
3. 时长控制在30-45秒
4. 使用适合${audience || '抖音用户'}的语言风格
5. 输出为markdown格式 只返回markdown得内容便于保存`;

      // 根据选择的模型调用不同API
      let script;
      if (model === 'chatgpt') {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        }, {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });
        script = response.data.choices[0].message.content;
      } else if (model === 'gemini') {
        const result = await Promise.race([
          googleModel.generateContent(prompt),
          new Promise((_, reject) => 
            controller.signal.onabort = () => 
              reject(new Error('AbortError'))
          )
        ]);
        script = result.response.text();
      } else if (model === 'deepseek') {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a helpful script writer assistant."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          stream: false
        }, {
          headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        script = response.data.choices[0].message.content;
      } else {
        // default Gemini
        const result = await googleModel.generateContent(prompt);
        script = result.response.text();
      }
      
      scripts.push(script);
    }

    // 处理并保存每个剧本
    const fileNames = [];
    for (const script of scripts) {
      // 清理Markdown标签
      const cleanScript = script
        .replace(/```.*?\n/sg, '')   // 移除代码块
        .replace(/\n{3,}/g, '\n\n') // 合并多余空行
        .replace(/```/g, '') // 移除残留的代码块标记
        // .replace(/-{3,}/g, '')       // 移除分割线
        // .replace(/#{1,6}\s*/g, '')    // 移除标题符号
        // .replace(/\*\*(.*?)\*\*/g, '$1') // 移除加粗
        // .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') // 移除斜体和加粗
        // .replace(/\[.*?\]\(.*?\)/g, '$1') // 移除链接
        .trim(); // 移除前后空白

      // 生成唯一文件名
      const timestamp = Date.now() + '-' + Math.floor(Math.random() * 1000);
      const fileName = `${timestamp}.md`;
      const filePath = path.join(SCRIPT_DIR, fileName);
      
      await fs.promises.writeFile(filePath, cleanScript);
      fileNames.push(fileName);
    }

    res.json({ 
      status: 'success',
      files: fileNames // 仅返回文件名数组
    });
  } catch (error) {
    if (error.message === 'AbortError') {
      console.log('请求被用户中止');
      return res.status(499).json({ error: '用户取消请求' }); // 499为自定义状态码
    }
    console.error('生成失败:', error);
    res.status(500).json({ 
      error: '内容生成失败',
      details: error.statusText 
    });
  }
});

app.post('/api/analyze-script', async (req, res) => {
    const { script, question, audience } = req.body;
    
    try {
        const prompt = `作为短视频专家，请分析以下剧本：
        ------------------
        剧本受众：${audience}
        剧本内容：${script.substring(0, 5000)}
        ------------------
        需要分析的问题：${question}
        请给出专业、详细的分析建议：`;

        const result = await googleModel.generateContent(prompt);
        const analysis = result.response.text();

        res.json({ analysis });
    } catch (error) {
        console.error('分析失败:', error);
        res.status(500).json({ error: '分析失败' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Server is running now' });
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/scripts', express.static(SCRIPT_DIR, {
  setHeaders: (res) => {
    res.set('Content-Type', 'text/markdown; charset=utf-8');
  }
}));

// 添加文件列表获取端点
app.get('/api/scripts', (req, res) => {
  fs.readdir(SCRIPT_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: '无法读取文件列表' });
    }
    res.json({ 
      files: files
        .filter(file => path.extname(file) === '.md')
        .map(file => ({
          name: file,
          url: `/scripts/${file}`,
          created: fs.statSync(path.join(SCRIPT_DIR, file)).birthtime
        }))
    });
  });
});

// 添加文件存在性检查中间件
app.use('/scripts', (req, res, next) => {
  const filePath = path.join(SCRIPT_DIR, req.path);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('文件不存在');
  }
  next();
});

app.delete('/api/scripts/clear', async (req, res) => {
  try {
    const files = await fs.promises.readdir(SCRIPT_DIR);
    
    await Promise.all(
      files.map(file => 
        fs.promises.unlink(path.join(SCRIPT_DIR, file))
      )
    );
    
    res.json({ 
      status: 'success',
      message: `已清除 ${files.length} 个文件`
    });
  } catch (error) {
    console.error('清除失败:', error);
    res.status(500).json({ 
      error: '清除文件失败',
      details: error.message 
    });
  }
});

// 添加专门的文件下载端点
app.get('/api/scripts/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(SCRIPT_DIR, filename);

  // 验证文件存在性
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  // 设置下载头信息
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // 创建文件流
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// 404 处理（必须放在所有路由之后）
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

