'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ScriptDetail() {
    const searchParams = useSearchParams();
    const [question, setQuestion] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [originalScript, setOriginalScript] = useState('');
    const [error, setError] = useState('');

    const filename = decodeURIComponent(searchParams.get('file'));

    useEffect(() => {
        const fetchScript = async () => {
            try {
                const encodedFilename = encodeURIComponent(filename);
                const response = await axios.get(
                    `${API_BASE_URL}/scripts/${encodedFilename}`,
                    {
                        responseType: 'text',
                        transformResponse: [(data) => data],
                    }
                );
                
                // 处理Windows系统可能存在的BOM头
                const cleanScript = response.data.replace(/^\uFEFF/, '');
                setOriginalScript(cleanScript);
                
            } catch (error) {
                console.error('获取文件失败:', error);
                setError(`文件加载失败: ${error.response?.status === 404 
                    ? '文件不存在' 
                    : '服务器错误'}`);
            }
        };

        if (filename) {
            if (!/^[\w-]+\.md$/.test(filename)) {
                setError('无效文件名格式');
                return;
            }
            fetchScript();
        }
    }, [filename]);

    const handleAnalyze = async () => {
        if (!question) return;
        
        setLoading(true);
        try {
            const response = await axios.post('/api/analyze-script', {
                script: originalScript,
                question,
                audience
            });
            
            setAnalysis(response.data.analysis);
        } catch (error) {
            console.error('分析失败:', error);
            setAnalysis('分析失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧剧本内容 */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">剧本内容</h2>
                    {error ? (
                        <div className="text-red-500">{error}</div>
                    ) : originalScript ? (
                        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold my-4" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold my-3" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-xl font-medium my-2" {...props} />,
                                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                                    code: ({ node, ...props }) => (
                                        <code className="bg-gray-100 px-2 py-1 rounded font-mono" {...props} />
                                    ),
                                    a: ({ node, ...props }) => (
                                        <a className="text-blue-500 hover:underline" target="_blank" {...props} />
                                    )
                                }}
                            >
                                {originalScript}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-gray-500">正在加载文件...</div>
                    )}
                </div>

                {/* 右侧分析结果 */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">AI 分析</h2>
                    <div className="bg-gray-50 p-4 rounded-md min-h-[300px]">
                        {analysis || '点击下方输入问题进行分析...'}
                    </div>
                    
                    {/* 对话框区域 */}
                    <div className="mt-6 space-y-4">
                        <Textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="输入您想分析的问题..."
                            className="resize-none"
                        />
                        <Button 
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full"
                        >
                            {loading ? '分析中...' : '开始分析'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
