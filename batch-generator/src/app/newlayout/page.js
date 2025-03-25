'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, Download, Play, Square } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3000';
const apiClient = axios.create({
  baseURL: API_BASE_URL
});

export default function Home() {
    const [prompt, setPrompt] = useState('');
    const [audience, setAudience] = useState('');
    const [files, setFiles] = useState([]);
    const [model, setModel] = useState('deepseek');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [fileName, setFileName] = useState('');
    const abortControllerRef = useRef(null);
    const [dots, setDots] = useState('');
    const [fileList, setFileList] = useState([]);

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
        abortControllerRef.current = new AbortController();
        setLoading(true);
        
        try {
            addLog('INFO', '正在初始化分析环境...');
            addLog('INFO', `加载信息: 使用模型 ${model}`);
            
            const formData = new FormData();
            formData.append('file', file);
            
            addLog('INFO', `开始执行 ${fileName}`);
            
            const analysisRes = await apiClient.post('/api/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current.signal
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
            }, {
                signal: abortControllerRef.current.signal
            });
            
            console.log('生成信息: ', generationRes.data);
            setFiles(generationRes.data.files);
            
            addLog('INFO', '剧本生成完成');
            
        } catch (error) {
            // 检查是否为取消请求导致的错误
            if (axios.isCancel(error) || error.name === 'AbortError' || error.name === 'CanceledError') {
                addLog('INFO', '用户主动停止生成');
                return; // 直接返回，不显示错误
            }
            
            console.error('处理失败:', error);
            addLog('ERROR', `生成失败: ${error.message || '未知错误'}`);
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
            fetchFiles();
        }
    };

    const handleAbort = () => {
        if (abortControllerRef.current) {
            try {
                abortControllerRef.current.abort();
                addLog('INFO', '正在停止生成...');
            } catch (error) {
                // 忽略中止过程中的错误
                console.log('停止过程中出现错误:', error);
            }
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleClear = async () => {
        const confirmed = window.confirm("删除文件后无法找回，您确定要继续吗？");
        if (confirmed) {
            // delete all scripts
        }
    };

    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setDots(prev => {
                    if (prev === '') return '.';
                    if (prev === '.') return '..';
                    if (prev === '..') return '...';
                    return '';
                });
            }, 500); // 每500ms更新一次
        }
        return () => clearInterval(interval);
    }, [loading]);

    const fetchFiles = async () => {
        try {
            const res = await apiClient.get('/api/scripts');
            setFileList(res.data.files);
        } catch (error) {
            console.error('获取文件列表失败:', error);
        }
    };

    // 在组件加载时调用
    useEffect(() => {
        fetchFiles();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 顶部导航 */}
            <header className="border-b bg-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <img
                            src="/images/black-ring-logo.svg"
                            alt="Logo"
                            className="h-8 w-auto"
                        />
                    </div>
                    <nav className="space-x-4">
                        <a href="#" className="text-gray-600">文档</a>
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
                                    <SelectItem value="deepseek">DeepSeek</SelectItem>
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
                                    <span className="text-sm">
                                        {loading ? `运行中${dots}` : '运行状态'}
                                    </span>
                                </div>
                                <Button 
                                    variant={loading ? "destructive" : "default"}
                                    size="sm"
                                    onClick={loading ? handleAbort : handleGenerate}
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
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={handleClear}
                            >
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                                清除所有结果
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
                                    {fileList.map((file, index) => (
                                        <TableRow key={file.name}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{file.name}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                    已生成
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(file.created).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    {/* 预览按钮 */}
                                                    <a
                                                        href={`${API_BASE_URL}${file.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="预览"
                                                    >
                                                        <svg 
                                                            xmlns="http://www.w3.org/2000/svg" 
                                                            className="h-4 w-4" 
                                                            viewBox="0 0 24 24" 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            strokeWidth="2"
                                                        >
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                            <circle cx="12" cy="12" r="3"/>
                                                        </svg>
                                                    </a>
                                                    
                                                    {/* 下载按钮 */}
                                                    <a 
                                                        href={`${API_BASE_URL}${file.url}`} 
                                                        download
                                                        className="text-green-500 hover:text-green-700"
                                                        title="下载"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
