
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { mergeImages } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const ImgMergeView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(mergeImages);

  const [imageFile1, setImageFile1] = useState<ImageFile | null>(null);
  const [imageFile2, setImageFile2] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [pickerTarget, setPickerTarget] = useState<'image1' | 'image2' | null>(null);

  const handleGenerate = async () => {
    if (!imageFile1 || !imageFile2 || !prompt) {
      setError('2枚の画像とテキスト指示をすべて入力してください。');
      return;
    }
    setError(null);

    try {
      const imagePart1 = await fileToData(imageFile1.file);
      const imagePart2 = await fileToData(imageFile2.file);
      const result = await generate(imagePart1, imagePart2, prompt);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };

  const handleSelectFromStock = (image: ImageFile) => {
    if (pickerTarget === 'image1') {
        setImageFile1(image);
    } else if (pickerTarget === 'image2') {
        setImageFile2(image);
    }
    setPickerTarget(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">二枚の画像を合成する</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 画像1をアップロード</h3>
          <FileUpload onFileSelect={setImageFile1} previewUrl={imageFile1?.preview} id="merge-upload-1" />
          <button onClick={() => setPickerTarget('image1')} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
            ストックから選択
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">2. 画像2をアップロード</h3>
          <FileUpload onFileSelect={setImageFile2} previewUrl={imageFile2?.preview} id="merge-upload-2" />
          <button onClick={() => setPickerTarget('image2')} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
            ストックから選択
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">3. 合成指示を入力</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="例: 1枚目の人物を2枚目の風景の中に立たせてください"
            className="w-full h-48 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !imageFile1 || !imageFile2 || !prompt}
            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : '生成'}
          </button>
        </div>
      </div>
      
      <StockImagePicker
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        stockImages={stockImages}
        onSelect={handleSelectFromStock}
      />

      {error && <p className="text-red-500 text-center mt-6">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">結果</h3>
        <div className="flex justify-center">
          <div className="w-full max-w-lg text-center">
            <ResultDisplay
                loading={loading}
                generatedImage={generatedImage}
                loadingMessage="AIが画像を合成中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImgMergeView;
