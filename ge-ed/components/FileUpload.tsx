
import React, { useState } from 'react';
import { ImageFile } from '../types';

interface FileUploadProps {
  onFileSelect: (imageFile: ImageFile) => void;
  previewUrl?: string;
  id: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, previewUrl, id }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect({
          id: `${Date.now()}-${file.name}`,
          file,
          preview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <label
      htmlFor={id}
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => handleDragEvents(e, true)}
      onDrop={onDrop}
      className={`
        w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 flex flex-col justify-center items-center
        ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-800/50'}
        ${previewUrl ? '' : 'p-4'}
      `}
    >
      {previewUrl ? (
        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
      ) : (
        <div className="text-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2">画像をドラッグ＆ドロップ</p>
          <p className="text-sm">またはクリックして選択</p>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files)}
      />
    </label>
  );
};

export default FileUpload;
