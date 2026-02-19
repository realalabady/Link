import React, { createContext, useContext, useState, useEffect } from "react";

interface GuestContextType {
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

const GUEST_MODE_KEY = "guest_mode";

export const GuestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    // Initialize from localStorage
    return localStorage.getItem(GUEST_MODE_KEY) === "true";
  });

  useEffect(() => {
    // Sync to localStorage whenever isGuest changes
    if (isGuest) {
      localStorage.setItem(GUEST_MODE_KEY, "true");
    } else {
      localStorage.removeItem(GUEST_MODE_KEY);
    }
  }, [isGuest]);

  const enterGuestMode = () => {
    setIsGuest(true);
  };

  const exitGuestMode = () => {
    setIsGuest(false);
  };

  return (
    <GuestContext.Provider
      value={{ isGuest, setIsGuest, enterGuestMode, exitGuestMode }}
    >
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error("useGuest must be used within a GuestProvider");
  }
  return context;
};

export default GuestContext;
