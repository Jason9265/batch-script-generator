'use client';

export default function ButtonGroup({ onClear, onGenerate }) {
    return (
        <div className="button-group">
            <button className="bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded hover:bg-gray-400 transition duration-200" onClick={onClear}>清除</button>
            <button className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-200" onClick={onGenerate}>生成</button>
        </div>
    );
}