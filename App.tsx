
// Fix: Provide full implementation for the main App component, which was previously empty.
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Viewer } from './components/Viewer';
import type { ImageFile, ImageViews, ViewType } from './types';
import { AppStatus } from './types';
import { generateInitialViews, editImage } from './services/geminiService';

const initialImageViews: ImageViews = {
  front: null,
  side: null,
  back: null,
  full: null,
};

const App: React.FC = () => {
  const [imageViews, setImageViews] = useState<ImageViews>(initialImageViews);
  const [activeView, setActiveView] = useState<ViewType>('front');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (imageFile: ImageFile) => {
    setStatus(AppStatus.GENERATING);
    setError(null);
    setImageViews({ ...initialImageViews, front: imageFile.base64 });
    setActiveView('front');

    try {
      const [sideView, backView, fullView] = await generateInitialViews(imageFile);
      setImageViews(prev => ({
        ...prev,
        side: sideView,
        back: backView,
        full: fullView,
      }));
      setStatus(AppStatus.READY);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Une erreur est survenue lors de la génération des vues.');
      setStatus(AppStatus.ERROR);
    }
  }, []);
  
  const handleApplyEdit = useCallback(async (prompt: string) => {
    const currentImage = imageViews[activeView];
    if (!currentImage) return;

    setStatus(AppStatus.EDITING);
    setError(null);

    try {
      const editedImage = await editImage(currentImage, prompt);
      setImageViews(prev => ({
        ...prev,
        [activeView]: editedImage,
      }));
      setStatus(AppStatus.READY);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Une erreur est survenue lors de la modification de l\'image.');
      setStatus(AppStatus.ERROR);
    }
  }, [activeView, imageViews]);

  const handleReset = useCallback(() => {
    setImageViews(initialImageViews);
    setActiveView('front');
    setStatus(AppStatus.IDLE);
    setError(null);
  }, []);

  return (
    <main className="flex h-screen bg-gray-800 text-white font-sans">
      <Sidebar
        onImageUpload={handleImageUpload}
        onApplyEdit={handleApplyEdit}
        onReset={handleReset}
        status={status}
        imageViews={imageViews}
      />
      <div className="flex-1 flex flex-col p-6">
        <Viewer 
          imageViews={imageViews} 
          activeView={activeView}
          setActiveView={setActiveView}
          status={status}
        />
        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md" role="alert">
            <strong className="font-bold">Erreur: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    </main>
  );
};

export default App;
