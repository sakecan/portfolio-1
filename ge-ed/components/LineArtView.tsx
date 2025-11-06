
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { extractLineArt } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const LineArtView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(extractLineArt);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleGenerate = async () => {
    if (!imageFile) {
      setError('画像をアップロードしてください。');
      return;
    }
    setError(null);
    
    try {
      const imagePart = await fileToData(imageFile.file);
      const result = await generate(imagePart);
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
        <h2 className="text-2xl font-bold">線画抽出</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold mb-2">1. 線画を抽出したい画像をアップロード</h3>
        <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="lineart-upload" />
        <div className="flex space-x-2 mt-2">
            <button
                onClick={() => setIsPickerOpen(true)}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
                ストックから選択
            </button>
            <button
                onClick={handleGenerate}
                disabled={loading || !imageFile}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {loading ? '抽出中...' : '線画を抽出'}
            </button>
        </div>
        <StockImagePicker
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            stockImages={stockImages}
            onSelect={handleFileSelect}
        />
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
            <h4 className="font-semibold mb-2">抽出された線画</h4>
            <ResultDisplay
              loading={loading}
              generatedImage={generatedImage}
              loadingMessage="AIが線画を抽出中です..."
              isResultWhiteBg={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineArtView;
