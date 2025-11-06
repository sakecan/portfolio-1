
import React from 'react';
import Spinner from './Spinner';
import { useAppContext } from '../contexts/AppContext';

interface ResultDisplayProps {
  loading: boolean;
  generatedImage: string | null;
  loadingMessage?: string;
  idleMessage?: string;
  isResultWhiteBg?: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  loading,
  generatedImage,
  loadingMessage = "AIが画像を生成中です...",
  idleMessage = "ここに生成された画像が表示されます",
  isResultWhiteBg = false,
}) => {
  const { addGeneratedImageToStock } = useAppContext();

  if (loading) {
    return (
      <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
        <Spinner message={loadingMessage} />
      </div>
    );
  }

  if (generatedImage) {
    return (
      <div>
        <img 
          src={generatedImage} 
          alt="Generated" 
          className={`rounded-lg shadow-lg mx-auto ${isResultWhiteBg ? 'bg-white' : ''}`}
        />
        <div className="flex justify-center items-center space-x-4 mt-4">
          <button
            onClick={() => addGeneratedImageToStock(generatedImage)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            ストックに格納
          </button>
          <a
            href={generatedImage}
            download="generated_image.png"
            className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
          >
            ダウンロード
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center text-gray-500 p-4">
      {idleMessage}
    </div>
  );
};

export default ResultDisplay;
