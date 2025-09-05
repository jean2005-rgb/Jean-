import React from 'react';
import type { ImageViews, ViewType } from '../types';
import { AppStatus } from '../types';
import { Loader } from './Loader';
import { PhotoIcon } from './icons/PhotoIcon';

interface ViewerProps {
  imageViews: ImageViews;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  status: AppStatus;
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


export const Viewer: React.FC<ViewerProps> = ({ imageViews, activeView, setActiveView, status }) => {
  const currentImage = imageViews[activeView];
  const isGeneratingViews = status === AppStatus.GENERATING;
  const isEditing = status === AppStatus.EDITING;
  
  const isLoadingView = (view: ViewType) => {
    return isGeneratingViews && imageViews[view] === null && view !== 'front';
  };

  const isViewReady = (view: ViewType) => imageViews[view] !== null;

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center border border-gray-700">
      <div className="relative w-full h-full max-w-2xl aspect-square flex items-center justify-center bg-black/20 rounded-md overflow-hidden">
        {(isEditing && currentImage) || (isLoadingView(activeView) && activeView !== 'front') ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
            <Loader />
            <p className="text-gray-300 mt-4">{isEditing ? 'Modification en cours...' : 'Génération de la vue...'}</p>
          </div>
        ) : null}
        
        {currentImage ? (
          <img src={currentImage} alt={`Vue ${activeView}`} className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="text-center text-gray-500 flex flex-col items-center">
            <PhotoIcon className="w-24 h-24 mb-4" />
            <h3 className="text-xl font-semibold">Visionneuse de Personnage</h3>
            <p>Uploadez une image pour commencer.</p>
          </div>
        )}
      </div>
      <div className="mt-6 flex space-x-3 bg-gray-900/50 p-2 rounded-lg">
        <ViewButton 
          label="Face" 
          isActive={activeView === 'front'} 
          isDisabled={!isViewReady('front')}
          onClick={() => setActiveView('front')}
        />
        <ViewButton 
          label="Profil" 
          isActive={activeView === 'side'} 
          isDisabled={!isViewReady('side')}
          onClick={() => setActiveView('side')}
        />
        <ViewButton 
          label="Dos" 
          isActive={activeView === 'back'} 
          isDisabled={!isViewReady('back')}
          onClick={() => setActiveView('back')}
        />
         <ViewButton 
          label="Complet" 
          isActive={activeView === 'full'} 
          isDisabled={!isViewReady('full')}
          onClick={() => setActiveView('full')}
        />
      </div>
    </div>
  );
};
