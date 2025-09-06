
import React from 'react';
import { AppStatus } from '../types.ts';
import { VideoIcon } from './icons/VideoIcon.tsx';
import { Loader } from './Loader.tsx';

interface VideoPanelProps {
  onGenerateVideo: () => void;
  status: AppStatus;
  disabled: boolean;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ onGenerateVideo, status, disabled }) => {
  const isGeneratingVideo = status === AppStatus.GENERATING_VIDEO;

  return (
    <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-gray-600">
      <h3 className="text-lg font-medium text-white mb-4">4. Créer une Vidéo</h3>
      <p className="text-sm text-gray-400 mb-4">
        Générez une courte vidéo de présentation (turntable) de votre personnage.
        Cela peut prendre quelques minutes.
      </p>
      <button
        onClick={onGenerateVideo}
        disabled={disabled || isGeneratingVideo}
        className="w-full flex items-center justify-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-200 disabled:bg-purple-800 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isGeneratingVideo ? (
          <>
            <Loader />
            <span className="ml-2">Génération en cours...</span>
          </>
        ) : (
          <>
            <VideoIcon className="w-5 h-5 mr-2" />
            <span>Générer la vidéo</span>
          </>
        )}
      </button>
    </div>
  );
};
