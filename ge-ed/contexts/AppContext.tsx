
import React, { createContext, useState, useEffect, useCallback, useRef, useContext, ReactNode } from 'react';
import { ViewMode, ImageFile, MenuComments, CustomMenuItem, AppContextType } from '../types';
import { dataURLtoFile } from '../services/utils';
import useLocalStorage from '../hooks/useLocalStorage';
import * as db from '../services/db';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewMode>(ViewMode.MainMenu);
  const [generatedImageCount, setGeneratedImageCount] = useLocalStorage<number>('generatedImageCount', 0);
  const [stockImages, setStockImages] = useState<ImageFile[]>([]);
  const [isStockLoaded, setIsStockLoaded] = useState(false);
  const [menuComments, setMenuComments] = useLocalStorage<MenuComments>('menuComments', {});
  const [customMenuItems, setCustomMenuItems] = useLocalStorage<CustomMenuItem[]>('customMenuItems', []);
  const [inpaintState, setInpaintState] = useState<{ imageFile: ImageFile, maskDataUrl: string, prompt?: string } | null>(null);

  const stockImagesRef = useRef<ImageFile[]>([]);
  useEffect(() => {
    stockImagesRef.current = stockImages;
  }, [stockImages]);

  useEffect(() => {
    const loadStockImages = async () => {
      try {
        const images = await db.getAllImages();
        setStockImages(images);
      } catch (e) {
        console.error("Failed to load images from IndexedDB:", e);
      } finally {
        setIsStockLoaded(true);
      }
    };
    loadStockImages();

    return () => {
      stockImagesRef.current.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, []);

  const addStockImages = useCallback(async (newFiles: File[]) => {
    const newImageFiles: ImageFile[] = newFiles.map(file => ({
        id: `${Date.now()}-${file.name}`,
        file: file,
        preview: URL.createObjectURL(file),
        comment: '',
    }));

    try {
        for (const image of newImageFiles) {
            const { preview, ...storableImage } = image; 
            await db.addImage(storableImage);
        }
        setStockImages(prev => [...prev, ...newImageFiles]);
    } catch (e) {
        console.error("Error adding stock images to DB:", e);
        newImageFiles.forEach(img => URL.revokeObjectURL(img.preview));
    }
  }, []);

  const addGeneratedImageToStock = useCallback((dataUrl: string) => {
    const filename = `generated-${Date.now()}.png`;
    dataURLtoFile(dataUrl, filename).then(file => {
        addStockImages([file]);
    });
  }, [addStockImages]);


  const removeStockImage = useCallback(async (id: string) => {
    const imageToRemove = stockImages.find(image => image.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    try {
      await db.deleteImage(id);
      setStockImages(prev => prev.filter(image => image.id !== id));
    } catch (e) {
      console.error("Error removing stock image from DB:", e);
    }
  }, [stockImages]);

  const updateStockImageComment = useCallback(async (id: string, comment: string) => {
    const originalStockImages = stockImages;
    let imageToUpdate: ImageFile | undefined;
    
    const newStockImages = stockImages.map(image => {
      if (image.id === id) {
        imageToUpdate = { ...image, comment };
        return imageToUpdate;
      }
      return image;
    });
    setStockImages(newStockImages);

    if (imageToUpdate) {
        try {
            const { preview, ...storableImage } = imageToUpdate;
            await db.updateImage(storableImage);
        } catch(e) {
            console.error("Error updating image comment in DB:", e);
            setStockImages(originalStockImages);
        }
    }
  }, [stockImages]);

  const updateMenuComment = useCallback((view: ViewMode, comment: string) => {
    setMenuComments(prev => {
      const newComments = { ...prev };
      const trimmedComment = comment.trim();
      if (trimmedComment) {
        newComments[view] = trimmedComment;
      } else {
        delete newComments[view];
      }
      return newComments;
    });
  }, [setMenuComments]);

  const addCustomMenuItem = useCallback((item: Omit<CustomMenuItem, 'id'>) => {
    const newItem: CustomMenuItem = { ...item, id: `custom-${Date.now()}` };
    setCustomMenuItems(prev => [...prev, newItem]);
  }, [setCustomMenuItems]);

  const updateCustomMenuItem = useCallback((updatedItem: CustomMenuItem) => {
    setCustomMenuItems(prev =>
      prev.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
  }, [setCustomMenuItems]);

  const removeCustomMenuItem = useCallback((id: string) => {
    setCustomMenuItems(prev => prev.filter(item => item.id !== id));
  }, [setCustomMenuItems]);

  const incrementGeneratedImageCount = useCallback(() => {
    setGeneratedImageCount(prev => prev + 1);
  }, [setGeneratedImageCount]);

  const resetGeneratedImageCount = useCallback(() => {
    setGeneratedImageCount(0);
  }, [setGeneratedImageCount]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (view !== ViewMode.MainMenu) {
      if (event.key === 'Escape') {
        setView(ViewMode.MainMenu);
      }
    }
  }, [view]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const value: AppContextType = {
    view,
    setView,
    generatedImageCount,
    incrementGeneratedImageCount,
    resetGeneratedImageCount,
    stockImages,
    addStockImages,
    removeStockImage,
    updateStockImageComment,
    addGeneratedImageToStock,
    isStockLoaded,
    menuComments,
    updateMenuComment,
    customMenuItems,
    addCustomMenuItem,
    updateCustomMenuItem,
    removeCustomMenuItem,
    inpaintState,
    setInpaintState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
