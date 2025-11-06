
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { StickFigureEditorRef, ImageFile } from '../types';
import StockImagePicker from './StockImagePicker';

interface Point {
  x: number;
  y: number;
}

interface Line {
  p1: Point;
  p2: Point;
}

type FaceDirection = 'left' | 'front' | 'right' | 'up' | 'down';

const DRAG_HANDLE_RADIUS = 8;
const DRAG_HANDLE_RADIUS_SQ = DRAG_HANDLE_RADIUS * DRAG_HANDLE_RADIUS;

interface StickFigureEditorProps {
  faceDirection: FaceDirection;
  backgroundImageUrl: string | null;
  onFileSelect: (imageFile: ImageFile) => void;
  stockImages: ImageFile[];
}

const StickFigureEditor = forwardRef<StickFigureEditorRef, StickFigureEditorProps>(({ faceDirection, backgroundImageUrl, onFileSelect, stockImages }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Component state
  const [lines, setLines] = useState<Line[]>([]);
  const [draggedPoint, setDraggedPoint] = useState<{ lineIndex: number; pointKey: 'p1' | 'p2' } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        setCtx(context);
      }
    }
  }, []);

  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.onload = () => {
        setBackgroundImage(img);
      };
      img.src = backgroundImageUrl;
    } else {
      setBackgroundImage(null);
    }
  }, [backgroundImageUrl]);
  
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

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
        return null;
    }

    return { x, y };
  }, []);

  const getNormalizedCoords = useCallback((point: Point): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      return { x: point.x / canvas.width, y: point.y / canvas.height };
  }, []);
  
  const getPixelCoords = useCallback((point: Point): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      return { x: point.x * canvas.width, y: point.y * canvas.height };
  }, []);


  const findPointAt = (pos: Point) => {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const p1Pixel = getPixelCoords(line.p1);
      const p2Pixel = getPixelCoords(line.p2);

      const distSq1 = (pos.x - p1Pixel.x) ** 2 + (pos.y - p1Pixel.y) ** 2;
      if (distSq1 < DRAG_HANDLE_RADIUS_SQ) {
        return { lineIndex: i, pointKey: 'p1' as const };
      }

      const distSq2 = (pos.x - p2Pixel.x) ** 2 + (pos.y - p2Pixel.y) ** 2;
      if (distSq2 < DRAG_HANDLE_RADIUS_SQ) {
        return { lineIndex: i, pointKey: 'p2' as const };
      }
    }
    return null;
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getCanvasCoords(e);
    if (!pos) return;

    const pointToDrag = findPointAt(pos);
    if (pointToDrag) {
      setDraggedPoint(pointToDrag);
    } else {
      const normalizedPos = getNormalizedCoords(pos);
      const newLine: Line = { p1: normalizedPos, p2: normalizedPos };
      setLines(prev => [...prev, newLine]);
      setDraggedPoint({ lineIndex: lines.length, pointKey: 'p2' });
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getCanvasCoords(e);
    setCurrentMousePos(pos);
    if (!pos || !draggedPoint) return;

    const normalizedPos = getNormalizedCoords(pos);

    setLines(prevLines => {
      const newLines = [...prevLines];
      const lineToUpdate = newLines[draggedPoint.lineIndex];
      if (lineToUpdate) {
          lineToUpdate[draggedPoint.pointKey] = normalizedPos;
      }
      return newLines;
    });
  };

  const handleEnd = () => {
    setDraggedPoint(null);
  };
  
  const getHeadInfo = useCallback((linesToAnalyze: Line[]): { center: Point; radius: number } | null => {
    if (linesToAnalyze.length === 0) return null;

    const allPoints = linesToAnalyze.flatMap(l => [l.p1, l.p2]);
    if (allPoints.length === 0) return null;

    let headTop = allPoints[0];
    let maxPos = allPoints[0];

    for (const p of allPoints) {
      if (p.y < headTop.y) headTop = p;
      if (p.y > maxPos.y) maxPos = p;
    }

    const height = maxPos.y - headTop.y;
    if (height <= 0.01) return null; // Not a figure

    const radius = height * 0.15;
    return {
      center: { x: headTop.x, y: headTop.y + radius },
      radius,
    };
  }, []);

  const drawStickFigure = useCallback((
    targetCtx: CanvasRenderingContext2D,
    linesToDraw: Line[],
    currentFaceDirection: FaceDirection,
    drawIndicator: boolean = true
  ) => {
    targetCtx.strokeStyle = 'white';
    targetCtx.lineWidth = 5;
    targetCtx.lineCap = 'round';

    // Draw body lines
    linesToDraw.forEach(line => {
      const p1 = getPixelCoords(line.p1);
      const p2 = getPixelCoords(line.p2);
      targetCtx.beginPath();
      targetCtx.moveTo(p1.x, p1.y);
      targetCtx.lineTo(p2.x, p2.y);
      targetCtx.stroke();
    });

    // Draw head
    const headInfo = getHeadInfo(linesToDraw);
    if (headInfo) {
      const headCenterPx = getPixelCoords(headInfo.center);
      const headRadiusPx = headInfo.radius * (canvasRef.current?.height || 400);

      // Head Circle
      targetCtx.beginPath();
      targetCtx.arc(headCenterPx.x, headCenterPx.y, headRadiusPx, 0, 2 * Math.PI);
      targetCtx.stroke();

      // Indicator for direction
      if (drawIndicator && currentFaceDirection !== 'front') {
        const indicatorLength = headRadiusPx * 0.8;
        let indicatorEndX = headCenterPx.x;
        let indicatorEndY = headCenterPx.y;

        switch (currentFaceDirection) {
            case 'left':
                indicatorEndX -= indicatorLength;
                break;
            case 'right':
                indicatorEndX += indicatorLength;
                break;
            case 'up':
                indicatorEndY -= indicatorLength;
                break;
            case 'down':
                indicatorEndY += indicatorLength;
                break;
        }

        targetCtx.beginPath();
        targetCtx.moveTo(headCenterPx.x, headCenterPx.y);
        targetCtx.lineTo(indicatorEndX, indicatorEndY);
        targetCtx.stroke();
      }
    }
  }, [getPixelCoords, getHeadInfo]);


  const redrawCanvas = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const container = canvas.parentElement;

    if (container) {
      const containerWidth = container.clientWidth;
      let newHeight = containerWidth;
      if (backgroundImage) {
        newHeight = containerWidth / (backgroundImage.width / backgroundImage.height);
      }
      if (canvas.width !== containerWidth || canvas.height !== newHeight) {
        canvas.width = containerWidth;
        canvas.height = newHeight;
      }
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1f2937'; // bg-gray-800
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    drawStickFigure(ctx, lines, faceDirection, true);

    let hovered = false;
    lines.forEach(line => {
        [line.p1, line.p2].forEach(p => {
            const pointPixel = getPixelCoords(p);
            
            let isHovered = false;
            if(currentMousePos) {
                 const distSq = (currentMousePos.x - pointPixel.x) ** 2 + (currentMousePos.y - pointPixel.y) ** 2;
                 if (distSq < DRAG_HANDLE_RADIUS_SQ) {
                    isHovered = true;
                    hovered = true;
                 }
            }

            ctx.beginPath();
            ctx.arc(pointPixel.x, pointPixel.y, DRAG_HANDLE_RADIUS, 0, 2 * Math.PI);
            ctx.fillStyle = isHovered ? 'rgba(0, 255, 255, 0.8)' : 'rgba(0, 255, 255, 0.4)';
            ctx.fill();
        });
    });

    if (canvasRef.current) {
        canvasRef.current.style.cursor = hovered || draggedPoint ? 'move' : 'crosshair';
    }

  }, [ctx, lines, getPixelCoords, currentMousePos, draggedPoint, faceDirection, drawStickFigure, backgroundImage]);

  useEffect(() => {
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    redrawCanvas();
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);


  useImperativeHandle(ref, () => ({
    getImageData: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.fillStyle = 'black';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            drawStickFigure(tempCtx, lines, faceDirection, false);

            return tempCanvas.toDataURL('image/png');
        }
      }
      return '';
    },
    clear: () => {
        setLines([]);
    },
    drawPose: (poseLines: number[][]) => {
      const newLines: Line[] = poseLines.map(([x1, y1, x2, y2]) => ({
          p1: { x: x1, y: y1 },
          p2: { x: x2, y: y2 },
      }));
      setLines(newLines);
    },
  }));

  return (
    <div
      className={`relative w-full border-2 border-dashed rounded-lg transition-colors duration-300
        ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600'}
        ${!backgroundImage ? 'hover:border-cyan-500' : ''}
      `}
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => handleDragEvents(e, true)}
      onDrop={onDrop}
    >
        <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseOut={handleEnd}
            onMouseLeave={() => setCurrentMousePos(null)}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
        />
        {!backgroundImage && (
            <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-gray-400 pointer-events-auto p-4 text-center">
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
                <div className="mt-4">
                  <span className="text-gray-500 text-sm">または</span>
                </div>
                <button
                  onClick={() => setIsPickerOpen(true)}
                  className="mt-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors duration-300"
                >
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
          onSelect={onFileSelect}
        />
    </div>
  );
});

export default StickFigureEditor;