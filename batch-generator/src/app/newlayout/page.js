'use client';
import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, Download, Info, AlertCircle, Play, Square } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000';
const apiClient = axios.create({
  baseURL: API_BASE_URL
});

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [audience, setAudience] = useState('');
    const [scripts, setScripts] = useState([]);
    const [model, setModel] = useState('gemini');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.ms-excel')) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
            addLog('INFO', `已上传文件: ${selectedFile.name}`);
        } else {
            alert('请上传有效的CSV或Excel文件');
        }
    };

    const addLog = (type, message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type, message, timestamp }]);
    };

    const handleGenerate = async () => {
        if (!file) {
            alert('请先上传数据文件');
            return;
        }

        setLoading(true);
        // setLogs([]);
        
        try {
            addLog('INFO', '正在初始化分析环境...');
            addLog('INFO', `加载信息: 使用模型 ${model}`);
            
            const formData = new FormData();
            formData.append('file', file);
            
            addLog('INFO', `开始执行 ${fileName}`);
            
            const analysisRes = await apiClient.post('/api/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log(analysisRes.data);
            // 添加分析结果到日志
            addLog('INFO', `分析完成 - 检测到 ${analysisRes.data.topics?.length || 0} 个主题`);
            addLog('INFO', `主要关键词: ${analysisRes.data.topics?.join(', ') || '无'}`);
            addLog('INFO', `正在生成剧本...`);
            
            // Second generation step
            const generationRes = await apiClient.post('/api/generate', {
                topics: analysisRes.data.topics,
                model,
                audience
            });
            
            console.log('生成信息: ', generationRes.data);
            setScripts(generationRes.data.scripts);
            
            addLog('INFO', '剧本生成完成');
            
        } catch (error) {
            console.error('处理失败:', error);
            addLog('ERROR', `行号 127: ${error.message || '处理过程中发生错误'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setPrompt('');
        setAudience('');
        setScripts([]);
        setFile(null);
        setFileName('');
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航 */}
            <header className="border-b bg-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="text-2xl font-bold">logo</div>
                    <nav className="space-x-4">
                        <a href="#" className="text-gray-600">文档</a>
                        <a href="#" className="text-gray-600">API</a>
                        <a href="#" className="text-gray-600">帮助</a>
                    </nav>
                </div>
            </header>

            <div className="container mx-auto p-4 space-y-6">
                {/* 文件上传区域 */}
                <div className="bg-white rounded-lg p-4">
                    <h2 className="text-lg font-medium mb-3">文件上传</h2>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 mb-2">将文件拖放到此处，或</p>
                            <div>
                                <label htmlFor="file-upload" className="bg-blue-500 text-white px-3 py-1.5 rounded-md cursor-pointer hover:bg-blue-600 text-sm">
                                    选择文件
                                </label>
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    accept=".csv,.xls" 
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">支持的文件格式: .csv, .xls</p>
                            {fileName && (
                                <p className="text-sm text-green-600 mt-1">已选择: {fileName}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* 配置区域 */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">AI 模型</label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择模型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Google Gemini 2.0</SelectItem>
                                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                    <SelectItem value="deepseek-r1">DeepSeek-R1</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">剧本主题</label>
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="请输入剧本的主题或关键词"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">目标用户</label>
                            <Input
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="请输入目标用户群体"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 运行状态 */}
                    <div className="bg-white rounded-lg">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-medium">运行状态</h2>
                            <div className="flex space-x-3">
                                <div className="flex items-center">
                                    <div className={`h-2 w-2 rounded-full ${loading ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                                    <span className="text-sm">运行中</span>
                                </div>
                                <Button 
                                    variant={loading ? "destructive" : "default"}
                                    size="sm"
                                    onClick={loading ? handleClear : handleGenerate}
                                >
                                    {loading ? (
                                        <Square className="h-4 w-4 mr-1" />
                                    ) : (
                                        <Play className="h-4 w-4 mr-1" />
                                    )}
                                    {loading ? '停止' : '开始生成'}
                                </Button>
                            </div>
                        </div>
                        <div className="p-4 bg-black text-green-400 font-mono text-sm h-[300px] overflow-y-auto">
                            {logs.map((log, index) => (
                                <div key={index} className={`mb-1 ${log.type === 'ERROR' ? 'text-red-400' : log.type === 'DATA' ? 'text-gray-300 whitespace-pre-wrap' : 'text-green-400'}`}>
                                    [{log.type}] {log.timestamp} {log.message}
                                </div>
                            ))}
                            {logs.length === 0 && !loading && (
                                <div className="text-gray-500">等待用户输入...</div>
                            )}
                        </div>
                    </div>

                    {/* 运行结果 */}
                    <div className="bg-white rounded-lg">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-medium">运行结果</h2>
                            <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4 mr-1" /> 导出结果
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">序号</TableHead>
                                        <TableHead>文件名</TableHead>
                                        <TableHead>状态</TableHead>
                                        <TableHead>生成时间</TableHead>
                                        <TableHead className="w-[50px]">操作</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {scripts.length > 0 ? (
                                        scripts.map((script, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{`剧本_${index + 1}.txt`}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">成功</span>
                                                </TableCell>
                                                <TableCell>{new Date().toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <button className="text-blue-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                                                暂无生成结果
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
