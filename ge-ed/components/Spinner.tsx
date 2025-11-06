
import React from 'react';

interface SpinnerProps {
    message?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col justify-center items-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      {message && <p className="mt-4 text-sm text-center text-cyan-400">{message}</p>}
    </div>
  );
};

export default Spinner;
