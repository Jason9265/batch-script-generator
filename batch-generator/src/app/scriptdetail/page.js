'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ScriptDetail() {
    const searchParams = useSearchParams();
    const [question, setQuestion] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    // 获取剧本内容
    const originalScript = decodeURIComponent(searchParams.get('script'));
    const audience = decodeURIComponent(searchParams.get('audience'));

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
                    <h2 className="text-xl font-semibold mb-4">原始剧本</h2>
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                        {originalScript}
                    </div>
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
