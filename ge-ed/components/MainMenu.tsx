
import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, CustomMenuItem } from '../types';
import { useAppContext } from '../contexts/AppContext';

const MainMenu: React.FC = () => {
  const {
    setView,
    generatedImageCount,
    resetGeneratedImageCount,
    menuComments,
    updateMenuComment,
    customMenuItems,
    addCustomMenuItem,
    updateCustomMenuItem,
    removeCustomMenuItem,
  } = useAppContext();

  const menuItems = [
    { view: ViewMode.Exit, label: '終了', key: '0' },
    { view: ViewMode.Img2Img, label: 'IMG2IMG: 画像をテキストで編集する', key: '1' },
    { view: ViewMode.Txt2Img, label: 'TXT2IMG: テキストから新しい画像を生成する', key: '2' },
    { view: ViewMode.Pose, label: '棒人間で姿勢を決める', key: '3' },
    { view: ViewMode.Merge, label: '二枚の画像を合成する', key: '4' },
    { view: ViewMode.Inpaint, label: 'インペイント処理を行う', key: '5' },
    { view: ViewMode.Outpaint, label: 'アウトペイント処理を行う', key: '6' },
    { view: ViewMode.StyleTransfer, label: 'スタイル変換をする', key: '7' },
    { view: ViewMode.PoseSelection, label: 'メニューから姿勢を選択する', key: '8' },
    { view: ViewMode.CameraPosition, label: 'カメラ位置の変更', key: '9' },
    { view: ViewMode.Figure, label: 'フィギュア/ぬいぐるみ化', key: '10' },
    { view: ViewMode.Colorization, label: '彩色プログラム', key: '11' },
    { view: ViewMode.Scribble, label: 'マウスで絵を描く', key: '12' },
    { view: ViewMode.LineArt, label: '線画抽出', key: '13' },
    { view: ViewMode.Expression, label: '表情を変える', key: '14' },
    { view: ViewMode.StockImage, label: '画像ライブラリ', key: '15' },
    { view: ViewMode.FaceCreation, label: '顔の作成', key: '16' },
    { view: ViewMode.PosterCreation, label: 'ポスター作製', key: '17' },
    { view: ViewMode.CatHairRemoval, label: '毛の除去', key: '18' },
    { view: ViewMode.FaceSwap, label: '顔の交換 (現状では機能しません)', key: '19' },
    { view: ViewMode.DustDetection, label: 'ちり、ほこり、毛の検出', key: '20' },
  ];

  const [editingCommentItem, setEditingCommentItem] = useState<(typeof menuItems)[0] | null>(null);
  const [editedComment, setEditedComment] = useState('');

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomMenuItem | null>(null); // null for new, object for edit
  const [cardData, setCardData] = useState({ label: '', link: '', comment: '' });

  const commentModalRef = useRef<HTMLDivElement>(null);
  const cardModalRef = useRef<HTMLDivElement>(null);

  const handleOpenCommentModal = (item: (typeof menuItems)[0]) => {
    setEditingCommentItem(item);
    setEditedComment(menuComments[item.view] || '');
  };

  const handleCloseCommentModal = () => {
    setEditingCommentItem(null);
  };

  const handleSaveComment = () => {
    if (editingCommentItem) {
      updateMenuComment(editingCommentItem.view, editedComment);
      handleCloseCommentModal();
    }
  };
  
  const handleOpenCardModal = (item: CustomMenuItem | null) => {
    setEditingCard(item);
    if (item) {
      setCardData({ label: item.label, link: item.link, comment: item.comment || '' });
    } else {
      setCardData({ label: '', link: '', comment: '' });
    }
    setIsCardModalOpen(true);
  };

  const handleCloseCardModal = () => {
    setIsCardModalOpen(false);
  };

  const handleSaveCard = () => {
    if (editingCard) { // Editing existing card
      updateCustomMenuItem({ ...editingCard, ...cardData });
    } else { // Creating new card
      if(cardData.label && cardData.link) {
        addCustomMenuItem(cardData);
      }
    }
    handleCloseCardModal();
  };
  
  const handleDeleteCard = () => {
    if (editingCard && window.confirm(`「${editingCard.label}」を削除しますか？`)) {
      removeCustomMenuItem(editingCard.id);
      handleCloseCardModal();
    }
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
        e.preventDefault();
        handleOpenCardModal(null); // Open modal for new card
    }
  };

  const sortedMenuItems = [...menuItems].sort((a, b) => {
    const keyA = parseInt(a.key, 10);
    const keyB = parseInt(b.key, 10);
    return keyA - keyB;
  });

  // Focus Trap hook
  const useFocusTrap = (modalRef: React.RefObject<HTMLDivElement>, isOpen: boolean) => {
    useEffect(() => {
      if (!isOpen) return;
  
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusableElements || focusableElements.length === 0) return;
  
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
  
          if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };
  
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, modalRef]);
  };

  useFocusTrap(commentModalRef, !!editingCommentItem);
  useFocusTrap(cardModalRef, isCardModalOpen);


  return (
    <div className="flex flex-col items-center justify-center" onContextMenu={handleBackgroundContextMenu}>
      <div className="w-full max-w-4xl mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex justify-between items-center shadow-lg">
        <div>
            <span className="text-gray-400 text-lg">総生成枚数: </span>
            <span className="text-3xl font-bold text-cyan-400 ml-2">{generatedImageCount}</span>
        </div>
        <div className="flex items-center space-x-4">
            <button
                onClick={() => setView(ViewMode.Settings)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold p-2 rounded-full transition-all duration-300 transform hover:scale-110 shadow-md"
                aria-label="設定"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            <button
                onClick={resetGeneratedImageCount}
                className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
            >
                リセット
            </button>
        </div>
      </div>
      <h2 className="text-3xl font-bold mb-8 text-white">メインメニュー</h2>
      <p className="text-gray-400 mb-8 -mt-4 text-sm">カードのない場所で右クリックすると、新しいカードを追加できます。</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {sortedMenuItems.map((item) => (
          <div
            key={item.view}
            className="relative group"
            onContextMenu={(e) => {
              if (item.view === ViewMode.Exit) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              handleOpenCommentModal(item);
            }}
          >
            <button
              onClick={() => setView(item.view)}
              className={`w-full bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 transition-all duration-300 transform hover:-translate-y-1 ${
                item.view === ViewMode.Exit
                  ? 'hover:bg-red-700/20 hover:border-red-500'
                  : 'hover:bg-cyan-500/20 hover:border-cyan-400'
              }`}
            >
              <div className="flex items-center">
                {item.key !== '0' && (
                  <span className={`text-lg font-semibold bg-gray-700 text-white rounded-md px-3 py-1 mr-4 transition-colors ${
                    item.view === ViewMode.Exit ? 'group-hover:bg-red-600' : 'group-hover:bg-cyan-500'
                  }`}>
                    {item.key}
                  </span>
                )}
                <span className="text-lg font-medium text-left">{item.label}</span>
              </div>
            </button>
            {menuComments[item.view] && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="truncate">{menuComments[item.view]}</p>
              </div>
            )}
            {item.view !== ViewMode.Exit && (
              <div className="absolute top-1 right-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                右クリックで編集
              </div>
            )}
          </div>
        ))}
        {customMenuItems.map((item) => (
          <div
            key={item.id}
            className="relative group"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenCardModal(item);
            }}
          >
            <button
              onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
              className="w-full bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-purple-500/20 border border-gray-700 hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center">
                <span className="text-lg font-semibold bg-gray-700 group-hover:bg-purple-500 text-white rounded-md px-3 py-1 mr-4 transition-colors">
                  🌐
                </span>
                <span className="text-lg font-medium text-left">{item.label}</span>
              </div>
            </button>
            {item.comment && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <p className="truncate">{item.comment}</p>
              </div>
            )}
            <div className="absolute top-1 right-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                右クリックで編集
            </div>
          </div>
        ))}
      </div>
      
      {editingCommentItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={handleCloseCommentModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-edit-title"
        >
          <div
            ref={commentModalRef}
            className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 id="comment-edit-title" className="text-lg font-bold mb-1">コメントを編集</h3>
              <p className="text-gray-400 text-sm mb-4">{editingCommentItem.label}</p>
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                placeholder="コメントを入力..."
                className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end p-4 bg-gray-700/50 rounded-b-lg space-x-4">
              <button
                onClick={handleCloseCommentModal}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveComment}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isCardModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          onClick={handleCloseCardModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={cardModalRef}
            className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingCard ? 'カードを編集' : '新しいカードを追加'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">ラベル</label>
                  <input
                    type="text"
                    value={cardData.label}
                    onChange={(e) => setCardData({ ...cardData, label: e.target.value })}
                    placeholder="例: Google ドライブ"
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">リンク先URL</label>
                  <input
                    type="url"
                    value={cardData.link}
                    onChange={(e) => setCardData({ ...cardData, link: e.target.value })}
                    placeholder="https://drive.google.com"
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">コメント (任意)</label>
                  <textarea
                    value={cardData.comment}
                    onChange={(e) => setCardData({ ...cardData, comment: e.target.value })}
                    placeholder="ホバー時に表示されるコメント"
                    className="w-full h-24 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between p-4 bg-gray-700/50 rounded-b-lg">
              <div>
                {editingCard && (
                  <button
                    onClick={handleDeleteCard}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="space-x-4">
                <button
                  onClick={handleCloseCardModal}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveCard}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;