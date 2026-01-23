import React, { createContext, useContext, useState } from 'react';

const DataModeContext = createContext();

export const useDataMode = () => {
  const context = useContext(DataModeContext);
  if (!context) {
    throw new Error('useDataMode must be used within DataModeProvider');
  }
  return context;
};

export const DataModeProvider = ({ children }) => {
  // Load from localStorage or default to 'live'
  const [dataMode, setDataMode] = useState(() => {
    return localStorage.getItem('dataMode') || 'live';
  });

  const toggleDataMode = () => {
    setDataMode(prev => {
      const newMode = prev === 'live' ? 'sample' : 'live';
      localStorage.setItem('dataMode', newMode);
      // Trigger a custom event so components can react to the change
      window.dispatchEvent(new CustomEvent('dataModeChanged', { detail: newMode }));
      return newMode;
    });
  };

  return (
    <DataModeContext.Provider value={{ dataMode, toggleDataMode }}>
      {children}
    </DataModeContext.Provider>
  );
};

