
import React from 'react';
import { ViewMode } from './types';
import MainMenu from './components/MainMenu';
import Img2TxtView from './components/Img2TxtView';
import Txt2ImgView from './components/Txt2ImgView';
import PoseView from './components/PoseView';
import ImgMergeView from './components/ImgMergeView';
import InpaintView from './components/InpaintView';
import OutpaintView from './components/OutpaintView';
import StyleTransferView from './components/StyleTransferView';
import Header from './components/Header';
import PoseSelectionView from './components/PoseSelectionView';
import CameraPositionView from './components/CameraPositionView';
import FigureView from './components/FigureView';
import LineArtView from './components/LineArtView';
import ColorizationView from './components/ColorizationView';
import ScribbleView from './components/ScribbleView';
import ExpressionView from './components/ExpressionView';
import StockImageView from './components/StockImageView';
import FaceCreationView from './components/FaceCreationView';
import PosterCreationView from './components/PosterCreationView';
import CatHairRemovalView from './components/CatHairRemovalView';
import DustDetectionView from './components/DustDetectionView';
import FaceSwapView from './components/FaceSwapView';
import ExitView from './components/ExitView';
import SettingsView from './components/SettingsView';
import { AppProvider, useAppContext } from './contexts/AppContext';

const AppContent: React.FC = () => {
  const { view, isStockLoaded } = useAppContext();

  const renderView = () => {
    switch (view) {
      case ViewMode.MainMenu:
        return <MainMenu />;
      case ViewMode.Img2Img:
        return <Img2TxtView />;
      case ViewMode.Txt2Img:
        return <Txt2ImgView />;
      case ViewMode.Pose:
        return <PoseView />;
      case ViewMode.Merge:
        return <ImgMergeView />;
      case ViewMode.Inpaint:
        return <InpaintView />;
      case ViewMode.Outpaint:
        return <OutpaintView />;
      case ViewMode.StyleTransfer:
        return <StyleTransferView />;
      case ViewMode.PoseSelection:
        return <PoseSelectionView />;
      case ViewMode.CameraPosition:
        return <CameraPositionView />;
      case ViewMode.Figure:
        return <FigureView />;
      case ViewMode.LineArt:
        return <LineArtView />;
      case ViewMode.Colorization:
        return <ColorizationView />;
      case ViewMode.Scribble:
        return <ScribbleView />;
      case ViewMode.Expression:
        return <ExpressionView />;
      case ViewMode.StockImage:
        return <StockImageView />;
      case ViewMode.FaceCreation:
        return <FaceCreationView />;
      case ViewMode.PosterCreation:
        return <PosterCreationView />;
      case ViewMode.CatHairRemoval:
        return <CatHairRemovalView />;
      case ViewMode.DustDetection:
        return <DustDetectionView />;
      case ViewMode.FaceSwap:
        return <FaceSwapView />;
      case ViewMode.Settings:
        return <SettingsView />;
      case ViewMode.Exit:
        return <ExitView />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {isStockLoaded ? renderView() : <div className="text-center p-8">画像ライブラリを読み込んでいます...</div>}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;