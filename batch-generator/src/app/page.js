'use client';
import { useState } from 'react';
import axios from 'axios';
import ModelSelect from './components/ModelSelect';
import InputGroup from './components/InputGroup';
import ButtonGroup from './components/ButtonGroup';
import ResultDisplay from './components/ResultDisplay';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [audience, setAudience] = useState('');
    const [scripts, setScripts] = useState([]);
    const [model, setModel] = useState('gemini');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) {
            alert('请填写描述提示词');
            return;
        }

        console.log('生成中...');
        setLoading(true);

        setScripts([]);

        var url = 'http://localhost:3000';
        url += model === 'gemini' ? '/api/gemini/' : '/api/chatgpt/';        const count = 3;

        try {
            const response = await axios.post(url, { prompt, audience, count });
            setScripts(response.data.scripts);
        } catch (error) {
            console.error('Error generating scripts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        setAudience('');
        setScripts([]);
    };

    return (
        <div className="container mx-auto flex flex-col items-center p-5 bg-gray-50 text-gray-800 min-h-screen">
            <h1 className="title text-3xl font-bold mb-6">短视频剧本生成器</h1>
            <div className="w-full max-w-md">
                <ModelSelect model={model} setModel={setModel} />
                <InputGroup
                    label="描述提示词"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入剧本的主题或关键词"
                />
                <InputGroup
                    label="目标用户"
                    id="audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="请输入目标用户群体"
                />
                <ButtonGroup onClear={handleClear} onGenerate={handleGenerate} />
                <ResultDisplay scripts={scripts} loading={loading} />
            </div>
        </div>
    );
}