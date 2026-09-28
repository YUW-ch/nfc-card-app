import { api } from "@/lib/api";
import type { BuilderServices, DesignTemplate } from "@/components/builders/host";

/** The company's saved page designs, as the builders and the pages list use them. */
export function designTemplateServices(companyId: string): NonNullable<BuilderServices["templates"]> {
  const path = `/companies/${companyId}/design-templates`;
  return {
    queryKey: ["design-templates", companyId],
    list: () => api.get<DesignTemplate[]>(path),
    create: (name, theme) => api.post<DesignTemplate>(path, { name, theme }),
    update: (id, patch) => api.patch<DesignTemplate>(`${path}/${id}`, patch),
    remove: (id) => api.delete<void>(`${path}/${id}`),
  };
}
