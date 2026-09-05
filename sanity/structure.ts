/**
 * The Studio's left-hand list.
 *
 * The default "one list per type" structure is fine for a schema of four types and useless for
 * one of fourteen. This is built around the two questions the academy actually opens the Studio to
 * answer: what is running when, and who has paid for it.
 */
import type { StructureResolver } from "sanity/structure";
/**
 * @sanity/icons v5 exports only `Icon` and the `icons` record from its root; each icon has its
 * own subpath entry point. Importing them one by one is also what keeps the Studio bundle from
 * pulling the whole set in.
 */
import { BookIcon } from "@sanity/icons/Book";
import { CalendarIcon } from "@sanity/icons/Calendar";
import { CaseIcon } from "@sanity/icons/Case";
import { CogIcon } from "@sanity/icons/Cog";
import { CreditCardIcon } from "@sanity/icons/CreditCard";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { DocumentsIcon } from "@sanity/icons/Documents";
import { EarthAmericasIcon } from "@sanity/icons/EarthAmericas";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { PinIcon } from "@sanity/icons/Pin";
import { RocketIcon } from "@sanity/icons/Rocket";
import { StarIcon } from "@sanity/icons/Star";
import { UsersIcon } from "@sanity/icons/Users";

const SINGLETON = "siteSettings";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Espresso Academy India")
    .items([
      S.listItem()
        .title("Courses")
        .icon(BookIcon)
        .child(S.documentTypeList("course").title("Courses").defaultOrdering([{ field: "priority", direction: "asc" }])),

      S.listItem()
        .title("Batches")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Batches")
            .items([
              S.listItem()
                .title("All batches, soonest first")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("courseInstance")
                    .title("All batches")
                    .defaultOrdering([{ field: "startDate", direction: "asc" }]),
                ),
              S.listItem()
                .title("By month")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("courseInstance")
                    .title("By month")
                    .defaultOrdering([{ field: "startDate", direction: "asc" }])
                    .filter('_type == "courseInstance" && defined(startDate)'),
                ),
              S.listItem()
                .title("Dates not set")
                .icon(CalendarIcon)
                .child(
                  S.documentList()
                    .title("Dates not set")
                    .filter('_type == "courseInstance" && !defined(startDate)'),
                ),
              S.divider(),
              S.listItem()
                .title("Rosters")
                .icon(UsersIcon)
                .child(
                  S.documentTypeList("courseInstance")
                    .title("Pick a batch")
                    .defaultOrdering([{ field: "startDate", direction: "asc" }])
                    .child((instanceId) =>
                      S.list()
                        .title("Batch roster")
                        .items([
                          S.listItem()
                            .title("Paid bookings")
                            .icon(CreditCardIcon)
                            .child(
                              S.documentList()
                                .title("Paid bookings")
                                .schemaType("booking")
                                .filter('_type == "booking" && instance._ref == $instanceId && status == "paid"')
                                .params({ instanceId })
                                .defaultOrdering([{ field: "paidAt", direction: "asc" }]),
                            ),
                          S.listItem()
                            .title("All bookings, any status")
                            .icon(CreditCardIcon)
                            .child(
                              S.documentList()
                                .title("All bookings")
                                .schemaType("booking")
                                .filter('_type == "booking" && instance._ref == $instanceId')
                                .params({ instanceId })
                                .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                            ),
                          S.listItem()
                            .title("Waiting list")
                            .icon(UsersIcon)
                            .child(
                              S.documentList()
                                .title("Waiting list")
                                .schemaType("enquiry")
                                .filter('_type == "enquiry" && instance._ref == $instanceId && type == "waitlist"')
                                .params({ instanceId })
                                .defaultOrdering([{ field: "createdAt", direction: "asc" }]),
                            ),
                          S.divider(),
                          S.listItem()
                            .title("The batch itself")
                            .icon(CalendarIcon)
                            .child(S.document().schemaType("courseInstance").documentId(instanceId)),
                        ]),
                    ),
                ),
            ]),
        ),

      S.listItem()
        .title("Bookings")
        .icon(CreditCardIcon)
        .child(
          S.list()
            .title("Bookings")
            .items([
              S.listItem()
                .title("All, newest first")
                .child(
                  S.documentTypeList("booking")
                    .title("All bookings")
                    .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                ),
              ...(["paid", "created", "failed", "refunded", "cancelled"] as const).map((status) =>
                S.listItem()
                  .id(`booking-${status}`)
                  .title(status[0]!.toUpperCase() + status.slice(1))
                  .child(
                    S.documentList()
                      .title(status)
                      .schemaType("booking")
                      .filter('_type == "booking" && status == $status')
                      .params({ status })
                      .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                  ),
              ),
              S.divider(),
              S.listItem()
                .id("booking-overbooked")
                .title("Needs attention: overbooked")
                .child(
                  S.documentList()
                    .title("Overbooked")
                    .schemaType("booking")
                    .filter('_type == "booking" && overbooked == true')
                    .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                ),
            ]),
        ),

      S.listItem()
        .title("Enquiries")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Enquiries")
            .items([
              S.listItem()
                .title("All, newest first")
                .child(
                  S.documentTypeList("enquiry")
                    .title("All enquiries")
                    .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                ),
              ...(["new", "contacted", "converted", "closed"] as const).map((status) =>
                S.listItem()
                  .id(`enquiry-${status}`)
                  .title(status[0]!.toUpperCase() + status.slice(1))
                  .child(
                    S.documentList()
                      .title(status)
                      .schemaType("enquiry")
                      .filter('_type == "enquiry" && status == $status')
                      .params({ status })
                      .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                  ),
              ),
              S.divider(),
              ...(["student", "waitlist", "cafe"] as const).map((type) =>
                S.listItem()
                  .id(`enquiry-type-${type}`)
                  .title(`Type: ${type}`)
                  .child(
                    S.documentList()
                      .title(type)
                      .schemaType("enquiry")
                      .filter('_type == "enquiry" && type == $type')
                      .params({ type })
                      .defaultOrdering([{ field: "createdAt", direction: "desc" }]),
                  ),
              ),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title("Workshops")
        .icon(StarIcon)
        .child(
          S.documentList()
            .title("Workshops")
            .schemaType("course")
            .filter('_type == "course" && isWorkshop == true')
            .defaultOrdering([{ field: "priority", direction: "asc" }]),
        ),
      S.listItem().title("Certifications").icon(CaseIcon).child(S.documentTypeList("certification")),
      S.listItem().title("Trainers").icon(UsersIcon).child(S.documentTypeList("trainer")),
      S.listItem().title("Stories").icon(StarIcon).child(S.documentTypeList("story")),
      S.listItem()
        .title("Guides")
        .icon(DocumentsIcon)
        .child(
          S.documentTypeList("guide").defaultOrdering([{ field: "publishedAt", direction: "desc" }]),
        ),
      S.listItem().title("FAQs").icon(HelpCircleIcon).child(S.documentTypeList("faqItem")),

      S.divider(),

      S.listItem().title("Pages").icon(DocumentTextIcon).child(S.documentTypeList("page")),
      S.listItem().title("Landing pages").icon(RocketIcon).child(S.documentTypeList("landingPage")),
      S.listItem().title("Venues").icon(PinIcon).child(S.documentTypeList("venue")),
      S.listItem().title("Redirects").icon(EarthAmericasIcon).child(S.documentTypeList("redirect")),

      S.divider(),

      S.listItem()
        .title("Settings")
        .icon(CogIcon)
        .child(S.document().schemaType(SINGLETON).documentId(SINGLETON).title("Settings")),
    ]);
