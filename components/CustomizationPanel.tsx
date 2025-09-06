// Fix: Provide full implementation for the CustomizationPanel component, which was previously empty.
import React, { useState } from 'react';
import { WandIcon } from './icons/WandIcon';
import { BrushIcon } from './icons/BrushIcon';
import { EraserIcon } from './icons/EraserIcon';

interface CustomizationPanelProps {
  onApplyEdit: (prompt: string) => void;
  disabled: boolean;
  advancedEditMode: boolean;
  onAdvancedEditModeChange: (enabled: boolean) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ 
  onApplyEdit, 
  disabled,
  advancedEditMode,
  onAdvancedEditModeChange,
  brushSize,
  onBrushSizeChange,
  onClearMask,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleApplyClick = () => {
    if (prompt.trim()) {
      onApplyEdit(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="bg-gray-700/50 p-4 sm:p-6 rounded-lg border border-gray-600">
      <h3 className="text-lg font-medium text-white mb-2">2. Personnaliser le Personnage</h3>
      
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="advanced-toggle" className="text-sm text-gray-300">
          Mode d'édition avancé
        </label>
        <button
          role="switch"
          aria-checked={advancedEditMode}
          id="advanced-toggle"
          onClick={() => onAdvancedEditModeChange(!advancedEditMode)}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:opacity-50 ${
            advancedEditMode ? 'bg-indigo-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              advancedEditMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {advancedEditMode && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-md border border-gray-600">
            <p className="text-xs text-indigo-300 mb-3">
                Dessinez sur l'image pour sélectionner la zone à modifier.
            </p>
            <div className="flex items-center space-x-3">
                <BrushIcon className="w-5 h-5 text-gray-400"/>
                <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    aria-label="Taille du pinceau"
                />
                <button
                    onClick={onClearMask}
                    disabled={disabled}
                    className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                    title="Effacer la sélection"
                    aria-label="Effacer la sélection"
                >
                    <EraserIcon className="w-5 h-5 text-gray-300" />
                </button>
            </div>
        </div>
      )}

      <p className="text-sm text-gray-400 mb-4">
        Décrivez les modifications. Ex: "ajoute un chapeau de pirate", "change la couleur de la chemise en rouge".
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={disabled}
        placeholder="Ex: ajoute une cicatrice sur l'œil gauche..."
        className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        onClick={handleApplyClick}
        disabled={disabled || !prompt.trim()}
        className="mt-4 w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <WandIcon className="w-5 h-5 mr-2" />
        Appliquer la Modification
      </button>
    </div>
  );
};