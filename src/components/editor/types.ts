// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// Shared types + industry presets for the card editor.
import { l, type L, type Translate } from "./locale";
import { s as str } from "./strings";

export type FontStyle = "sans" | "serif" | "rounded" | "display";

// The physical card the customer is ordering. "business" is the premium metal
// card (available in a silver or black finish); "review" is our classic printed
// card for reviews and menus.
export type CardType = "business" | "review";
export type CardFinish = "silver" | "black";

export type CardTypeDef = {
  key: CardType;
  name: L;
  tagline: L;
  material: L;
  price: number; // base CHF per card, before volume discount
  available: boolean; // false → shown for preview but not orderable yet
  aspect: string; // CSS aspect-ratio of the physical card
  previewScale: number; // relative preview size (1 = largest)
  sizeLabel: L; // printed dimensions
  finishes?: CardFinish[]; // metal cards only
};

export const CARD_TYPES: CardTypeDef[] = [
  {
    key: "business",
    name: l("Metal business card", "Metall-Visitenkarte", "Carte de visite métal", "Biglietto da visita in metallo"),
    tagline: l(
      "Premium anodised metal, brushed finish",
      "Hochwertiges eloxiertes Metall, gebürstet",
      "Métal anodisé premium, finition brossée",
      "Metallo anodizzato premium, finitura spazzolata",
    ),
    material: l("Anodised aluminium", "Eloxiertes Aluminium", "Aluminium anodisé", "Alluminio anodizzato"),
    price: 89,
    available: true,
    aspect: "85 / 54", // standard business-card landscape
    previewScale: 0.92,
    sizeLabel: l("85 × 54 mm", "85 × 54 mm", "85 × 54 mm", "85 × 54 mm"),
    finishes: ["silver", "black"],
  },
  {
    key: "review",
    name: l("Review & menu card", "Bewertungs- & Menükarte", "Carte avis & menu", "Carta recensioni & menu"),
    tagline: l(
      "Our classic for Google reviews, menus and more",
      "Unser Klassiker für Google-Bewertungen, Menüs und mehr",
      "Notre classique pour les avis Google, les menus et plus",
      "Il nostro classico per recensioni Google, menu e altro",
    ),
    material: l("PVC", "PVC", "PVC", "PVC"),
    price: 50,
    available: true,
    aspect: "5 / 6", // large portrait review/menu card
    previewScale: 1,
    sizeLabel: l("120 × 120 mm", "120 × 120 mm", "120 × 120 mm", "120 × 120 mm"),
  },
];

// Finish swatches for the metal card. The gradient approximates brushed metal
// and also themes the live preview frame.
export const FINISHES: { key: CardFinish; label: L; swatch: string; ring: string }[] = [
  {
    key: "silver",
    label: l("Silver", "Silber", "Argent", "Argento"),
    swatch: "linear-gradient(135deg,#f2f3f5 0%,#c3c6cd 38%,#e9eaee 55%,#a9adb6 78%,#dfe1e6 100%)",
    ring: "#b9bcc4",
  },
  {
    key: "black",
    label: l("Black", "Schwarz", "Noir", "Nero"),
    swatch: "linear-gradient(135deg,#43444a 0%,#161719 38%,#33343a 55%,#0d0e10 78%,#2a2b31 100%)",
    ring: "#2b2c31",
  },
];

// How the bottom edge of the header band is drawn. "wave" and "scallop" give
// the soft, flowy look of Google's review cards; "round" is a single arch.
export type HeaderShape = "straight" | "wave" | "round" | "scallop";

// What the middle of the card leads with. Not every business has a big logo —
// some are better served by a bold message ("text") or a short menu / service
// list ("list"). "logo" is the classic logo-drop-zone layout.
export type CardLayout = "logo" | "text" | "list";

// The full, serialisable description of a customer's card design.
export type CardConfig = {
  cardType: CardType;
  finish: CardFinish; // only meaningful for the metal business card
  category: string;
  layout: CardLayout;
  headline: string;
  logoText: string;
  logoHint: string;
  logoDataUrl: string | null;
  logoName: string | null;
  logoScale: number; // logo size relative to the default, see LOGO_SCALE
  // Layout-specific content.
  bodyText: string; // "text" layout — the big message
  listTitle: string; // "list" layout — heading above the items
  listItems: string; // "list" layout — one item per line
  headerColor: string;
  headerTextColor: string;
  bodyColor: string;
  starColor: string;
  accentColor: string;
  font: FontStyle;
  headerShape: HeaderShape;
  showStars: boolean;
  showQr: boolean; // backup QR code for phones without NFC
  showGoogle: boolean; // "Google review" mark in the footer
  showTapZone: boolean; // printed "hold your phone here" target over the chip
  showTapZoneText: boolean; // print a label under the tap marker
  tapZoneText: string; // that label, empty = localized default
  logoOnly: boolean; // minimal card: just the logo and the tap marker
  template: Preset["key"]; // chosen template, decides the example copy
  reviewUrl: string;
  // Business-card fields (metal card only)
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
};

export type Preset = {
  key:
    | "restaurant"
    | "electronics"
    | "fitness"
    | "beauty"
    | "cafe"
    | "bakery"
    | "bar"
    | "hotel"
    | "health"
    | "garage"
    | "fashion"
    | "minimal";
  name: L;
  category: L;
  layout: CardLayout;
  headerColor: string;
  headerTextColor: string;
  bodyColor: string;
  starColor: string;
  accentColor: string;
  font: FontStyle;
  headerShape: HeaderShape;
  showStars: boolean;
  logoOnly?: boolean; // start from the logo-and-marker-only card
  text?: TemplateText; // example copy, printed while a field is left empty
};

// Industry example copy for a template. Without it the generic defaults apply.
export type TemplateText = { headline: L; bodyText: L; listTitle: L; listItems: L };

// A ready-made example design (restaurant preset, default text) — used both as
// the editor's starting point and as the marketing preview on the home page.
export function exampleCard(): CardConfig {
  const p = PRESETS[0];
  return {
    cardType: "review",
    finish: "silver",
    category: "",
    layout: p.layout,
    headline: "",
    logoText: "",
    logoHint: "",
    logoDataUrl: null,
    logoName: null,
    logoScale: 1,
    bodyText: "",
    listTitle: "",
    listItems: "",
    headerColor: p.headerColor,
    headerTextColor: p.headerTextColor,
    bodyColor: p.bodyColor,
    starColor: p.starColor,
    accentColor: p.accentColor,
    font: p.font,
    headerShape: p.headerShape,
    showStars: p.showStars,
    showQr: false,
    showGoogle: false,
    showTapZone: true,
    showTapZoneText: true,
    tapZoneText: "",
    logoOnly: false,
    template: p.key,
    reviewUrl: "",
    fullName: "",
    jobTitle: "",
    company: "",
    phone: "",
    email: "",
    website: "",
  };
}

// Industry starting points — mirror the four reference designs. Everything
// stays editable after a preset is applied; picking one only seeds colours,
// font, layout, header edge and a suggested category label.
export const PRESETS: Preset[] = [
  {
    key: "restaurant",
    name: l("Restaurant", "Restaurant", "Restaurant", "Ristorante"),
    category: l("Fast food & restaurant", "Schnellrestaurant", "Restauration rapide", "Ristorazione veloce"),
    layout: "list",
    headerColor: "#2f6df0",
    headerTextColor: "#ffffff",
    bodyColor: "#eaf1fd",
    starColor: "#ffd23f",
    accentColor: "#2f6df0",
    font: "sans",
    headerShape: "wave",
    showStars: true,
  },
  {
    key: "electronics",
    name: l("Electronics", "Elektronik", "Électronique", "Elettronica"),
    category: l("Electronics store", "Elektronikmarkt", "Magasin d'électronique", "Negozio di elettronica"),
    layout: "logo",
    headerColor: "#143a5e",
    headerTextColor: "#ffffff",
    bodyColor: "#ffffff",
    starColor: "#f4c542",
    accentColor: "#143a5e",
    font: "sans",
    headerShape: "straight",
    showStars: true,
    text: {
      headline: l(
        "How was our service?",
        "Wie war unsere Beratung?",
        "Comment était notre conseil ?",
        "Com'è stata la nostra consulenza?",
      ),
      bodyText: l(
        "Found the right device? Tap and rate our advice.",
        "Das richtige Gerät gefunden? Antippen und Beratung bewerten.",
        "Trouvé le bon appareil ? Tapez et notez notre conseil.",
        "Trovato il dispositivo giusto? Tappa e valuta la consulenza.",
      ),
      listTitle: l(
        "Our services",
        "Unser Service",
        "Nos services",
        "I nostri servizi",
      ),
      listItems: l(
        "Expert advice\nSetup & data transfer\nRepairs on site\n2-year warranty",
        "Persönliche Beratung\nEinrichtung & Datentransfer\nReparaturen vor Ort\n2 Jahre Garantie",
        "Conseil personnalisé\nInstallation & transfert de données\nRéparations sur place\nGarantie 2 ans",
        "Consulenza personale\nConfigurazione & trasferimento dati\nRiparazioni in sede\nGaranzia 2 anni",
      ),
    },
  },
  {
    key: "fitness",
    name: l("Fitness & Club", "Fitness & Club", "Fitness & Club", "Fitness & Club"),
    category: l("Fitness & nightlife", "Fitnessstudio & Nightlife", "Fitness & vie nocturne", "Fitness & nightlife"),
    layout: "text",
    headerColor: "#101010",
    headerTextColor: "#ffffff",
    bodyColor: "#fff0f6",
    starColor: "#ff2d78",
    accentColor: "#ff2d78",
    font: "display",
    headerShape: "round",
    showStars: true,
    text: {
      headline: l(
        "Crushed your workout?",
        "Training geschafft?",
        "Séance réussie ?",
        "Allenamento fatto?",
      ),
      bodyText: l(
        "Tap, rate us and push the community forward.",
        "Antippen, bewerten und die Community pushen.",
        "Tapez, notez-nous et motivez la communauté.",
        "Tappa, valutaci e spingi la community.",
      ),
      listTitle: l(
        "This week",
        "Diese Woche",
        "Cette semaine",
        "Questa settimana",
      ),
      listItems: l(
        "HIIT Monday 18:00\nYoga Wednesday 07:30\nSpin Friday 19:00\nOpen gym every day",
        "HIIT Montag 18:00\nYoga Mittwoch 07:30\nSpinning Freitag 19:00\nOpen Gym täglich",
        "HIIT lundi 18h00\nYoga mercredi 07h30\nSpinning vendredi 19h00\nSalle ouverte tous les jours",
        "HIIT lunedì 18:00\nYoga mercoledì 07:30\nSpinning venerdì 19:00\nPalestra aperta ogni giorno",
      ),
    },
  },
  {
    key: "beauty",
    name: l("Beauty & Salon", "Beauty & Salon", "Beauté & Salon", "Bellezza & Salone"),
    category: l("Hair & beauty salon", "Friseur & Kosmetikstudio", "Coiffure & institut de beauté", "Parrucchiere & centro estetico"),
    layout: "logo",
    headerColor: "#c6a24b",
    headerTextColor: "#ffffff",
    bodyColor: "#fbf4e9",
    starColor: "#c6a24b",
    accentColor: "#b8933f",
    font: "serif",
    headerShape: "scallop",
    showStars: false,
    text: {
      headline: l(
        "Feeling beautiful?",
        "Wohlgefühlt?",
        "Vous vous sentez belle ?",
        "Ti senti bene?",
      ),
      bodyText: l(
        "Share your new look in a quick review.",
        "Teilen Sie Ihren neuen Look in einer kurzen Bewertung.",
        "Partagez votre nouveau look en un avis rapide.",
        "Condividi il tuo nuovo look con una breve recensione.",
      ),
      listTitle: l(
        "Our treatments",
        "Unsere Behandlungen",
        "Nos soins",
        "I nostri trattamenti",
      ),
      listItems: l(
        "Cut & styling\nColour & balayage\nManicure & pedicure\nFacial treatments",
        "Schnitt & Styling\nFarbe & Balayage\nManiküre & Pediküre\nGesichtsbehandlungen",
        "Coupe & coiffage\nCouleur & balayage\nManucure & pédicure\nSoins du visage",
        "Taglio & piega\nColore & balayage\nManicure & pedicure\nTrattamenti viso",
      ),
    },
  },
  {
    key: "cafe",
    name: l("Café", "Café", "Café", "Caffè"),
    category: l("Café & coffee bar", "Café & Kaffeebar", "Café & bar à café", "Caffetteria"),
    layout: "list",
    headerColor: "#6b4a3a",
    headerTextColor: "#ffffff",
    bodyColor: "#f6efe6",
    starColor: "#e8b04a",
    accentColor: "#6b4a3a",
    font: "rounded",
    headerShape: "wave",
    showStars: true,
    text: {
      headline: l(
        "Enjoyed your coffee?",
        "Hat der Kaffee geschmeckt?",
        "Votre café vous a plu ?",
        "Ti è piaciuto il caffè?",
      ),
      bodyText: l(
        "Tap and tell us how your cup was.",
        "Antippen und erzählen, wie Ihr Kaffee war.",
        "Tapez et dites-nous comment était votre tasse.",
        "Tappa e raccontaci com'era la tua tazza.",
      ),
      listTitle: l(
        "Fresh from the bar",
        "Frisch von der Bar",
        "Frais du comptoir",
        "Fresco dal banco",
      ),
      listItems: l(
        "Flat white\nOat cappuccino\nHomemade banana bread\nCroissant of the day",
        "Flat White\nHafer-Cappuccino\nHausgemachtes Bananenbrot\nGipfeli des Tages",
        "Flat white\nCappuccino à l'avoine\nBanana bread maison\nCroissant du jour",
        "Flat white\nCappuccino all'avena\nBanana bread fatto in casa\nCornetto del giorno",
      ),
    },
  },
  {
    key: "bakery",
    name: l("Bakery", "Bäckerei", "Boulangerie", "Panetteria"),
    category: l("Bakery & pastry", "Bäckerei & Konditorei", "Boulangerie & pâtisserie", "Panetteria & pasticceria"),
    layout: "list",
    headerColor: "#d9822b",
    headerTextColor: "#ffffff",
    bodyColor: "#fff6ea",
    starColor: "#fff1c2",
    accentColor: "#b8641c",
    font: "rounded",
    headerShape: "scallop",
    showStars: true,
    text: {
      headline: l(
        "Fresh from the oven!",
        "Frisch aus dem Ofen!",
        "Tout frais sorti du four !",
        "Appena sfornato!",
      ),
      bodyText: l(
        "Tasted good? Tap and leave us a sweet review.",
        "Hat es geschmeckt? Antippen und süss bewerten.",
        "C'était bon ? Tapez et laissez-nous un avis gourmand.",
        "Era buono? Tappa e lasciaci una dolce recensione.",
      ),
      listTitle: l(
        "Baked today",
        "Heute gebacken",
        "Cuit aujourd'hui",
        "Sfornato oggi",
      ),
      listItems: l(
        "Sourdough bread\nButter croissants\nFruit tarts\nSunday braided loaf",
        "Sauerteigbrot\nButtergipfeli\nFruchtwähen\nSonntagszopf",
        "Pain au levain\nCroissants au beurre\nTartes aux fruits\nTresse du dimanche",
        "Pane a lievitazione naturale\nCornetti al burro\nCrostate di frutta\nTreccia della domenica",
      ),
    },
  },
  {
    key: "bar",
    name: l("Bar & Wine", "Bar & Wein", "Bar & Vin", "Bar & Vino"),
    category: l("Bar & wine bar", "Bar & Weinbar", "Bar & bar à vin", "Bar & enoteca"),
    layout: "text",
    headerColor: "#5b1a2e",
    headerTextColor: "#f7e7c6",
    bodyColor: "#f8f1ec",
    starColor: "#e6b54a",
    accentColor: "#7a2440",
    font: "serif",
    headerShape: "round",
    showStars: true,
    text: {
      headline: l(
        "Cheers to you!",
        "Zum Wohl!",
        "Santé !",
        "Salute!",
      ),
      bodyText: l(
        "Had a great evening? Raise a glass and rate us.",
        "Schöner Abend gehabt? Glas heben und bewerten.",
        "Belle soirée ? Levez votre verre et notez-nous.",
        "Bella serata? Alza il calice e valutaci.",
      ),
      listTitle: l(
        "Tonight's pours",
        "Heute im Glas",
        "Ce soir au verre",
        "Stasera nel calice",
      ),
      listItems: l(
        "Local Pinot Noir\nChasselas from Lavaux\nSignature spritz\nCheese & charcuterie board",
        "Pinot Noir aus der Region\nChasselas aus dem Lavaux\nHaus-Spritz\nKäse- & Fleischplatte",
        "Pinot noir de la région\nChasselas de Lavaux\nSpritz maison\nPlanche fromages & charcuterie",
        "Pinot nero della regione\nChasselas del Lavaux\nSpritz della casa\nTagliere di formaggi & salumi",
      ),
    },
  },
  {
    key: "hotel",
    name: l("Hotel", "Hotel", "Hôtel", "Hotel"),
    category: l("Hotel & guesthouse", "Hotel & Gästehaus", "Hôtel & maison d'hôtes", "Hotel & pensione"),
    layout: "logo",
    headerColor: "#1f3b35",
    headerTextColor: "#f3ead8",
    bodyColor: "#f6f3ec",
    starColor: "#d4b16a",
    accentColor: "#1f3b35",
    font: "serif",
    headerShape: "straight",
    showStars: true,
    text: {
      headline: l(
        "How was your stay?",
        "Wie war Ihr Aufenthalt?",
        "Comment s'est passé votre séjour ?",
        "Com'è stato il soggiorno?",
      ),
      bodyText: l(
        "We hope you slept well. Tap to share your stay.",
        "Wir hoffen, Sie haben gut geschlafen. Antippen und Aufenthalt teilen.",
        "Nous espérons que vous avez bien dormi. Tapez pour partager votre séjour.",
        "Speriamo che abbia dormito bene. Tappa per condividere il soggiorno.",
      ),
      listTitle: l(
        "During your stay",
        "Während Ihres Aufenthalts",
        "Pendant votre séjour",
        "Durante il soggiorno",
      ),
      listItems: l(
        "Breakfast 07:00 to 10:30\nSpa & sauna until 21:00\nFree Wi-Fi everywhere\nReception open 24/7",
        "Frühstück 07:00 bis 10:30\nSpa & Sauna bis 21:00\nGratis WLAN im ganzen Haus\nRezeption rund um die Uhr",
        "Petit-déjeuner 07h00 à 10h30\nSpa & sauna jusqu'à 21h00\nWi-Fi gratuit partout\nRéception ouverte 24h/24",
        "Colazione dalle 07:00 alle 10:30\nSpa & sauna fino alle 21:00\nWi-Fi gratuito ovunque\nReception aperta 24 ore su 24",
      ),
    },
  },
  {
    key: "health",
    name: l("Health & Practice", "Praxis & Gesundheit", "Santé & Cabinet", "Salute & Studio"),
    category: l("Medical & dental practice", "Arzt- & Zahnarztpraxis", "Cabinet médical & dentaire", "Studio medico & dentistico"),
    layout: "logo",
    headerColor: "#0f8a8a",
    headerTextColor: "#ffffff",
    bodyColor: "#effaf9",
    starColor: "#ffc94a",
    accentColor: "#0f7a7a",
    font: "sans",
    headerShape: "round",
    showStars: true,
    text: {
      headline: l(
        "Thank you for your trust",
        "Danke für Ihr Vertrauen",
        "Merci de votre confiance",
        "Grazie per la fiducia",
      ),
      bodyText: l(
        "Were you happy with your visit? Your feedback helps others.",
        "Waren Sie zufrieden? Ihre Bewertung hilft anderen Patienten.",
        "Satisfait de votre visite ? Votre avis aide d'autres patients.",
        "Soddisfatto della visita? La tua opinione aiuta altri pazienti.",
      ),
      listTitle: l(
        "Our practice",
        "Unsere Praxis",
        "Notre cabinet",
        "Il nostro studio",
      ),
      listItems: l(
        "Check-ups & prevention\nDental hygiene\nEmergency appointments\nOnline booking",
        "Kontrollen & Vorsorge\nDentalhygiene\nNotfalltermine\nOnline-Terminbuchung",
        "Contrôles & prévention\nHygiène dentaire\nRendez-vous d'urgence\nRéservation en ligne",
        "Controlli & prevenzione\nIgiene dentale\nAppuntamenti urgenti\nPrenotazione online",
      ),
    },
  },
  {
    key: "garage",
    name: l("Garage & Auto", "Garage & Auto", "Garage & Auto", "Officina & Auto"),
    category: l("Garage & car service", "Autogarage & Service", "Garage & entretien auto", "Officina & assistenza auto"),
    layout: "text",
    headerColor: "#1c1c1e",
    headerTextColor: "#ffffff",
    bodyColor: "#f2f2f2",
    starColor: "#ff6a13",
    accentColor: "#e2530c",
    font: "display",
    headerShape: "straight",
    showStars: true,
    text: {
      headline: l(
        "Back on the road?",
        "Wieder startklar?",
        "Prêt à reprendre la route ?",
        "Di nuovo in strada?",
      ),
      bodyText: l(
        "Happy with the service? Tap and rate our team.",
        "Zufrieden mit dem Service? Antippen und unser Team bewerten.",
        "Satisfait du service ? Tapez et notez notre équipe.",
        "Soddisfatto del servizio? Tappa e valuta il nostro team.",
      ),
      listTitle: l(
        "Our workshop",
        "Unsere Werkstatt",
        "Notre atelier",
        "La nostra officina",
      ),
      listItems: l(
        "Service & inspection\nTyre change & storage\nMFK preparation\nReplacement car",
        "Service & Inspektion\nReifenwechsel & Einlagerung\nMFK-Vorbereitung\nErsatzfahrzeug",
        "Service & inspection\nChangement & stockage de pneus\nPréparation expertise\nVéhicule de remplacement",
        "Tagliando & ispezione\nCambio & deposito pneumatici\nPreparazione collaudo\nAuto sostitutiva",
      ),
    },
  },
  {
    key: "fashion",
    name: l("Fashion & Retail", "Mode & Laden", "Mode & Boutique", "Moda & Negozio"),
    category: l("Fashion & retail store", "Mode- & Einzelhandel", "Mode & commerce de détail", "Moda & commercio al dettaglio"),
    layout: "logo",
    headerColor: "#ead9cf",
    headerTextColor: "#2a2320",
    bodyColor: "#fffaf7",
    starColor: "#2a2320",
    accentColor: "#2a2320",
    font: "serif",
    headerShape: "straight",
    showStars: false,
    text: {
      headline: l(
        "Found your new favourite?",
        "Neues Lieblingsstück gefunden?",
        "Trouvé votre nouvelle pièce préférée ?",
        "Trovato il tuo nuovo capo preferito?",
      ),
      bodyText: l(
        "Tell us about your shopping experience.",
        "Erzählen Sie uns von Ihrem Einkauf.",
        "Racontez-nous votre expérience shopping.",
        "Raccontaci la tua esperienza di shopping.",
      ),
      listTitle: l(
        "In store now",
        "Neu im Laden",
        "Nouveau en boutique",
        "Ora in negozio",
      ),
      listItems: l(
        "New season collection\nPersonal styling\nFree alterations\nGift cards",
        "Neue Saisonkollektion\nPersönliche Stilberatung\nKostenlose Änderungen\nGeschenkkarten",
        "Nouvelle collection\nConseil en style personnalisé\nRetouches gratuites\nCartes cadeaux",
        "Nuova collezione\nConsulenza di stile personale\nModifiche gratuite\nCarte regalo",
      ),
    },
  },
  {
    key: "minimal",
    name: l("Minimal", "Minimal", "Minimal", "Minimal"),
    category: l("Logo and tap marker only", "Nur Logo und Markierung", "Logo et repère uniquement", "Solo logo e indicatore"),
    layout: "logo",
    headerColor: "#14120f",
    headerTextColor: "#ffffff",
    bodyColor: "#ffffff",
    starColor: "#14120f",
    accentColor: "#14120f",
    font: "sans",
    headerShape: "straight",
    showStars: false,
    logoOnly: true,
  },
];

// Logo size slider range, as a factor of the default logo size.
export const LOGO_SCALE = { min: 0.5, max: 1.6, step: 0.05 } as const;

// Font stacks for the card. One family drives the whole card so the headline,
// logo label and body all share the same voice.
export const FONT_STACKS: Record<FontStyle, string> = {
  sans: "var(--font-body)",
  serif: '"Iowan Old Style", Georgia, "Times New Roman", serif',
  rounded:
    'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", "Quicksand", var(--font-body)',
  display: 'var(--font-bricolage), "Bricolage Grotesque", sans-serif',
};

// Live price and availability per product, keyed by product key (matches
// `CardType`). Prices in CHF. Missing entries fall back to CARD_TYPES.
export type ProductCatalog = Partial<
  Record<string, { price: number; available: boolean; stock: number | null }>
>;

// Volume pricing: the more cards ordered, the bigger the per-card discount.
// Tiers are checked high-to-low; the first one the quantity clears applies.
export type VolumeTier = { min: number; off: number };

export const DEFAULT_VOLUME_TIERS: VolumeTier[] = [
  { min: 200, off: 0.2 },
  { min: 100, off: 0.15 },
  { min: 50, off: 0.1 },
  { min: 20, off: 0.07 },
  { min: 10, off: 0.05 },
  { min: 5, off: 0.03 },
];

/** What the card prints for each text field left empty: the template's example copy, else the generic defaults. */
export function exampleText(config: Pick<CardConfig, "template">, t: Translate) {
  const text = PRESETS.find((p) => p.key === config.template)?.text;
  return {
    headline: t(text?.headline ?? str.defaultHeadline),
    bodyText: t(text?.bodyText ?? str.defaultBodyText),
    listTitle: t(text?.listTitle ?? str.defaultListTitle),
    listItems: t(text?.listItems ?? str.defaultListItems),
  };
}

/** The design with the example copy filled into the empty fields the card prints, so the order shows the real text. */
export function withPrintedText(c: CardConfig, t: Translate): CardConfig {
  if (c.cardType === "business" || c.logoOnly) return c;
  const ex = exampleText(c, t);
  return {
    ...c,
    headline: c.headline.trim() || ex.headline,
    ...(c.layout === "text" && { bodyText: c.bodyText.trim() || ex.bodyText }),
    ...(c.layout === "list" && {
      listTitle: c.listTitle.trim() || ex.listTitle,
      listItems: c.listItems.trim() || ex.listItems,
    }),
  };
}
