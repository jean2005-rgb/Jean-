
// Fix: Provide full implementation for the Sidebar component, which was previously empty.
import React from 'react';
import type { ImageFile, ImageViews } from '../types.ts';
import { AppStatus } from '../types.ts';
import { ImageUploader } from './ImageUploader.tsx';
import { CustomizationPanel } from './CustomizationPanel.tsx';
import { ExportPanel } from './ExportPanel.tsx';
import { VideoPanel } from './VideoPanel.tsx';
import { ResetIcon } from './icons/ResetIcon.tsx';
import { CubeIcon } from './icons/CubeIcon.tsx';

interface SidebarProps {
  onImageUpload: (imageFile: ImageFile) => void;
  onApplyEdit: (prompt: string) => void;
  onGenerateVideo: () => void;
  onReset: () => void;
  status: AppStatus;
  imageViews: ImageViews;
  advancedEditMode: boolean;
  onAdvancedEditModeChange: (enabled: boolean) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onImageUpload,
  onApplyEdit,
  onGenerateVideo,
  onReset,
  status,
  imageViews,
  advancedEditMode,
  onAdvancedEditModeChange,
  brushSize,
  onBrushSizeChange,
  onClearMask,
}) => {
  const isReady = status === AppStatus.READY;
  const isProcessing = status === AppStatus.GENERATING || status === AppStatus.EDITING || status === AppStatus.GENERATING_VIDEO;
  const hasUploadedImage = imageViews.front !== null;

  return (
    <aside className="w-full md:w-96 bg-gray-900 text-white p-4 md:p-6 flex flex-col space-y-6 md:overflow-y-auto flex-shrink-0">
      <header className="flex items-center space-x-3">
        <CubeIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight">Créateur de Personnage IA</h1>
      </header>
      
      <div className="flex-grow space-y-6">
        <ImageUploader onImageUpload={onImageUpload} disabled={isProcessing || hasUploadedImage} />
        
        {hasUploadedImage && (
            <>
                <CustomizationPanel 
                  onApplyEdit={onApplyEdit} 
                  disabled={!isReady}
                  advancedEditMode={advancedEditMode}
                  onAdvancedEditModeChange={onAdvancedEditModeChange}
                  brushSize={brushSize}
                  onBrushSizeChange={onBrushSizeChange}
                  onClearMask={onClearMask}
                />
                <ExportPanel imageViews={imageViews} disabled={!isReady && !isProcessing} />
                <VideoPanel onGenerateVideo={onGenerateVideo} status={status} disabled={!isReady} />
            </>
        )}
      </div>

      {hasUploadedImage && (
        <div className="mt-auto pt-6">
          <button
            onClick={onReset}
            disabled={isProcessing}
            className="w-full flex items-center justify-center bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:bg-red-800 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <ResetIcon className="w-5 h-5 mr-2" />
            Recommencer
          </button>
        </div>
      )}
    </aside>
  );
};
