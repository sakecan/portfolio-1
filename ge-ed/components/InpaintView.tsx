
import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, ImageFile, MaskEditorRef } from '../types';
import MaskEditor from './MaskEditor';
import { inpaintImage } from '../api/gemini';
import { fileToData, dataUrlToData } from '../services/utils';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const InpaintView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages, inpaintState, setInpaintState } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(inpaintImage);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const maskEditorRef = useRef<MaskEditorRef>(null);

  useEffect(() => {
    if (inpaintState && maskEditorRef.current) {
      maskEditorRef.current.loadImage(inpaintState.imageFile);
      
      if (inpaintState.prompt) {
        setPrompt(inpaintState.prompt);
      }

      setTimeout(() => {
        if (maskEditorRef.current) {
          maskEditorRef.current.loadMask(inpaintState.maskDataUrl);
        }
      }, 200);

      setInpaintState(null);
    }
  }, [inpaintState, setInpaintState]);

  const handleGenerate = async () => {
    if (!imageFile || !prompt || !maskEditorRef.current) {
      setError('画像、マスク、テキスト指示をすべて入力してください。');
      return;
    }

    const maskDataUrl = maskEditorRef.current.getImageData();
    if (maskDataUrl.length < 100) { // Simple check for empty canvas
        setError('マスク領域を描画してください。');
        return;
    }
    setError(null);
    
    try {
      const imagePart = await fileToData(imageFile.file);
      const maskPart = dataUrlToData(maskDataUrl);

      const result = await generate(imagePart, maskPart, prompt);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };
  
  const handleClear = () => {
      if (maskEditorRef.current) {
          maskEditorRef.current.clear();
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">インペイント処理</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 画像をアップロードし、マスク領域を描画</h3>
           <MaskEditor ref={maskEditorRef} onFileSelect={setImageFile} stockImages={stockImages} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">2. 編集指示を入力</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: サングラスを追加して"
            className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleClear}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300"
            >
              マスクをクリア
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !imageFile || !prompt}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? '生成中...' : '生成'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mt-6">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">結果</h3>
        <div className="flex justify-center">
            <div className="w-full max-w-lg text-center">
                <ResultDisplay
                    loading={loading}
                    generatedImage={generatedImage}
                    loadingMessage="AIがマスク領域を編集中です..."
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default InpaintView;
