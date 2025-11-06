
import React, { useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import FileUpload from './FileUpload';
import { editImageWithText } from '../api/gemini';
import { fileToData } from '../services/utils';
import StockImagePicker from './StockImagePicker';
import ResultDisplay from './ResultDisplay';
import { useAppContext } from '../contexts/AppContext';
import { useGeminiApi } from '../hooks/useGeminiApi';

const STYLES_CATEGORIZED = [
  {
    category: 'アートスタイル変換',
    styles: [
      { name: '油絵風', prompt: 'Transform this image into an oil painting, with visible brushstrokes and a rich, textured feel.' },
      { name: '水彩画風', prompt: 'Convert this image into a watercolor painting, with soft, translucent colors and fluid brushwork.' },
      { name: 'スケッチ風', prompt: 'Redraw this image as a pencil or charcoal sketch, with emphasis on lines, shading, and texture.' },
      { name: 'ミニマル風', prompt: 'Recreate this image in a minimalist style, simplifying forms and using a limited color palette to capture the essence of the subject.' },
      { name: 'デジタルステンドグラス風', prompt: 'Transform this image into a digital stained glass window, with bold black outlines and vibrant, luminous colors.' },
      { name: 'アニメ/漫画風', prompt: 'Convert this image into a Japanese anime/manga style, with clean lines, cel shading, and large expressive eyes.' },
      { name: 'ゴッホ風', prompt: 'Transform this image into a painting in the style of Vincent van Gogh, with thick impasto brushstrokes and vibrant colors.' },
      { name: '水墨画', prompt: 'Redraw this image in the style of a traditional East Asian ink wash painting (Sumi-e), using shades of black ink and minimalist brushwork.' },
      { name: '影絵', prompt: 'Recreate this image as a silhouette art (shadow puppetry style), showing only the dark outlines of the subjects against a bright background.' }
    ]
  },
  {
    category: '写真スタイル変換',
    styles: [
      { name: 'フィルム風', prompt: 'Apply a classic film photography preset to this image, giving it the color grading, grain, and feel of a vintage analog camera film.' },
      { name: 'ゴールデンアワー', prompt: 'Adjust the lighting and color tone of this image to a "golden hour" style, with warm, soft, and diffused light.' },
      { name: 'フォトリアリスティック', prompt: 'Enhance this image to be photorealistic, improving details, lighting, and textures to make it look like a high-resolution photograph.' },
      { name: 'ビンテージ写真風', prompt: 'Give this image a vintage photo effect, with faded colors, sepia tones, and slight imperfections like scratches or light leaks.' },
      { name: 'ボケ効果', prompt: 'Recreate this image with a strong bokeh effect, creating a shallow depth of field where the main subject is sharp and the background is beautifully blurred.' }
    ]
  },
  {
    category: 'ライティング・雰囲気の変換',
    styles: [
      { name: 'Greasy Guide', prompt: 'Apply a "greasy" concept art style to the image, characterized by painterly, slightly messy brushstrokes and a focus on lighting and mood.' },
      { name: 'ネオン・ノワール', prompt: 'Transform the lighting of this image to a "neon noir" aesthetic, with dark shadows and vibrant, moody neon lights.' },
      { name: 'ドラマチックライティング', prompt: 'Dramatically relight this image with high contrast lighting, like chiaroscuro, to create a sense of mood and tension.' }
    ]
  }
];

const COLOR_TONES = [
  { name: '指定なし', value: '' },
  { name: '暖色系', value: 'warm color tone' },
  { name: '寒色系', value: 'cool color tone' },
  { name: 'モノクロ', value: 'monochrome' },
  { name: 'ビビッド', value: 'vivid colors' },
];

const LIGHTING_EFFECTS = [
  { name: '指定なし', value: '' },
  { name: 'ドラマチック', value: 'dramatic lighting' },
  { name: 'ソフト', value: 'soft lighting' },
  { name: '逆光', value: 'backlit' },
  { name: 'ネオン', value: 'neon' },
];

const StyleTransferView: React.FC = () => {
  const { setView, incrementGeneratedImageCount, stockImages } = useAppContext();
  const { execute: generate, data: generatedImage, loading, error, setError } = useGeminiApi(editImageWithText);
  
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [colorTone, setColorTone] = useState<string>('');
  const [lighting, setLighting] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(50);
  const [customPromptIntensity, setCustomPromptIntensity] = useState<number>(50);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleStyleSelect = (styleName: string) => {
    setSelectedStyle(styleName);
  };

  const handleCustomPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomPrompt(e.target.value);
  };

  const handleGenerate = async () => {
    if (!imageFile || (!selectedStyle && !customPrompt.trim())) {
      setError('画像と、スタイルまたは自由入力の指示を選択してください。');
      return;
    }
    setError(null);

    try {
      const imagePart = await fileToData(imageFile.file);
      
      let stylePrompt = '';
      if (selectedStyle) {
        const allStyles = STYLES_CATEGORIZED.flatMap(c => c.styles);
        const styleInfo = allStyles.find(s => s.name === selectedStyle);
        if (styleInfo) {
            stylePrompt = styleInfo.prompt;
        }
      }

      let customPromptPart = '';
      if (customPrompt.trim()) {
          const customText = customPrompt.trim();
          if (customPromptIntensity <= 33) {
              customPromptPart = `Additionally, subtly incorporate the following instruction with about ${customPromptIntensity}% emphasis: "${customText}"`;
          } else if (customPromptIntensity <= 66) {
              customPromptPart = `Additionally, incorporate the following instruction with about ${customPromptIntensity}% emphasis: "${customText}"`;
          } else {
              customPromptPart = `Additionally, strongly emphasize the following instruction with about ${customPromptIntensity}% emphasis: "${customText}"`;
          }
      }

      const colorPrompt = colorTone ? `The overall color palette should be ${colorTone}` : '';
      const lightingPrompt = lighting ? `The lighting should be ${lighting}` : '';
      const negativePromptInstruction = negativePrompt.trim() ? `IMPORTANTLY, you must avoid generating the following elements under any circumstances: ${negativePrompt.trim()}` : '';

      let strengthDescription = '';
      if (intensity <= 33) {
        strengthDescription = `Apply this overall style transformation subtly, with a strength of about ${intensity}%. The original image's features and composition should remain very clear.`;
      } else if (intensity <= 66) {
        strengthDescription = `Apply this overall style transformation with a medium strength of about ${intensity}%. There should be a good balance between the original image and the new style.`;
      } else {
        strengthDescription = `Apply this overall style transformation strongly, with a strength of about ${intensity}%. The new style should be dominant, significantly transforming the original image.`;
      }
      
      const finalPrompt = [stylePrompt, customPromptPart, colorPrompt, lightingPrompt, strengthDescription, negativePromptInstruction]
          .filter(p => p.trim() !== '')
          .join('. ');

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
        <h2 className="text-2xl font-bold">スタイル変換</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">1. 元の画像をアップロード</h3>
          <FileUpload onFileSelect={handleFileSelect} previewUrl={imageFile?.preview} id="style-transfer-upload" />
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
          <h3 className="text-lg font-semibold mb-2">2. スタイルを選択</h3>
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
            {STYLES_CATEGORIZED.map((category) => (
              <div key={category.category}>
                <h4 className="font-semibold text-cyan-400 mb-2">{category.category}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {category.styles.map((style) => (
                    <button
                      key={style.name}
                      onClick={() => handleStyleSelect(style.name)}
                      className={`p-3 rounded-lg transition-colors duration-300 text-center font-medium text-sm
                        ${selectedStyle === style.name
                          ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                          : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-2">3. 色の雰囲気</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {COLOR_TONES.map((tone) => (
                    <button
                        key={tone.value}
                        onClick={() => setColorTone(tone.value)}
                        className={`p-2 rounded-lg transition-colors text-sm ${
                            colorTone === tone.value ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        {tone.name}
                    </button>
                ))}
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">4. 照明効果</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {LIGHTING_EFFECTS.map((effect) => (
                    <button
                        key={effect.value}
                        onClick={() => setLighting(effect.value)}
                        className={`p-2 rounded-lg transition-colors text-sm ${
                            lighting === effect.value ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        {effect.name}
                    </button>
                ))}
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-2">5. 除外したい要素 (ネガティブプロンプト)</h3>
            <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="例: 人物, 文字, 赤色"
                className="w-full h-20 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />


          <h3 className="text-lg font-semibold mt-6 mb-2">6. 変換の強度 ({intensity}%)</h3>
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

          <h3 className="text-lg font-semibold mt-6 mb-2">7. 指示を自由入力</h3>
          <textarea
            value={customPrompt}
            onChange={handleCustomPromptChange}
            placeholder="選択したスタイルに加え、細かな指示を追加できます。例: 猫をサイバーパンク風の鎧を着た戦士にして"
            className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <div className="mt-2">
            <label htmlFor="custom-prompt-intensity-slider" className="block text-sm font-medium text-gray-400 text-center mb-2">
                自由入力の強度: {customPromptIntensity}%
            </label>
            <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                <span className="text-sm text-gray-400">弱</span>
                <input
                    id="custom-prompt-intensity-slider"
                    type="range"
                    min="1"
                    max="100"
                    value={customPromptIntensity}
                    onChange={(e) => setCustomPromptIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-gray-400">強</span>
            </div>
          </div>


          <button
            onClick={handleGenerate}
            disabled={loading || !imageFile || (!selectedStyle && !customPrompt.trim())}
            className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? '生成中...' : '生成'}
          </button>
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
              loadingMessage="AIがスタイルを適用中です..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleTransferView;
