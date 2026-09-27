"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Menu as MenuIcon, Plus, QrCode, Star, User, Wifi } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import type { Card as CardModel, CardStatus, CardType, Location, PageSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Modal, ConfirmDialog } from "@/components/modal";
import { CardQR } from "@/components/card-qr";
import { Badge, Button, EmptyState, Field, Input, Select, Spinner } from "@/components/ui";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const CARD_TYPES: { value: CardType; label: string; icon: typeof Star }[] = [
  { value: "REVIEW", label: "Reviews", icon: Star },
  { value: "MENU", label: "Menu", icon: MenuIcon },
  { value: "LINKHUB", label: "Link hub", icon: Link2 },
  { value: "VCARD", label: "Contact card", icon: User },
  { value: "WIFI", label: "Wi-Fi", icon: Wifi },
];

function typeMeta(type: CardType) {
  return CARD_TYPES.find((t) => t.value === type) ?? CARD_TYPES[0];
}

function tapUrl(slug: string) {
  return `${APP_URL}/c/${slug}`;
}

const STATUS_TONE: Record<CardStatus, "muted" | "positive" | "neutral"> = {
  UNASSIGNED: "muted",
  ACTIVE: "positive",
  DISABLED: "neutral",
};

const STATUS_LABEL: Record<CardStatus, string> = {
  UNASSIGNED: "Unassigned",
  ACTIVE: "Active",
  DISABLED: "Disabled",
};

export default function CardsPage() {
  const companyId = useCompanyId();
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cardsQuery = useQuery({
    queryKey: ["cards", companyId],
    queryFn: () => api.get<CardModel[]>(`/companies/${companyId}/cards`),
  });

  const locationsQuery = useQuery({
    queryKey: ["locations", companyId],
    queryFn: () => api.get<Location[]>(`/companies/${companyId}/locations`),
  });

  const cards = cardsQuery.data ?? [];
  const selected = cards.find((c) => c.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader
        eyebrow="Hardware"
        title="Cards"
        description="Every NFC card you own, its status, and where a tap sends people."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New card
          </Button>
        }
      />

      {cardsQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<QrCode className="size-10" />}
          title="No cards yet"
          description="Add your first NFC card and point it at a destination page."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New card
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const meta = typeMeta(card.type);
            const Icon = meta.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedId(card.id)}
                className="group flex w-full flex-col gap-4 rounded-card border border-line bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-ink/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{card.name}</p>
                      <Badge tone="accent" className="mt-1">
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                  <Badge tone={STATUS_TONE[card.status]}>{STATUS_LABEL[card.status]}</Badge>
                </div>

                <div className="mt-auto space-y-1 border-t border-line pt-4 text-sm">
                  <p className="text-muted">
                    Destination:{" "}
                    <span className="font-medium text-ink">
                      {card.activePage?.name ?? "No destination"}
                    </span>
                  </p>
                  <p className="truncate font-mono text-xs text-muted">{tapUrl(card.slug)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateCardModal
        open={creating}
        onClose={() => setCreating(false)}
        companyId={companyId}
        locations={locationsQuery.data ?? []}
      />

      {selected && (
        <CardDetailModal
          card={selected}
          companyId={companyId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

// ─── Create ──────────────────────────────────────────────────────────────────

function CreateCardModal({
  open,
  onClose,
  companyId,
  locations,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  locations: Location[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<CardType>("REVIEW");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setType("REVIEW");
    setLocationId("");
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const create = useMutation({
    mutationFn: () =>
      api.post<CardModel>(`/companies/${companyId}/cards`, {
        name: name.trim(),
        type,
        locationId: locationId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", companyId] });
      close();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not create the card."),
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title="New card"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            loading={create.isPending}
            disabled={!name.trim()}
            onClick={() => {
              setError(null);
              create.mutate();
            }}
          >
            Create card
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name">
          <Input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="Front desk card"
          />
        </Field>
        <Field label="Type" hint="What kind of page this card links to.">
          <Select value={type} onChange={(e) => setType(e.target.value as CardType)}>
            {CARD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        {locations.length > 0 && (
          <Field label="Location" hint="Optional. Assign this card to a location.">
            <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">No location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}

// ─── Detail ──────────────────────────────────────────────────────────────────

function CardDetailModal({
  card,
  companyId,
  onClose,
}: {
  card: CardModel;
  companyId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(card.name);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cards", companyId] });

  const pagesQuery = useQuery({
    queryKey: ["pages", companyId, card.type],
    queryFn: () =>
      api.get<PageSummary[]>(`/companies/${companyId}/pages`, { kind: card.type }),
  });

  const rename = useMutation({
    mutationFn: () =>
      api.patch<CardModel>(`/companies/${companyId}/cards/${card.id}`, { name: name.trim() }),
    onSuccess: invalidate,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not rename the card."),
  });

  const setDestination = useMutation({
    mutationFn: (pageId: string | null) =>
      api.put<CardModel>(`/companies/${companyId}/cards/${card.id}/destination`, { pageId }),
    onSuccess: invalidate,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not update the destination."),
  });

  const setStatus = useMutation({
    mutationFn: (status: CardStatus) =>
      api.patch<CardModel>(`/companies/${companyId}/cards/${card.id}`, { status }),
    onSuccess: invalidate,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not change the status."),
  });

  const remove = useMutation({
    mutationFn: () => api.delete<void>(`/companies/${companyId}/cards/${card.id}`),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not delete the card."),
  });

  const meta = typeMeta(card.type);
  const canToggle = card.status !== "UNASSIGNED";
  const nextStatus: CardStatus = card.status === "DISABLED" ? "ACTIVE" : "DISABLED";

  return (
    <>
      <Modal open onClose={onClose} title={card.name}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{meta.label}</Badge>
            <Badge tone={STATUS_TONE[card.status]}>{STATUS_LABEL[card.status]}</Badge>
            {card.location?.name && <Badge tone="neutral">{card.location.name}</Badge>}
          </div>

          <CardQR url={tapUrl(card.slug)} />

          <Field label="Name">
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button
                variant="outline"
                loading={rename.isPending}
                disabled={!name.trim() || name.trim() === card.name}
                onClick={() => {
                  setError(null);
                  rename.mutate();
                }}
              >
                Save
              </Button>
            </div>
          </Field>

          <Field
            label="Destination"
            hint={`Pick a ${meta.label.toLowerCase()} page. Changes take effect instantly.`}
          >
            {pagesQuery.isLoading ? (
              <div className="py-2">
                <Spinner />
              </div>
            ) : (
              <Select
                value={card.activePageId ?? ""}
                disabled={setDestination.isPending}
                onChange={(e) => {
                  setError(null);
                  setDestination.mutate(e.target.value || null);
                }}
              >
                <option value="">No destination</option>
                {(pagesQuery.data ?? []).map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                    {page.published ? "" : " (draft)"}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <Button
              variant="outline"
              disabled={!canToggle}
              loading={setStatus.isPending}
              onClick={() => {
                setError(null);
                setStatus.mutate(nextStatus);
              }}
            >
              {card.status === "DISABLED" ? "Enable card" : "Disable card"}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete card
            </Button>
          </div>

          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="Delete card"
        description={`This permanently removes "${card.name}". Anyone tapping it will see a blank page.`}
      />
    </>
  );
}
