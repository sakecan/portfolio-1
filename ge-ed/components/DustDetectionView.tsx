
import React, { useState, useEffect } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { detectDustAndHair } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import Spinner from './Spinner';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const DETECTION_TYPES = ['ごみ', '毛状のもの'];
const DETECTION_COLORS = ['白', '黒', '紫', 'ピンク', '透明'];

const DustDetectionView: React.FC = () => {
    const { setView, stockImages, addGeneratedImageToStock, setInpaintState } = useAppContext();
    const { execute: runDetection, data: detections, loading, error, setError } = useGeminiApi(detectDustAndHair);
    
    const [imageFile, setImageFile] = useState<ImageFile | null>(null);
    const [detectionTypes, setDetectionTypes] = useState<string[]>([]);
    const [detectionColors, setDetectionColors] = useState<string[]>([]);
    const [sensitivity, setSensitivity] = useState<number>(50);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

    const [magnifyPoint, setMagnifyPoint] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (!imageFile) {
            setResultImageUrl(null);
            return;
        }

        if (detections) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                if (detections.length > 0) {
                    ctx.strokeStyle = '#FF00FF'; // Magenta
                    ctx.lineWidth = Math.max(2, Math.min(img.width, img.height) * 0.005);

                    detections.forEach(detection => {
                        const { box } = detection;
                        if (!box || box.length !== 4) return;
                        const [x_min, y_min, x_max, y_max] = box;
                        const x = x_min * canvas.width;
                        const y = y_min * canvas.height;
                        const width = (x_max - x_min) * canvas.width;
                        const height = (y_max - y_min) * canvas.height;
                        ctx.strokeRect(x, y, width, height);
                    });
                }
                
                setResultImageUrl(canvas.toDataURL());
            };
            img.onerror = () => {
                setError("オリジナル画像の読み込みに失敗しました。");
            };
            img.src = imageFile.preview;
        } else {
            setResultImageUrl(null);
        }
    }, [detections, imageFile, setError]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMagnifyPoint(null);
            }
        };

        if (magnifyPoint) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [magnifyPoint]);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMagnifyPoint({ x, y });
    };

    const handleCloseMagnifyModal = () => {
        setMagnifyPoint(null);
    };

    const handleTypeToggle = (type: string) => {
        setDetectionTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleColorToggle = (color: string) => {
        setDetectionColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const handleDetect = async () => {
        if (!imageFile) {
            setError('画像をアップロードしてください。');
            return;
        }
        if (detectionTypes.length === 0) {
            setError('検出する種類を1つ以上選択してください。');
            return;
        }
        setError(null);

        try {
            const imagePart = await fileToData(imageFile.file);
            await runDetection(imagePart, detectionTypes, detectionColors, sensitivity);
        } catch (e) {
            console.error(e);
            setError('画像の準備中にエラーが発生しました。');
        }
    };

    const handleFileSelect = (file: ImageFile) => {
        setImageFile(file);
        setResultImageUrl(null);
        setError(null);
    };

    const handleInpaintRedirect = () => {
        if (!imageFile || !detections || detections.length === 0) return;
    
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
    
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
    
            ctx.fillStyle = 'black';
            detections.forEach(detection => {
                const { box } = detection;
                if (!box || box.length !== 4) return;
                const [x_min, y_min, x_max, y_max] = box;
                const x = x_min * canvas.width;
                const y = y_min * canvas.height;
                const width = (x_max - x_min) * canvas.width;
                const height = (y_max - y_min) * canvas.height;
                ctx.fillRect(x, y, width, height);
            });
            
            const maskDataUrl = canvas.toDataURL('image/png');
            setInpaintState({ imageFile, maskDataUrl, prompt: 'ピンク色で示されたゴミを目立たないように除去してください' });
            setView(ViewMode.Inpaint);
        };
        img.src = imageFile.preview;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold">ちり、ほこり、毛の検出プログラム</h2>
                <button
                    onClick={() => setView(ViewMode.MainMenu)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                >
                    メニューに戻る (Esc)
                </button>
            </div>
            <p className="text-gray-400 mb-6 text-center max-w-3xl mx-auto">
                ゴミなどがあったら見つけるプログラムです。種類や色、検出精度を指定して、画像内の不要な要素を検出します。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <h3 className="text-lg font-semibold mb-2">1. 画像をアップロード</h3>
                    <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="dust-detection-upload" />
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
                            <h3 className="text-lg font-semibold mb-2">2. 検出する種類を選択 (必須)</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {DETECTION_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeToggle(type)}
                                        className={`w-full py-3 rounded-lg transition-colors font-semibold ${detectionTypes.includes(type)
                                                ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">3. 検出する色を選択 (任意)</h3>
                             <p className="text-xs text-gray-400 -mt-2 mb-2">指定しない場合はすべての色を対象にします。</p>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {DETECTION_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorToggle(color)}
                                        className={`w-full py-2 rounded-lg transition-colors font-semibold text-sm ${detectionColors.includes(color)
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
                            <h3 className="text-lg font-semibold mb-2">4. 検出精度 ({sensitivity}%)</h3>
                            <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                                <span className="text-sm text-gray-400">甘め</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={sensitivity}
                                    onChange={(e) => setSensitivity(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-sm text-gray-400">厳しめ</span>
                            </div>
                        </div>
                        <button
                            onClick={handleDetect}
                            disabled={loading || !imageFile || detectionTypes.length === 0}
                            className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : '検出'}
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
                        {imageFile ? (
                           <img src={imageFile.preview} alt="Original" className="rounded-lg shadow-lg mx-auto" />
                        ) : (
                           <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
                               ここにオリジナル画像が表示されます
                           </div>
                        )}
                    </div>
                    <div className="text-center">
                        {detections ? (
                           <h4 className="font-semibold mb-2">検出結果: {detections.length}個</h4>
                        ) : (
                           <h4 className="font-semibold mb-2">検出結果</h4>
                        )}
                        {loading ? (
                           <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                               <Spinner message="ちり・ほこりを検出中です..." />
                           </div>
                        ) : resultImageUrl ? (
                           <div>
                                <img 
                                    src={resultImageUrl} 
                                    alt="Detection Result" 
                                    className="rounded-lg shadow-lg mx-auto cursor-zoom-in" 
                                    onClick={handleImageClick}
                                />
                               <div className="flex justify-center items-center space-x-4 mt-4">
                                   <button
                                       onClick={() => addGeneratedImageToStock(resultImageUrl)}
                                       className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                                   >
                                       ストックに格納
                                   </button>
                                   <a
                                       href={resultImageUrl}
                                       download="detection_result.png"
                                       className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                                   >
                                       ダウンロード
                                   </a>
                                   {detections && detections.length > 0 && (
                                     <button
                                         onClick={handleInpaintRedirect}
                                         className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                                     >
                                         インペイントで除去
                                     </button>
                                   )}
                               </div>
                           </div>
                        ) : (
                           <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 p-4">
                                {detections && detections.length === 0 ? (
                                    <p className="text-white text-lg">指定された条件のゴミは見つかりませんでした。</p>
                                ) : (
                                    'ここに検出結果が表示されます'
                                )}
                           </div>
                        )}
                    </div>
                </div>
            </div>
            
            {magnifyPoint && resultImageUrl && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
                    onClick={handleCloseMagnifyModal}
                    role="dialog"
                    aria-modal="true"
                >
                    <div 
                        className="relative w-[512px] h-[512px] bg-gray-900 border-2 border-cyan-400 rounded-lg overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={resultImageUrl}
                            alt="Zoomed detection result"
                            className="absolute top-0 left-0 w-full h-full object-cover"
                            style={{
                                transform: `scale(10)`,
                                transformOrigin: `${magnifyPoint.x * 100}% ${magnifyPoint.y * 100}%`,
                                willChange: 'transform',
                            }}
                        />
                    </div>
                    <button 
                        onClick={handleCloseMagnifyModal} 
                        className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg z-10" 
                        aria-label="閉じる"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default DustDetectionView;
