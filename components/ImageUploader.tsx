
import React, { useState, useCallback } from 'react';
import type { ImageFile } from '../types.ts';
import { UploadIcon } from './icons/UploadIcon.tsx';

interface ImageUploaderProps {
  onImageUpload: (imageFile: ImageFile) => void;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Format de fichier non supporté. Veuillez utiliser JPG ou PNG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onImageUpload({
        name: file.name,
        type: file.type,
        mimeType: file.type,
        base64,
      });
      setError(null);
    };
    reader.onerror = () => {
        setError("Erreur lors de la lecture du fichier.");
    }
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  return (
    <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-dashed border-gray-600">
      <h3 className="text-lg font-medium text-white mb-4">1. Uploader une Image</h3>
      <label
        htmlFor="file-upload"
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
          <p className="mb-2 text-xs sm:text-sm text-gray-400"><span className="font-semibold">Cliquez pour uploader</span><br className="sm:hidden" /> ou glissez-déposez</p>
          <p className="text-xs text-gray-500">JPG ou PNG</p>
        </div>
        <input 
            id="file-upload" 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg"
            disabled={disabled}
        />
      </label>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
};
