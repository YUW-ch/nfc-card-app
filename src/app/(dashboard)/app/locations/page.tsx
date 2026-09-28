"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import { formatPlanNames, usePermissions } from "@/lib/permissions";
import type { Location } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Modal, ConfirmDialog } from "@/components/modal";
import { UpgradeNotice, ViewOnlyNotice } from "@/components/gate";
import { Badge, Button, Card, EmptyState, Field, Input, Spinner } from "@/components/ui";

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
  const { canManage, canAddLocation, features, planName, plansWithLocations, locationLimit } =
    usePermissions();
  const [creating, setCreating] = useState(false);
  const [choosing, setChoosing] = useState(false);
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
  const currentDefault = locations.find((l) => l.isDefault);
  // Over the plan's limit (after a downgrade): kept and live, but read-only.
  const readOnlyCount = locations.filter((l) => l.readOnly).length;
  const planIncludes =
    maxLocations === 1 ? "a single location" : `up to ${maxLocations} locations`;

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
      {readOnlyCount > 0 && (
        <UpgradeNotice
          className="mb-6"
          title={
            readOnlyCount === 1 ? "1 location is read-only" : `${readOnlyCount} locations are read-only`
          }
          description={`Your ${planName ? `${planName} ` : ""}plan includes ${planIncludes}. The others are kept and their cards and pages stay live, but they can't be changed. ${
            canManage ? "Choose which locations stay active, or upgrade in Settings." : ""
          }`}
          action={
            canManage && (
              <Button size="sm" variant="outline" onClick={() => setChoosing(true)}>
                Choose active locations
              </Button>
            )
          }
        />
      )}
      {canManage && !canAdd && readOnlyCount === 0 && !locationsQuery.isLoading && (
        <UpgradeNotice
          className="mb-6"
          title={`Your ${planName ? `${planName} ` : ""}plan includes ${planIncludes}`}
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
                    <div className="mt-1 flex gap-1.5 empty:hidden">
                      {loc.isDefault && <Badge tone="accent">Default</Badge>}
                      {loc.readOnly && (
                        <Badge tone="muted">
                          <Lock className="size-3" /> Read-only
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canManage && !loc.readOnly && (
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
          currentDefault={currentDefault}
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
          currentDefault={currentDefault}
          onClose={() => setEditing(null)}
          onSaved={() => {
            invalidate();
            setEditing(null);
          }}
        />
      )}

      {choosing && (
        <ActiveLocationsModal
          companyId={companyId}
          locations={locations}
          limit={locationLimit}
          onClose={() => setChoosing(false)}
          onSaved={() => {
            invalidate();
            // Cards and pages show whether their location is read-only.
            queryClient.invalidateQueries({ queryKey: ["cards", companyId] });
            setChoosing(false);
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
  currentDefault,
  onClose,
  onSaved,
}: {
  companyId: string;
  location?: Location;
  currentDefault?: Location;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<LocationForm>(location ? toForm(location) : emptyForm());
  const [error, setError] = useState<string | null>(null);

  // The backend keeps exactly one default: it unmarks the others when this is
  // set, and ignores unsetting it. So the current default stays locked here.
  const isCurrentDefault = !!location?.isDefault;
  const replacesDefault =
    form.isDefault && !isCurrentDefault && currentDefault && currentDefault.id !== location?.id;

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
        <div>
          <label
            className={`flex items-start gap-3 rounded-2xl border border-line p-3 ${
              isCurrentDefault ? "opacity-70" : "cursor-pointer hover:border-accent"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-accent"
              checked={form.isDefault}
              disabled={isCurrentDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold text-ink">
                Set as default location
              </span>
              <span className="block text-xs text-muted">
                {isCurrentDefault
                  ? "This is your default location. To change it, make another location the default."
                  : "Used when a card has no location set. Only one location can be the default."}
              </span>
            </span>
          </label>
          {replacesDefault && (
            <p className="mt-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-ink">
              This becomes your new default location.{" "}
              <span className="font-semibold">{currentDefault.name}</span> will no longer be the
              default.
            </p>
          )}
        </div>
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}

/** Pick which locations stay editable when there are more than the plan allows. */
function ActiveLocationsModal({
  companyId,
  locations,
  limit,
  onClose,
  onSaved,
}: {
  companyId: string;
  locations: Location[];
  /** null = unlimited. */
  limit: number | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    locations.filter((l) => !l.readOnly).map((l) => l.id),
  );
  const [error, setError] = useState<string | null>(null);
  const full = limit !== null && selected.length >= limit;
  const defaultKept = locations.some((l) => l.isDefault && selected.includes(l.id));
  const firstChosen = locations.find((l) => l.id === selected[0]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = useMutation({
    mutationFn: () =>
      api.put<Location[]>(`/companies/${companyId}/locations/active`, { locationIds: selected }),
    onSuccess: onSaved,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not save your choice."),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Choose active locations"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={save.isPending}
            disabled={selected.length === 0}
            onClick={() => save.mutate()}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted">
          {limit === null
            ? "Pick the locations you can edit."
            : `Your plan includes ${limit === 1 ? "one location" : `${limit} locations`}. The others stay live but read-only. Nothing is deleted.`}
        </p>
        {locations.map((loc) => {
          const checked = selected.includes(loc.id);
          const disabled = !checked && full;
          return (
            <label
              key={loc.id}
              className={`flex items-center gap-3 rounded-2xl border border-line p-3 ${
                disabled ? "opacity-50" : "cursor-pointer hover:border-accent"
              }`}
            >
              <input
                type="checkbox"
                className="size-4 shrink-0 accent-accent"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(loc.id)}
              />
              <span className="flex-1 text-sm font-semibold text-ink">{loc.name}</span>
              {loc.isDefault && <Badge tone="accent">Default</Badge>}
            </label>
          );
        })}
        {!defaultKept && firstChosen && (
          <p className="text-xs text-muted">{firstChosen.name} becomes your default location.</p>
        )}
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}
