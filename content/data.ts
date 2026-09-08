/**
 * Espresso Academy India: typed content.
 * Every field that the client has not confirmed is null and renders as a TBC state.
 * Shape maps 1:1 to the Sanity schema (course, courseInstance, certification, trainer, story,
 * faqItem, redirect, siteSettings).
 * Facts here must trace to content/facts.md. Do not add values without a source.
 *
 * Revision 2 (facts.md, 8 September 2026) cut the catalogue from eight courses to three. Latte
 * Art, Brewing, Roasting and Cupping are days inside the IBC rather than courses, and the three
 * Barista Skills courses are not offered at all: the client's document describes the SCA as a
 * standards body and lists no SCA course, fee or date. Their URLs are redirected below.
 */

export type Level = "basic" | "advanced";
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
  seatsMax: number | null;
  status: "open" | "waitlist" | "soldout" | "tbc";
}

/**
 * One day of a course.
 *
 * The client gives the syllabus as one module per day, and the day is the unit a reader is sold:
 * "latte art" is day 4 of the IBC, not a course. It is also the unit the redirects land on, so
 * each day renders with `id="day-<number>"` on the course page and the old /courses/latte-art URL
 * points at it.
 */
export interface CourseDay {
  number: number;
  title: string;
  topics: string[];
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
  schedule: string | null;   // "10 am to 5 pm", from the client's brochure
  /**
   * The fee the client quotes, before GST, in whole rupees.
   *
   * Ex-GST because that is how the client quotes it and because the GST rate is not confirmed:
   * storing a tax-inclusive figure would mean storing a rate nobody has given us. 18% is the usual
   * rate on commercial training and facts.md says so, but it says so as an assumption, which is
   * exactly why it is not in this file.
   */
  feeExGst: number | null;
  /** What the fee is before the offer, ex-GST. Struck through beside the fee. */
  listPriceExGst: number | null;
  /** Why the fee is below the list price, e.g. "25% off, 55th batch offer". */
  offerLabel: string | null;
  /** Per cent, e.g. 18. Null means no incl-GST total may be printed anywhere. */
  gstRate: number | null;
  emiAvailable: boolean | null;
  seatsMax: number | null;
  outcome: string;           // one sentence, outcome-led, no claims beyond facts
  forWhom: string[];
  notForWhom: string[];
  days: CourseDay[] | null;  // TBC renders the "syllabus being finalised" panel
  includes: string[] | null;
  prerequisites: string | null;
  trainers: string[];        // trainer slugs; empty until client assigns
  nextInLadder: string | null;
  faq: { q: string; a: string; link?: { label: string; href: string } }[];
  instances: CourseInstance[];
  heroImage: string | null;  // public/images/courses/<slug>.jpg
  heroAlt: string;
  priority: number;          // ordering on hub
}

export interface FaqItem { q: string; a: string; category: "courses" | "fees" | "certification" | "schedule" | "campus" | "careers"; link?: { label: string; href: string } }

export interface Story { id: string; name: string; course: string; outcome: string; quote: string; image: string | null; permission: boolean }

/** A retired URL and where it goes now. Seeded into Sanity; next.config.ts reads them at build. */
export interface Redirect { from: string; to: string; statusCode: 301 | 302 | 307 | 308 }

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
    /* facts.md, Organisation: the certificate line is the client's own wording, and the reach
       claim is attributed to the issuer rather than made on our own behalf. */
    summary: "The Italian Barista Certificate is issued in Italy by Espresso Academy, Florence, and sent to its authorised partner schools. Espresso Academy India teaches under the supervision of Espresso Academy Florence, which has over 30 branches worldwide. The certificate is awarded at Basic Barista, Advanced Barista and Advanced Roasting.",
    levels: ["Basic Barista", "Advanced Barista", "Advanced Roasting"],
    recognitionNote: "A certificate helps you get an interview; your skills get you the job. Ask us which employers recognise the IBC in your city and we will answer plainly.",
    status: "confirmed",
  },
  {
    slug: "sca-coffee-skills-program",
    name: "SCA Coffee Skills Program",
    shortName: "SCA",
    issuer: "Specialty Coffee Association",
    /* facts.md, SCA: the client's document describes the standards body and its exams. It lists
       no SCA course, fee or date the academy offers, so neither does this. */
    summary: "The Specialty Coffee Association sets standards for the coffee trade and examines them in five areas: Introduction to Coffee, Green Coffee, Sensory Skills, Roasting, and Barista Skills and Brewing. Each runs at Foundation, Intermediate and Professional level. The academy does not currently run an SCA course of its own, and this page is here so you can tell the two certificates apart before you choose.",
    levels: ["Foundation", "Intermediate", "Professional"],
    recognitionNote: "SCA certification is issued by the SCA, not by a school, on an assessed module taught by an authorised trainer and usually for a separate SCA fee. The academy has an SCA Authorised Trainer on faculty, and assessed modules run on batches the academy confirms. No SCA course, fee or date is published here.",
    status: "wording-pending",
  },
];

export const trainers: Trainer[] = [
  {
    slug: "nageswara-rao-k",
    name: "Nageswara Rao K",
    role: null,
    credentials: [
      { name: "Post Graduate Diploma in Coffee Quality Management", issuer: "Coffee Board of India" },
      { name: "Q Grader", issuer: "Coffee Quality Institute" },
      { name: "SCA certified Sensory Professional", issuer: "Specialty Coffee Association" },
      /* facts.md, Trainers: the client wrote "authorised IBM trainer", almost certainly IBC.
         TODO(client): confirm before this line is published as anything more specific. */
      { name: "Authorised trainer", issuer: null },
    ],
    bio: "Nagesh is a postgraduate in agriculture with a Post Graduate Diploma in Coffee Quality Management from the Coffee Board of India. He is a certified Q Grader and an SCA certified Sensory Professional, an experienced roaster, and sits on the judging panel for national coffee competitions. He teaches at the Bengaluru campus.",
    philosophy: null,
    image: null,
    sameAs: [],
  },
  {
    slug: "akanksha-gupta",
    name: "Akanksha Gupta",
    role: null,
    credentials: [
      { name: "Diploma, Coffee Board of India", issuer: "Coffee Board of India" },
      /* facts.md, Trainers: the SCA public trainer directory lists her as an SCA Trainer (AST),
         Karnataka, checked 5 Sept 2026. The modules are the directory's own list. */
      { name: "SCA Authorised Trainer (AST)", issuer: "Specialty Coffee Association" },
      { name: "SCA certified: Sensory Skills, Barista Skills, Roasting", issuer: "Specialty Coffee Association" },
      { name: "Coffee competition judge", issuer: null },
    ],
    bio: "Akanksha is a biotechnology graduate with a Coffee Board of India diploma and SCA certifications in sensory, barista and roasting modules. She is listed in the SCA trainer directory as an Authorised Trainer for Introduction to Coffee, Barista Skills, Brewing, Sensory Skills, Roasting, CVA for Cuppers and Q Grader. She judges coffee competitions and teaches at the Bengaluru campus.",
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

/* The batches the client listed, seeded so a fresh dataset renders the real calendar. Dates are
   ISO; the site renders them in Asia/Kolkata. */
const batch = (
  courseSlug: string,
  startDate: string,
  endDate: string,
  seatsMax: number,
): CourseInstance => ({
  id: `${courseSlug}-${startDate}`,
  startDate,
  endDate,
  schedule: "10 am to 5 pm",
  seatsMax,
  status: "open",
});

const courseFaqCommon = (name: string): { q: string; a: string; link?: { label: string; href: string } }[] => [
  { q: `Do I need experience before ${name}?`, a: "Prerequisites are listed above. If the field says TBC, message us on WhatsApp with your background and we will tell you plainly whether this is the right starting point.", link: { label: "See every course and level", href: "/courses" } },
  { q: "Is the certificate included in the fee?", a: "Yes. The certificate is part of the course, and there is no separate certification fee to pay.", link: { label: "What the certificate is", href: "/certifications/italian-barista-certificate" } },
  { q: "How do I hold a seat?", a: "An advance of ₹5,000 confirms your seat. The balance is paid at the academy before the first day. Seats are capped per batch, so the advance is what reserves one.", link: { label: "Refund and reschedule policy", href: "/refund-policy" } },
  { q: "Where are classes held?", a: "At the Bengaluru campus, Plot No. 9, Microexcel Plaza, 72, 80 Feet Road, RMV 2nd Stage, near Ramaiah Hospital.", link: { label: "Directions to the campus", href: "/contact" } },
];

export const courses: Course[] = [
  {
    slug: "italian-barista-course-basic",
    title: "Italian Barista Course (IBC), Basic",
    skillArea: "barista-skills", level: "basic", levelLabel: "IBC Basic",
    certification: "italian-barista-certificate",
    /* facts.md line 26: the wording on the diploma itself. */
    certificateAwardedLabel: "Italian Barista Certificate, Basic Barista",
    format: "in-person", durationDays: 4, durationHours: null, schedule: "10 am to 5 pm",
    /* facts.md line 32: ₹35,600 + GST list price, 25% off "as it's the 55th batch", ₹26,700 + GST.
       The GST rate is not stated, so gstRate stays null and the site prints no incl-GST total.
       TODO(client): confirm the GST rate, and which batches the offer covers and until when. */
    feeExGst: 26700, listPriceExGst: 35600, offerLabel: "25% off, 55th batch offer", gstRate: null,
    emiAvailable: null, seatsMax: 8,
    outcome: "Four days, one module a day, from green coffee and roasting through brewing and espresso to latte art, ending in the Italian Barista Certificate at Basic Barista.",
    forWhom: [
      "Career changers who want a barista job",
      "Beginners who have never used an espresso machine",
      "Cafe staff who need the whole picture rather than one skill",
      "Cafe owners who want to know what their team should know",
    ],
    notForWhom: [
      "Working baristas who already pull consistent shots (see IBC Advanced Barista)",
      "Anyone who only wants to roast (see IBC Advanced Roasting)",
      "Anyone who cannot give four consecutive days, 10 am to 5 pm",
    ],
    days: [
      {
        number: 1,
        title: "Roasting and Cupping",
        topics: [
          "The history of coffee",
          "Green coffee, its role and its value",
          "Physical evaluation of the green bean",
          "Choosing roasting equipment",
          "Hands-on roasting on a Bullet roaster",
          "The roasting stages: drying, Maillard, development",
          "Introduction to sensory analysis",
          "Cupping",
        ],
      },
      {
        number: 2,
        title: "Brewing Techniques",
        topics: [
          "Brewing history and how it evolved",
          "The brew ratio guide",
          "The SCA brewing chart",
          "Brewing fundamentals",
          "How water quality changes the taste",
          "Hands-on manual brewing: pour over, AeroPress, French press, moka pot, syphon",
        ],
      },
      {
        number: 3,
        title: "Basic Barista Training",
        topics: [
          "The coffee plant: anatomy, cherry structure, Arabica and Robusta",
          "Where coffee grows",
          "Harvesting and processing",
          "Italian coffee bar culture",
          "How espresso machines evolved",
          "The key parts of an espresso machine",
          "Handling and maintenance",
          "The Basic Barista Exam (IBC), 8 minutes",
        ],
      },
      {
        number: 4,
        title: "Latte Art",
        topics: [
          "Steaming milk",
          "Pouring technique",
          "Latte art patterns",
          "Practice on the heart and the tulip",
        ],
      },
    ],
    includes: ["Certification"],
    prerequisites: "None. The course starts from the coffee plant and assumes no machine experience.",
    trainers: [], nextInLadder: "ibc-advanced-barista",
    faq: courseFaqCommon("the IBC Basic"),
    instances: [
      batch("italian-barista-course-basic", "2026-09-10", "2026-09-13", 8),
      batch("italian-barista-course-basic", "2026-09-24", "2026-09-27", 8),
      batch("italian-barista-course-basic", "2026-10-08", "2026-10-11", 8),
    ],
    heroImage: null,
    heroAlt: "Student learning espresso extraction at Espresso Academy India, Bengaluru", priority: 1,
  },
  {
    slug: "ibc-advanced-barista",
    title: "IBC Advanced Barista",
    skillArea: "barista-skills", level: "advanced", levelLabel: "IBC Advanced Barista",
    certification: "italian-barista-certificate",
    certificateAwardedLabel: "Italian Barista Certificate, Advanced Barista",
    format: "in-person", durationDays: 2, durationHours: null, schedule: null,
    /* TODO(client): facts.md line 42 gives no fee for either Advanced course. */
    feeExGst: null, listPriceExGst: null, offerLabel: null, gstRate: null,
    emiAvailable: null, seatsMax: 4,
    outcome: "Two days on varietals, extraction and speed for people already working a bar, ending in the Italian Barista Certificate at Advanced Barista.",
    forWhom: [
      "Working baristas who want the next certificate",
      "IBC Basic graduates",
      "Head baristas setting the standard for a team",
    ],
    notForWhom: [
      "Complete beginners (start with the IBC Basic)",
      "Anyone who wants the roasting side (see IBC Advanced Roasting)",
    ],
    days: [
      {
        number: 1,
        title: "Coffee, roast and machine",
        topics: [
          "Coffee varietals",
          "Plantation and processing",
          "Roasting and blending",
          "Water and coffee",
          "Espresso machines",
        ],
      },
      {
        number: 2,
        title: "Extraction, recipes and speed",
        topics: [
          "Espresso tasting",
          "The Italian espresso recipe",
          "Coffee recipes",
          "Latte art",
          "Plant-based milk",
          "Barista skills and speed test",
        ],
      },
    ],
    includes: ["Certification"],
    /* facts.md line 42: prerequisites are TBC. IBC Basic or equivalent is the sensible default and
       is written as a suggestion rather than a rule until the academy confirms it.
       TODO(client): confirm the prerequisite for IBC Advanced Barista. */
    prerequisites: "To be confirmed by the academy. The IBC Basic, or equivalent time on a bar, is the sensible starting point. Ask before you book and you will get a straight answer.",
    trainers: [], nextInLadder: null,
    faq: courseFaqCommon("the IBC Advanced Barista"),
    instances: [],
    heroImage: null,
    heroAlt: "Advanced barista training on a professional espresso machine, Bengaluru", priority: 2,
  },
  {
    slug: "ibc-advanced-roasting",
    title: "IBC Advanced Roasting",
    skillArea: "roasting-cupping", level: "advanced", levelLabel: "IBC Advanced Roasting",
    certification: "italian-barista-certificate",
    certificateAwardedLabel: "Italian Barista Certificate, Advanced Roasting",
    format: "in-person", durationDays: 2, durationHours: null, schedule: null,
    /* TODO(client): facts.md line 49 gives no fee for either Advanced course. */
    feeExGst: null, listPriceExGst: null, offerLabel: null, gstRate: null,
    emiAvailable: null, seatsMax: 4,
    outcome: "Two days on roast curves, defects and cupping for people who already roast, ending in the Italian Barista Certificate at Advanced Roasting.",
    forWhom: [
      "Roasters who want to control a curve rather than follow one",
      "Cafe owners roasting their own coffee",
      "Planters and estate teams",
    ],
    notForWhom: [
      "Anyone who has never roasted (day 1 of the IBC Basic is the place to start)",
      "Anyone looking for espresso and milk skills (see IBC Advanced Barista)",
    ],
    days: [
      {
        number: 1,
        title: "Curves and measurement",
        topics: [
          "Roasting theory and curve fundamentals",
          "Roasting software and technology",
          "Measurement and colour analysis",
          "Green coffee and roast adjustments",
        ],
      },
      {
        number: 2,
        title: "Control and defects",
        topics: [
          "Advanced roast control and parameters",
          "Recognising defects and troubleshooting them",
          "Sensory evaluation, cupping",
        ],
      },
    ],
    includes: ["Certification"],
    /* TODO(client): confirm the prerequisite for IBC Advanced Roasting. */
    prerequisites: "To be confirmed by the academy. Roasting experience is assumed. Ask before you book and you will get a straight answer.",
    trainers: [], nextInLadder: null,
    faq: courseFaqCommon("the IBC Advanced Roasting"),
    instances: [batch("ibc-advanced-roasting", "2026-09-15", "2026-09-16", 4)],
    heroImage: null,
    heroAlt: "Cupping session with roasted coffee samples", priority: 3,
  },
];

/**
 * Retired URLs.
 *
 * Latte Art, Brewing and Roasting and Cupping stopped being courses and became days inside the
 * IBC, so each one points at the day that teaches it rather than at the hub: someone who searched
 * for a latte art course should land on the latte art day, not on a list.
 *
 * The three Barista Skills URLs all land on day 3, the only barista training the academy runs.
 * There is no intermediate or professional equivalent to send them to, and pointing them at a
 * course that does not exist would be worse than pointing them at the one that does.
 */
const IBC_BASIC = "/courses/italian-barista-course-basic";

export const redirects: Redirect[] = [
  { from: "/courses/roasting-and-cupping", to: `${IBC_BASIC}#day-1`, statusCode: 301 },
  { from: "/courses/brewing", to: `${IBC_BASIC}#day-2`, statusCode: 301 },
  { from: "/courses/sca-barista-skills-foundation", to: `${IBC_BASIC}#day-3`, statusCode: 301 },
  { from: "/courses/sca-barista-skills-intermediate", to: `${IBC_BASIC}#day-3`, statusCode: 301 },
  { from: "/courses/sca-barista-skills-professional", to: `${IBC_BASIC}#day-3`, statusCode: 301 },
  { from: "/courses/latte-art", to: `${IBC_BASIC}#day-4`, statusCode: 301 },
  { from: "/courses/italian-barista-certificate-junior", to: IBC_BASIC, statusCode: 301 },
  { from: "/courses/italian-barista-certificate-advanced", to: "/courses/ibc-advanced-barista", statusCode: 301 },
];

export const faqs: FaqItem[] = [
  { category: "courses", q: "Which course should I start with?", a: "If you have never worked a machine, start with the IBC Basic. It runs four days and covers roasting, brewing, espresso and latte art, one a day. If you already pull shots daily, look at IBC Advanced Barista; if you already roast, look at IBC Advanced Roasting.", link: { label: "See all three courses", href: "/courses" } },
  { category: "courses", q: "Do you teach latte art or brewing on their own?", a: "Not as separate courses. Latte art is day 4 of the IBC Basic and brewing is day 2, and you take the whole four days rather than one of them.", link: { label: "See the four days", href: "/courses/italian-barista-course-basic" } },
  { category: "certification", q: "What is the Italian Barista Certificate?", a: "The IBC is issued in Italy by Espresso Academy, Florence, and sent to authorised partner schools. Espresso Academy India teaches under the supervision of Espresso Academy Florence and awards it at Basic Barista, Advanced Barista and Advanced Roasting.", link: { label: "About the IBC", href: "/certifications/italian-barista-certificate" } },
  { category: "certification", q: "Are your courses SCA certified?", a: "No. The academy runs the Italian Barista Course, not an SCA course. There is an SCA Authorised Trainer on faculty, and assessed SCA modules run on batches the academy confirms, but no SCA course, fee or date is published here. Ask if you want the SCA route specifically.", link: { label: "How the two compare", href: "/certifications" } },
  { category: "fees", q: "What does the course cost?", a: "The IBC Basic is ₹26,700 + GST, down from ₹35,600 + GST for the 55th batch. The GST rate is being confirmed, so no tax-inclusive total is printed anywhere on this site yet. No fee is published for either Advanced course; ask and the academy will quote for the batch.", link: { label: "See the fee", href: "/courses/italian-barista-course-basic" } },
  { category: "fees", q: "How much do I pay to hold a seat?", a: "₹5,000. That advance confirms your seat, and the balance is paid at the academy before the first day. Batches are capped at 8 seats for the IBC Basic and 4 for the Advanced courses.", link: { label: "Refund and reschedule policy", href: "/refund-policy" } },
  { category: "schedule", q: "When is the next batch?", a: "Batch dates are on each course page and on the calendar. A batch drops off the calendar once it has started.", link: { label: "See the batch calendar", href: "/calendar" } },
  { category: "campus", q: "Where is the academy?", a: "Plot No. 9, Microexcel Plaza, 72, 80 Feet Road, RMV 2nd Stage, near Ramaiah Hospital, Bengaluru 560094.", link: { label: "Directions", href: "/contact" } },
  { category: "careers", q: "Will a certificate get me a job?", a: "A certificate helps you get an interview; your skills get you the job. The IBC Basic is four days of machine time and ends in an assessed exam for that reason.", link: { label: "What the certificate is worth", href: "/certifications" } },
  { category: "courses", q: "Do you train cafe teams?", a: "Ask us. Message the academy on WhatsApp with your cafe, team size and goal and we will reply with options.", link: { label: "Ask about team training", href: "/contact?topic=cafe" } },
];

export const stories: Story[] = []; // stays empty until real, permitted stories arrive

export const levelBadge: Record<Level, { label: string; className: string }> = {
  basic: { label: "IBC Basic", className: "bg-mustard text-black" },
  advanced: { label: "IBC Advanced", className: "bg-blue text-white" },
};
