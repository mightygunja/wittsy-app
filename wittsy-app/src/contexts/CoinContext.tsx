/**
 * Coin Context - For immediate coin balance updates across the app
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface CoinContextType {
  localCoins: number | null;
  updateLocalCoins: (coins: number) => void;
  clearLocalCoins: () => void;
}

const CoinContext = createContext<CoinContextType>({
  localCoins: null,
  updateLocalCoins: () => {},
  clearLocalCoins: () => {},
});

export const CoinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localCoins, setLocalCoins] = useState<number | null>(null);

  const updateLocalCoins = useCallback((coins: number) => {
    console.log(`💰 CoinContext.updateLocalCoins called with: ${coins}`);
    console.log(`💰 Previous localCoins value:`, localCoins);
    setLocalCoins(coins);
    console.log(`💰 setLocalCoins called, new value should be: ${coins}`);
  }, [localCoins]);

  const clearLocalCoins = useCallback(() => {
    setLocalCoins(null);
  }, []);

  return (
    <CoinContext.Provider value={{ localCoins, updateLocalCoins, clearLocalCoins }}>
      {children}
    </CoinContext.Provider>
  );
};

export const useCoins = () => useContext(CoinContext);
