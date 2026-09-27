"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { Wifi, Copy, Check, Download, Mail } from "lucide-react";
import type { Locale, WifiContent } from "@/lib/page-content";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

const noSubscribe = () => () => {};

export type WifiAccessResult =
  | { status: "granted"; token: string; password: string | null }
  | { status: "code_sent"; email: string };

/**
 * What the Wi-Fi page needs from the app it runs in (the host's own API).
 * Absent in the editor preview, where the page renders without network calls.
 */
export interface WifiAccessClient {
  /** localStorage key that remembers a granted guest on this device. */
  storageKey: string;
  request: (input: {
    email: string;
    marketingConsent: boolean;
    locale: Locale;
  }) => Promise<WifiAccessResult>;
  verify: (email: string, code: string) => Promise<WifiAccessResult>;
  credentials: (token: string) => Promise<{ password: string | null }>;
  /** The iOS profile download, with the guest's token when access is gated. */
  profileUrl: (token?: string) => string;
}

// ─── Copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  de: {
    eyebrow: "Mit dem WLAN verbinden",
    notConfigured: "Das Netzwerk ist noch nicht eingerichtet.",
    join: "Netzwerk beitreten",
    iosSteps: [
      "Tippe auf Netzwerk beitreten, dann auf Erlauben.",
      "Öffne die Einstellungen und tippe auf Profil geladen.",
      "Tippe auf Installieren. Dein iPhone verbindet sich automatisch.",
    ],
    typeInstead: "Passwort lieber selbst eingeben?",
    password: "Passwort",
    copy: "Passwort kopieren",
    copied: "Kopiert",
    stepCopy: "Kopiere das Passwort.",
    stepOpen: (ssid: string, hidden: boolean) =>
      hidden
        ? `Öffne die WLAN-Einstellungen, wähle Netzwerk hinzufügen und gib ${ssid} ein.`
        : `Öffne die WLAN-Einstellungen und wähle ${ssid}.`,
    stepPaste: "Füge das Passwort ein und verbinde dich.",
    openNetwork: "Offenes Netzwerk, kein Passwort nötig.",
    gateTitle: "Gib deine E-Mail-Adresse ein, um ins WLAN zu kommen.",
    gateVerify: "Wir senden dir einen Code zur Bestätigung.",
    emailLabel: "E-Mail-Adresse",
    continue: "Weiter",
    sendCode: "Code senden",
    codeTitle: (email: string) => `Gib den 6-stelligen Code ein, den wir an ${email} gesendet haben.`,
    codeLabel: "Code",
    confirm: "Bestätigen",
    resend: "Neuen Code senden",
    otherEmail: "Andere E-Mail-Adresse",
    marketing: (name: string) =>
      `Ja, ${name} darf mir Neuigkeiten und Angebote per E-Mail senden. Ich kann mich jederzeit abmelden.`,
    privacy: (name: string, marketing: boolean) =>
      `${name} verwendet deine E-Mail-Adresse, um dir WLAN-Zugang zu geben${
        marketing ? " und, nur wenn du zustimmst, für Neuigkeiten und Angebote" : ""
      }. Taplino verarbeitet sie im Auftrag von ${name}. Ohne Einwilligung in Werbung wird sie 12 Monate nach deinem letzten Besuch gelöscht.`,
    contact: "Einwilligung widerrufen oder Daten löschen lassen:",
    policy: "Datenschutzerklärung",
    preview: "Vorschau: Hier geben Gäste ihre E-Mail-Adresse ein.",
    error: "Das hat nicht geklappt. Bitte versuche es nochmals.",
  },
  en: {
    eyebrow: "Connect to Wi-Fi",
    notConfigured: "Network not configured yet.",
    join: "Join network",
    iosSteps: [
      "Tap Join network, then Allow.",
      "Open Settings and tap Profile Downloaded.",
      "Tap Install. Your iPhone joins automatically.",
    ],
    typeInstead: "Prefer to type the password?",
    password: "Password",
    copy: "Copy password",
    copied: "Copied",
    stepCopy: "Copy the password.",
    stepOpen: (ssid: string, hidden: boolean) =>
      hidden
        ? `Open your Wi-Fi settings, choose Add network and enter ${ssid}.`
        : `Open your Wi-Fi settings and choose ${ssid}.`,
    stepPaste: "Paste the password and connect.",
    openNetwork: "Open network, no password required.",
    gateTitle: "Enter your email to get on the Wi-Fi.",
    gateVerify: "We'll send you a code to confirm it.",
    emailLabel: "Email address",
    continue: "Continue",
    sendCode: "Send code",
    codeTitle: (email: string) => `Enter the 6-digit code we sent to ${email}.`,
    codeLabel: "Code",
    confirm: "Confirm",
    resend: "Send a new code",
    otherEmail: "Use a different email",
    marketing: (name: string) =>
      `Yes, ${name} may send me news and offers by email. I can unsubscribe at any time.`,
    privacy: (name: string, marketing: boolean) =>
      `${name} uses your email to give you Wi-Fi access${
        marketing ? " and, only if you agree, to send you news and offers" : ""
      }. Taplino processes it on behalf of ${name}. Without marketing consent it is deleted 12 months after your last visit.`,
    contact: "Withdraw consent or have your data deleted:",
    policy: "Privacy policy",
    preview: "Preview: guests enter their email here.",
    error: "That didn't work. Please try again.",
  },
  fr: {
    eyebrow: "Se connecter au Wi-Fi",
    notConfigured: "Le réseau n'est pas encore configuré.",
    join: "Rejoindre le réseau",
    iosSteps: [
      "Touchez Rejoindre le réseau, puis Autoriser.",
      "Ouvrez Réglages et touchez Profil téléchargé.",
      "Touchez Installer. Votre iPhone se connecte automatiquement.",
    ],
    typeInstead: "Vous préférez saisir le mot de passe ?",
    password: "Mot de passe",
    copy: "Copier le mot de passe",
    copied: "Copié",
    stepCopy: "Copiez le mot de passe.",
    stepOpen: (ssid: string, hidden: boolean) =>
      hidden
        ? `Ouvrez les réglages Wi-Fi, choisissez Ajouter un réseau et saisissez ${ssid}.`
        : `Ouvrez les réglages Wi-Fi et choisissez ${ssid}.`,
    stepPaste: "Collez le mot de passe et connectez-vous.",
    openNetwork: "Réseau ouvert, aucun mot de passe requis.",
    gateTitle: "Saisissez votre e-mail pour accéder au Wi-Fi.",
    gateVerify: "Nous vous envoyons un code de confirmation.",
    emailLabel: "Adresse e-mail",
    continue: "Continuer",
    sendCode: "Envoyer le code",
    codeTitle: (email: string) => `Saisissez le code à 6 chiffres envoyé à ${email}.`,
    codeLabel: "Code",
    confirm: "Confirmer",
    resend: "Envoyer un nouveau code",
    otherEmail: "Utiliser une autre adresse",
    marketing: (name: string) =>
      `Oui, ${name} peut m'envoyer des nouvelles et des offres par e-mail. Je peux me désabonner à tout moment.`,
    privacy: (name: string, marketing: boolean) =>
      `${name} utilise votre e-mail pour vous donner accès au Wi-Fi${
        marketing ? " et, seulement si vous l'acceptez, pour vous envoyer des nouvelles et des offres" : ""
      }. Taplino le traite pour le compte de ${name}. Sans consentement marketing, il est supprimé 12 mois après votre dernière visite.`,
    contact: "Retirer votre consentement ou faire supprimer vos données :",
    policy: "Politique de confidentialité",
    preview: "Aperçu : les clients saisissent leur e-mail ici.",
    error: "Cela n'a pas fonctionné. Veuillez réessayer.",
  },
  it: {
    eyebrow: "Connettiti al Wi-Fi",
    notConfigured: "La rete non è ancora configurata.",
    join: "Connetti alla rete",
    iosSteps: [
      "Tocca Connetti alla rete, poi Consenti.",
      "Apri Impostazioni e tocca Profilo scaricato.",
      "Tocca Installa. Il tuo iPhone si connette automaticamente.",
    ],
    typeInstead: "Preferisci inserire la password?",
    password: "Password",
    copy: "Copia password",
    copied: "Copiata",
    stepCopy: "Copia la password.",
    stepOpen: (ssid: string, hidden: boolean) =>
      hidden
        ? `Apri le impostazioni Wi-Fi, scegli Aggiungi rete e inserisci ${ssid}.`
        : `Apri le impostazioni Wi-Fi e scegli ${ssid}.`,
    stepPaste: "Incolla la password e connettiti.",
    openNetwork: "Rete aperta, nessuna password richiesta.",
    gateTitle: "Inserisci la tua e-mail per accedere al Wi-Fi.",
    gateVerify: "Ti inviamo un codice di conferma.",
    emailLabel: "Indirizzo e-mail",
    continue: "Continua",
    sendCode: "Invia codice",
    codeTitle: (email: string) => `Inserisci il codice di 6 cifre inviato a ${email}.`,
    codeLabel: "Codice",
    confirm: "Conferma",
    resend: "Invia un nuovo codice",
    otherEmail: "Usa un'altra e-mail",
    marketing: (name: string) =>
      `Sì, ${name} può inviarmi novità e offerte via e-mail. Posso disiscrivermi in qualsiasi momento.`,
    privacy: (name: string, marketing: boolean) =>
      `${name} usa la tua e-mail per darti accesso al Wi-Fi${
        marketing ? " e, solo se acconsenti, per inviarti novità e offerte" : ""
      }. Taplino la tratta per conto di ${name}. Senza consenso al marketing viene cancellata 12 mesi dopo la tua ultima visita.`,
    contact: "Revocare il consenso o far cancellare i tuoi dati:",
    policy: "Informativa sulla privacy",
    preview: "Anteprima: qui gli ospiti inseriscono la loro e-mail.",
    error: "Non ha funzionato. Riprova.",
  },
} satisfies Record<Locale, unknown>;

type Copy = (typeof COPY)["de"];

function readToken(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeToken(key: string, token: string | null) {
  try {
    if (token) localStorage.setItem(key, token);
    else localStorage.removeItem(key);
  } catch {
    /* storage unavailable: the guest just signs in again next time */
  }
}

// ─── View ─────────────────────────────────────────────────────────────────────

/**
 * Guests arrive by tapping an NFC card, so they are already on the phone that
 * should join. A web page cannot join a network itself: iPhones install a Wi-Fi
 * profile and Android guests copy the password into their Wi-Fi settings. With
 * guest access on, both come only after the email (and code) step.
 */
export function WifiView({
  content,
  name,
  locale,
  businessName,
  client,
}: {
  content: WifiContent;
  name: string;
  locale: Locale;
  businessName: string;
  client?: WifiAccessClient;
}) {
  const t = COPY[locale] ?? COPY.de;
  const ssid = content?.ssid || "";
  const mode = content?.guestAccess?.mode ?? "open";
  const gated = mode !== "open";
  const nopass = (content?.encryption || "WPA") === "nopass";

  // Gated pages never carry the password; it arrives with the grant.
  const [grant, setGrant] = useState<{ token?: string; password: string | null } | null>(null);
  const [restoring, setRestoring] = useState(gated && !!client);

  // A guest who already got access on this device skips the form.
  useEffect(() => {
    if (!gated || !client) return;
    const token = readToken(client.storageKey);
    if (!token) {
      setRestoring(false);
      return;
    }
    client
      .credentials(token)
      .then((r) => setGrant({ token, password: r.password }))
      .catch(() => writeToken(client.storageKey, null))
      .finally(() => setRestoring(false));
  }, [gated, client]);

  const onGranted = (token: string, password: string | null) => {
    if (client) writeToken(client.storageKey, token);
    setGrant({ token, password });
  };

  let body;
  if (!ssid) {
    body = <p className="mt-8 opacity-60">{t.notConfigured}</p>;
  } else if (!gated) {
    body = (
      <Connect
        t={t}
        ssid={ssid}
        hidden={content.hidden === true}
        password={nopass ? null : content.password || null}
        profileUrl={client?.profileUrl()}
      />
    );
  } else if (grant) {
    body = (
      <Connect
        t={t}
        ssid={ssid}
        hidden={content.hidden === true}
        password={grant.password}
        profileUrl={client?.profileUrl(grant.token)}
      />
    );
  } else if (restoring) {
    body = <div className="mt-8 h-40" />;
  } else {
    body = (
      <Gate
        t={t}
        verify={mode === "verify"}
        marketing={content.guestAccess?.marketing === true}
        privacyUrl={content.guestAccess?.privacyUrl}
        contactEmail={content.guestAccess?.contactEmail}
        businessName={businessName}
        locale={locale}
        client={client}
        onGranted={onGranted}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <div
        className="mb-4 flex size-16 items-center justify-center rounded-[var(--pt-card-radius)]"
        style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
      >
        <Wifi className="size-8" />
      </div>

      <p className="eyebrow opacity-50">{t.eyebrow}</p>
      <p className="display mt-1 break-all text-3xl">{ssid || name}</p>

      {body}
    </div>
  );
}

const primaryClass =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--pt-radius)] text-base font-semibold transition active:scale-[0.98] disabled:opacity-60";
const brandStyle = { background: "var(--pt-brand)", color: "var(--pt-on-brand)" };
const surfaceStyle = { background: "var(--pt-surface)" };
const inputClass =
  "min-h-[52px] w-full rounded-[var(--pt-radius)] border px-4 text-base outline-none focus:ring-2";
const inputStyle = {
  background: "var(--pt-surface)",
  borderColor: "var(--pt-line)",
  color: "inherit",
  "--tw-ring-color": "var(--pt-brand)",
} as React.CSSProperties;

/** The per-platform way onto the network, once the guest may have it. */
function Connect({
  t,
  ssid,
  hidden,
  password,
  profileUrl,
}: {
  t: Copy;
  ssid: string;
  hidden: boolean;
  password: string | null;
  profileUrl?: string;
}) {
  const platform = useSyncExternalStore<Platform>(noSubscribe, detectPlatform, () => "other");
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const passwordCard = password && (
    <div className="rounded-[var(--pt-card-radius)] p-4 text-left" style={surfaceStyle}>
      <p className="eyebrow opacity-40">{t.password}</p>
      <p className="mt-1 break-all font-mono text-lg">{password}</p>
    </div>
  );

  const copyButton = password && (
    <button type="button" onClick={copyPassword} className={primaryClass} style={brandStyle}>
      {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
      {copied ? t.copied : t.copy}
    </button>
  );

  if (platform === "ios" && profileUrl) {
    return (
      <div className="mt-8 w-full max-w-xs space-y-3">
        <a href={profileUrl} className={primaryClass} style={brandStyle}>
          <Download className="size-5" />
          {t.join}
        </a>
        <Steps steps={t.iosSteps} />
        {password && (
          <details className="pt-2 text-sm">
            <summary className="cursor-pointer opacity-60">{t.typeInstead}</summary>
            <div className="mt-3 space-y-3">
              {passwordCard}
              {copyButton}
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8 w-full max-w-xs space-y-3">
      {passwordCard}
      {copyButton}
      <Steps
        steps={
          password
            ? [t.stepCopy, t.stepOpen(ssid, hidden), t.stepPaste]
            : [t.stepOpen(ssid, hidden), t.openNetwork]
        }
      />
    </div>
  );
}

/** Email (and code) step in front of the password, with the privacy note. */
function Gate({
  t,
  verify,
  marketing,
  privacyUrl,
  contactEmail,
  businessName,
  locale,
  client,
  onGranted,
}: {
  t: Copy;
  verify: boolean;
  marketing: boolean;
  privacyUrl?: string;
  contactEmail?: string;
  businessName: string;
  locale: Locale;
  client?: WifiAccessClient;
  onGranted: (token: string, password: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (result: WifiAccessResult) => {
    if (result.status === "granted") onGranted(result.token, result.password);
    else setSentTo(result.email);
  };

  async function run(action: () => Promise<WifiAccessResult>) {
    setBusy(true);
    setError(null);
    try {
      handle(await action());
    } catch (e) {
      setError((e as Error).message || t.error);
    } finally {
      setBusy(false);
    }
  }

  const request = () =>
    client ? run(() => client.request({ email, marketingConsent: consent, locale })) : undefined;

  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    request();
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    if (client && sentTo) run(() => client.verify(sentTo, code));
  };

  if (sentTo) {
    return (
      <form onSubmit={submitCode} className="mt-8 w-full max-w-xs space-y-3 text-left">
        <p className="text-center text-sm opacity-80">{t.codeTitle(sentTo)}</p>
        <input
          aria-label={t.codeLabel}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} text-center font-mono text-2xl tracking-[0.5em]`}
          style={inputStyle}
        />
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy || code.length !== 6} className={primaryClass} style={brandStyle}>
          {t.confirm}
        </button>
        <div className="flex justify-between gap-3 pt-1 text-sm">
          <button type="button" className="opacity-60 underline" onClick={() => setSentTo(null)}>
            {t.otherEmail}
          </button>
          <button type="button" className="opacity-60 underline" disabled={busy} onClick={request}>
            {t.resend}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitEmail} className="mt-8 w-full max-w-xs space-y-3 text-left">
      <p className="text-center text-base font-semibold">{t.gateTitle}</p>
      {verify && <p className="-mt-1 text-center text-sm opacity-60">{t.gateVerify}</p>}
      <div className="relative">
        <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 opacity-40" />
        <input
          type="email"
          aria-label={t.emailLabel}
          placeholder={t.emailLabel}
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} pl-12`}
          style={inputStyle}
        />
      </div>
      {marketing && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 size-5 shrink-0"
            style={{ accentColor: "var(--pt-brand)" }}
          />
          <span className="opacity-80">{t.marketing(businessName)}</span>
        </label>
      )}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy || !client} className={primaryClass} style={brandStyle}>
        {verify ? t.sendCode : t.continue}
      </button>
      {!client && <p className="text-center text-xs opacity-50">{t.preview}</p>}
      <p className="pt-2 text-xs leading-relaxed opacity-60">
        {t.privacy(businessName, marketing)}
        {contactEmail && (
          <>
            {" "}
            {t.contact}{" "}
            <a href={`mailto:${contactEmail}`} className="underline">
              {contactEmail}
            </a>
            .
          </>
        )}
        {privacyUrl && (
          <>
            {" "}
            <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {t.policy}
            </a>
          </>
        )}
      </p>
    </form>
  );
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 pt-2 text-left text-sm">
      {steps.map((step, i) => (
        <li key={step} className="flex gap-3">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ background: "var(--pt-chip)" }}
          >
            {i + 1}
          </span>
          <span className="pt-0.5 opacity-80">{step}</span>
        </li>
      ))}
    </ol>
  );
}
