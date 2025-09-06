import React, { useState, useRef, MouseEvent, WheelEvent, useEffect } from 'react';
import type { ImageViews, ViewType } from '../types';
import { AppStatus } from '../types';
import { Loader } from './Loader';
import { PhotoIcon } from './icons/PhotoIcon';

interface ViewerProps {
  imageViews: ImageViews;
  videoUrl: string | null;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  status: AppStatus;
  advancedEditMode: boolean;
  onMaskChange: (mask: string | null) => void;
  brushSize: number;
  clearMaskSignal: number;
}

const ViewButton: React.FC<{
  label: string;
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
}> = ({ label, isActive, isDisabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {label}
  </button>
);


export const Viewer: React.FC<ViewerProps> = ({ 
  imageViews, videoUrl, activeView, setActiveView, status,
  advancedEditMode, onMaskChange, brushSize, clearMaskSignal 
}) => {
  const currentImage = imageViews[activeView as keyof ImageViews];
  const isGeneratingViews = status === AppStatus.GENERATING;
  const isEditing = status === AppStatus.EDITING;

  // 3D-like interaction state
  const [rotationY, setRotationY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [is3DDragging, setIs3DDragging] = useState(false);
  const lastMouseX = useRef(0);
  
  // Advanced edit mode state
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);


  const isLoadingView = (view: ViewType) => {
    return isGeneratingViews && imageViews[view as keyof ImageViews] === null && view !== 'front';
  };

  const isViewReady = (view: ViewType) => {
    if (view === 'video') return videoUrl !== null;
    return imageViews[view as keyof ImageViews] !== null;
  };

  const resetTransforms = () => {
    setRotationY(0);
    setZoom(1);
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    resetTransforms();
  };

  // 3D Interaction handlers
  const handle3DMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!currentImage || advancedEditMode) return;
    setIs3DDragging(true);
    lastMouseX.current = e.clientX;
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handle3DMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!is3DDragging || !currentImage || advancedEditMode) return;
    const deltaX = e.clientX - lastMouseX.current;
    setRotationY(prev => prev - deltaX * 0.5);
    lastMouseX.current = e.clientX;
  };

  const handle3DMouseUpOrLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!is3DDragging) return;
    setIs3DDragging(false);
    e.currentTarget.style.cursor = 'grab';
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!currentImage || advancedEditMode) return;
    e.preventDefault();
    setZoom(prev => {
        const newZoom = prev - e.deltaY * 0.001;
        return Math.max(0.5, Math.min(newZoom, 3));
    });
  };

  // Canvas drawing handlers
  const getMousePos = (canvas: HTMLCanvasElement, e: MouseEvent<HTMLCanvasElement>): {x: number, y: number} => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const draw = (ctx: CanvasRenderingContext2D, from: {x:number, y:number}, to: {x:number, y:number}) => {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };
  
  const handleCanvasMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const pos = getMousePos(e.currentTarget, e);
    lastPos.current = pos;
    // Draw a dot on single click
    const ctx = e.currentTarget.getContext('2d');
    if(ctx) draw(ctx, pos, pos);
  };
  
  const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = e.currentTarget;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(canvas, e);
    if(ctx && lastPos.current) {
        draw(ctx, lastPos.current, pos);
    }
    lastPos.current = pos;
  };

  const handleCanvasMouseUpOrLeave = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
        onMaskChange(canvas.toDataURL());
    }
  };

  // Effect to sync canvas size with image size
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !advancedEditMode || !currentImage) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    const resizeCanvas = () => {
      const { width, height } = image.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = 'black';
      context.fillRect(0, 0, width, height);
      onMaskChange(null);
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(image);
    
    image.onload = resizeCanvas;
    if (image.complete) resizeCanvas();

    return () => observer.disconnect();
  }, [advancedEditMode, currentImage, onMaskChange]);
  
  // Effect to clear canvas from parent signal
  useEffect(() => {
    if (clearMaskSignal === 0) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if(context && canvas) {
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
        onMaskChange(null);
    }
  }, [clearMaskSignal, onMaskChange]);

  const getCursorStyle = () => {
    if (advancedEditMode) return 'none'; // Custom cursor will be handled by a div
    if (is3DDragging) return 'grabbing';
    if (currentImage) return 'grab';
    return 'default';
  }

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-2 sm:p-4 flex flex-col items-center justify-center border border-gray-700 min-h-0">
      <div 
        className="relative w-full h-full max-w-2xl aspect-square flex items-center justify-center bg-black/20 rounded-md overflow-hidden"
        style={{ perspective: '1000px', cursor: getCursorStyle() }}
        onMouseDown={activeView !== 'video' ? handle3DMouseDown : undefined}
        onMouseMove={activeView !== 'video' ? handle3DMouseMove : undefined}
        onMouseUp={activeView !== 'video' ? handle3DMouseUpOrLeave : undefined}
        onMouseLeave={activeView !== 'video' ? handle3DMouseUpOrLeave : undefined}
        onWheel={activeView !== 'video' ? handleWheel : undefined}
      >
        {(isEditing && currentImage) || (isLoadingView(activeView)) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20">
            <Loader />
            <p className="text-gray-300 mt-4">{isEditing ? 'Modification en cours...' : 'Génération de la vue...'}</p>
          </div>
        ) : null}
        
        {activeView === 'video' && videoUrl ? (
            <video 
                src={videoUrl}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                loop
                muted // Mute to allow autoplay in most browsers
            />
        ) : currentImage ? (
          <>
            <img 
              ref={imageRef}
              src={currentImage} 
              alt={`Vue ${activeView}`} 
              className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out pointer-events-none"
              style={{
                transform: `rotateY(${rotationY}deg) scale(${zoom})`,
              }}
              draggable="false"
            />
            {advancedEditMode && (
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 opacity-50 z-10"
                style={{
                  transform: `rotateY(${rotationY}deg) scale(${zoom})`,
                  pointerEvents: isEditing ? 'none' : 'auto',
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUpOrLeave}
                onMouseLeave={handleCanvasMouseUpOrLeave}
              />
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 flex flex-col items-center p-4">
            <PhotoIcon className="w-16 h-16 sm:w-24 sm:h-24 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold">Visionneuse de Personnage</h3>
            <p className="text-sm">Uploadez une image pour commencer.</p>
            <p className="text-xs text-gray-600 mt-2">Cliquez-glissez pour pivoter, molette pour zoomer.</p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 bg-gray-900/50 p-2 rounded-lg">
        <ViewButton 
          label="Face" 
          isActive={activeView === 'front'} 
          isDisabled={!isViewReady('front')}
          onClick={() => handleViewChange('front')}
        />
        <ViewButton 
          label="Profil" 
          isActive={activeView === 'side'} 
          isDisabled={!isViewReady('side')}
          onClick={() => handleViewChange('side')}
        />
        <ViewButton 
          label="Dos" 
          isActive={activeView === 'back'} 
          isDisabled={!isViewReady('back')}
          onClick={() => handleViewChange('back')}
        />
         <ViewButton 
          label="Complet" 
          isActive={activeView === 'full'} 
          isDisabled={!isViewReady('full')}
          onClick={() => handleViewChange('full')}
        />
        <ViewButton 
          label="Vidéo" 
          isActive={activeView === 'video'} 
          isDisabled={!isViewReady('video')}
          onClick={() => handleViewChange('video')}
        />
      </div>
    </div>
  );
};