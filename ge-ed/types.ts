
export enum ViewMode {
  MainMenu = 'MainMenu',
  Img2Img = 'Img2Img',
  Txt2Img = 'Txt2Img',
  Pose = 'Pose',
  Merge = 'Merge',
  Inpaint = 'Inpaint',
  Outpaint = 'Outpaint',
  StyleTransfer = 'StyleTransfer',
  PoseSelection = 'PoseSelection',
  CameraPosition = 'CameraPosition',
  Figure = 'Figure',
  LineArt = 'LineArt',
  Colorization = 'Colorization',
  Scribble = 'Scribble',
  Expression = 'Expression',
  StockImage = 'StockImage',
  FaceCreation = 'FaceCreation',
  PosterCreation = 'PosterCreation',
  CatHairRemoval = 'CatHairRemoval',
  DustDetection = 'DustDetection',
  FaceSwap = 'FaceSwap',
  Exit = 'Exit',
  Settings = 'Settings',
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  comment?: string;
}

export type MenuComments = { [key in ViewMode]?: string };

export interface CustomMenuItem {
  id: string;
  label: string;
  link: string;
  comment?: string;
}

export interface StickFigureEditorRef {
  getImageData: () => string;
  clear: () => void;
  drawPose: (lines: number[][]) => void;
}

export interface MaskEditorRef {
  getImageData: () => string;
  clear: () => void;
  loadImage: (imageFile: ImageFile) => void;
  loadMask: (maskDataUrl: string) => void;
}

export interface ScribbleEditorRef {
  getImageData: () => string;
  clear: () => void;
}

export interface AppContextType {
  view: ViewMode;
  setView: (view: ViewMode) => void;
  generatedImageCount: number;
  incrementGeneratedImageCount: () => void;
  resetGeneratedImageCount: () => void;
  stockImages: ImageFile[];
  addStockImages: (newFiles: File[]) => Promise<void>;
  removeStockImage: (id: string) => Promise<void>;
  updateStockImageComment: (id: string, comment: string) => Promise<void>;
  addGeneratedImageToStock: (dataUrl: string) => void;
  isStockLoaded: boolean;
  menuComments: MenuComments;
  updateMenuComment: (view: ViewMode, comment: string) => void;
  customMenuItems: CustomMenuItem[];
  addCustomMenuItem: (item: Omit<CustomMenuItem, 'id'>) => void;
  updateCustomMenuItem: (updatedItem: CustomMenuItem) => void;
  removeCustomMenuItem: (id: string) => void;
  inpaintState: { imageFile: ImageFile, maskDataUrl: string, prompt?: string } | null;
  setInpaintState: (state: { imageFile: ImageFile, maskDataUrl: string, prompt?: string } | null) => void;
}
