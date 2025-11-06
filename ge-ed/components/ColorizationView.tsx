
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { colorizeImage } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const ColorizationView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(colorizeImage);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [hairColor, setHairColor] = useState<string>('');
  const [skinColor, setSkinColor] = useState<string>('');
  const [clothingColor, setClothingColor] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!imageFile) {
      setError('画像をアップロードしてください。');
      return;
    }
    setError(null);

    try {
      const imagePart = await fileToData(imageFile.file);
      const result = await generate(imagePart, mode, hairColor, skinColor, clothingColor);
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
        <h2 className="text-2xl font-bold">彩色プログラム</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 線画をアップロード</h3>
          <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="colorization-upload" />
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
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">2. 彩色モードを選択</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('auto')}
                className={`p-3 rounded-lg transition-colors ${
                  mode === 'auto' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                自動
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`p-3 rounded-lg transition-colors ${
                  mode === 'manual' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                マニュアル
              </button>
            </div>
          </div>
          
          {mode === 'manual' && (
            <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-center">3. 色を指定 (任意)</h3>
              <div>
                <label htmlFor="hair-color" className="block text-sm font-medium text-gray-300 mb-1">髪の色</label>
                <input
                  id="hair-color"
                  type="text"
                  value={hairColor}
                  onChange={(e) => setHairColor(e.target.value)}
                  placeholder="例: 金色"
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="skin-color" className="block text-sm font-medium text-gray-300 mb-1">肌の色</label>
                <input
                  id="skin-color"
                  type="text"
                  value={skinColor}
                  onChange={(e) => setSkinColor(e.target.value)}
                  placeholder="例: 健康的な肌色"
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="clothing-color" className="block text-sm font-medium text-gray-300 mb-1">服の色</label>
                <input
                  id="clothing-color"
                  type="text"
                  value={clothingColor}
                  onChange={(e) => setClothingColor(e.target.value)}
                  placeholder="例: 青いシャツと白いスカート"
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !imageFile}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? '彩色中...' : '彩色する'}
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
              loadingMessage="AIが線画を彩色中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorizationView;
