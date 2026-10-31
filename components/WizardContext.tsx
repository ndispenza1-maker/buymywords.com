"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface WizardContextType {
  isOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const WizardContext = createContext<WizardContextType>({
  isOpen: false,
  openWizard: () => {},
  closeWizard: () => {},
});

export function useWizard() {
  return useContext(WizardContext);
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWizard = useCallback(() => setIsOpen(true), []);
  const closeWizard = useCallback(() => setIsOpen(false), []);

  return (
    <WizardContext.Provider value={{ isOpen, openWizard, closeWizard }}>
      {children}
    </WizardContext.Provider>
  );
}
