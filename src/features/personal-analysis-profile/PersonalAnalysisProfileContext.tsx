"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  defaultPersonalAnalysisProfile,
  PERSONAL_ANALYSIS_PROFILE_STORAGE_KEY,
} from "./profileOptions";
import type { PersonalAnalysisProfile } from "./types";

type PersonalAnalysisProfileContextValue = {
  profile: PersonalAnalysisProfile;
  isDrawerOpen: boolean;
  isHydrated: boolean;
  savedMessage: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  saveProfile: (profile: PersonalAnalysisProfile) => void;
  resetProfile: () => void;
  clearSavedMessage: () => void;
};

const PersonalAnalysisProfileContext =
  createContext<PersonalAnalysisProfileContextValue | null>(null);

function normalizeProfile(value: unknown): PersonalAnalysisProfile {
  if (!value || typeof value !== "object") {
    return defaultPersonalAnalysisProfile;
  }

  const profile = value as Partial<PersonalAnalysisProfile>;

  return {
    knowledgeLevel: profile.knowledgeLevel ?? defaultPersonalAnalysisProfile.knowledgeLevel,
    goal: profile.goal ?? defaultPersonalAnalysisProfile.goal,
    riskAppetite: profile.riskAppetite ?? defaultPersonalAnalysisProfile.riskAppetite,
    interfaceMode: profile.interfaceMode ?? defaultPersonalAnalysisProfile.interfaceMode,
    explanationDepth: profile.explanationDepth ?? defaultPersonalAnalysisProfile.explanationDepth,
    updatedAt: profile.updatedAt ?? "",
  };
}

function readStoredProfile() {
  if (typeof window === "undefined") {
    return defaultPersonalAnalysisProfile;
  }

  try {
    const storedProfile = window.localStorage.getItem(PERSONAL_ANALYSIS_PROFILE_STORAGE_KEY);
    return storedProfile
      ? normalizeProfile(JSON.parse(storedProfile))
      : defaultPersonalAnalysisProfile;
  } catch {
    return defaultPersonalAnalysisProfile;
  }
}

export function PersonalAnalysisProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(readStoredProfile);
  const [isHydrated] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const clearSavedMessage = useCallback(() => setSavedMessage(""), []);

  const saveProfile = useCallback((nextProfile: PersonalAnalysisProfile) => {
    const profileToSave = {
      ...nextProfile,
      updatedAt: new Date().toISOString(),
    };

    setProfile(profileToSave);
    window.localStorage.setItem(
      PERSONAL_ANALYSIS_PROFILE_STORAGE_KEY,
      JSON.stringify(profileToSave)
    );
    setSavedMessage("Đã cập nhật Hồ sơ phân tích cá nhân.");
  }, []);

  const resetProfile = useCallback(() => {
    const profileToSave = {
      ...defaultPersonalAnalysisProfile,
      updatedAt: new Date().toISOString(),
    };

    setProfile(profileToSave);
    window.localStorage.setItem(
      PERSONAL_ANALYSIS_PROFILE_STORAGE_KEY,
      JSON.stringify(profileToSave)
    );
    setSavedMessage("Đã đặt lại Hồ sơ phân tích cá nhân.");
  }, []);

  const value = useMemo(
    () => ({
      clearSavedMessage,
      closeDrawer,
      isDrawerOpen,
      isHydrated,
      openDrawer,
      profile,
      resetProfile,
      savedMessage,
      saveProfile,
    }),
    [
      clearSavedMessage,
      closeDrawer,
      isDrawerOpen,
      isHydrated,
      openDrawer,
      profile,
      resetProfile,
      savedMessage,
      saveProfile,
    ]
  );

  return (
    <PersonalAnalysisProfileContext.Provider value={value}>
      {children}
    </PersonalAnalysisProfileContext.Provider>
  );
}

export function usePersonalAnalysisProfile() {
  const context = useContext(PersonalAnalysisProfileContext);

  if (!context) {
    throw new Error("usePersonalAnalysisProfile must be used inside PersonalAnalysisProfileProvider");
  }

  return context;
}
