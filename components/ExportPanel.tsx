

// Fix: Provide full implementation for the ExportPanel component, which was previously empty.
import React from 'react';
import type { ImageViews } from '../types.ts';
import { DownloadIcon } from './icons/DownloadIcon.tsx';

interface ExportPanelProps {
  imageViews: ImageViews;
  disabled: boolean;
}

const viewNameMapping: Record<keyof ImageViews, string> = {
  front: 'de face',
  side: 'de profil',
  back: 'de dos',
  full: 'complète'
};

export const ExportPanel: React.FC<ExportPanelProps> = ({ imageViews, disabled }) => {
  const handleDownload = (image: string | null, viewName: string) => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `character-${viewName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    Object.entries(imageViews).forEach(([viewName, image], index) => {
      if (image) {
        // Use a small delay to allow browsers to handle multiple downloads
        setTimeout(() => handleDownload(image, viewName), index * 200);
      }
    });
  };

  const isAnyImageReady = Object.values(imageViews).some(img => img !== null);

  return (
    <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-gray-600">
      <h3 className="text-lg font-medium text-white mb-4">3. Exporter</h3>
      <div className="space-y-3">
        {(Object.keys(imageViews) as Array<keyof ImageViews>).map((viewName) => {
          const image = imageViews[viewName];
          return (
            <button
              key={viewName}
              onClick={() => handleDownload(image, viewName)}
              disabled={!image || disabled}
              className="w-full flex items-center justify-between bg-gray-700 text-white font-medium py-2 px-4 rounded-md hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Télécharger la vue {viewNameMapping[viewName]}</span>
              <DownloadIcon className="w-5 h-5" />
            </button>
          )
        })}
      </div>
      <button
        onClick={handleDownloadAll}
        disabled={!isAnyImageReady || disabled}
        className="mt-4 w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200 disabled:bg-green-800 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        Télécharger Tout
      </button>
    </div>
  );
};
