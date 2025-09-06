// Fix: Provide full implementation for the main App component, which was previously empty.
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Viewer } from './components/Viewer';
import type { ImageFile, ImageViews, ViewType } from './types';
import { AppStatus } from './types';
import { generateInitialViews, editImage, generateVideo } from './services/geminiService';

const initialImageViews: ImageViews = {
  front: null,
  side: null,
  back: null,
  full: null,
};

const App: React.FC = () => {
  // Add a check for the API key. This is a common issue on deployment.
  if (!process.env.API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white font-sans">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl border border-red-500 max-w-md mx-4">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Erreur de Configuration</h1>
          <p className="text-gray-300">
            La clé API de Google Gemini n'est pas configurée.
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            Pour que cette application fonctionne, veuillez définir la variable d'environnement <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300">API_KEY</code> dans les paramètres de votre projet sur Vercel.
          </p>
        </div>
      </div>
    );
  }
  
  const [imageViews, setImageViews] = useState<ImageViews>(initialImageViews);
  const [activeView, setActiveView] = useState<ViewType>('front');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // State for Advanced Edit Mode
  const [advancedEditMode, setAdvancedEditMode] = useState(false);
  const [mask, setMask] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [clearMaskSignal, setClearMaskSignal] = useState(0);


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
    const currentImage = imageViews[activeView as keyof ImageViews];
    if (!currentImage) return;

    setStatus(AppStatus.EDITING);
    setError(null);

    try {
      const editedImage = await editImage(currentImage, prompt, advancedEditMode ? mask : null);
      setImageViews(prev => ({
        ...prev,
        [activeView]: editedImage,
      }));
       // Clear mask after successful application
      if (advancedEditMode) {
        setClearMaskSignal(prev => prev + 1);
        setMask(null);
      }
      setStatus(AppStatus.READY);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Une erreur est survenue lors de la modification de l\'image.');
      setStatus(AppStatus.ERROR);
    }
  }, [activeView, imageViews, advancedEditMode, mask]);

  const handleGenerateVideo = useCallback(async () => {
    const frontImage = imageViews.front;
    if (!frontImage) return;

    setStatus(AppStatus.GENERATING_VIDEO);
    setError(null);

    try {
      const newVideoUrl = await generateVideo(frontImage);
      setVideoUrl(newVideoUrl);
      setStatus(AppStatus.READY);
      setActiveView('video'); // Switch to video view on success
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Une erreur est survenue lors de la génération de la vidéo.');
      setStatus(AppStatus.ERROR);
    }
  }, [imageViews.front]);

  const handleReset = useCallback(() => {
    // Revoke old video URL to prevent memory leaks
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setImageViews(initialImageViews);
    setActiveView('front');
    setStatus(AppStatus.IDLE);
    setError(null);
    setVideoUrl(null);
    setAdvancedEditMode(false);
    setMask(null);
  }, [videoUrl]);

  const handleClearMask = useCallback(() => {
    setMask(null);
    setClearMaskSignal(prev => prev + 1);
  }, []);

  return (
    <main className="flex flex-col md:flex-row md:h-screen bg-gray-800 text-white font-sans">
      <Sidebar
        onImageUpload={handleImageUpload}
        onApplyEdit={handleApplyEdit}
        onGenerateVideo={handleGenerateVideo}
        onReset={handleReset}
        status={status}
        imageViews={imageViews}
        advancedEditMode={advancedEditMode}
        onAdvancedEditModeChange={setAdvancedEditMode}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        onClearMask={handleClearMask}
      />
      <div className="flex-1 flex flex-col p-2 sm:p-4 md:p-6 min-h-0">
        <Viewer 
          imageViews={imageViews}
          videoUrl={videoUrl}
          activeView={activeView}
          setActiveView={setActiveView}
          status={status}
          advancedEditMode={advancedEditMode}
          onMaskChange={setMask}
          brushSize={brushSize}
          clearMaskSignal={clearMaskSignal}
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