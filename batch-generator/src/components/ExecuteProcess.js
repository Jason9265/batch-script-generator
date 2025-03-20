'use client';
import React from 'react';

export default function ExecuteProcess({ 
  loading, 
  hasFile, 
  isAnalyzing, 
  isCompiling, 
  topics,
  isComplete 
}) {
  return (
    <div className="mt-4 space-y-2 text-sm">
      {!loading && !isComplete && (
        <p className="text-muted-foreground">准备处理用户输入...</p>
      )}
      
      {hasFile && (
        <p className="text-green-600">✓ 已接收CSV/Excel文件</p>
      )}

      {isAnalyzing && (
        <p className="text-blue-600">分析文件中，提取关键主题...</p>
      )}

      {isCompiling && (
        <div className="space-y-1">
          <p className="text-blue-600">编译目标文件，检测到热门话题:</p>
          {topics && (
            <div className="flex gap-2 flex-wrap">
              {topics.map((topic, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                >
                  {typeof topic === 'object' ? topic.标签 : topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isComplete && (
        <p className="text-green-600">✓ 生成成功，共生成{topics?.length || 0}个相关主题剧本</p>
      )}
    </div>
  );
} 
