
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { MaskEditorRef, ImageFile } from '../types';
import StockImagePicker from './StockImagePicker';

interface MaskEditorProps {
    onFileSelect: (imageFile: ImageFile) => void;
    stockImages: ImageFile[];
}

const MaskEditor = forwardRef<MaskEditorRef, MaskEditorProps>(({ onFileSelect, stockImages }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        context.strokeStyle = 'rgba(255, 0, 255, 0.7)';
        context.lineCap = 'round';
        context.lineJoin = 'round';
        setCtx(context);
      }
    }
  }, []);

  useEffect(() => {
    if (ctx) {
      ctx.lineWidth = brushSize;
    }
  }, [brushSize, ctx]);
  
  const redrawCanvas = useCallback(() => {
    if (ctx && canvasRef.current) {
        const canvas = canvasRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (backgroundImage) {
            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        }
    }
  }, [ctx, backgroundImage]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const loadImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas && canvas.parentElement) {
          const containerWidth = canvas.parentElement.clientWidth;
          canvas.width = containerWidth;
          canvas.height = containerWidth * (img.height / img.width);
        }
        setBackgroundImage(img);
      };
      img.src = reader.result as string;
      onFileSelect({
        id: `${Date.now()}-${file.name}`,
        file,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      loadImageFromFile(files[0]);
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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx || !backgroundImage) return;
    const { offsetX, offsetY } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx || !backgroundImage) return;
    const { offsetX, offsetY } = getCoords(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const offsetX = (clientX - rect.left) * scaleX;
    const offsetY = (clientY - rect.top) * scaleY;

    return { offsetX, offsetY };
  };

  const clearMask = () => {
    redrawCanvas();
  };
  
  const handleSelectFromStock = (image: ImageFile) => {
    loadImageFromFile(image.file);
  };

  useImperativeHandle(ref, () => ({
    getImageData: () => {
      if (canvasRef.current && ctx && backgroundImage) {
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          const originalImageCanvas = document.createElement('canvas');
          originalImageCanvas.width = tempCanvas.width;
          originalImageCanvas.height = tempCanvas.height;
          const originalImageCtx = originalImageCanvas.getContext('2d');
          if(!originalImageCtx) return '';

          originalImageCtx.drawImage(backgroundImage, 0, 0, tempCanvas.width, tempCanvas.height);
          const originalImageData = originalImageCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

          const drawnImageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const maskData = tempCtx.createImageData(tempCanvas.width, tempCanvas.height);

          for (let i = 0; i < drawnImageData.data.length; i += 4) {
            const isOriginal = originalImageData.data[i] === drawnImageData.data[i] &&
                              originalImageData.data[i+1] === drawnImageData.data[i+1] &&
                              originalImageData.data[i+2] === drawnImageData.data[i+2] &&
                              originalImageData.data[i+3] === drawnImageData.data[i+3];

            if (!isOriginal) {
              maskData.data[i] = 0;   // R
              maskData.data[i+1] = 0; // G
              maskData.data[i+2] = 0; // B
              maskData.data[i+3] = 255; // A
            } else {
              maskData.data[i] = 255;
              maskData.data[i+1] = 255;
              maskData.data[i+2] = 255;
              maskData.data[i+3] = 255;
            }
          }
          tempCtx.putImageData(maskData, 0, 0);
          return tempCanvas.toDataURL('image/png');
        }
      }
      return '';
    },
    clear: clearMask,
    loadImage: (imageFile: ImageFile) => {
        loadImageFromFile(imageFile.file);
    },
    loadMask: (maskDataUrl: string) => {
        if (!ctx || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const maskImg = new Image();
        maskImg.onload = () => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = canvas.width;
            offscreenCanvas.height = canvas.height;
            const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
            if (!offscreenCtx) return;

            offscreenCtx.drawImage(maskImg, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

            const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128) {
                    data[i] = 255;
                    data[i + 1] = 0;
                    data[i + 2] = 255;
                    data[i + 3] = 255 * 0.7;
                } else {
                    data[i + 3] = 0;
                }
            }
            offscreenCtx.putImageData(imageData, 0, 0);

            ctx.drawImage(offscreenCanvas, 0, 0);
        };
        maskImg.src = maskDataUrl;
    },
  }));

  return (
    <div>
      <div 
          className={`relative w-full ${!backgroundImage ? 'aspect-square' : ''}`}
          onDragEnter={(e) => handleDragEvents(e, true)}
          onDragLeave={(e) => handleDragEvents(e, false)}
          onDragOver={(e) => handleDragEvents(e, true)}
          onDrop={onDrop}
      >
          <canvas
              ref={canvasRef}
              className={`w-full h-auto bg-gray-800 border-2 rounded-lg touch-none
                  ${isDragging ? 'border-cyan-400' : 'border-gray-600'}
                  ${backgroundImage ? 'cursor-crosshair' : ''}
              `}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
          />
          {!backgroundImage && (
               <div className={`absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-gray-400 transition-colors
                  ${isDragging ? 'bg-gray-700/50' : ''}`}
               >
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2">画像をドラッグ＆ドロップ</p>
                    <p className="text-sm">またはクリックして選択</p>
                  </div>
                  <div className="mt-4"><span className="text-gray-500 text-sm">または</span></div>
                  <button onClick={() => setIsPickerOpen(true)} className="mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors duration-300">
                    ストックから選択
                  </button>
               </div>
          )}
          <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files)}
          />
          <StockImagePicker
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            stockImages={stockImages}
            onSelect={handleSelectFromStock}
          />
      </div>
      <div className="mt-4">
        <label htmlFor="brush-size-slider" className="block text-sm font-medium text-gray-400 text-center mb-2">
            ブラシサイズ: {brushSize}
        </label>
        <input
            id="brush-size-slider"
            type="range"
            min="5"
            max="80"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
});

export default MaskEditor;
