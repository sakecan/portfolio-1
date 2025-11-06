
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { createFace } from '../api/gemini';
import { fileToData, ImageData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const FaceCreationView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(createFace);

  const [baseFace, setBaseFace] = useState<ImageFile | null>(null);
  const [eyelashes, setEyelashes] = useState<ImageFile | null>(null);
  const [eyes, setEyes] = useState<ImageFile | null>(null);
  const [nose, setNose] = useState<ImageFile | null>(null);
  const [mouth, setMouth] = useState<ImageFile | null>(null);
  const [ears, setEars] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [verticalAngle, setVerticalAngle] = useState<number>(0);
  const [horizontalAngle, setHorizontalAngle] = useState<number>(0);

  const [pickerTarget, setPickerTarget] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!baseFace) {
      setError('顔全体の画像をアップロードしてください。');
      return;
    }
    setError(null);
    
    try {
      const labeledParts: { label: string; data: ImageData }[] = [];
      labeledParts.push({ label: 'base_face', data: await fileToData(baseFace.file) });

      if (eyelashes) labeledParts.push({ label: 'eyelashes', data: await fileToData(eyelashes.file) });
      if (eyes) labeledParts.push({ label: 'eyes', data: await fileToData(eyes.file) });
      if (nose) labeledParts.push({ label: 'nose', data: await fileToData(nose.file) });
      if (mouth) labeledParts.push({ label: 'mouth', data: await fileToData(mouth.file) });
      if (ears) labeledParts.push({ label: 'ears', data: await fileToData(ears.file) });

      const result = await generate(labeledParts, horizontalAngle, verticalAngle, prompt);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };

  const openPicker = (target: string) => setPickerTarget(target);

  const handleSelectFromStock = (image: ImageFile) => {
    switch (pickerTarget) {
      case 'baseFace': setBaseFace(image); break;
      case 'eyelashes': setEyelashes(image); break;
      case 'eyes': setEyes(image); break;
      case 'nose': setNose(image); break;
      case 'mouth': setMouth(image); break;
      case 'ears': setEars(image); break;
    }
    setPickerTarget(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">顔の作成プログラム</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. 顔全体 (必須)</h3>
            <FileUpload onFileSelect={setBaseFace} previewUrl={baseFace?.preview} id="face-base-upload" />
            <button onClick={() => openPicker('baseFace')} className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300">
              ストックから選択
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">2. 合成するパーツ (任意)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1 text-center">まつげ</h4>
                <div className="relative">
                  <FileUpload onFileSelect={setEyelashes} previewUrl={eyelashes?.preview} id="face-eyelashes-upload" />
                  {eyelashes && (
                    <button
                      onClick={() => setEyelashes(null)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center z-10 leading-none text-xl p-1 transition-transform transform hover:scale-110"
                      aria-label="まつげ画像を削除"
                    >
                      <span className="mb-1">&times;</span>
                    </button>
                  )}
                </div>
                <button onClick={() => openPicker('eyelashes')} className="w-full mt-1 text-xs bg-gray-700 hover:bg-gray-600 py-1 rounded">Stock</button>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1 text-center">目</h4>
                <div className="relative">
                  <FileUpload onFileSelect={setEyes} previewUrl={eyes?.preview} id="face-eyes-upload" />
                  {eyes && (
                    <button
                      onClick={() => setEyes(null)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center z-10 leading-none text-xl p-1 transition-transform transform hover:scale-110"
                      aria-label="目画像を削除"
                    >
                      <span className="mb-1">&times;</span>
                    </button>
                  )}
                </div>
                 <button onClick={() => openPicker('eyes')} className="w-full mt-1 text-xs bg-gray-700 hover:bg-gray-600 py-1 rounded">Stock</button>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1 text-center">鼻</h4>
                <div className="relative">
                  <FileUpload onFileSelect={setNose} previewUrl={nose?.preview} id="face-nose-upload" />
                  {nose && (
                    <button
                      onClick={() => setNose(null)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center z-10 leading-none text-xl p-1 transition-transform transform hover:scale-110"
                      aria-label="鼻画像を削除"
                    >
                      <span className="mb-1">&times;</span>
                    </button>
                  )}
                </div>
                 <button onClick={() => openPicker('nose')} className="w-full mt-1 text-xs bg-gray-700 hover:bg-gray-600 py-1 rounded">Stock</button>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1 text-center">口</h4>
                <div className="relative">
                  <FileUpload onFileSelect={setMouth} previewUrl={mouth?.preview} id="face-mouth-upload" />
                  {mouth && (
                    <button
                      onClick={() => setMouth(null)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center z-10 leading-none text-xl p-1 transition-transform transform hover:scale-110"
                      aria-label="口画像を削除"
                    >
                      <span className="mb-1">&times;</span>
                    </button>
                  )}
                </div>
                 <button onClick={() => openPicker('mouth')} className="w-full mt-1 text-xs bg-gray-700 hover:bg-gray-600 py-1 rounded">Stock</button>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1 text-center">耳</h4>
                <div className="relative">
                  <FileUpload onFileSelect={setEars} previewUrl={ears?.preview} id="face-ears-upload" />
                  {ears && (
                    <button
                      onClick={() => setEars(null)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center z-10 leading-none text-xl p-1 transition-transform transform hover:scale-110"
                      aria-label="耳画像を削除"
                    >
                      <span className="mb-1">&times;</span>
                    </button>
                  )}
                </div>
                 <button onClick={() => openPicker('ears')} className="w-full mt-1 text-xs bg-gray-700 hover:bg-gray-600 py-1 rounded">Stock</button>
              </div>
            </div>
          </div>
           <div>
            <h3 className="text-lg font-semibold mb-2">3. 顔の向きをスライダーで設定</h3>
             <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div>
                  <label htmlFor="vertical-slider" className="block text-sm font-medium text-gray-300 mb-1">
                    上下視点: <span className="font-bold text-cyan-400">{verticalAngle}°</span> {verticalAngle > 0 ? '(ハイアングル)' : verticalAngle < 0 ? '(ローアングル)' : ''}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">下</span>
                    <input
                      id="vertical-slider"
                      type="range"
                      min="-90"
                      max="90"
                      value={verticalAngle}
                      onChange={(e) => setVerticalAngle(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">上</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="horizontal-slider" className="block text-sm font-medium text-gray-300 mb-1">
                    左右視点: <span className="font-bold text-cyan-400">{horizontalAngle}°</span> {horizontalAngle > 0 ? '(右向き)' : horizontalAngle < 0 ? '(左向き)' : ''}
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">左</span>
                    <input
                      id="horizontal-slider"
                      type="range"
                      min="-90"
                      max="90"
                      value={horizontalAngle}
                      onChange={(e) => setHorizontalAngle(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400">右</span>
                  </div>
                </div>
            </div>
          </div>
           <div>
            <h3 className="text-lg font-semibold mb-2">4. 追加指示 (任意)</h3>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例: 微笑ませてください、若くしてください"
                className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !baseFace}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? '合成中...' : '合成'}
          </button>
        </div>
        
        {/* Right Column: Result */}
        <div>
           <h3 className="text-xl font-bold mb-4 text-center">結果</h3>
            <div className="w-full max-w-lg mx-auto text-center">
                <ResultDisplay
                    loading={loading}
                    generatedImage={generatedImage}
                    loadingMessage="AIが顔のパーツを合成中です..."
                    idleMessage="ここに合成された顔が表示されます"
                />
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
    </div>
  );
};

export default FaceCreationView;
