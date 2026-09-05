/** Every type the Studio and the queries know about. */
import type { SchemaTypeDefinition } from "sanity";

import { sharedObjects } from "./objects/shared";
import { portableTextObjects } from "./objects/portableText";
import { sectionObjects } from "./objects/sections";

import { booking } from "./documents/booking";
import { certification } from "./documents/certification";
import { course } from "./documents/course";
import { courseInstance } from "./documents/courseInstance";
import { enquiry } from "./documents/enquiry";
import { faqItem } from "./documents/faqItem";
import { guide } from "./documents/guide";
import { landingPage } from "./documents/landingPage";
import { page } from "./documents/page";
import { redirect } from "./documents/redirect";
import { siteSettings } from "./documents/siteSettings";
import { story } from "./documents/story";
import { trainer } from "./documents/trainer";
import { venue } from "./documents/venue";

export const documentTypes = [
  course,
  courseInstance,
  venue,
  certification,
  trainer,
  story,
  guide,
  faqItem,
  page,
  landingPage,
  siteSettings,
  redirect,
  booking,
  enquiry,
];

export const schemaTypes: SchemaTypeDefinition[] = [
  ...sharedObjects,
  ...portableTextObjects,
  ...sectionObjects,
  ...documentTypes,
];
