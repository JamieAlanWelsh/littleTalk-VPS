import "vite/modulepreload-polyfill";
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 border border-gray-300 w-48 rounded-lg bg-white shadow-md">
        <p className="text-lg font-semibold text-blue-800 mb-4">
          Count: <span className="text-blue-600">{count}</span>
        </p>
        <button
          onClick={() => setCount(count + 1)}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
        >
          Increment
        </button>
      </div>
    </div>
  );
}
