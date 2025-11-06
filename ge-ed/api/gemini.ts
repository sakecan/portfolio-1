
import { GoogleGenAI, Modality, Part, Type, GenerateContentResponse } from "@google/genai";
import { ImageData } from '../services/utils';

// A single, lazily-initialized instance of the GoogleGenAI class.
let ai: GoogleGenAI | null = null;
const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable is not set.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

const imageModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-2.5-flash'; // For tasks that primarily reason and return JSON

// Helper to extract the base64 image string from the API response.
const extractImage = (response: GenerateContentResponse): string => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }
  throw new Error('No image found in API response');
};

// Helper to convert our ImageData to a GenAI Part object.
const createImagePart = (image: ImageData): Part => ({
    inlineData: {
        data: image.data,
        mimeType: image.mimeType,
    }
});


export const generateImageFromText = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [{ text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const editImageWithText = async (image: ImageData, prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

type FaceDirection = 'left' | 'front' | 'right' | 'up' | 'down';

export const changePose = async (image: ImageData, pose: ImageData, faceDirection: FaceDirection): Promise<string> => {
    const ai = getAi();
    let directionPrompt = "The person should be facing forward, looking directly at the camera.";
    if (faceDirection === 'left') directionPrompt = "The person's head should be turned to their left, showing their right profile.";
    else if (faceDirection === 'right') directionPrompt = "The person's head should be turned to their right, showing their left profile.";
    else if (faceDirection === 'up') directionPrompt = "The person should be looking upwards, with their chin tilted up.";
    else if (faceDirection === 'down') directionPrompt = "The person should be looking downwards, with their chin tilted down.";
    
    const prompt = `Your task is to meticulously modify the pose of the person in the first image to perfectly match the provided stick figure pose from the second image. It is absolutely crucial to maintain the original person's identity, appearance, clothing, and the background of the first image without any alterations. Only the pose should change. ${directionPrompt}`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), createImagePart(pose), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};


export const mergeImages = async (image1: ImageData, image2: ImageData, prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image1), createImagePart(image2), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const inpaintImage = async (image: ImageData, mask: ImageData, prompt: string): Promise<string> => {
    const ai = getAi();
    const fullPrompt = `Using the first image as the source and the second image as a mask (black areas indicate where to edit), please inpaint the masked area according to the following instruction: "${prompt}". The rest of the image should remain unchanged.`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), createImagePart(mask), { text: fullPrompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const outpaintImage = async (image: ImageData, prompt: string): Promise<string> => {
    const ai = getAi();
    const fullPrompt = `This is an outpainting task. The provided image has transparent areas around a central image. Your task is to fill in these transparent areas to naturally extend the scene. If a prompt is provided, use it as a theme for the extended areas. Prompt: "${prompt || 'Extend the existing scene seamlessly.'}"`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: fullPrompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const faceSwap = async (sourceFace: ImageData, destImage: ImageData): Promise<string> => {
    const ai = getAi();
    const prompt = `You are an expert in photo manipulation. Perform a high-quality face swap.
1.  **Source Face**: The first image provided contains the source face. You must extract this person's entire facial identity.
2.  **Destination Image**: The second image provided is the destination.
3.  **Action**: Replace the face of the person in the destination image with the source face.
4.  **Blending**: The swapped face must be seamlessly blended into the destination image. Match the lighting, shadows, skin tone, and head orientation of the destination image perfectly.
5.  **Critical Rule**: The final image MUST show the person from the source image on the body of the person from the destination image. The original face from the destination image should be completely replaced. Preserve the background and clothing from the destination image.`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(sourceFace), createImagePart(destImage), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const changeCameraPosition = async (image: ImageData, verticalAngle: number, horizontalAngle: number, prompt: string): Promise<string> => {
    const ai = getAi();
    const fullPrompt = `Re-render the image from a different camera angle. The vertical angle should be shifted by ${verticalAngle} degrees (positive is high-angle, negative is low-angle) and the horizontal angle should be shifted by ${horizontalAngle} degrees (positive is from the right, negative is from the left). Maintain the subject and style. Additional instruction: "${prompt || 'None'}"`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: fullPrompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const extractPoseFromImage = async (image: ImageData): Promise<number[][]> => {
    const ai = getAi();
    const prompt = `Analyze the image and identify the pose of the primary human subject. Represent this pose as a simple stick figure. Provide the output as a JSON object containing a single key 'lines'. The value of 'lines' should be an array of line segments that make up the stick figure (e.g., torso, arms, legs, head). Each line segment is an array of four numbers: [x1, y1, x2, y2]. All coordinates must be normalized to a bounding box where the top-left is [0, 0] and the bottom-right is [1, 1].`;
    const response = await ai.models.generateContent({ 
        model: textModel, 
        contents: { parts: [createImagePart(image), { text: prompt }] }, 
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { type: Type.OBJECT, properties: { lines: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 4, maxItems: 4 } } }, required: ["lines"] } 
        } 
    });
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    if (result && result.lines && Array.isArray(result.lines)) {
      const isValid = result.lines.every(
        (line: any) =>
          Array.isArray(line) &&
          line.length === 4 &&
          line.every((coord: any) => typeof coord === 'number')
      );
      if (isValid) return result.lines;
    }
    throw new Error("Invalid pose data received from API.");
};

export const createFigureFromImage = async (image: ImageData, objectType: 'figure' | 'plushie', material: string, prompt: string, intensity: number): Promise<string> => {
    const ai = getAi();
    const fullPrompt = `Transform the main subject of this image into a ${material} ${objectType}. The conversion should have an intensity of ${intensity} out of 100, where 100 is a complete transformation and 1 is very subtle. The style should be photorealistic, as if it's a real object on a clean studio background. Additional instruction: "${prompt || 'None'}"`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: fullPrompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};
  
export const extractLineArt = async (image: ImageData): Promise<string> => {
    const ai = getAi();
    const prompt = "Extract a clean, black and white line art from this image. The background should be pure white. Focus on the main contours and important details of the subject.";
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const colorizeImage = async (
    image: ImageData, 
    mode: 'auto' | 'manual', 
    hairColor: string, 
    skinColor: string, 
    clothingColor: string
): Promise<string> => {
    const ai = getAi();
    let prompt = "Colorize this line art image with a natural and aesthetically pleasing color scheme. Use your best judgment for colors.";
    if (mode === 'manual') {
        prompt = `Colorize this line art image. Please follow these specific color instructions: Hair should be ${hairColor || 'not specified'}. Skin should be ${skinColor || 'not specified'}. Clothing should be ${clothingColor || 'not specified'}. If a color is not specified, use your best judgment for that part.`
    }
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const generateImageFromScribble = async (scribbleImage: ImageData, stylePrompt: string, userPrompt: string): Promise<string> => {
    const ai = getAi();
    const prompt = `Using this rough scribble/sketch as a structural guide, generate a detailed image in a "${stylePrompt}" style. The subject of the image is: "${userPrompt}". Adhere to the composition and shapes in the scribble.`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(scribbleImage), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const changeExpression = async (image: ImageData, expressionPrompt: string): Promise<string> => {
    const ai = getAi();
    const prompt = `Subtly change the facial expression of the person in the image. The new expression should be: "${expressionPrompt}". Do not change their identity, clothing, or the background.`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const createFace = async (labeledParts: {label: string, data: ImageData}[], horizontalAngle: number, verticalAngle: number, userPrompt: string): Promise<string> => {
    const ai = getAi();
    const parts: Part[] = labeledParts.map(p => createImagePart(p.data));
    const prompt = `Create a new human face by compositing the provided image parts. The first image is the base face shape. Subsequent images are specific parts in this order (if provided): eyelashes, eyes, nose, mouth, ears. Blend them seamlessly. The final face should be rendered with a camera angle shifted vertically by ${verticalAngle} degrees and horizontally by ${horizontalAngle} degrees. Additional instructions: ${userPrompt || 'Create a realistic and harmonious face.'}`;
    const response = await ai.models.generateContent({
        model: imageModel, 
        contents: { parts: [...parts, { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] }
    });
    return extractImage(response);
};

export const createPoster = async (backgroundImage: ImageData, subjectImage: ImageData, maskImage: ImageData, userPrompt: string): Promise<string> => {
    const ai = getAi();
    const prompt = `Use the first image as the background. Use the third image (mask) to define a region on the background. Inpaint the person from the second image into the masked (black) area of the background. Blend the subject naturally with the background's lighting and style. Additional instructions: "${userPrompt || 'None.'}"`
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(backgroundImage), createImagePart(subjectImage), createImagePart(maskImage), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const removeHair = async (image: ImageData, colors: string[], intensity: number): Promise<string> => {
    const ai = getAi();
    const prompt = `In this image, please remove all stray hairs of the following colors: ${colors.join(', ')}. The removal should be done with an intensity of ${intensity} out of 100. The underlying surface (skin, clothes, background) should be cleanly restored. Do not alter other parts of the image.`;
    const response = await ai.models.generateContent({ 
        model: imageModel, 
        contents: { parts: [createImagePart(image), { text: prompt }] }, 
        config: { responseModalities: [Modality.IMAGE] } 
    });
    return extractImage(response);
};

export const detectDustAndHair = async (
    image: ImageData,
    types: string[],
    colors: string[],
    sensitivity: number
): Promise<{ box: number[] }[]> => {
    const ai = getAi();
    
    const typePrompt = types.length > 0 ? `Identify all instances of the following types: ${types.join(', ')}.` : 'Identify all instances of dust, debris, and hair-like objects.';
    const colorPrompt = colors.length > 0 ? `Focus on items with these colors: ${colors.join(', ')}.` : 'Consider items of all colors.';
    
    const prompt = `Analyze the provided image to detect and locate specific types of debris. ${typePrompt} ${colorPrompt} The detection sensitivity should be set to ${sensitivity}/100; a higher value means stricter detection, finding only more obvious items, while a lower value means looser detection, finding more subtle items.
For each detected item, provide its bounding box coordinates.
The output must be a JSON object containing a single key "detections", which is an array of objects.
Each object in the array should represent a detected item and have a "box" property, which is an array of four numbers [x_min, y_min, x_max, y_max].
The coordinates must be normalized to the image dimensions (0.0 to 1.0).
If no items are found, return an empty "detections" array.`;

    const response = await ai.models.generateContent({
        model: textModel, // Use the text model for JSON output
        contents: { parts: [createImagePart(image), { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    detections: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                box: {
                                    type: Type.ARRAY,
                                    items: { type: Type.NUMBER },
                                    minItems: 4,
                                    maxItems: 4,
                                },
                            },
                            required: ['box'],
                        },
                    },
                },
                required: ['detections'],
            },
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result && result.detections && Array.isArray(result.detections)) {
        return result.detections;
    }
    
    throw new Error("Invalid detection data received from API.");
};