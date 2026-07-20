import { createContext, useContext } from "react";

type AppNavContextValue = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

export const AppNavContext = createContext<AppNavContextValue | null>(null);

export function useAppNav() {
  return useContext(AppNavContext);
}
