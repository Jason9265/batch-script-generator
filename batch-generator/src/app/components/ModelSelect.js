import React from 'react';

const ModelSelect = ({ model, setModel }) => {
    return (
        <div className="mb-4 w-full">
            <label htmlFor="ai-model" className="block mb-2 text-gray-700">选择AI模型:</label>
            <select
                id="ai-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
            >
                <option value="gemini">Gemini</option>
                {/* <option value="chatgpt">ChatGPT</option> */}
            </select>
        </div>
    );
};

export default ModelSelect;