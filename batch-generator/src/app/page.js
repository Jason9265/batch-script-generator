'use client';
import { useState } from 'react';
import axios from 'axios';
import ModelSelect from '../components/ModelSelect';
import InputGroup from '../components/InputGroup';
import ButtonGroup from '../components/ButtonGroup';
import ResultDisplay from '../components/ResultDisplay';
import FileUpload from '../components/FileUpload';
import ExecuteProcess from '../components/ExecuteProcess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [audience, setAudience] = useState('');
    const [scripts, setScripts] = useState([]);
    const [model, setModel] = useState('gemini');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);

    const handleGenerate = async () => {
        if (!file) {
            alert('请先上传数据文件');
            return;
        }

        try {
            // First analysis step
            setIsAnalyzing(true);
            const formData = new FormData();
            formData.append('file', file);
            
            const analysisRes = await axios.post('http://localhost:3000/api/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setAnalysisResult(analysisRes.data);
            setIsAnalyzing(false);
            
            // Second generation step
            setIsCompiling(true);
            const generationRes = await axios.post('http://localhost:3000/api/generate', {
                topics: analysisRes.data.topics,
                model,
                audience
            });
            
            setScripts(generationRes.data.scripts);
            console.log('生成结果:', generationRes.data);
            setIsCompiling(false);
            
        } catch (error) {
            console.error('处理失败:', error);
            alert('处理过程中发生错误');
        } finally {
            setLoading(false);
            setIsAnalyzing(false);
            setIsCompiling(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        setAudience('');
        setScripts([]);
        setFile(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-center text-gray-900">短视频剧本生成器</h1>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">生成设置</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>AI 模型</Label>
                            <ModelSelect model={model} setModel={setModel} />
                        </div>

                        <div className="space-y-2">
                            <Label>剧本主题</Label>
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="请输入剧本的主题或关键词"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>目标用户</Label>
                            <Input
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="请输入目标用户群体"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>数据文件</Label>
                            <FileUpload onFileChange={setFile} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">生成控制</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between gap-4">
                            <Button 
                                variant="secondary" 
                                onClick={handleClear}
                                className="flex-1"
                            >
                                清除设置
                            </Button>
                            <Button 
                                onClick={handleGenerate}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? '生成中...' : '开始生成'}
                            </Button>
                        </div>
                        
                        {loading && (
                            <div className="mt-4 space-y-2">
                                <Progress value={33} className="h-2" />
                                <p className="text-sm text-gray-500">正在分析输入并生成剧本...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {scripts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">生成结果</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResultDisplay scripts={scripts} />
                        </CardContent>
                    </Card>
                )}

                <ExecuteProcess
                    loading={loading}
                    hasFile={!!file}
                    isAnalyzing={isAnalyzing}
                    isCompiling={isCompiling}
                    topics={analysisResult?.topics}
                    isComplete={scripts.length > 0}
                />
            </div>
        </div>
    );
}
