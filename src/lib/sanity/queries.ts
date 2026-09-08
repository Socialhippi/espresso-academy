/**
 * Every GROQ query the site runs, in one file.
 *
 * The projections are written to return the shapes `src/lib/content.ts` already exported when the
 * content lived in `content/data.ts`, so the components did not have to change with the data
 * source. Two deliberate details:
 *
 * - `seatsAvailable` is computed here, not stored. A stored copy is a second number that can be
 *   wrong, and it would be wrong in the one place it matters: at checkout.
 * - A batch is fetched through `references(^._id)` rather than an array on the course, so adding a
 *   batch never touches the course document and two editors cannot overwrite each other's work.
 */

const IMAGE = /* groq */ `{
  "alt": alt,
  "asset": asset->{ _id, url, "lqip": metadata.lqip }
}`;

const VENUE = /* groq */ `{
  "id": _id,
  name,
  city,
  mapsUrl,
  address
}`;

const INSTANCE_FIELDS = /* groq */ `
  "id": _id,
  startDate,
  endDate,
  schedule,
  status,
  seatsMax,
  "seatsBooked": coalesce(seatsBooked, 0),
  "seatsAvailable": select(defined(seatsMax) => seatsMax - coalesce(seatsBooked, 0), null),
  priceOverride,
  "venue": venue->${VENUE}
`;

const COURSE_FIELDS = /* groq */ `
  "id": _id,
  "slug": slug.current,
  title,
  skillArea,
  level,
  levelLabel,
  "isWorkshop": coalesce(isWorkshop, false),
  "certification": certification->slug.current,
  certificateAwardedLabel,
  format,
  durationDays,
  durationHours,
  schedule,
  feeInclGst,
  emiAvailable,
  seatsMax,
  outcome,
  forWhom,
  notForWhom,
  days[]{ number, title, topics },
  includes,
  prerequisites,
  "trainers": trainers[]->slug.current,
  "nextInLadder": nextInLadder->slug.current,
  faq[]{ q, a, link },
  "heroImage": heroImage${IMAGE},
  heroAlt,
  priority,
  "instances": *[_type == "courseInstance" && references(^._id)]
    | order(coalesce(startDate, "9999-12-31") asc) { ${INSTANCE_FIELDS} }
`;

export const coursesQuery = /* groq */ `
  *[_type == "course" && defined(slug.current)] | order(priority asc) { ${COURSE_FIELDS} }
`;

export const courseBySlugQuery = /* groq */ `
  *[_type == "course" && slug.current == $slug][0] { ${COURSE_FIELDS} }
`;

export const courseSlugsQuery = /* groq */ `
  *[_type == "course" && defined(slug.current)] | order(priority asc).slug.current
`;

/** A batch with everything the checkout needs, including the fee the server will charge. */
export const instanceByIdQuery = /* groq */ `
  *[_type == "courseInstance" && _id == $id][0] {
    ${INSTANCE_FIELDS},
    "course": course->{ ${COURSE_FIELDS} }
  }
`;

/** Every dated batch, soonest first, for the calendar and the "next batches" strip. */
export const datedInstancesQuery = /* groq */ `
  *[_type == "courseInstance" && defined(startDate) && status != "completed"]
    | order(startDate asc) {
      ${INSTANCE_FIELDS},
      "course": course->{ ${COURSE_FIELDS} }
    }
`;

/** Batch ids, for generateStaticParams on /book/[instanceId]. */
export const bookableInstanceIdsQuery = /* groq */ `
  *[_type == "courseInstance" && status in ["open", "waitlist", "soldout"]]._id
`;

export const trainersQuery = /* groq */ `
  *[_type == "trainer" && defined(slug.current)] | order(name asc) {
    "slug": slug.current,
    name,
    role,
    credentials[]{ name, issuer },
    bio,
    philosophy,
    "image": image${IMAGE},
    sameAs
  }
`;

export const trainerBySlugQuery = /* groq */ `
  *[_type == "trainer" && slug.current == $slug][0] {
    "slug": slug.current,
    name,
    role,
    credentials[]{ name, issuer },
    bio,
    philosophy,
    "image": image${IMAGE},
    sameAs
  }
`;

export const certificationsQuery = /* groq */ `
  *[_type == "certification" && defined(slug.current)] | order(name asc) {
    "slug": slug.current,
    name,
    shortName,
    issuer,
    summary,
    levels,
    recognitionNote,
    status,
    seo
  }
`;

export const faqsQuery = /* groq */ `
  *[_type == "faqItem"] | order(coalesce(order, 99) asc) {
    q,
    a,
    category,
    link
  }
`;

/** Only stories the subject has given written permission to publish. */
export const storiesQuery = /* groq */ `
  *[_type == "story" && permission == true] | order(_createdAt desc) {
    "id": _id,
    name,
    "course": course->title,
    outcome,
    quote,
    "image": image${IMAGE},
    permission
  }
`;

export const siteSettingsQuery = /* groq */ `
  *[_type == "siteSettings"][0] {
    name,
    legalName,
    tagline,
    partnerLine,
    foundedFlorence,
    launchedBengaluru,
    address,
    phonePrimary,
    phoneSecondary,
    whatsappNumber,
    whatsappConfirmed,
    whatsappText,
    email,
    hours,
    replyPromise,
    instagram,
    florencePartnerPage,
    razorpayDisplayName,
    refundPolicy,
    metaPixelIdOverride,
    announcements
  }
`;

const GUIDE_FIELDS = /* groq */ `
  "slug": slug.current,
  title,
  excerpt,
  publishedAt,
  updatedAt,
  "author": author->{ "slug": slug.current, name, role, credentials[]{ name, issuer } },
  "reviewedBy": reviewedBy->{ "slug": slug.current, name, role },
  "primaryCourse": primaryCourse->{ "slug": slug.current, title },
  "primaryCertification": primaryCertification->{ "slug": slug.current, name },
  "heroImage": heroImage${IMAGE},
  seo
`;

export const guidesQuery = /* groq */ `
  *[_type == "guide" && defined(slug.current)] | order(publishedAt desc) { ${GUIDE_FIELDS} }
`;

export const guideBySlugQuery = /* groq */ `
  *[_type == "guide" && slug.current == $slug][0] {
    ${GUIDE_FIELDS},
    body[]{
      ...,
      _type == "brandImage" => { "alt": alt, "asset": asset->{ _id, url, "lqip": metadata.lqip } }
    }
  }
`;

export const guideSlugsQuery = /* groq */ `
  *[_type == "guide" && defined(slug.current)].slug.current
`;

export const pageBySlugQuery = /* groq */ `
  *[_type == "page" && slug.current == $slug][0] {
    "slug": slug.current,
    title,
    intro,
    sections[]{
      ...,
      _type == "heroSection" => { "image": image${IMAGE} }
    },
    seo
  }
`;

export const landingPageBySlugQuery = /* groq */ `
  *[_type == "landingPage" && slug.current == $slug][0] {
    "slug": slug.current,
    title,
    campaign,
    "course": course->{ "slug": slug.current, title, feeInclGst },
    sections[]{
      ...,
      _type == "heroSection" => { "image": image${IMAGE} }
    }
  }
`;

export const landingPageSlugsQuery = /* groq */ `
  *[_type == "landingPage" && defined(slug.current)].slug.current
`;

export const redirectsQuery = /* groq */ `
  *[_type == "redirect" && defined(from) && defined(to)] {
    from,
    to,
    "permanent": coalesce(permanent, true),
    statusCode
  }
`;

/** The status of one booking, for the confirmation page's poll. Never returns anything else. */
export const bookingStatusQuery = /* groq */ `
  *[_type == "booking" && _id == $id][0] { "id": _id, status, paidAt }
`;

/** The whole booking, for the confirmation page. Server-side only: it carries personal data. */
export const bookingByIdQuery = /* groq */ `
  *[_type == "booking" && _id == $id][0] {
    "id": _id,
    name,
    phone,
    email,
    amount,
    currency,
    status,
    razorpayOrderId,
    razorpayPaymentId,
    createdAt,
    paidAt,
    overbooked,
    "course": course->{ "slug": slug.current, title, levelLabel, prerequisites },
    "instance": instance->{ ${INSTANCE_FIELDS} }
  }
`;

/** Used by the webhook to find the booking an order belongs to. */
export const bookingByOrderIdQuery = /* groq */ `
  *[_type == "booking" && razorpayOrderId == $orderId][0] {
    "id": _id,
    status,
    amount,
    name,
    email,
    phone,
    "instanceId": instance._ref,
    "courseTitle": course->title,
    "courseSlug": course->slug.current,
    "instance": instance->{ ${INSTANCE_FIELDS} }
  }
`;
