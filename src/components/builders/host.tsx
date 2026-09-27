"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale, LocalizedText, PageTheme } from "@/lib/page-content";

/** Translates `text` from `from` into each of `to`, returning one string per target. */
export type Translator = (text: string, from: Locale, to: Locale[]) => Promise<LocalizedText>;

export interface DesignTemplate {
  id: string;
  name: string;
  theme: PageTheme;
}

/**
 * What the builders need from the app they run in. The panel app and the admin
 * console each provide their own implementation (their own endpoints, where the
 * backend enforces roles and limits), so the builders stay free of API code.
 * A missing service hides the matching UI.
 */
export interface BuilderServices {
  translate?: Translator;
  /** Stores an image and resolves to its public URL. */
  uploadImage?: (file: Blob) => Promise<string>;
  templates?: {
    /** react-query key for the list, unique per company. */
    queryKey: readonly unknown[];
    list: () => Promise<DesignTemplate[]>;
    create: (name: string, theme: PageTheme) => Promise<DesignTemplate>;
    update: (id: string, patch: { name?: string; theme?: PageTheme }) => Promise<DesignTemplate>;
    remove: (id: string) => Promise<void>;
  };
}

const BuilderServicesContext = createContext<BuilderServices>({});

export function BuilderServicesProvider({
  services,
  children,
}: {
  services: BuilderServices;
  children: ReactNode;
}) {
  return (
    <BuilderServicesContext.Provider value={services}>{children}</BuilderServicesContext.Provider>
  );
}

export function useBuilderServices(): BuilderServices {
  return useContext(BuilderServicesContext);
}
