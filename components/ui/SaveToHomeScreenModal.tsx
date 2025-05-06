"use client";

import React, { useEffect, useState } from 'react';
import { X, Smartphone, Download, Share, PlusSquare } from 'lucide-react';

interface SaveToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveToHomeScreenModal: React.FC<SaveToHomeScreenModalProps> = ({ isOpen, onClose }) => {
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    }
  }, []);

  if (!isOpen) return null;

  const iosInstructions = (
    <>
      <p className="mb-2">1. Tap the <Share className="inline-block h-5 w-5 mx-1" /> button in your browser's toolbar.</p>
      <p>2. Scroll down and tap on <PlusSquare className="inline-block h-5 w-5 mx-1" /> 'Add to Home Screen'.</p>
    </>
  );

  const androidInstructions = (
    <>
      <p className="mb-2">1. Tap the <Download className="inline-block h-5 w-5 mx-1" /> icon or the three dots <Smartphone className="inline-block h-5 w-5 rotate-90 mx-1" /> (menu) in your browser.</p>
      <p>2. Look for an option like 'Install app', 'Add to Home screen', or 'Save to device'.</p>
    </>
  );

  const generalInstructions = (
    <p className="mb-2">Check your browser's menu for an option to 'Add to Home Screen' or 'Install App'.</p>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-700 flex items-center">
            <Smartphone className="h-7 w-7 mr-2 text-blue-600" /> Boost Your Experience!
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="text-gray-700 space-y-3 mb-6">
          <p className="text-lg">
            For the best performance, offline play, and easy access, add Pocket Score to your Home Screen!
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-600 mb-2 text-md">How to add:</h3>
            {os === 'ios' && iosInstructions}
            {os === 'android' && androidInstructions}
            {os === 'other' && generalInstructions}
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default SaveToHomeScreenModal; 