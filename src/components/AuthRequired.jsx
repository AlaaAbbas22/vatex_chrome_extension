import React from 'react';
import config from '../config.js';

const AuthRequired = () => {
  return (
    <div className="popup-container">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-6">Please login to the main application first to use the extension.</p>
        <a 
          href={config.clientUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="login-link inline-flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Go to Login Page
        </a>
      </div>
    </div>
  );
};

export default AuthRequired; 