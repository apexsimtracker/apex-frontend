import { createContext, useContext } from "react";

type V2NavContextValue = {
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
};

export const V2NavContext = createContext<V2NavContextValue | null>(null);

export function useV2Nav() {
  return useContext(V2NavContext);
}
