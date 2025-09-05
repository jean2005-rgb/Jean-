
// Fix: Provide full implementation for the Sidebar component, which was previously empty.
import React from 'react';
import type { ImageFile, ImageViews } from '../types';
import { AppStatus } from '../types';
import { ImageUploader } from './ImageUploader';
import { CustomizationPanel } from './CustomizationPanel';
import { ExportPanel } from './ExportPanel';
import { ResetIcon } from './icons/ResetIcon';
import { CubeIcon } from './icons/CubeIcon';

interface SidebarProps {
  onImageUpload: (imageFile: ImageFile) => void;
  onApplyEdit: (prompt: string) => void;
  onReset: () => void;
  status: AppStatus;
  imageViews: ImageViews;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onImageUpload,
  onApplyEdit,
  onReset,
  status,
  imageViews,
}) => {
  const isReady = status === AppStatus.READY;
  const isProcessing = status === AppStatus.GENERATING || status === AppStatus.EDITING;
  const hasUploadedImage = imageViews.front !== null;

  return (
    <aside className="w-96 bg-gray-900 text-white p-6 flex flex-col space-y-6 overflow-y-auto">
      <header className="flex items-center space-x-3">
        <CubeIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight">Créateur de Personnage IA</h1>
      </header>
      
      <div className="flex-grow space-y-6">
        <ImageUploader onImageUpload={onImageUpload} disabled={isProcessing || hasUploadedImage} />
        
        {hasUploadedImage && (
            <>
                <CustomizationPanel onApplyEdit={onApplyEdit} disabled={!isReady} />
                <ExportPanel imageViews={imageViews} disabled={!isReady && !isProcessing} />
            </>
        )}
      </div>

      {hasUploadedImage && (
        <button
          onClick={onReset}
          disabled={isProcessing}
          className="w-full flex items-center justify-center bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:bg-red-800 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <ResetIcon className="w-5 h-5 mr-2" />
          Recommencer
        </button>
      )}
    </aside>
  );
};
