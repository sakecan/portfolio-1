
import React, { useState } from 'react';
import { ViewMode } from '../types';
import { generateImageFromText } from '../api/gemini';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const Txt2ImgView: React.FC = () => {
  const { setView, incrementGeneratedImageCount } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(generateImageFromText);
  
  const [prompt, setPrompt] = useState<string>('');

  const handleGenerate = async () => {
    if (!prompt) {
      setError('テキスト指示を入力してください。');
      return;
    }
    setError(null);
    const result = await generate(prompt);
    if (result) {
      incrementGeneratedImageCount();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">TXT2IMG: テキストから画像を生成</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-2">1. 生成したい画像の説明を入力</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例: 宇宙飛行士が馬に乗って火星を走っている写真"
          className="w-full h-40 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '生成'}
        </button>
      </div>

      {error && <p className="text-red-500 text-center mt-6">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">結果</h3>
        <div className="flex justify-center">
          <div className="w-full max-w-lg text-center">
            <ResultDisplay
              loading={loading}
              generatedImage={generatedImage}
              loadingMessage="AIが新しい画像を生成中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Txt2ImgView;
