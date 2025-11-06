
import React, { useState, useEffect } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { changeExpression } from '../api/gemini';
import { dataUrlToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const emotions = [
  { id: 'joy', label: '喜び' },
  { id: 'anger', label: '怒り' },
  { id: 'sadness', label: '悲しみ' },
  { id: 'ecstasy', label: '恍惚' },
  { id: 'pain', label: '痛み' },
] as const;

type EmotionId = typeof emotions[number]['id'];

const parts = [
  { id: 'rightEye', label: '右目' },
  { id: 'leftEye', label: '左目' },
  { id: 'mouth', label: '口' },
] as const;

type PartId = typeof parts[number]['id'];

const ExpressionView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError, setData: setGeneratedImage } = useGeminiApi(changeExpression);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [usePartControls, setUsePartControls] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [emotionValues, setEmotionValues] = useState<Record<EmotionId, number>>(
    {
      joy: 0,
      anger: 0,
      sadness: 0,
      ecstasy: 0,
      pain: 0,
    }
  );
  
  const [partValues, setPartValues] = useState<Record<PartId, number>>({
    rightEye: 0,
    leftEye: 0,
    mouth: 0,
  });

  useEffect(() => {
    if (!usePartControls) {
      setPartValues({
        rightEye: 0,
        leftEye: 0,
        mouth: 0,
      });
    }
  }, [usePartControls]);

  const handleEmotionSliderChange = (emotionId: EmotionId, value: number) => {
    setEmotionValues(prev => ({ ...prev, [emotionId]: value }));
  };
  
  const handlePartSliderChange = (partId: PartId, value: number) => {
    setPartValues(prev => ({ ...prev, [partId]: value }));
  };
  
  const hasEmotionSelection = Object.values(emotionValues).some((v: number) => v > 0);
  const hasPartSelection = usePartControls && Object.values(partValues).some((v: number) => v !== 0);
  const hasPrompt = customPrompt.trim() !== '';
  const hasSelection = hasEmotionSelection || hasPartSelection || hasPrompt;

  const handleGenerate = async () => {
    const currentImage = generatedImage || imageFile?.preview;
    if (!currentImage || !hasSelection) {
      setError('画像と、変更したい表情の強度、パーツの開閉、または追加指示のいずれかを設定してください。');
      return;
    }
    setError(null);

    try {
      const imagePart = dataUrlToData(currentImage);
      
      const activeEmotions = emotions
        .map(e => ({ ...e, value: emotionValues[e.id] }))
        .filter(e => e.value > 0);
        
      const activeParts = usePartControls 
        ? parts
            .map(p => ({ ...p, value: partValues[p.id] }))
            .filter(p => p.value !== 0)
        : [];
      
      const expressionPrompts = activeEmotions.map(e => {
        let intensityDesc = '';
        if (e.value < 25) intensityDesc = 'a hint of';
        else if (e.value < 50) intensityDesc = 'slight';
        else if (e.value < 75) intensityDesc = '';
        else intensityDesc = 'strong';
        
        return `${intensityDesc} ${e.id} (${e.value}%)`.trim();
      });

      const partPrompts = activeParts.map(p => {
         const partName = p.id === 'rightEye' ? 'right eye' : p.id === 'leftEye' ? 'left eye' : 'mouth';
         const direction = p.value > 0 ? 'open' : 'closed';
         const percentage = Math.abs(p.value);
         return `${partName} is ${percentage}% ${direction}`;
      });

      const allPrompts = [...expressionPrompts, ...partPrompts];
      if (customPrompt.trim()) {
        allPrompts.push(customPrompt.trim());
      }
      const finalPrompt = allPrompts.join('; ');

      const result = await generate(imagePart, finalPrompt);
      if (result) {
          incrementGeneratedImageCount();
      }
    } catch (e: any) {
        console.error(e)
        setError('画像の準備中にエラーが発生しました。');
    }
  };

  const handleResetSliders = () => {
    setEmotionValues({
      joy: 0,
      anger: 0,
      sadness: 0,
      ecstasy: 0,
      pain: 0,
    });
    setPartValues({
      rightEye: 0,
      leftEye: 0,
      mouth: 0,
    });
    setUsePartControls(false);
    setCustomPrompt('');
  };

  const handleFileSelect = (file: ImageFile) => {
    setImageFile(file);
    setGeneratedImage(null);
    handleResetSliders();
  }

  const getPartLabel = (value: number) => {
    if (value === 0) return '変更なし';
    const direction = value > 0 ? '開ける' : '閉じる';
    return `${direction} ${Math.abs(value)}%`;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">表情を変える</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 画像</h3>
          <FileUpload onFileSelect={handleFileSelect} previewUrl={generatedImage || imageFile?.preview} id="expression-upload" />
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
          <div className="space-y-4 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">2. 表情の強度を調整</h3>
            <p className="text-sm text-gray-400 -mt-2 mb-4">生成された画像に対して、さらに表情を重ねて変更できます。</p>
            {emotions.map(({ id, label }) => (
              <div key={id}>
                <label htmlFor={`${id}-slider`} className="block text-sm font-medium text-gray-300 mb-1">
                  {label}: <span className="font-bold text-cyan-400">{emotionValues[id]}%</span>
                </label>
                <input
                  id={`${id}-slider`}
                  type="range"
                  min="0"
                  max="100"
                  value={emotionValues[id]}
                  onChange={(e) => handleEmotionSliderChange(id, Number(e.target.value))}
                  disabled={!imageFile}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:bg-gray-800 disabled:cursor-not-allowed"
                />
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold">3. パーツの開閉調整</h3>
              <div className="flex items-center">
                <label htmlFor="use-parts-toggle" className="text-sm font-medium text-gray-300 mr-3">
                  使用する
                </label>
                <button
                  id="use-parts-toggle"
                  role="switch"
                  aria-checked={usePartControls}
                  onClick={() => setUsePartControls(!usePartControls)}
                  disabled={!imageFile}
                  className={`${
                    usePartControls ? 'bg-cyan-600' : 'bg-gray-600'
                  } relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span
                    className={`${
                      usePartControls ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>
            </div>

            {usePartControls && (
                <div className="space-y-4">
                    {parts.map(({ id, label }) => (
                        <div key={id}>
                            <label htmlFor={`${id}-slider`} className="block text-sm font-medium text-gray-300 mb-1">
                                {label}: <span className="font-bold text-cyan-400">{getPartLabel(partValues[id])}</span>
                            </label>
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>閉じる</span>
                                <input
                                    id={`${id}-slider`}
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={partValues[id]}
                                    onChange={(e) => handlePartSliderChange(id, Number(e.target.value))}
                                    disabled={!imageFile}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:bg-gray-800 disabled:cursor-not-allowed"
                                />
                                <span>開ける</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-4 mt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold">4. 追加指示 (任意)</h3>
              <p className="text-sm text-gray-400 mb-2">スライダーでの調整に加え、テキストで細かなニュアンスを指示できます。</p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例: 少し困ったように微笑む、口を少しだけ開けて驚いた表情"
                className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                disabled={!imageFile}
              />
            </div>

          </div>
          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleResetSliders}
              disabled={loading || !hasSelection}
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              リセット
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !imageFile || !hasSelection}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : '実行'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-center mt-6">{error}</p>}

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-center">結果</h3>
        <div className="flex justify-center">
            <div className="w-full max-w-lg text-center">
                <h4 className="font-semibold mb-2">生成画像</h4>
                <ResultDisplay
                    loading={loading && !generatedImage}
                    generatedImage={generatedImage}
                    loadingMessage="AIが表情を調整中です..."
                    idleMessage="ここに生成された画像が表示されます"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExpressionView;
