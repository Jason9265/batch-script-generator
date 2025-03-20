'use client';

export default function InputGroup({ label, id, value, onChange, placeholder }) {
    return (
        <div className="mb-4 w-full">
            <label htmlFor={id} className="block mb-2 text-gray-700">{label}</label>
            <input
                type="text"
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}