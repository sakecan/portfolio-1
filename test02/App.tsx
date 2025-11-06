
import React, { useState, useCallback } from 'react';

const App: React.FC = () => {
  const [num1, setNum1] = useState<string>('');
  const [num2, setNum2] = useState<string>('');
  const [sum, setSum] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const handleCalculate = useCallback(() => {
    setError('');
    setSum(null);

    const n1 = parseFloat(num1);
    const n2 = parseFloat(num2);

    if (isNaN(n1) || isNaN(n2)) {
      setError('有効な数値を両方の入力欄に入力してください。');
      return;
    }

    setSum(n1 + n2);
  }, [num1, num2]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 flex items-center justify-center min-h-screen font-sans">
      <div className="w-full max-w-md mx-4 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">加算プログラム</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">二つの数字を足し算します</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="num1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数値 1
            </label>
            <input
              id="num1"
              type="text"
              inputMode="decimal"
              value={num1}
              onChange={(e) => setNum1(e.target.value)}
              placeholder="最初の数値を入力"
              className="w-full px-4 py-3 text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="num2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数値 2
            </label>
            <input
              id="num2"
              type="text"
              inputMode="decimal"
              value={num2}
              onChange={(e) => setNum2(e.target.value)}
              placeholder="次の数値を入力"
              className="w-full px-4 py-3 text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleCalculate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transform hover:-translate-y-1 transition-all duration-300"
          >
            計算
          </button>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg text-center">
            {error}
          </div>
        )}

        {sum !== null && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">計算結果:</p>
            <p className="text-5xl font-bold text-gray-900 dark:text-white mt-2 animate-pulse">
              {sum}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
