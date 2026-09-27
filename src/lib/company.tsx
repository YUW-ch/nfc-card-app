"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { AccessResponse, Company } from "./types";

const STORAGE_KEY = "taplino.company";

interface CompanyContextValue {
  access: AccessResponse | undefined;
  companies: Company[];
  company: Company | undefined;
  companyId: string | undefined;
  setCompanyId: (id: string) => void;
  isLoading: boolean;
  refetch: () => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

/** Bootstraps the tenant context: loads /access, tracks the selected company. */
export function CompanyProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["access"],
    queryFn: () => api.get<AccessResponse>("/access"),
  });

  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const companies = useMemo(() => data?.companies ?? [], [data]);

  // Restore the persisted selection once on mount (client only).
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setSelectedId(stored);
  }, []);

  // Derive the effective company id DURING render (not in an effect) so it is
  // never undefined while companies exist. This prevents a render window where a
  // page calling useCompanyId() would throw before an effect could set it.
  const companyId =
    selectedId && companies.some((c) => c.id === selectedId)
      ? selectedId
      : companies[0]?.id;

  const setCompanyId = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const company = companies.find((c) => c.id === companyId);

  return (
    <CompanyContext.Provider
      value={{ access: data, companies, company, companyId, setCompanyId, isLoading, refetch }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used within CompanyProvider");
  return ctx;
}

/** Convenience: the current company id, or throws if none selected yet. */
export function useCompanyId(): string {
  const { companyId } = useCompany();
  if (!companyId) throw new Error("No company selected");
  return companyId;
}
