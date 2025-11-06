import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-cyan-400 tracking-wider">
          汎用画像処理 Ver7
        </h1>
        <p className="text-center text-gray-400 mt-1 text-sm">Powered by Google Gemini API</p>
      </div>
    </header>
  );
};

export default Header;