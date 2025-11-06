
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { changeCameraPosition } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const CameraPositionView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(changeCameraPosition);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [verticalAngle, setVerticalAngle] = useState<number>(0);
  const [horizontalAngle, setHorizontalAngle] = useState<number>(0);
  const [prompt, setPrompt] = useState<string>('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!imageFile) {
      setError('画像をアップロードしてください。');
      return;
    }
    setError(null);

    try {
      const imagePart = await fileToData(imageFile.file);
      const result = await generate(imagePart, verticalAngle, horizontalAngle, prompt);
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
        <h2 className="text-2xl font-bold">カメラ位置の変更</h2>
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
          <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="cam-pos-upload" />
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
          <h3 className="text-lg font-semibold mb-2">2. カメラ視点をスライダーで設定</h3>
          <div className="space-y-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div>
              <label htmlFor="vertical-slider" className="block text-sm font-medium text-gray-300 mb-2">
                上下視点: <span className="font-bold text-cyan-400">{verticalAngle}°</span> {verticalAngle > 0 ? '(ハイアングル)' : verticalAngle < 0 ? '(ローアングル)' : ''}
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">下 (-90°)</span>
                <input
                  id="vertical-slider"
                  type="range"
                  min="-90"
                  max="90"
                  value={verticalAngle}
                  onChange={(e) => setVerticalAngle(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400">上 (90°)</span>
              </div>
            </div>
            <div>
              <label htmlFor="horizontal-slider" className="block text-sm font-medium text-gray-300 mb-2">
                左右視点: <span className="font-bold text-cyan-400">{horizontalAngle}°</span> {horizontalAngle > 0 ? '(右から)' : horizontalAngle < 0 ? '(左から)' : ''}
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400">左 (-90°)</span>
                <input
                  id="horizontal-slider"
                  type="range"
                  min="-90"
                  max="90"
                  value={horizontalAngle}
                  onChange={(e) => setHorizontalAngle(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400">右 (90°)</span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold mt-6 mb-2">3. カメラ位置に対するプロンプト (任意)</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 被写体の顔がはっきりと見えるように"
            className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !imageFile}
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
              loadingMessage="AIがカメラ位置を調整中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPositionView;
