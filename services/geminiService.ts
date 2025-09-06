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

export const editImage = async (image: string, prompt: string, mask: string | null = null): Promise<string> => {
    const { mimeType, data } = parseBase64(image);
    const imagePart: Part = {
        inlineData: { mimeType, data }
    };

    const parts: Part[] = [imagePart];
    let fullPrompt: string;

    if (mask) {
        const { mimeType: maskMimeType, data: maskData } = parseBase64(mask);
        const maskPart: Part = {
            inlineData: { mimeType: maskMimeType, data: maskData }
        };
        parts.push(maskPart);
        fullPrompt = `Using the provided mask (the white area), edit the image based on this instruction: "${prompt}". Return only the modified image with a transparent background. Do not add text.`;
    } else {
        fullPrompt = `Edit the entire image based on this instruction: "${prompt}". Return only the modified image with a transparent background. Do not add text.`;
    }
    
    parts.push({ text: fullPrompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
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

export const generateVideo = async (baseImage: string): Promise<string> => {
  const { mimeType, data } = parseBase64(baseImage);

  const prompt = "Create a 360-degree turntable animation of this character. The character should be in a neutral A-pose. The background should be a simple, neutral gray studio background. The animation should be a smooth, seamless loop.";

  let operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: prompt,
    image: {
      imageBytes: data,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1
    }
  });

  // Poll for the result every 10 seconds
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error('Video generation failed: no download link found.');
  }

  // Fetch the video data using the API key
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.statusText}`);
  }

  const videoBlob = await videoResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);

  return videoUrl;
};