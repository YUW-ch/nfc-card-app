"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import { formatPlanNames, usePermissions } from "@/lib/permissions";
import type { Location } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Modal, ConfirmDialog } from "@/components/modal";
import { UpgradeNotice, ViewOnlyNotice } from "@/components/gate";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner } from "@/components/ui";

interface LocationForm {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  googleReviewUrl: string;
  isDefault: boolean;
}

function emptyForm(): LocationForm {
  return {
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "CH",
    googleReviewUrl: "",
    isDefault: false,
  };
}

function toForm(loc: Location): LocationForm {
  return {
    name: loc.name,
    address: loc.address ?? "",
    city: loc.city ?? "",
    postalCode: loc.postalCode ?? "",
    country: loc.country || "CH",
    googleReviewUrl: loc.googleReviewUrl ?? "",
    isDefault: loc.isDefault,
  };
}

function toPayload(form: LocationForm) {
  return {
    name: form.name.trim(),
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    postalCode: form.postalCode.trim() || null,
    country: form.country.trim() || "CH",
    googleReviewUrl: form.googleReviewUrl.trim() || null,
    isDefault: form.isDefault,
  };
}

export default function LocationsPage() {
  const companyId = useCompanyId();
  const { canManage, canAddLocation, features, planName, plansWithLocations } = usePermissions();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["locations", companyId],
    queryFn: () => api.get<Location[]>(`/companies/${companyId}/locations`),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["locations", companyId] });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/companies/${companyId}/locations/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
    },
  });

  const locations = locationsQuery.data ?? [];
  const canAdd = canManage && canAddLocation(locations.length);
  const upgradePlans = plansWithLocations(locations.length + 1);
  const maxLocations = features?.multiLocation ? features.maxLocations : 1;

  return (
    <div>
      <PageHeader
        eyebrow="Places"
        title="Locations"
        description="The physical places your cards live. The default location is used when none is set."
        actions={
          canAdd && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New location
            </Button>
          )
        }
      />

      {!canManage && <ViewOnlyNotice className="mb-6" />}
      {canManage && !canAdd && !locationsQuery.isLoading && (
        <UpgradeNotice
          className="mb-6"
          title={`Your ${planName ? `${planName} ` : ""}plan includes ${
            maxLocations === 1 ? "a single location" : `up to ${maxLocations} locations`
          }`}
          description={
            upgradePlans.length > 0
              ? `Upgrade to ${formatPlanNames(upgradePlans)} to add more. Contact us at hello@taplino.ch.`
              : "Contact us at hello@taplino.ch to add more."
          }
        />
      )}

      {locationsQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : locations.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-10" />}
          title="No locations yet"
          description={
            canManage
              ? "Add your first location to group cards and connect Google reviews."
              : "No locations have been added to this business yet."
          }
          action={
            canAdd && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                New location
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {locations.map((loc) => (
            <Card key={loc.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{loc.name}</p>
                    {loc.isDefault && (
                      <Badge tone="accent" className="mt-1">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(loc)}
                      className="rounded-full p-2 text-muted transition hover:bg-ink/5 hover:text-ink"
                      aria-label="Edit location"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(loc)}
                      className="rounded-full p-2 text-muted transition hover:bg-ink/5 hover:text-negative"
                      aria-label="Delete location"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-line pt-3 text-sm text-muted">
                {[loc.address, [loc.postalCode, loc.city].filter(Boolean).join(" "), loc.country]
                  .filter(Boolean)
                  .join(", ") || "No address on file"}
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && (
        <LocationModal
          companyId={companyId}
          onClose={() => setCreating(false)}
          onSaved={() => {
            invalidate();
            setCreating(false);
          }}
        />
      )}

      {editing && (
        <LocationModal
          companyId={companyId}
          location={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        loading={remove.isPending}
        title="Delete location"
        description={
          remove.error instanceof ApiError
            ? remove.error.message
            : `This removes "${deleting?.name ?? ""}". Cards assigned here will lose their location.`
        }
      />
    </div>
  );
}

function LocationModal({
  companyId,
  location,
  onClose,
  onSaved,
}: {
  companyId: string;
  location?: Location;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<LocationForm>(location ? toForm(location) : emptyForm());
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof LocationForm>(key: K, value: LocationForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () =>
      location
        ? api.patch<Location>(`/companies/${companyId}/locations/${location.id}`, toPayload(form))
        : api.post<Location>(`/companies/${companyId}/locations`, toPayload(form)),
    onSuccess: onSaved,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not save the location."),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={location ? "Edit location" : "New location"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={save.isPending}
            disabled={!form.name.trim()}
            onClick={() => {
              setError(null);
              save.mutate();
            }}
          >
            {location ? "Save changes" : "Create location"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input
            value={form.name}
            autoFocus
            onChange={(e) => set("name", e.target.value)}
            placeholder="Zurich Flagship"
          />
        </Field>
        <Field label="Address">
          <Input
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Bahnhofstrasse 1"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Postal code">
            <Input
              value={form.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
              placeholder="8001"
            />
          </Field>
          <Field label="City">
            <Input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Zurich"
            />
          </Field>
        </div>
        <Field label="Country">
          <Input
            value={form.country}
            onChange={(e) => set("country", e.target.value.toUpperCase())}
            placeholder="CH"
            maxLength={2}
          />
        </Field>
        <Field
          label="Google review URL"
          hint="Where a Review card sends happy customers."
        >
          <Input
            value={form.googleReviewUrl}
            onChange={(e) => set("googleReviewUrl", e.target.value)}
            placeholder="https://g.page/r/..."
          />
        </Field>
        <Field label="Default location">
          <Select
            value={form.isDefault ? "yes" : "no"}
            onChange={(e) => set("isDefault", e.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes, make this the default</option>
          </Select>
        </Field>
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}
