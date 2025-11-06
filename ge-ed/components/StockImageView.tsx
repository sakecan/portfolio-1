import React, { useRef, useState } from 'react';
import { ViewMode, ImageFile } from '../types';
import { useAppContext } from '../contexts/AppContext';

const StockImageView: React.FC = () => {
  const { setView, stockImages, addStockImages, removeStockImage, updateStockImageComment } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ImageFile | null>(null);
  const [editedComment, setEditedComment] = useState('');

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      addStockImages(filesArray);
      setMessage(null);
    }
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };
  
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleEditComment = (image: ImageFile) => {
    setEditingImage(image);
    setEditedComment(image.comment || '');
  };

  const handleSaveComment = () => {
    if (editingImage) {
      updateStockImageComment(editingImage.id, editedComment);
      setEditingImage(null);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingImage(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">画像ライブラリ</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={onDrop}
        className={`w-full p-8 mb-4 border-2 border-dashed rounded-lg transition-colors duration-300 flex flex-col justify-center items-center
          ${isDragging 
              ? 'border-cyan-400 bg-gray-700/50' 
              : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/50'
          }
        `}
      >
        <div 
          className="text-center text-gray-400 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2">画像をドラッグ＆ドロップ (複数可)</p>
          <p className="text-sm">またはクリックして選択</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </div>

      {message && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 text-yellow-300 rounded-lg text-center">
          {message}
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-2">ストック画像 ({stockImages.length}枚)</h3>
        <p className="text-sm text-gray-400 mb-4">格納できる枚数は画像サイズとブラウザによって制限されます。</p>
        {stockImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stockImages.map(image => (
              <div 
                key={image.id} 
                className="relative group"
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleEditComment(image);
                }}
              >
                <img src={image.preview} alt="Stock" className="w-full h-full object-cover rounded-lg aspect-square" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStockImage(image.id);
                      setMessage(null);
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full"
                    aria-label="Delete image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                {image.comment && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <p className="truncate">{image.comment}</p>
                  </div>
                )}
                <div className="absolute top-1 right-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    右クリックで編集
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">ストックされている画像はありません。</p>
        )}
      </div>

      {editingImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={handleCancelEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-edit-title"
        >
          <div 
            className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 id="comment-edit-title" className="text-lg font-bold mb-4">コメントを編集</h3>
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                placeholder="コメントを入力..."
                className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end p-4 bg-gray-700/50 rounded-b-lg space-x-4">
                <button 
                    onClick={handleCancelEdit}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                >
                    キャンセル
                </button>
                <button 
                    onClick={handleSaveComment}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                >
                    保存
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockImageView;
