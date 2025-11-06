
import React, { useState, useRef } from 'react';
import { ViewMode, ImageFile, MaskEditorRef } from '../types';
import FileUpload from './FileUpload';
import MaskEditor from './MaskEditor';
import { createPoster } from '../api/gemini';
import { fileToData, dataUrlToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const PosterCreationView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(createPoster);

  const [backgroundImageFile, setBackgroundImageFile] = useState<ImageFile | null>(null);
  const [subjectImageFile, setSubjectImageFile] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [pickerTarget, setPickerTarget] = useState<'background' | 'subject' | null>(null);
  const maskEditorRef = useRef<MaskEditorRef>(null);

  const handleGenerate = async () => {
    if (!backgroundImageFile || !subjectImageFile || !maskEditorRef.current) {
      setError('背景画像、マスク、はめ込む画像をすべて用意してください。');
      return;
    }
    
    const maskDataUrl = maskEditorRef.current.getImageData();
    if (maskDataUrl.length < 100) { // Simple check for empty canvas
        setError('マスク領域を描画してください。');
        return;
    }
    setError(null);

    try {
      const backgroundImagePart = await fileToData(backgroundImageFile.file);
      const subjectImagePart = await fileToData(subjectImageFile.file);
      const maskPart = dataUrlToData(maskDataUrl);

      const result = await generate(backgroundImagePart, subjectImagePart, maskPart, prompt);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };
  
  const handleClearMask = () => {
    if (maskEditorRef.current) {
        maskEditorRef.current.clear();
    }
  };

  const handleSelectFromStock = (image: ImageFile) => {
    if (pickerTarget === 'background') {
        setBackgroundImageFile(image);
    } else if (pickerTarget === 'subject') {
        setSubjectImageFile(image);
    }
    setPickerTarget(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold">インペイントでポスター作製</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>
      <p className="text-gray-400 mb-6 text-center max-w-3xl mx-auto">
        背景画像に、はめ込みたい画像の被写体をAIがインペイント（描き込み合成）します。マスク領域を描いて、合成したい場所を指定してください。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
            <h3 className="text-lg font-semibold mb-2">1. 背景画像をアップロードし、マスク領域を描画</h3>
            <MaskEditor ref={maskEditorRef} onFileSelect={setBackgroundImageFile} stockImages={stockImages} />
        </div>
        <div>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">2. はめ込む画像をアップロード</h3>
                    <FileUpload onFileSelect={setSubjectImageFile} previewUrl={subjectImageFile?.preview} id="poster-subject-upload" />
                    <button onClick={() => setPickerTarget('subject')} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
                        ストックから選択
                    </button>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">3. 追加指示 (任意)</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="例: 被写体を半透明にする、SF風のホログラムのように見せる"
                        className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <div className="flex space-x-4">
                    <button
                      onClick={handleClearMask}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300"
                    >
                      マスクをクリア
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !backgroundImageFile || !subjectImageFile}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {loading ? '作成中...' : 'インペイントで作成'}
                    </button>
                </div>
            </div>
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
        <h3 className="text-xl font-bold mb-4 text-center">完成したポスター</h3>
        <div className="flex justify-center">
          <div className="w-full max-w-lg text-center">
            <ResultDisplay
              loading={loading}
              generatedImage={generatedImage}
              loadingMessage="AIがインペイント処理を開始しました... 指定された領域に画像を自然に合成しています。しばらくお待ちください。"
              idleMessage="ここに作成されたポスターが表示されます"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterCreationView;
