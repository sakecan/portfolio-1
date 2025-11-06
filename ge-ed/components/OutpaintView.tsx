
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { outpaintImage } from '../api/gemini';
import { dataUrlToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const ASPECT_RATIOS = ['16:9', '4:3', '1:1', '3:4', '9:16'];
const POSITIONS = [
    { key: 'top-left', label: '↖' }, { key: 'top-center', label: '↑' }, { key: 'top-right', label: '↗' },
    { key: 'middle-left', label: '←' }, { key: 'center', label: '中央' }, { key: 'middle-right', label: '→' },
    { key: 'bottom-left', label: '↙' }, { key: 'bottom-center', label: '↓' }, { key: 'bottom-right', label: '↘' },
];

const OutpaintView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(outpaintImage);

  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [position, setPosition] = useState<string>('center');
  const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!imageFile) {
      setError('画像をアップロードしてください。');
      return;
    }
    setError(null);
    setProcessedImagePreview(null);

    const image = new Image();
    image.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Canvas context could not be retrieved.');
        }
        
        const [targetW, targetH] = aspectRatio.split(':').map(Number);
        const targetRatio = targetW / targetH;

        let canvasWidth = image.width;
        let canvasHeight = image.height;
        
        if (image.width / image.height > targetRatio) {
            canvasHeight = image.width / targetRatio;
        } else {
            canvasWidth = image.height * targetRatio;
        }

        const MAX_DIMENSION = 1024;
        let scale = 1;
        if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION) {
            if (canvasWidth > canvasHeight) {
                scale = MAX_DIMENSION / canvasWidth;
            } else {
                scale = MAX_DIMENSION / canvasHeight;
            }
        }
        
        canvas.width = canvasWidth * scale;
        canvas.height = canvasHeight * scale;
        
        const scaledImageWidth = image.width * scale;
        const scaledImageHeight = image.height * scale;

        let offsetX = 0;
        let offsetY = 0;

        switch (position) {
            case 'top-left': offsetX = 0; offsetY = 0; break;
            case 'top-center': offsetX = (canvas.width - scaledImageWidth) / 2; offsetY = 0; break;
            case 'top-right': offsetX = canvas.width - scaledImageWidth; offsetY = 0; break;
            case 'middle-left': offsetX = 0; offsetY = (canvas.height - scaledImageHeight) / 2; break;
            case 'center': offsetX = (canvas.width - scaledImageWidth) / 2; offsetY = (canvas.height - scaledImageHeight) / 2; break;
            case 'middle-right': offsetX = canvas.width - scaledImageWidth; offsetY = (canvas.height - scaledImageHeight) / 2; break;
            case 'bottom-left': offsetX = 0; offsetY = canvas.height - scaledImageHeight; break;
            case 'bottom-center': offsetX = (canvas.width - scaledImageWidth) / 2; offsetY = canvas.height - scaledImageHeight; break;
            case 'bottom-right': offsetX = canvas.width - scaledImageWidth; offsetY = canvas.height - scaledImageHeight; break;
        }

        ctx.drawImage(image, offsetX, offsetY, scaledImageWidth, scaledImageHeight);
        
        const dataUrl = canvas.toDataURL('image/png');
        setProcessedImagePreview(dataUrl);

        const imagePart = dataUrlToData(dataUrl);
        const result = await generate(imagePart, prompt);
        if (result) {
            incrementGeneratedImageCount();
        }

      } catch (e) {
        console.error(e);
        setError('画像の準備中にエラーが発生しました。');
      }
    };
    image.onerror = () => {
      setError('画像の読み込みに失敗しました。');
    }
    image.src = imageFile.preview;
  };
  
  const handleFileSelect = (file: ImageFile) => {
    setImageFile(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">アウトペイント処理</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 元の画像をアップロード</h3>
          <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="outpaint-upload" />
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
          <h3 className="text-lg font-semibold mb-2">2. 拡張後のアスペクト比を選択</h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={`p-2 rounded-lg transition-colors ${
                  aspectRatio === ar
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {ar}
              </button>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-2">3. 拡張する方向を選択</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
             {POSITIONS.map((pos) => (
              <button
                key={pos.key}
                onClick={() => setPosition(pos.key)}
                className={`p-3 rounded-lg transition-colors text-lg font-mono ${
                  position === pos.key
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-2">4. 追加する要素の指示 (任意)</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 背景に壮大な山々を追加して"
            className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
            <h4 className="font-semibold mb-2">入力画像 (拡張後)</h4>
            {loading && !processedImagePreview ? (
              <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">処理中...</div>
            ) : processedImagePreview ? (
              <img src={processedImagePreview} alt="Processed" className="rounded-lg shadow-lg mx-auto" style={{background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%234a5568\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%234a5568\'/%3E%3Crect width=\'20\' height=\'20\' fill=\'%232d3748\' fill-opacity=\'0.6\'/%3E%3C/svg%3E")'}}/>
            ) : (
               <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">ここに生成用の入力画像が表示されます</div>
            )}
          </div>
          <div className="text-center">
            <h4 className="font-semibold mb-2">生成画像</h4>
            <ResultDisplay
              loading={loading}
              generatedImage={generatedImage}
              loadingMessage="AIが画像の続きを描画中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutpaintView;
