
import React from 'react';
import { ImageFile } from '../types';

interface StockImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  stockImages: ImageFile[];
  onSelect: (image: ImageFile) => void;
}

const StockImagePicker: React.FC<StockImagePickerProps> = ({ isOpen, onClose, stockImages, onSelect }) => {
  if (!isOpen) {
    return null;
  }

  const handleSelect = (image: ImageFile) => {
    onSelect(image);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-image-picker-title"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 id="stock-image-picker-title" className="text-xl font-bold">ストックから画像を選択</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {stockImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {stockImages.map(image => (
                <button
                  key={image.id}
                  onClick={() => handleSelect(image)}
                  className="group block w-full aspect-square bg-gray-700 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                >
                  <img 
                    src={image.preview} 
                    alt="Stock" 
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">ストックされている画像はありません。「画像を格納する」メニューから追加してください。</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockImagePicker;
