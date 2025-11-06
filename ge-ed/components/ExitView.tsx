
import React from 'react';

const ExitView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="p-8 bg-gray-800/50 rounded-lg border border-gray-700 shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4 text-cyan-400">アプリケーションを終了します</h2>
        <p className="text-gray-300 text-lg mb-2">
          現在の状態は自動的に保存されました。
        </p>
        <p className="text-gray-400">
          このタブまたはウィンドウを閉じて終了してください。
        </p>
      </div>
    </div>
  );
};

export default ExitView;
