"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  appendScore,
  parseUser,
  readRawUser,
  subscribe,
  writeUser,
  type SavedScore,
  type User,
} from "@/lib/session";

type SessionContextValue = {
  user: User | null;
  login: (user: User | null) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // En servidor y en la hidratación el snapshot es null (sin sesión);
  // después del montaje React lee localStorage sin errores de hidratación.
  const raw = useSyncExternalStore(subscribe, readRawUser, () => null);
  const user = useMemo(() => parseUser(raw), [raw]);

  const login = useCallback((u: User | null) => writeUser(u), []);
  const signOut = useCallback(() => writeUser(null), []);
  const saveScore = useCallback(
    (entry: Omit<SavedScore, "at">) => appendScore(entry),
    [],
  );

  const value = useMemo(
    () => ({ user, login, signOut, saveScore }),
    [user, login, signOut, saveScore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
