"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, MapPin, Menu as MenuIcon, Plus, QrCode, Search, Star, User, Wifi } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompany, useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type { Card as CardModel, CardStatus, CardType, Location, PageSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Modal, ConfirmDialog } from "@/components/modal";
import { CardQR } from "@/components/card-qr";
import { ViewOnlyNotice } from "@/components/gate";
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

/** The link on the card's chip: /c/<business short name>/<card>. */
function tapUrl(companySlug: string, slug: string) {
  return `${APP_URL}/c/${companySlug}/${slug}`;
}

function useCompanySlug(): string {
  return useCompany().company?.slug ?? "";
}

/** Mirrors the backend's card-slug.ts: "Tisch 12 (Terrasse)" -> "tisch-12-terrasse". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
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

// "Tisch 2" before "Tisch 10".
const naturalSort = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

const NO_LOCATION = "__none__";

interface CardGroup {
  key: string;
  location: string;
  areas: { area: string | null; cards: CardModel[] }[];
  count: number;
}

/** Cards grouped by location, then by area, each sorted naturally by name. */
function groupCards(cards: CardModel[], locations: Location[]): CardGroup[] {
  const order = new Map(locations.map((l, i) => [l.id, i]));
  const byLocation = new Map<string, CardModel[]>();
  for (const card of cards) {
    const key = card.locationId ?? NO_LOCATION;
    byLocation.set(key, [...(byLocation.get(key) ?? []), card]);
  }
  return [...byLocation.entries()]
    .sort(([a], [b]) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity))
    .map(([key, list]) => {
      const byArea = new Map<string | null, CardModel[]>();
      for (const card of list) {
        const area = card.area?.trim() || null;
        byArea.set(area, [...(byArea.get(area) ?? []), card]);
      }
      const areas = [...byArea.entries()]
        // Cards without an area come last.
        .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : naturalSort.compare(a, b)))
        .map(([area, areaCards]) => ({
          area,
          cards: [...areaCards].sort((x, y) => naturalSort.compare(x.name, y.name)),
        }));
      return {
        key,
        location: list[0].location?.name ?? "No location",
        areas,
        count: list.length,
      };
    });
}

/** Area names already in use, for the area field's suggestions. */
function knownAreas(cards: CardModel[]): string[] {
  return [...new Set(cards.map((c) => c.area?.trim()).filter((a): a is string => !!a))].sort(
    naturalSort.compare,
  );
}

export default function CardsPage() {
  const companyId = useCompanyId();
  const { canManage } = usePermissions();
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
  const locations = locationsQuery.data ?? [];
  const selected = cards.find((c) => c.id === selectedId) ?? null;
  const areas = useMemo(() => knownAreas(cards), [cards]);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<CardType | "">("");
  const [statusFilter, setStatusFilter] = useState<CardStatus | "">("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(
      (c) =>
        (!q ||
          [c.name, c.area, c.slug, c.activePage?.name, c.linkUrl, c.location?.name].some((v) =>
            v?.toLowerCase().includes(q),
          )) &&
        (!locationFilter || (c.locationId ?? NO_LOCATION) === locationFilter) &&
        (!typeFilter || c.type === typeFilter) &&
        (!statusFilter || c.status === statusFilter),
    );
  }, [cards, search, locationFilter, typeFilter, statusFilter]);

  const groups = useMemo(() => groupCards(filtered, locations), [filtered, locations]);
  // Headings only help once there is something to tell apart.
  const showHeadings = groups.length > 1 || groups.some((g) => g.areas.some((a) => a.area));
  const filtering = !!(search || locationFilter || typeFilter || statusFilter);

  return (
    <div>
      <PageHeader
        eyebrow="Hardware"
        title="Cards"
        description="Every NFC card you own, its status, and where a tap sends people."
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New card
            </Button>
          )
        }
      />

      {!canManage && <ViewOnlyNotice className="mb-6" />}

      {cardsQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          icon={<QrCode className="size-10" />}
          title="No cards yet"
          description={
            canManage
              ? "Add your first NFC card and point it at a destination page."
              : "No cards have been added to this business yet."
          }
          action={
            canManage && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                New card
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(3,11rem)]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cards, areas, pages"
                aria-label="Search cards"
                className="pl-10"
              />
            </div>
            <Select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              aria-label="Filter by location"
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
              {cards.some((c) => !c.locationId) && <option value={NO_LOCATION}>No location</option>}
            </Select>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CardType | "")}
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              {CARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CardStatus | "")}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABEL) as CardStatus[]).map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABEL[st]}
                </option>
              ))}
            </Select>
          </div>

          {filtering && (
            <div className="mb-4 flex items-center justify-between text-sm text-muted">
              <span>
                {filtered.length} of {cards.length} cards
              </span>
              <button
                type="button"
                className="font-semibold text-accent-ink hover:underline"
                onClick={() => {
                  setSearch("");
                  setLocationFilter("");
                  setTypeFilter("");
                  setStatusFilter("");
                }}
              >
                Clear filters
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="size-10" />}
              title="No matching cards"
              description="Try another search or clear the filters."
            />
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <section key={group.key}>
                  {showHeadings && (
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
                      <MapPin className="size-4 text-accent" />
                      {group.location}
                      <span className="text-sm font-normal text-muted">{group.count}</span>
                    </h2>
                  )}
                  <div className="space-y-6">
                    {group.areas.map(({ area, cards: areaCards }) => (
                      <div key={area ?? "none"}>
                        {showHeadings && group.areas.length > 1 && (
                          <p className="eyebrow mb-3 text-muted">
                            {area ?? "No area"} · {areaCards.length}
                          </p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {areaCards.map((card) => (
                            <CardTile key={card.id} card={card} onOpen={() => setSelectedId(card.id)} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <CreateCardModal
        open={creating}
        onClose={() => setCreating(false)}
        companyId={companyId}
        locations={locations}
        areas={areas}
      />

      {selected && (
        <CardDetailModal
          card={selected}
          companyId={companyId}
          canManage={canManage}
          locations={locations}
          areas={areas}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

/** "instagram.com/…" for web links, the number or address otherwise. */
function linkLabel(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return `${u.host.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
    }
    return decodeURIComponent(u.pathname || url);
  } catch {
    return url;
  }
}

function CardTile({ card, onOpen }: { card: CardModel; onOpen: () => void }) {
  const companySlug = useCompanySlug();
  const meta = typeMeta(card.type);
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onOpen}
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
            {card.activePage?.name ?? (card.linkUrl ? linkLabel(card.linkUrl) : "No destination")}
          </span>
        </p>
        <p className="truncate font-mono text-xs text-muted">{tapUrl(companySlug, card.slug)}</p>
      </div>
    </button>
  );
}

// ─── Create ──────────────────────────────────────────────────────────────────

function CreateCardModal({
  open,
  onClose,
  companyId,
  locations,
  areas,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  locations: Location[];
  areas: string[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [slug, setSlug] = useState("");
  const companySlug = useCompanySlug();
  const [type, setType] = useState<CardType>("REVIEW");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setType("REVIEW");
    setLocationId("");
    setArea("");
    setSlug("");
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
        area: area.trim() || undefined,
        slug: slug.replace(/^-+|-+$/g, "") || undefined,
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
        <AreaField value={area} onChange={setArea} areas={areas} />
        <Field
          label="Link"
          hint="The address on the card's chip. Only needs to be unique within your business. Can't be changed once the card is printed."
        >
          <div className="flex items-center overflow-hidden rounded-xl border border-line bg-white focus-within:ring-2 focus-within:ring-accent/30">
            <span className="shrink-0 pl-3.5 font-mono text-xs text-muted">/c/{companySlug}/</span>
            <input
              value={slug}
              maxLength={40}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, "-")
                    .replace(/-{2,}/g, "-"),
                )
              }
              placeholder={slugify(name) || "tisch-1"}
              className="min-w-0 flex-1 bg-transparent py-2.5 pr-3.5 font-mono text-sm text-ink outline-none"
              aria-label="Card link"
            />
          </div>
        </Field>
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Modal>
  );
}

/** Free text with suggestions from the areas already in use. */
function AreaField({
  value,
  onChange,
  areas,
  action,
}: {
  value: string;
  onChange: (next: string) => void;
  areas: string[];
  action?: React.ReactNode;
}) {
  return (
    <Field label="Area" hint="Optional. Groups cards inside a location, e.g. Terrasse or Saal.">
      <div className="flex gap-2">
        <Input
          value={value}
          maxLength={40}
          list="card-areas"
          onChange={(e) => onChange(e.target.value)}
          placeholder="Terrasse"
        />
        {action}
      </div>
      <datalist id="card-areas">
        {areas.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
    </Field>
  );
}

// ─── Detail ──────────────────────────────────────────────────────────────────

function CardDetailModal({
  card,
  companyId,
  canManage,
  locations,
  areas,
  onClose,
}: {
  card: CardModel;
  companyId: string;
  canManage: boolean;
  locations: Location[];
  areas: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(card.name);
  const [area, setArea] = useState(card.area ?? "");
  const companySlug = useCompanySlug();
  const [destMode, setDestMode] = useState<"page" | "link">(card.linkUrl ? "link" : "page");
  const [link, setLink] = useState(card.linkUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["cards", companyId] });

  const pagesQuery = useQuery({
    queryKey: ["pages", companyId, card.type],
    queryFn: () =>
      api.get<PageSummary[]>(`/companies/${companyId}/pages`, { kind: card.type }),
    enabled: canManage,
  });

  const rename = useMutation({
    mutationFn: () =>
      api.patch<CardModel>(`/companies/${companyId}/cards/${card.id}`, { name: name.trim() }),
    onSuccess: invalidate,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not rename the card."),
  });

  const place = useMutation({
    mutationFn: (patch: { locationId?: string | null; area?: string | null }) =>
      api.patch<CardModel>(`/companies/${companyId}/cards/${card.id}`, patch),
    onSuccess: invalidate,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not move the card."),
  });

  const setDestination = useMutation({
    mutationFn: (target: { pageId?: string | null; url?: string | null }) =>
      api.put<CardModel>(`/companies/${companyId}/cards/${card.id}/destination`, target),
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
            {card.area && <Badge tone="neutral">{card.area}</Badge>}
          </div>

          <CardQR url={tapUrl(companySlug, card.slug)} />

          {canManage ? (
            <>
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

              {locations.length > 0 && (
                <Field label="Location">
                  <Select
                    value={card.locationId ?? ""}
                    disabled={place.isPending}
                    onChange={(e) => {
                      setError(null);
                      place.mutate({ locationId: e.target.value || null });
                    }}
                  >
                    <option value="">No location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              <AreaField
                value={area}
                onChange={setArea}
                areas={areas}
                action={
                  <Button
                    variant="outline"
                    loading={place.isPending}
                    disabled={area.trim() === (card.area ?? "")}
                    onClick={() => {
                      setError(null);
                      place.mutate({ area: area.trim() || null });
                    }}
                  >
                    Save
                  </Button>
                }
              />

              <Field
                label="Destination"
                hint={
                  destMode === "page"
                    ? `Pick a ${meta.label.toLowerCase()} page. Changes take effect instantly.`
                    : "Any web address, or tel:, mailto: or sms:. Taps are still counted."
                }
              >
                <div className="mb-2 flex w-fit rounded-full bg-ink/5 p-1 text-xs font-semibold">
                  {(
                    [
                      { value: "page", label: "One of your pages" },
                      { value: "link", label: "Custom link" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setDestMode(o.value)}
                      className={`rounded-full px-3 py-1.5 transition ${
                        destMode === o.value ? "bg-white text-ink shadow-sm" : "text-muted"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {destMode === "link" ? (
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      inputMode="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://instagram.com/your-restaurant"
                    />
                    <Button
                      variant="outline"
                      loading={setDestination.isPending}
                      disabled={!link.trim() || link.trim() === card.linkUrl}
                      onClick={() => {
                        setError(null);
                        setDestination.mutate({ url: link.trim() });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                ) : pagesQuery.isLoading ? (
                  <div className="py-2">
                    <Spinner />
                  </div>
                ) : (
                  <Select
                    value={card.linkUrl ? "" : (card.activePageId ?? "")}
                    disabled={setDestination.isPending}
                    onChange={(e) => {
                      setError(null);
                      setDestination.mutate({ pageId: e.target.value || null });
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
            </>
          ) : (
            <p className="text-sm text-muted">
              Destination:{" "}
              <span className="font-medium text-ink">
                {card.activePage?.name ?? "No destination"}
              </span>
            </p>
          )}

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
