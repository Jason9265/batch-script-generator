'use client';
import { RingLoader } from 'react-spinners';

export default function ResultDisplay({ scripts, loading }) {
    return (
        <div className="result mt-6">
            <h2 className="text-xl font-bold mb-4">生成的剧本选项</h2>
            {loading ? (
                <div className="flex justify-center items-center">
                    <RingLoader color="#3498db" size={60} />
                </div>
            ) : (
                scripts.map((script, index) => (
                    <div key={index} className="mb-4">
                        <h3 className="text-lg font-semibold">选项 {index + 1}</h3>
                        <pre className="bg-gray-100 p-2 border border-gray-300 rounded">{script}</pre>
                    </div>
                ))
            )}
        </div>
    );
}