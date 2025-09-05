
// Fix: Provide full implementation for the CustomizationPanel component, which was previously empty.
import React, { useState } from 'react';
import { WandIcon } from './icons/WandIcon';

interface CustomizationPanelProps {
  onApplyEdit: (prompt: string) => void;
  disabled: boolean;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ onApplyEdit, disabled }) => {
  const [prompt, setPrompt] = useState('');

  const handleApplyClick = () => {
    if (prompt.trim()) {
      onApplyEdit(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600">
      <h3 className="text-lg font-medium text-white mb-4">2. Personnaliser le Personnage</h3>
      <p className="text-sm text-gray-400 mb-4">
        Décrivez les modifications que vous souhaitez apporter. Par exemple: "ajoute un chapeau de pirate", "change la couleur de la chemise en rouge".
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
