
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { faceSwap } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const FaceSwapView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(faceSwap);

  const [sourceImage, setSourceImage] = useState<ImageFile | null>(null);
  const [destImage, setDestImage] = useState<ImageFile | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'source' | 'dest' | null>(null);

  const handleGenerate = async () => {
    if (!sourceImage || !destImage) {
      setError('元の顔と合成先の画像を両方アップロードしてください。');
      return;
    }
    setError(null);

    try {
      const sourcePart = await fileToData(sourceImage.file);
      const destPart = await fileToData(destImage.file);
      const result = await generate(sourcePart, destPart);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };

  const handleSelectFromStock = (image: ImageFile) => {
    if (pickerTarget === 'source') {
        setSourceImage(image);
    } else if (pickerTarget === 'dest') {
        setDestImage(image);
    }
    setPickerTarget(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">顔の交換</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 元の顔 (Source)</h3>
          <FileUpload onFileSelect={setSourceImage} previewUrl={sourceImage?.preview} id="faceswap-source-upload" />
          <button onClick={() => setPickerTarget('source')} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
            ストックから選択
          </button>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">2. 合成先の画像 (Destination)</h3>
          <FileUpload onFileSelect={setDestImage} previewUrl={destImage?.preview} id="faceswap-dest-upload" />
          <button onClick={() => setPickerTarget('dest')} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
            ストックから選択
          </button>
        </div>
      </div>
      
      <StockImagePicker
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        stockImages={stockImages}
        onSelect={handleSelectFromStock}
      />

      <div className="mt-6">
        <button
          onClick={handleGenerate}
          disabled={loading || !sourceImage || !destImage}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {loading ? '交換中...' : '顔を交換する'}
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
                loadingMessage="AIが顔を交換中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceSwapView;
