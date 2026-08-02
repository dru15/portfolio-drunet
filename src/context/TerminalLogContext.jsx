import React, { createContext, useContext } from 'react';

export const TerminalLogContext = createContext({ log: () => {} });

export function useTerminalLog() {
  return useContext(TerminalLogContext);
}
