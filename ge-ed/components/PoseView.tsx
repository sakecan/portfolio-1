
import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, ImageFile, StickFigureEditorRef } from '../types';
import Spinner from './Spinner';
import StickFigureEditor from './StickFigureEditor';
import { changePose, extractPoseFromImage } from '../api/gemini';
import { fileToData, dataUrlToData } from '../services/utils';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const POSE_TEMPLATES = [
    {
      name: '立つ',
      lines: [
        // Core
        [0.5, 0.35, 0.5, 0.6],   // Torso
        [0.5, 0.15, 0.5, 0.35],  // Neck (defines head top)
        // Left Arm
        [0.5, 0.35, 0.4, 0.48], // Upper Arm (shoulder to elbow)
        [0.4, 0.48, 0.35, 0.6], // Lower Arm (elbow to wrist)
        [0.35, 0.6, 0.33, 0.62], // Hand
        // Right Arm
        [0.5, 0.35, 0.6, 0.48], // Upper Arm
        [0.6, 0.48, 0.65, 0.6], // Lower Arm
        [0.65, 0.6, 0.67, 0.62], // Hand
        // Left Leg
        [0.5, 0.6, 0.45, 0.75], // Upper Leg (hip to knee)
        [0.45, 0.75, 0.4, 0.9], // Lower Leg (knee to ankle)
        [0.4, 0.9, 0.35, 0.9], // Foot
        // Right Leg
        [0.5, 0.6, 0.55, 0.75], // Upper Leg
        [0.55, 0.75, 0.6, 0.9], // Lower Leg
        [0.6, 0.9, 0.65, 0.9], // Foot
      ],
    },
    {
      name: '歩く',
      lines: [
        [0.5, 0.35, 0.5, 0.6],   // Torso
        [0.5, 0.15, 0.5, 0.35],  // Neck (defines head top)
        // Right Arm (forward)
        [0.5, 0.35, 0.6, 0.45], // Upper
        [0.6, 0.45, 0.7, 0.5], // Lower
        [0.7, 0.5, 0.72, 0.52], // Hand
        // Left Arm (backward)
        [0.5, 0.35, 0.4, 0.45], // Upper
        [0.4, 0.45, 0.3, 0.4], // Lower
        [0.3, 0.4, 0.28, 0.38], // Hand
        // Left Leg (forward)
        [0.5, 0.6, 0.4, 0.75], // Upper
        [0.4, 0.75, 0.35, 0.9], // Lower
        [0.35, 0.9, 0.3, 0.9], // Foot
        // Right Leg (backward)
        [0.5, 0.6, 0.6, 0.75], // Upper
        [0.6, 0.75, 0.65, 0.9], // Lower
        [0.65, 0.9, 0.7, 0.9], // Foot
      ],
    },
    {
      name: '走る',
      lines: [
        [0.5, 0.35, 0.5, 0.6],   // Torso
        [0.5, 0.15, 0.5, 0.35],  // Neck (defines head top)
        // Right Arm (forward, bent up)
        [0.5, 0.35, 0.65, 0.35], // Upper
        [0.65, 0.35, 0.6, 0.25], // Lower
        [0.6, 0.25, 0.62, 0.23], // Hand
        // Left Arm (backward, bent up)
        [0.5, 0.35, 0.35, 0.4], // Upper
        [0.35, 0.4, 0.4, 0.5], // Lower
        [0.4, 0.5, 0.42, 0.52], // Hand
        // Left Leg (backward, bent up)
        [0.5, 0.6, 0.6, 0.7], // Upper
        [0.6, 0.7, 0.7, 0.8], // Lower
        [0.7, 0.8, 0.72, 0.78], // Foot
        // Right Leg (forward, bent up)
        [0.5, 0.6, 0.4, 0.65], // Upper
        [0.4, 0.65, 0.3, 0.8], // Lower
        [0.3, 0.8, 0.25, 0.8], // Foot
      ],
    },
    {
      name: '座る',
      lines: [
        [0.5, 0.3, 0.5, 0.55],   // Torso
        [0.5, 0.1, 0.5, 0.3],  // Neck (defines head top)
        // Left Arm
        [0.5, 0.3, 0.4, 0.4], // Upper
        [0.4, 0.4, 0.35, 0.55], // Lower
        [0.35, 0.55, 0.33, 0.57], // Hand
        // Right Arm
        [0.5, 0.3, 0.6, 0.4], // Upper
        [0.6, 0.4, 0.65, 0.55], // Lower
        [0.65, 0.55, 0.67, 0.57], // Hand
        // Left Leg
        [0.5, 0.55, 0.3, 0.6], // Upper (Thigh)
        [0.3, 0.6, 0.3, 0.8], // Lower (Shin)
        [0.3, 0.8, 0.35, 0.8], // Foot
        // Right Leg
        [0.5, 0.55, 0.7, 0.6], // Upper
        [0.7, 0.6, 0.7, 0.8], // Lower
        [0.7, 0.8, 0.65, 0.8], // Foot
      ],
    },
];

type FaceDirection = 'left' | 'front' | 'right' | 'up' | 'down';

const FACE_DIRECTIONS: { key: FaceDirection; label: string }[] = [
    { key: 'left', label: '左' },
    { key: 'up', label: '上' },
    { key: 'front', label: '正面' },
    { key: 'down', label: '下' },
    { key: 'right', label: '右' },
];

const PoseView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generatePose, data: generatedImage, loading, error, setError } = useGeminiApi(changePose);
  const { execute: extractPose, loading: poseLoading } = useGeminiApi(extractPoseFromImage);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [faceDirection, setFaceDirection] = useState<FaceDirection>('front');
  const stickFigureEditorRef = useRef<StickFigureEditorRef>(null);

  useEffect(() => {
    if (stickFigureEditorRef.current) {
      stickFigureEditorRef.current.drawPose(POSE_TEMPLATES[0].lines);
    }
  }, []);

  const handleGenerate = async () => {
    if (!imageFile || !stickFigureEditorRef.current) {
      setError('画像と棒人間のポーズの両方を用意してください。');
      return;
    }
    
    const poseImageDataUrl = stickFigureEditorRef.current.getImageData();
    if (poseImageDataUrl.length < 100) { // Simple check for empty canvas
        setError('棒人間を描いてください。');
        return;
    }
    setError(null);
    
    try {
      const imageData = await fileToData(imageFile.file);
      const poseData = dataUrlToData(poseImageDataUrl);
      const result = await generatePose(imageData, poseData, faceDirection);
      if (result) {
        incrementGeneratedImageCount();
      }
    } catch (e) {
      console.error(e);
      setError('画像の準備中にエラーが発生しました。');
    }
  };
  
  const handleClear = () => {
      if (stickFigureEditorRef.current) {
          stickFigureEditorRef.current.clear();
      }
  };

  const handleApplyTemplate = (lines: number[][]) => {
    if (stickFigureEditorRef.current) {
      stickFigureEditorRef.current.drawPose(lines);
    }
  };

  const handleExtractPose = async () => {
    if (!imageFile) {
      setError('ポーズを抽出する画像をアップロードしてください。');
      return;
    }
    setError(null);

    try {
      const imageData = await fileToData(imageFile.file);
      const extractedLines = await extractPose(imageData);
      if (extractedLines && stickFigureEditorRef.current) {
        stickFigureEditorRef.current.drawPose(extractedLines);
      }
    } catch (e) {
      console.error(e);
      setError('ポーズ抽出のためのデータ準備に失敗しました。');
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">棒人間で姿勢を決める</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 画像をアップロード &amp; ポーズを編集</h3>
          <StickFigureEditor
            ref={stickFigureEditorRef}
            faceDirection={faceDirection}
            backgroundImageUrl={imageFile?.preview || null}
            onFileSelect={setImageFile}
            stockImages={stockImages}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">2. ポーズツール</h3>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
             <div className="space-y-4">
                 <div>
                    <h5 className="text-sm font-semibold mb-2 text-center text-gray-400">顔の向き</h5>
                     <div className="grid grid-cols-5 gap-2">
                        {FACE_DIRECTIONS.map((dir) => (
                            <button
                                key={dir.key}
                                onClick={() => setFaceDirection(dir.key)}
                                className={`p-2 rounded-lg transition-colors ${
                                    faceDirection === dir.key
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                            >
                                {dir.label}
                            </button>
                        ))}
                    </div>
                 </div>
                 <button
                    onClick={handleExtractPose}
                    disabled={poseLoading || !imageFile}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                   {poseLoading ? '抽出中...' : '画像からポーズを自動抽出'}
                 </button>
                 <div>
                    <h5 className="text-sm font-semibold mb-2 text-center text-gray-400">またはテンプレートを選択</h5>
                    <div className="grid grid-cols-4 gap-2">
                        {POSE_TEMPLATES.map(template => (
                            <button
                                key={template.name}
                                onClick={() => handleApplyTemplate(template.lines)}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded transition-colors duration-300 text-sm"
                            >
                                {template.name}
                            </button>
                        ))}
                    </div>
                 </div>
              </div>
          </div>

          <div className="flex space-x-4 mt-4">
              <button
                  onClick={handleClear}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300"
              >
              クリア
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !imageFile}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {loading ? '生成中...' : '生成'}
              </button>
          </div>
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
              loadingMessage="AIがポーズを変更中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseView;
