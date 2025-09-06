
// Fix: Provide full implementation for the main App component, which was previously empty.
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Viewer } from './components/Viewer.tsx';
import type { ImageFile, ImageViews, ViewType } from './types.ts';
import { AppStatus } from './types.ts';
import { generateInitialViews, editImage, generateVideo } from './services/geminiService.ts';

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
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl border border-yellow-500 max-w-2xl mx-4">
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">Action Requise : Configuration de la Clé API</h1>
          <p className="text-gray-300 text-left mb-4">
            Pour que l'application puisse communiquer avec l'IA de Google, une clé API est nécessaire. Pour des raisons de sécurité, cette clé ne doit pas être inscrite directement dans le code.
          </p>
          <p className="text-gray-300 text-left mb-4">
            Elle doit être fournie via une variable d'environnement nommée <code className="bg-gray-700 px-2 py-1 rounded text-yellow-300">API_KEY</code>.
          </p>
          <div className="text-left mt-6 bg-gray-900/50 p-4 rounded-md border border-gray-700">
            <h2 className="font-semibold text-lg mb-2 text-white">Comment configurer la clé :</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400 text-sm">
                <li>
                    <strong>Si vous déployez sur une plateforme (Vercel, Netlify...) :</strong><br/>
                    Allez dans les paramètres de votre projet et ajoutez une variable d'environnement. Nommez-la <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">API_KEY</code> et collez-y votre clé.
                </li>
                <li>
                    <strong>Si vous exécutez le projet localement :</strong><br/>
                     Vous devez démarrer votre serveur de développement avec la variable d'environnement. Par exemple, dans votre terminal :<br/>
                     <code className="block bg-gray-700 mt-1 p-2 rounded text-yellow-300 text-xs">API_KEY=VOTRE_CLE_ICI npm run dev</code>
                </li>
            </ul>
          </div>
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
