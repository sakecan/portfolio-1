
// A simple data structure to hold image data for API calls.
export interface ImageData {
  data: string;
  mimeType: string;
}

// Function to convert a File object to a serializable data object
export async function fileToData(file: File): Promise<ImageData> {
  const base64EncodedData = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    data: base64EncodedData,
    mimeType: file.type,
  };
}

export function dataUrlToData(dataUrl: string): ImageData {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return {
        data: data,
        mimeType: mimeType
    };
}

export async function dataURLtoFile(dataurl: string, filename: string): Promise<File> {
    const res = await fetch(dataurl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}
