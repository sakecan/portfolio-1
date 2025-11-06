
import React from 'react';
import { ViewMode } from '../types';
import { useAppContext } from '../contexts/AppContext';

const SettingsView: React.FC = () => {
  const { setView } = useAppContext();
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">設定</h2>
        <button
          onClick={() => setView(ViewMode.MainMenu)}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
        >
          メニューに戻る (Esc)
        </button>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Section 1: Reference Folder (Image Library) */}
        <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-3 text-cyan-400">参照するフォルダの設定 (画像ライブラリ)</h3>
          <p className="text-gray-400 mb-4">
            このアプリケーションで使用する参照画像は、ブラウザ内の「画像ライブラリ」に保存されます。ここからライブラリを管理できます。
            Webアプリケーションのセキュリティ上の制約により、コンピュータのフォルダを直接参照することはできません。
          </p>
          <button
            onClick={() => setView(ViewMode.StockImage)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
          >
            画像ライブラリを管理する
          </button>
        </div>

        {/* Section 2: Download Folder */}
        <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-3 text-cyan-400">ダウンロードするフォルダの設定</h3>
          <p className="text-gray-400">
            生成された画像の保存先は、お使いのブラウザの設定によって決まります。
            アプリケーション側でダウンロードフォルダを指定することはできません。
          </p>
          <p className="text-gray-400 mt-2">
            保存先を変更したい場合は、Chrome、Edge、Firefoxなどのブラウザ本体の設定メニューから「ダウンロード」の項目を探し、保存場所を変更してください。
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
