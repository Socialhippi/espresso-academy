/**
 * Structured data. Everything is emitted as one `@graph` per page so the nodes can reference each
 * other by @id, and every optional node is omitted rather than guessed: no Offer without a fee,
 * no CourseInstance without a date. A schema claim the site cannot make in prose it does not make
 * in JSON-LD either.
 */
import { absoluteUrl, siteUrl } from "@/lib/env";
import { formatDate, isoDate, whatsappNumber } from "@/lib/format";
import {
  getCertification,
  getCourseTrainers,
  siteSettings,
  type Certification,
  type Course,
  type FaqItem,
  type Trainer,
} from "@/lib/content";

type JsonLdNode = Record<string, unknown>;

const ORGANISATION_ID = `${siteUrl}/#organisation`;
const WEBSITE_ID = `${siteUrl}/#website`;
const PLACE_ID = `${siteUrl}/#campus`;

function postalAddress(): JsonLdNode {
  return {
    "@type": "PostalAddress",
    streetAddress: `${siteSettings.address.line1}, ${siteSettings.address.line2}`,
    addressLocality: siteSettings.address.city,
    addressRegion: siteSettings.address.region,
    postalCode: siteSettings.address.postalCode,
    addressCountry: siteSettings.address.country,
  };
}

function sameAs(): string[] {
  return [siteSettings.instagram, siteSettings.florencePartnerPage];
}

/**
 * The site-wide nodes: the academy as an EducationalOrganization, the campus as a LocalBusiness,
 * and the WebSite. Rendered once, in the root layout.
 */
export function organisationGraph(): JsonLdNode[] {
  const organisation: JsonLdNode = {
    "@type": "EducationalOrganization",
    "@id": ORGANISATION_ID,
    name: siteSettings.name,
    url: siteUrl,
    description: `${siteSettings.partnerLine}. Barista and coffee courses in ${siteSettings.address.city}.`,
    foundingDate: String(siteSettings.foundedFlorence),
    address: postalAddress(),
    telephone: siteSettings.phonePrimary,
    sameAs: sameAs(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo/lockup-on-white.png"),
      width: 1000,
      height: 998,
    },
    areaServed: { "@type": "City", name: siteSettings.address.city },
    parentOrganization: {
      "@type": "Organization",
      name: "Espresso Academy",
      url: "https://espressoacademy.it/en/",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Florence",
        addressCountry: "IT",
      },
    },
  };

  // TODO(client): siteSettings.email and siteSettings.hours are null, so no email or
  // openingHoursSpecification is emitted. Adding a guess here would be a fabricated fact.
  const campus: JsonLdNode = {
    "@type": "LocalBusiness",
    "@id": PLACE_ID,
    name: `${siteSettings.name}, ${siteSettings.address.city} campus`,
    url: absoluteUrl("/contact"),
    parentOrganization: { "@id": ORGANISATION_ID },
    address: postalAddress(),
    telephone: siteSettings.phonePrimary,
    sameAs: sameAs(),
    hasMap: siteSettings.address.mapsUrl,
    image: absoluteUrl("/logo/lockup-on-white.png"),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "admissions",
        telephone: siteSettings.phonePrimary,
        areaServed: "IN",
        availableLanguage: ["en", "hi", "kn"],
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        telephone: `+${whatsappNumber()}`,
        contactOption: "TollFree",
        areaServed: "IN",
      },
    ],
  };

  const website: JsonLdNode = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteUrl,
    name: siteSettings.name,
    inLanguage: "en-IN",
    publisher: { "@id": ORGANISATION_ID },
  };

  return [organisation, campus, website];
}

/** Course, with hasCourseInstance only for dated batches and Offer only for confirmed fees. */
export function courseNode(course: Course): JsonLdNode {
  const certification = course.certification ? getCertification(course.certification) : undefined;
  const trainers = getCourseTrainers(course);

  const instances = course.instances
    .filter((instance) => instance.startDate !== null)
    .map((instance) => {
      const node: JsonLdNode = {
        "@type": "CourseInstance",
        courseMode: course.format === "online" ? "Online" : "Onsite",
        startDate: isoDate(instance.startDate),
        name: `${course.title}, ${formatDate(instance.startDate)}`,
        location: { "@id": PLACE_ID },
      };
      if (instance.endDate) node.endDate = isoDate(instance.endDate);
      if (trainers.length > 0) {
        node.instructor = trainers.map((trainer) => ({
          "@type": "Person",
          name: trainer.name,
          url: absoluteUrl(`/trainers/${trainer.slug}`),
        }));
      }
      // Offer only exists when there is a real fee to state.
      if (course.feeInclGst !== null) {
        node.offers = {
          "@type": "Offer",
          price: course.feeInclGst,
          priceCurrency: "INR",
          category: "Fee includes GST",
          availability:
            instance.status === "soldout"
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
          url: absoluteUrl(`/enquire?course=${course.slug}`),
        };
      }
      return node;
    });

  const node: JsonLdNode = {
    "@type": "Course",
    "@id": absoluteUrl(`/courses/${course.slug}#course`),
    name: course.title,
    description: course.outcome,
    url: absoluteUrl(`/courses/${course.slug}`),
    provider: { "@id": ORGANISATION_ID },
    inLanguage: "en-IN",
    educationalLevel: course.levelLabel,
    teaches: course.modules ?? undefined,
    coursePrerequisites: course.prerequisites ?? undefined,
    /* Google requires either hasCourseInstance or offers on a Course. Neither can be stated
       honestly yet, so the course is described without them and gains them the day the client
       sends dates and fees. */
    hasCourseInstance: instances.length > 0 ? instances : undefined,
  };

  if (certification) {
    node.educationalCredentialAwarded = {
      "@type": "EducationalOccupationalCredential",
      name: course.certificateAwardedLabel ?? certification.name,
      credentialCategory: "certificate",
      recognizedBy: { "@type": "Organization", name: certification.issuer },
    };
  }

  return stripUndefined(node);
}

/** Person for a trainer page, with each credential as an EducationalOccupationalCredential. */
export function trainerNode(trainer: Trainer): JsonLdNode {
  return stripUndefined({
    "@type": "Person",
    "@id": absoluteUrl(`/trainers/${trainer.slug}#person`),
    name: trainer.name,
    url: absoluteUrl(`/trainers/${trainer.slug}`),
    description: trainer.bio,
    // TODO(client): trainer.role is null, so no jobTitle is emitted.
    jobTitle: trainer.role ?? undefined,
    worksFor: { "@id": ORGANISATION_ID },
    sameAs: trainer.sameAs.length > 0 ? trainer.sameAs : undefined,
    hasCredential: trainer.credentials.map((credential) =>
      stripUndefined({
        "@type": "EducationalOccupationalCredential",
        name: credential.name,
        credentialCategory: "certification",
        recognizedBy: credential.issuer
          ? { "@type": "Organization", name: credential.issuer }
          : undefined,
      }),
    ),
  });
}

/** FAQPage. Only emit it where the questions are actually visible on the page. */
export function faqNode(items: FaqItem[], pagePath: string): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": absoluteUrl(`${pagePath}#faq`),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** Article for a certification explainer, authored by the academy. */
export function certificationArticleNode(
  certification: Certification,
  path: string,
): JsonLdNode {
  return {
    "@type": "Article",
    "@id": absoluteUrl(`${path}#article`),
    headline: `What is the ${certification.name}?`,
    description: certification.summary,
    url: absoluteUrl(path),
    inLanguage: "en-IN",
    author: { "@id": ORGANISATION_ID },
    publisher: { "@id": ORGANISATION_ID },
    about: {
      "@type": "EducationalOccupationalCredential",
      name: certification.name,
      credentialCategory: "certificate",
      recognizedBy: { "@type": "Organization", name: certification.issuer },
    },
  };
}

/** ItemList for a hub page, so the set of courses is legible as a set. */
export function courseListNode(courses: Course[], path: string): JsonLdNode {
  return {
    "@type": "ItemList",
    "@id": absoluteUrl(`${path}#courses`),
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/courses/${course.slug}`),
      name: course.title,
    })),
  };
}

/** WebPage node tying a page to the site graph. */
export function webPageNode(path: string, name: string, description: string): JsonLdNode {
  return {
    "@type": "WebPage",
    "@id": absoluteUrl(`${path}#webpage`),
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANISATION_ID },
  };
}

/** Wrap nodes into the single @graph the page emits. */
export function graph(nodes: JsonLdNode[]): JsonLdNode {
  return { "@context": "https://schema.org", "@graph": nodes.map(stripUndefined) };
}

/** schema.org readers choke on explicit nulls; drop the key instead. */
function stripUndefined(node: JsonLdNode): JsonLdNode {
  const out: JsonLdNode = {};
  for (const [key, value] of Object.entries(node)) {
    if (value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

export const schemaIds = { ORGANISATION_ID, WEBSITE_ID, PLACE_ID };
