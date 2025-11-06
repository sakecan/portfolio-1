
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { editImageWithText } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const PRIMARY_POSES = ['座っている', '立っている', '横になっている'];
const SECONDARY_POSES = ['M字開脚', '万歳', '右手でピースサイン'];
const CAMERA_POSITIONS = ['正面から', '真上から', '顔の近くから', '足の近くから'];
const LENS_TYPES = ['標準レンズ', '超望遠レンズ', '望遠レンズ', '広角レンズ', '超広角レンズ'];
const CAMERA_DISTANCES = ['5メートル', '近距離', '2メートル', '10メートル'];


const PoseSelectionView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(editImageWithText);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [primaryPose, setPrimaryPose] = useState<string>(PRIMARY_POSES[1]);
  const [secondaryPoses, setSecondaryPoses] = useState<string[]>([]);
  const [subjectPrompt, setSubjectPrompt] = useState<string>('');
  const [cameraPosition, setCameraPosition] = useState<string>(CAMERA_POSITIONS[0]);
  const [lensType, setLensType] = useState<string>(LENS_TYPES[0]);
  const [cameraDistance, setCameraDistance] = useState<string>(CAMERA_DISTANCES[0]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const handleSecondaryPoseToggle = (pose: string) => {
    setSecondaryPoses(prev =>
      prev.includes(pose)
        ? prev.filter(p => p !== pose)
        : [...prev, pose]
    );
  };

  const handleGenerate = async () => {
    if (!imageFile || !subjectPrompt.trim()) {
      setError('画像と被写体の説明を入力してください。');
      return;
    }
    setError(null);

    let finalPosePrompt = `「${primaryPose}」姿勢`;
    if (secondaryPoses.length > 0) {
        finalPosePrompt = `「${primaryPose}」姿勢を基本として、さらに「${secondaryPoses.join('、')}」の要素を加えたポーズ`;
    }
    const finalPrompt = `画像の中の「${subjectPrompt}」の姿勢を${finalPosePrompt}に変更してください。さらに、撮影条件を次のように変更してください：カメラ位置は「${cameraPosition}」、使用レンズは「${lensType}」、被写体からの距離は「${cameraDistance}」です。キャラクターの見た目、服装、背景は元の画像を維持してください。`;


    try {
      const imagePart = await fileToData(imageFile.file);
      const result = await generate(imagePart, finalPrompt);
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
        <h2 className="text-2xl font-bold">メニューから姿勢を選択する</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left column for inputs */}
        <div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">1. 元の画像をアップロード</h3>
              <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="pose-select-upload" />
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
              <h3 className="text-lg font-semibold mb-2 text-center">2. 画像の主要な被写体を説明</h3>
              <textarea
                value={subjectPrompt}
                onChange={(e) => setSubjectPrompt(e.target.value)}
                placeholder="例: 青いドレスの女性"
                className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">3. 基本の姿勢を選択</h3>
              <div className="grid grid-cols-3 gap-4">
                {PRIMARY_POSES.map((pose) => (
                  <button
                    key={pose}
                    onClick={() => setPrimaryPose(pose)}
                    className={`p-3 rounded-lg transition-colors duration-300 text-center font-medium ${
                      primaryPose === pose
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {pose}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">4. 追加のポーズを選択 (複数可)</h3>
              <div className="grid grid-cols-3 gap-4">
                {SECONDARY_POSES.map((pose) => (
                  <button
                    key={pose}
                    onClick={() => handleSecondaryPoseToggle(pose)}
                    className={`p-3 rounded-lg transition-colors duration-300 text-center font-medium ${
                      secondaryPoses.includes(pose)
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {pose}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">5. カメラ位置を選択</h3>
              <div className="grid grid-cols-4 gap-2">
                {CAMERA_POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setCameraPosition(pos)}
                    className={`p-2 rounded-lg transition-colors duration-300 text-center font-medium text-sm ${
                      cameraPosition === pos
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">6. 使用レンズを選択</h3>
              <div className="grid grid-cols-5 gap-2">
                {LENS_TYPES.map((lens) => (
                  <button
                    key={lens}
                    onClick={() => setLensType(lens)}
                    className={`p-2 rounded-lg transition-colors duration-300 text-center font-medium text-xs ${
                      lensType === lens
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {lens}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-center">7. カメラからの距離を選択</h3>
              <div className="grid grid-cols-4 gap-2">
                {CAMERA_DISTANCES.map((dist) => (
                  <button
                    key={dist}
                    onClick={() => setCameraDistance(dist)}
                    className={`p-2 rounded-lg transition-colors duration-300 text-center font-medium text-sm ${
                      cameraDistance === dist
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {dist}
                  </button>
                ))}
              </div>
            </div>


            <button
              onClick={handleGenerate}
              disabled={loading || !imageFile || !subjectPrompt.trim()}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {loading ? '生成中...' : '生成'}
            </button>
          </div>
        </div>

        {/* Right column for results */}
        <div>
          <div className="space-y-8">
            <div className="text-center">
              <h4 className="font-semibold mb-2">オリジナル画像</h4>
              {imageFile ? (
                <img src={imageFile.preview} alt="Original" className="rounded-lg shadow-lg mx-auto" />
              ) : (
                <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                  ここにアップロードした画像が表示されます
                </div>
              )}
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">生成画像</h4>
                <ResultDisplay
                    loading={loading}
                    generatedImage={generatedImage}
                    loadingMessage="AIがポーズとカメラ位置を調整中です..."
                />
            </div>
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-center mt-6">{error}</p>}
    </div>
  );
};

export default PoseSelectionView;
