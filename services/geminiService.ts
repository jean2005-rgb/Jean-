// Fix: Provide full implementation for the Gemini service, which was previously empty.
import { GoogleGenAI, GenerateContentResponse, Part, Modality } from "@google/genai";
import type { ImageFile } from '../types';

// Fix: Correctly initialize GoogleGenAI with the apiKey in an object as required by the SDK.
// Use `process.env.API_KEY` directly as it's expected to be set in the environment.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const parseBase64 = (base64: string): { mimeType: string; data: string } => {
  const parts = base64.split(';base64,');
  const mimeType = parts[0].split(':')[1];
  const data = parts[1];
  return { mimeType, data };
};

const imageToPart = (image: ImageFile): Part => {
  const { mimeType, data } = parseBase64(image.base64);
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
};

/**
 * Generates a single view of a character based on a base image and a text prompt.
 * @param baseImage The initial image file.
 * @param prompt The prompt describing the view to generate.
 * @returns A promise that resolves to the base64 string of the generated image.
 */
const generateSingleView = async (baseImage: ImageFile, prompt: string): Promise<string> => {
    const imagePart = imageToPart(baseImage);

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [imagePart, { text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

    if (!imagePartResponse || !imagePartResponse.inlineData) {
        const textPart = response.text;
        if (textPart) {
            throw new Error(`Failed to generate view: ${textPart}`);
        }
        throw new Error('Failed to generate view. The model did not return an image.');
    }
    
    return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
}

export const generateInitialViews = async (image: ImageFile): Promise<[string, string, string]> => {
  const commonInstructions = "Ensure the art style is consistent with the original image. The background should be transparent. Return ONLY the image. Do not include any text, labels, or explanations.";
  
  const sideViewPrompt = `Based on this front-view image of a character, generate a side view of the character (profile view). ${commonInstructions}`;
  const backViewPrompt = `Based on this front-view image of a character, generate a back view of the character. ${commonInstructions}`;
  const fullViewPrompt = `Based on this front-view image of a character, generate a full-body view of the character from the front. ${commonInstructions}`;

  // Run all generation requests in parallel for better performance
  const [sideView, backView, fullView] = await Promise.all([
      generateSingleView(image, sideViewPrompt),
      generateSingleView(image, backViewPrompt),
      generateSingleView(image, fullViewPrompt),
  ]);

  return [sideView, backView, fullView];
};

export const editImage = async (image: string, prompt: string): Promise<string> => {
    const { mimeType, data } = parseBase64(image);
    const imagePart: Part = {
        inlineData: {
            mimeType,
            data,
        }
    };

    const fullPrompt = `Edit the image based on this instruction: "${prompt}". Return only the modified image with a transparent background. Do not include any text in your response.`;

    // Fix: Use gemini-2.5-flash-image-preview for image editing, per guidelines.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [imagePart, { text: fullPrompt }],
        },
        config: {
            // Fix: Per documentation, must include both Modality.IMAGE and Modality.TEXT for this model.
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

    if (!imagePartResponse || !imagePartResponse.inlineData) {
        const textPart = response.text;
        if (textPart) {
            throw new Error(`Failed to edit image: ${textPart}`);
        }
        throw new Error('Failed to edit image. The model did not return an image.');
    }
    
    return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
};