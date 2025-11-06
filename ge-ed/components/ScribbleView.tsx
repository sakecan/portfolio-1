
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ViewMode, ScribbleEditorRef } from '../types';
import ScribbleEditor from './ScribbleEditor';
import { generateImageFromScribble } from '../api/gemini';
import { dataUrlToData } from '../services/utils';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const ART_STYLES = [
  '劇画',
  '少女漫画',
  'アメコミ風',
  'メルヘン',
  'いわさきちひろ風',
  'ジブリ風'
];

const ScribbleView: React.FC = () => {
  const { setView, incrementGeneratedImageCount } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError, setData: setGeneratedImage } = useGeminiApi(generateImageFromScribble);

  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>(ART_STYLES[0]);

  const scribbleEditorRef = useRef<ScribbleEditorRef>(null);
  const generationTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const initialMount = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!scribbleEditorRef.current) return;
    
    const scribbleDataUrl = scribbleEditorRef.current.getImageData();
    if (scribbleDataUrl.length < 200) { // Simple check for empty canvas
      return;
    }
    if (!prompt.trim()) {
      setError('何を描くか入力してください。');
      return;
    }
    setError(null);

    try {
      const scribblePart = dataUrlToData(scribbleDataUrl);
      const result = await generate(scribblePart, selectedStyle, prompt);
      if (result && isMountedRef.current) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
        console.error(e)
        if (isMountedRef.current) {
            setError('画像の準備中にエラーが発生しました。');
        }
    }
  }, [prompt, selectedStyle, incrementGeneratedImageCount, generate, setError]);

  const debouncedGenerate = useCallback(() => {
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }
    generationTimeoutRef.current = window.setTimeout(() => {
      handleGenerate();
    }, 750); // 750ms debounce
  }, [handleGenerate]);

  // Trigger generation on changes, but not on initial mount
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
    } else {
      debouncedGenerate();
    }
  }, [prompt, selectedStyle, debouncedGenerate]);

  const handleClear = () => {
    if (scribbleEditorRef.current) {
      scribbleEditorRef.current.clear();
      setGeneratedImage(null);
      setPrompt('');
      setError(null);
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">マウスで絵を描く</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. ラフ画を描く</h3>
          <ScribbleEditor ref={scribbleEditorRef} onDrawEnd={debouncedGenerate} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">2. 何を描くか入力</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 雲の上に浮かぶ城"
            className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <h3 className="text-lg font-semibold mt-4 mb-2">3. 絵柄を選択</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {ART_STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`p-3 rounded-lg transition-colors text-center text-sm ${
                  selectedStyle === style
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleClear}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300"
            >
              クリア
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mt-6">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">結果 (描画や入力を止めると自動で更新されます)</h3>
        <div className="flex justify-center">
            <div className="w-full max-w-lg text-center">
                 <ResultDisplay
                    loading={loading}
                    generatedImage={generatedImage}
                    loadingMessage="AIがラフ画から画像を生成中です..."
                    idleMessage="ここに生成された画像が表示されます"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScribbleView;
