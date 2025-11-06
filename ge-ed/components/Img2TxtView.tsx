
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { editImageWithText } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const Img2TxtView: React.FC = () => {
  const { setView, stockImages, incrementGeneratedImageCount } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(editImageWithText);

  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!imageFile || !prompt) {
      setError('画像とテキスト指示の両方を入力してください。');
      return;
    }
    setError(null);

    try {
      const imageData = await fileToData(imageFile.file);
      const result = await generate(imageData, prompt);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };
  
  const handleFileSelect = (file: ImageFile) => {
    setImageFile(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">IMG2IMG: 画像をテキストで編集</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 元の画像をアップロード</h3>
          <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="img2txt-upload" />
          <button
            onClick={() => setIsPickerOpen(true)}
            className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            ストックから選択
          </button>
          <StockImagePicker
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            stockImages={stockImages}
            onSelect={handleFileSelect}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">2. 編集指示を入力</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 帽子をかぶせて"
            className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !imageFile || !prompt}
            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : '生成'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mt-6">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">結果</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <h4 className="font-semibold mb-2">オリジナル画像</h4>
            {imageFile && <img src={imageFile.preview} alt="Original" className="rounded-lg shadow-lg mx-auto" />}
          </div>
          <div className="text-center">
            <h4 className="font-semibold mb-2">生成画像</h4>
            <ResultDisplay
              loading={loading}
              generatedImage={generatedImage}
              loadingMessage="AIが画像を編集中です..."
              idleMessage="ここに生成された画像が表示されます"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Img2TxtView;
