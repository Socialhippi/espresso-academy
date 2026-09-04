/**
 * Espresso Academy India: typed content.
 * Every field that the client has not confirmed is null and renders as a TBC state.
 * Shape maps 1:1 to the future Sanity schema (course, courseInstance, certification, trainer, story, faqItem, siteSettings).
 * Facts here must trace to content/facts.md. Do not add values without a source.
 */

export type Level = "foundation" | "intermediate" | "professional" | "junior" | "advanced" | "open";
export type Format = "in-person" | "hybrid" | "online";
export type SkillArea =
  | "barista-skills" | "latte-art" | "brewing" | "roasting-cupping" | "sensory" | "green-coffee" | "mixology" | "cafe-management";

export interface Certification {
  slug: "italian-barista-certificate" | "sca-coffee-skills-program";
  name: string;
  shortName: string;
  issuer: string;
  summary: string;           // supported by facts.md
  levels: string[];
  recognitionNote: string;   // honest, supported
  status: "confirmed" | "wording-pending";
}

export interface Trainer {
  slug: string;
  name: string;
  role: string | null;       // TBC
  credentials: { name: string; issuer: string | null }[];
  bio: string;               // only supported facts, third person, <= 80 words
  philosophy: string | null; // TBC: from a 10-minute interview
  image: string | null;      // public/images/trainers/<slug>.jpg when available
  sameAs: string[];
}

export interface CourseInstance {
  id: string;
  startDate: string | null;  // ISO
  endDate: string | null;
  schedule: string | null;
  seatsAvailable: number | null;
  status: "open" | "waitlist" | "soldout" | "tbc";
  paymentPageUrl: string | null;
}

export interface Course {
  slug: string;
  title: string;
  skillArea: SkillArea;
  level: Level;
  levelLabel: string;
  certification: Certification["slug"] | null;
  certificateAwardedLabel: string | null;
  format: Format | null;
  durationDays: number | null;
  durationHours: number | null;
  feeInclGst: number | null;
  emiAvailable: boolean | null;
  seatsMax: number | null;
  outcome: string;           // one sentence, outcome-led, no claims beyond facts
  forWhom: string[];
  notForWhom: string[];
  modules: string[] | null;  // TBC until client syllabus arrives
  includes: string[] | null;
  prerequisites: string | null;
  trainers: string[];        // trainer slugs; empty until client assigns
  nextInLadder: string | null;
  faq: { q: string; a: string }[];
  instances: CourseInstance[];
  heroImage: string | null;  // public/images/courses/<slug>.jpg
  heroAlt: string;
  priority: number;          // ordering on hub
}

export interface FaqItem { q: string; a: string; category: "courses" | "fees" | "certification" | "schedule" | "campus" | "careers"; link?: { label: string; href: string } }

export interface Story { id: string; name: string; course: string; outcome: string; quote: string; image: string | null; permission: boolean }

export const siteSettings = {
  name: "Espresso Academy India",
  legalName: null as string | null,
  tagline: null as string | null,                       // "Happy Coffee People" pending client confirmation
  partnerLine: "Official Partner of Espresso Academy, Florence",
  foundedFlorence: 2007,
  launchedBengaluru: 2023,
  address: {
    line1: "Microexcel Plaza, Plot No. 72, 80 Feet Road",
    line2: "RMV 2nd Stage, near Ramaiah Hospital",
    city: "Bengaluru",
    postalCode: "560094",
    region: "Karnataka",
    country: "IN",
    plotNumberConfirmed: false,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Microexcel+Plaza+80+Feet+Road+RMV+2nd+Stage+Bengaluru+560094",
  },
  phonePrimary: "+919448106100",
  phoneSecondary: "+919886646411",
  whatsappNumber: "919448106100",                        // TBC: client to confirm which number is on WhatsApp
  whatsappConfirmed: false,
  email: null as string | null,
  hours: null as string | null,
  instagram: "https://www.instagram.com/espressoacademyindia/",
  florencePartnerPage: "https://espressoacademy.it/en/find-out-the-espresso-academy-branch-in-your-country/",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://espressoacademy.in",
  replyPromise: null as string | null,                   // e.g. "We reply on WhatsApp within 2 hours, 10am to 7pm"
};

export const certifications: Certification[] = [
  {
    slug: "italian-barista-certificate",
    name: "Italian Barista Certificate (IBC)",
    shortName: "IBC",
    issuer: "Espresso Academy, Florence",
    summary: "The Italian Barista Certificate is issued in Italy by Espresso Academy, Florence, and sent to its authorised partner schools. Espresso Academy India teaches to the same method and offers the IBC at Junior and Advanced levels.",
    levels: ["Junior", "Advanced"],
    recognitionNote: "A certificate helps you get an interview; your skills get you the job. Ask us which employers recognise the IBC in your city and we will answer plainly.",
    status: "confirmed",
  },
  {
    slug: "sca-coffee-skills-program",
    name: "SCA Coffee Skills Program",
    shortName: "SCA",
    issuer: "Specialty Coffee Association",
    summary: "The Specialty Coffee Association's Coffee Skills Program is a modular curriculum (Introduction to Coffee, Barista Skills, Brewing, Green Coffee, Roasting, Sensory Skills) taught at Foundation, Intermediate and Professional levels. Espresso Academy India offers training aligned to the program across five modules.",
    levels: ["Foundation", "Intermediate", "Professional"],
    recognitionNote: "Certification is issued by the SCA on completion of an assessed module with an authorised trainer, usually with a separate SCA fee. Whether a given batch is assessed for SCA certification is confirmed at enrolment.",
    status: "wording-pending",
  },
];

export const trainers: Trainer[] = [
  {
    slug: "akanksha-gupta",
    name: "Akanksha Gupta",
    role: null,
    credentials: [
      { name: "Diploma, Coffee Board of India", issuer: "Coffee Board of India" },
      { name: "SCA certified: Sensory Skills, Barista Skills, Roasting", issuer: "Specialty Coffee Association" },
      { name: "Coffee competition judge", issuer: null },
    ],
    bio: "Akanksha is a biotechnology graduate with a Coffee Board of India diploma and SCA certifications in sensory, barista and roasting modules. She judges coffee competitions and teaches at the Bengaluru campus.",
    philosophy: null,
    image: null,
    sameAs: ["https://espressoacademy.it/en/our-authorized-trainers/"],
  },
  {
    slug: "sowmya-r",
    name: "Sowmya R",
    role: null,
    credentials: [
      { name: "Diploma, Coffee Board of India", issuer: "Coffee Board of India" },
      { name: "Q Processing Professional", issuer: "Coffee Quality Institute" },
      { name: "Food Safety Supervisor", issuer: "FSSAI" },
    ],
    bio: "Sowmya is a biotechnology graduate with a Coffee Board of India diploma, a CQI Q Processing professional credential and FSSAI Food Safety Supervisor certification. She teaches at the Bengaluru campus.",
    philosophy: null,
    image: null,
    sameAs: ["https://espressoacademy.it/en/our-authorized-trainers/"],
  },
  {
    slug: "nirupam-ranjan",
    name: "Nirupam Ranjan",
    role: null,
    credentials: [
      { name: "Diploma, Coffee Board of India", issuer: "Coffee Board of India" },
      { name: "Q Grader, Arabica and Robusta", issuer: "Coffee Quality Institute" },
      { name: "Former operations head, gourmet roaster", issuer: null },
    ],
    bio: "Nirupam is a life sciences graduate with a Coffee Board of India diploma and Q Grader status for both Arabica and Robusta. He previously led operations at a gourmet roaster and teaches at the Bengaluru campus.",
    philosophy: null,
    image: null,
    sameAs: ["https://espressoacademy.it/en/our-authorized-trainers/"],
  },
];

const tbcInstance = (courseSlug: string): CourseInstance => ({ id: `${courseSlug}-tbc`, startDate: null, endDate: null, schedule: null, seatsAvailable: null, status: "tbc", paymentPageUrl: null });

const courseFaqCommon = (name: string): { q: string; a: string }[] => [
  { q: `Do I need experience before ${name}?`, a: "Prerequisites are listed above. If the field says TBC, message us on WhatsApp with your background and we will tell you plainly whether this is the right starting point." },
  { q: "Is the certificate included in the fee?", a: "Fees and what they include are confirmed by the academy at enrolment. Where a certification body charges a separate fee, we say so before you pay." },
  { q: "Where are classes held?", a: "At the Bengaluru campus, Microexcel Plaza, 80 Feet Road, RMV 2nd Stage, near Ramaiah Hospital." },
];

export const courses: Course[] = [
  {
    slug: "italian-barista-certificate-junior",
    title: "Italian Barista Certificate, Junior",
    skillArea: "barista-skills", level: "junior", levelLabel: "IBC Junior",
    certification: "italian-barista-certificate", certificateAwardedLabel: "Italian Barista Certificate (Junior), issued by Espresso Academy, Florence",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Learn espresso and milk fundamentals the Florence way and earn the Italian Barista Certificate at Junior level.",
    forWhom: ["Career changers who want a barista job", "Beginners with no machine experience", "Cafe staff who need a structured foundation"],
    notForWhom: ["Working baristas who already pull consistent shots (see IBC Advanced)", "Home enthusiasts who want a one-day experience (see workshops when announced)"],
    modules: null, includes: null, prerequisites: null, trainers: [], nextInLadder: "italian-barista-certificate-advanced",
    faq: courseFaqCommon("IBC Junior"), instances: [tbcInstance("italian-barista-certificate-junior")], heroImage: null,
    heroAlt: "Student learning espresso extraction at Espresso Academy India, Bengaluru", priority: 1,
  },
  {
    slug: "italian-barista-certificate-advanced",
    title: "Italian Barista Certificate, Advanced",
    skillArea: "barista-skills", level: "advanced", levelLabel: "IBC Advanced",
    certification: "italian-barista-certificate", certificateAwardedLabel: "Italian Barista Certificate (Advanced), issued by Espresso Academy, Florence",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Refine extraction, milk texture and workflow to professional standard and earn the IBC at Advanced level.",
    forWhom: ["Working baristas", "IBC Junior graduates", "Cafe owners who want to set the standard for their team"],
    notForWhom: ["Complete beginners (start with IBC Junior)"],
    modules: null, includes: null, prerequisites: "IBC Junior or equivalent experience (to be confirmed by the academy)", trainers: [], nextInLadder: null,
    faq: courseFaqCommon("IBC Advanced"), instances: [tbcInstance("italian-barista-certificate-advanced")], heroImage: null,
    heroAlt: "Advanced barista training on a professional espresso machine, Bengaluru", priority: 2,
  },
  {
    slug: "sca-barista-skills-foundation",
    title: "Barista Skills, Foundation",
    skillArea: "barista-skills", level: "foundation", levelLabel: "Foundation",
    certification: "sca-coffee-skills-program", certificateAwardedLabel: "Training aligned to the SCA Coffee Skills Program, Barista Skills Foundation",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Build the core barista skills of the SCA Coffee Skills Program: grinding, dosing, extraction, milk and workflow.",
    forWhom: ["Aspiring baristas who want the SCA pathway", "Cafe staff being upskilled", "Enthusiasts serious about espresso"],
    notForWhom: ["Baristas with two or more years on a machine (see Intermediate)"],
    modules: null, includes: null, prerequisites: "None", trainers: [], nextInLadder: "sca-barista-skills-intermediate",
    faq: courseFaqCommon("Barista Skills Foundation"), instances: [tbcInstance("sca-barista-skills-foundation")], heroImage: null,
    heroAlt: "Barista Skills Foundation class at Espresso Academy India", priority: 3,
  },
  {
    slug: "sca-barista-skills-intermediate",
    title: "Barista Skills, Intermediate",
    skillArea: "barista-skills", level: "intermediate", levelLabel: "Intermediate",
    certification: "sca-coffee-skills-program", certificateAwardedLabel: "Training aligned to the SCA Coffee Skills Program, Barista Skills Intermediate",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Dial in with intent: extraction theory, sensory evaluation of espresso, milk science and bar efficiency.",
    forWhom: ["Working baristas", "Foundation graduates", "Cafe owners and head baristas"],
    notForWhom: ["Beginners (start with Foundation)"],
    modules: null, includes: null, prerequisites: "Foundation or equivalent experience (to be confirmed by the academy)", trainers: [], nextInLadder: "sca-barista-skills-professional",
    faq: courseFaqCommon("Barista Skills Intermediate"), instances: [tbcInstance("sca-barista-skills-intermediate")], heroImage: null,
    heroAlt: "Intermediate barista skills training, espresso dialling in", priority: 4,
  },
  {
    slug: "sca-barista-skills-professional",
    title: "Barista Skills, Professional",
    skillArea: "barista-skills", level: "professional", levelLabel: "Professional",
    certification: "sca-coffee-skills-program", certificateAwardedLabel: "Training aligned to the SCA Coffee Skills Program, Barista Skills Professional",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Master advanced extraction, competition-level milk and bar management for head barista and trainer roles.",
    forWhom: ["Head baristas and trainers", "Intermediate graduates", "Competitors"],
    notForWhom: ["Anyone without Intermediate-level skills"],
    modules: null, includes: null, prerequisites: "Intermediate (to be confirmed by the academy)", trainers: [], nextInLadder: null,
    faq: courseFaqCommon("Barista Skills Professional"), instances: [tbcInstance("sca-barista-skills-professional")], heroImage: null,
    heroAlt: "Professional-level barista training, Bengaluru", priority: 5,
  },
  {
    slug: "latte-art",
    title: "Latte Art",
    skillArea: "latte-art", level: "open", levelLabel: "All levels",
    certification: null, certificateAwardedLabel: null,
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Steam, pour and control: from a clean heart to rosettas and tulips, with the milk science behind them.",
    forWhom: ["Baristas who want consistent pours", "Enthusiasts with a home machine", "Cafe teams before a menu launch"],
    notForWhom: ["People who have never used a steam wand and want a full barista foundation first"],
    modules: null, includes: null, prerequisites: null, trainers: [], nextInLadder: null,
    faq: courseFaqCommon("Latte Art"), instances: [tbcInstance("latte-art")], heroImage: null,
    heroAlt: "Latte art pour at Espresso Academy India", priority: 6,
  },
  {
    slug: "brewing",
    title: "Brewing",
    skillArea: "brewing", level: "open", levelLabel: "All levels",
    certification: "sca-coffee-skills-program", certificateAwardedLabel: "Training aligned to the SCA Coffee Skills Program, Brewing",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Understand extraction, ratios, grind and water across pour-over, immersion and batch brewing.",
    forWhom: ["Cafe teams adding a manual brew bar", "Home brewers", "Roasters and cafe owners"],
    notForWhom: ["People looking only for espresso skills (see Barista Skills)"],
    modules: null, includes: null, prerequisites: "None", trainers: [], nextInLadder: null,
    faq: courseFaqCommon("Brewing"), instances: [tbcInstance("brewing")], heroImage: null,
    heroAlt: "Manual brewing class with pour-over equipment", priority: 7,
  },
  {
    slug: "roasting-and-cupping",
    title: "Roasting and Cupping",
    skillArea: "roasting-cupping", level: "open", levelLabel: "All levels",
    certification: "sca-coffee-skills-program", certificateAwardedLabel: "Training aligned to the SCA Coffee Skills Program, Roasting and Sensory Skills",
    format: null, durationDays: null, durationHours: null, feeInclGst: null, emiAvailable: null, seatsMax: null,
    outcome: "Roast profiles, defects and cupping protocol, taught by faculty with Q Grader and Q Processing credentials.",
    forWhom: ["Aspiring roasters", "Cafe owners sourcing coffee", "Planters and estate teams"],
    notForWhom: ["Beginners who want to make better espresso first"],
    modules: null, includes: null, prerequisites: null, trainers: ["nirupam-ranjan", "sowmya-r"], nextInLadder: null,
    faq: courseFaqCommon("Roasting and Cupping"), instances: [tbcInstance("roasting-and-cupping")], heroImage: null,
    heroAlt: "Cupping session with roasted coffee samples", priority: 8,
  },
];

export const faqs: FaqItem[] = [
  { category: "courses", q: "Which course should I start with?", a: "If you have never worked a machine, start with IBC Junior or Barista Skills Foundation. If you already pull shots daily, start at Intermediate or IBC Advanced. Message us on WhatsApp with your background and we will point you to the right one.", link: { label: "See all courses", href: "/courses" } },
  { category: "certification", q: "What is the Italian Barista Certificate?", a: "The IBC is issued in Italy by Espresso Academy, Florence, and sent to authorised partner schools. Espresso Academy India offers it at Junior and Advanced levels.", link: { label: "About the IBC", href: "/certifications/italian-barista-certificate" } },
  { category: "certification", q: "Are your courses SCA certified?", a: "Our training is aligned to the SCA Coffee Skills Program across five modules at Foundation, Intermediate and Professional levels. Whether a batch is assessed for SCA certification, and the SCA fee involved, is confirmed at enrolment.", link: { label: "About the SCA program", href: "/certifications/sca-coffee-skills-program" } },
  { category: "fees", q: "How much do the courses cost?", a: "Fees are confirmed by the academy for each batch and stated incl. GST before you pay. Message us on WhatsApp for the current fee sheet." },
  { category: "schedule", q: "When is the next batch?", a: "Batch dates are announced on each course page and on the calendar. Join the batch alert on any course to be told first." },
  { category: "campus", q: "Where is the academy?", a: "Microexcel Plaza, 80 Feet Road, RMV 2nd Stage, near Ramaiah Hospital, Bengaluru 560094.", link: { label: "Directions", href: "/contact" } },
  { category: "careers", q: "Will a certificate get me a job?", a: "A certificate helps you get an interview; your skills get you the job. Our courses are built around machine time and assessment for that reason." },
  { category: "courses", q: "Do you train cafe teams?", a: "Ask us. Message the academy on WhatsApp with your cafe, team size and goal and we will reply with options." },
];

export const stories: Story[] = []; // stays empty until real, permitted stories arrive

export const levelBadge: Record<Level, { label: string; className: string }> = {
  foundation: { label: "Foundation", className: "bg-mustard text-black" },
  intermediate: { label: "Intermediate", className: "bg-blue text-white" },
  professional: { label: "Professional", className: "bg-purple text-white" },
  junior: { label: "IBC Junior", className: "bg-mustard text-black" },
  advanced: { label: "IBC Advanced", className: "bg-blue text-white" },
  open: { label: "All levels", className: "bg-white-2 text-black" },
};
