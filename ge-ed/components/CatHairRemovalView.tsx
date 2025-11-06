
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { removeHair } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const HAIR_COLORS = ['黒', '白', '茶', '透明', 'ピンク', '紫'];

const CatHairRemovalView: React.FC = () => {
    const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
    const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(removeHair);
    
    const [imageFile, setImageFile] = useState<ImageFile | null>(null);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [intensity, setIntensity] = useState<number>(50);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleColorToggle = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const handleGenerate = async () => {
        if (!imageFile || selectedColors.length === 0) {
            setError('画像と除去したい毛の色を1色以上選択してください。');
            return;
        }
        setError(null);

        try {
            const imagePart = await fileToData(imageFile.file);
            const result = await generate(imagePart, selectedColors, intensity);
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
                <h2 className="text-2xl font-bold">毛の除去</h2>
                <button
                    onClick={() => setView(ViewMode.MainMenu)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                >
                    メニューに戻る (Esc)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="text-lg font-semibold mb-2">1. 画像をアップロード</h3>
                    <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="cat-hair-upload" />
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
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">2. 除去する毛の色を選択 (複数可)</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {HAIR_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorToggle(color)}
                                        className={`w-full py-3 rounded-lg transition-colors font-semibold ${selectedColors.includes(color)
                                                ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">3. 処理の強度 ({intensity}%)</h3>
                            <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                                <span className="text-sm text-gray-400">弱</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={intensity}
                                    onChange={(e) => setIntensity(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm text-gray-400">強</span>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !imageFile || selectedColors.length === 0}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {loading ? '処理中...' : '毛を除去'}
                        </button>
                        <p className="text-xs text-gray-400 text-center">
                            もしここで除去できない場合はインペイントで処理する選択肢もあります。
                        </p>
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
                          loadingMessage="AIが指定された色の毛を除去中です..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CatHairRemovalView;
