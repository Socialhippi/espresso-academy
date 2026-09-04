import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button, ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CallButton } from "@/components/site/CallButton";
import { TbcPill, TbcValue } from "@/components/site/TbcPill";
import { LevelBadge } from "@/components/site/LevelBadge";
import { Placeholder } from "@/components/site/Placeholder";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CourseCard } from "@/components/course/CourseCard";
import { SpecStrip } from "@/components/course/SpecStrip";
import { LevelLadder } from "@/components/course/LevelLadder";
import { BatchTable } from "@/components/course/BatchTable";
import { FeeBlock } from "@/components/course/FeeBlock";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { CourseFilters } from "@/components/course/CourseFilters";
import { ProofStrip } from "@/components/sections/ProofStrip";
import { AudienceDoors } from "@/components/sections/AudienceDoors";
import { NextBatches } from "@/components/sections/NextBatches";
import { TrainerGrid } from "@/components/sections/TrainerGrid";
import { StoryGrid } from "@/components/sections/StoryGrid";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { HomeHero, PageHero } from "@/components/sections/Hero";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { Field, FieldError, fieldControlClass, fieldInputClass } from "@/components/forms/Field";
import { Button as ShadcnButton } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCourses,
  getFaqs,
  getLevels,
  getSkillAreas,
  getTrainers,
  type Level,
} from "@/lib/content";
import { formatDate, formatDuration, formatFee, whatsappUrl } from "@/lib/format";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Component gallery",
  robots: { index: false, follow: false, nocache: true },
};

const allLevels: Level[] = [
  "foundation",
  "intermediate",
  "professional",
  "junior",
  "advanced",
  "open",
];

interface SpecimenProps {
  title: string;
  note?: string;
  children: React.ReactNode;
  /** Renders the specimen on the black ground so on-dark variants can be checked. */
  dark?: boolean;
}

function Specimen({ title, note, children, dark = false }: SpecimenProps) {
  return (
    <section className="border-t border-white-2 py-10">
      <h2 className="type-h3 text-black">{title}</h2>
      {note && <p className="mt-2 measure type-small text-grey">{note}</p>}
      <div className={dark ? "mt-6 dark-wash p-6" : "mt-6"}>{children}</div>
    </section>
  );
}

export default function ComponentGalleryPage() {
  const courses = getCourses();
  const trainers = getTrainers();
  const faqs = getFaqs();
  const first = courses[0];
  const courseOptions = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => formatDate(instance.startDate)),
  }));

  return (
    <>
      <PageHero
        eyebrow="Internal"
        title="Component gallery"
        intro="Every component in every state, including the empty, loading, error and TBC states. Not indexed, not linked from the site."
      />

      <Container className="pb-24">
        <Specimen
          title="Buttons"
          note="Primary is 48px on mobile and 44px from md. Hover states are described in code; hold the pointer over each to see them."
        >
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="dark">Dark</Button>
            <Button variant="tertiary" size="inline">
              Tertiary link
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <ButtonLink href="/courses" variant="primary" size="sm">
              Small link button
            </ButtonLink>
          </div>
          <div className="mt-6">
            <Button variant="primary" size="block">
              Block, full width
            </Button>
          </div>
        </Specimen>

        <Specimen title="Buttons on the black ground" dark>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="light">Light</Button>
            <Button variant="secondary-on-dark">Outline</Button>
            <Button variant="tertiary-on-dark" size="inline">
              Underlined link
            </Button>
          </div>
          <p className="mt-4 type-small text-grey-2">
            Red never appears as text here. On the black ground red is a button ground or a 1px
            rule, per the contrast rules in .claude/rules/design.md.
          </p>
        </Specimen>

        <Specimen title="Contact buttons">
          <div className="flex flex-wrap items-center gap-4">
            <WhatsAppButton />
            <WhatsAppButton size="icon" />
            <WhatsAppButton size="sm" course="Barista Skills, Foundation" />
            <CallButton />
            <CallButton size="icon" />
          </div>
          <p className="mt-4 type-small text-grey">
            Pre-filled WhatsApp text: <code className="break-all text-black">{whatsappUrl({ course: "Latte Art" })}</code>
          </p>
        </Specimen>

        <Specimen title="TBC states">
          <div className="flex flex-wrap items-center gap-4">
            <TbcPill />
            <TbcPill label="Dates TBC" />
            <TbcPill label="Fee TBC" />
            <TbcValue value={null} />
            <TbcValue value="A confirmed value" />
          </div>
          <p className="mt-4 type-small text-grey">
            formatFee(null) renders <span className="text-black">{formatFee(null)}</span>;
            formatFee(25300) renders <span className="text-black">{formatFee(25300)}</span>;
            formatDuration(null, null) renders{" "}
            <span className="text-black">{formatDuration(null, null)}</span>.
          </p>
        </Specimen>

        <Specimen title="Level badges" note="The only place mustard, blue and purple appear.">
          <div className="flex flex-wrap items-center gap-3">
            {allLevels.map((level) => (
              <LevelBadge key={level} level={level} />
            ))}
          </div>
        </Specimen>

        <Specimen title="Section heading">
          <SectionHeading
            number="01"
            eyebrow="Courses"
            title="Barista and coffee courses"
            description="A standfirst of the length a real section carries, so the measure can be checked."
            action={
              <ButtonLink href="/courses" variant="tertiary" size="inline">
                See all courses
              </ButtonLink>
            }
          />
        </Specimen>

        <Specimen title="Section heading on the black ground" dark>
          <SectionHeading
            number="02"
            eyebrow="Next step"
            title="On the dark ground"
            description="The eyebrow inverts to white because red text on black fails contrast."
            onDark
          />
        </Specimen>

        <Specimen title="Breadcrumbs">
          <Breadcrumbs
            items={[
              { label: "Courses", href: "/courses" },
              { label: "Barista Skills, Foundation", href: "/courses/sca-barista-skills-foundation" },
            ]}
          />
        </Specimen>

        <Specimen
          title="Photo placeholders"
          note="Rendered until a real file lands in public/images/. Each announces 'Photo placeholder: <slot>' to a screen reader."
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Placeholder slot="hero" aspect="photo" />
            <Placeholder slot="trainer-akanksha-gupta" aspect="portrait" />
            <Placeholder slot="about-campus-1" aspect="wide" tone="dark" />
          </div>
        </Specimen>

        <Specimen
          title="Course card, nothing confirmed"
          note="What the hub shows today. With duration, format, fee and dates all unknown, the card states that once rather than carrying four separate TBC pills."
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </Specimen>

        <Specimen
          title="Course card, values confirmed"
          note="The same component once the academy sends its numbers. The full spec row and the Bebas fee and date numerals return with no code change."
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {first && (
              <CourseCard
                course={{
                  ...first,
                  feeInclGst: 25300,
                  durationDays: 3,
                  format: "in-person",
                  instances: [
                    {
                      id: "demo-card",
                      startDate: "2026-10-12",
                      endDate: "2026-10-14",
                      schedule: "10am to 5pm",
                      seatsAvailable: 6,
                      status: "open",
                      paymentPageUrl: null,
                    },
                  ],
                }}
              />
            )}
            {courses[1] && (
              <CourseCard
                course={{ ...courses[1], feeInclGst: 18500, durationHours: 12, format: "hybrid" }}
              />
            )}
          </div>
        </Specimen>

        {first && (
          <>
            <Specimen title="Spec strip">
              <SpecStrip course={first} />
            </Specimen>

            <Specimen title="Fee block, fee not yet confirmed">
              <FeeBlock course={first} />
            </Specimen>

            <Specimen title="Fee block, fee confirmed">
              <FeeBlock
                course={{
                  ...first,
                  feeInclGst: 25300,
                  emiAvailable: true,
                  includes: ["Machine time", "Coffee", "Certificate"],
                }}
              />
            </Specimen>

            <Specimen
              title="Batch table, empty state"
              note="Every instance in content/data.ts is a tbc placeholder, so this is what the site shows today."
            >
              <BatchTable course={first} />
            </Specimen>

            <Specimen title="Batch table, with dates">
              <BatchTable
                course={{
                  ...first,
                  instances: [
                    {
                      id: "demo-1",
                      startDate: "2026-10-12",
                      endDate: "2026-10-14",
                      schedule: "10am to 5pm",
                      seatsAvailable: 6,
                      status: "open",
                      paymentPageUrl: null,
                    },
                    {
                      id: "demo-2",
                      startDate: "2026-11-09",
                      endDate: null,
                      schedule: null,
                      seatsAvailable: null,
                      status: "waitlist",
                      paymentPageUrl: null,
                    },
                  ],
                }}
              />
            </Specimen>
          </>
        )}

        <Specimen title="Level ladder">
          <LevelLadder current="foundation" />
        </Specimen>

        <Specimen title="Level ladder on the black ground" dark>
          <LevelLadder current="junior" onDark />
        </Specimen>

        <Specimen title="Waitlist, inline form" note="Idle state. Submit with an empty name to see the error state and focus move.">
          <WaitlistInline course="Barista Skills, Foundation" />
        </Specimen>

        <Specimen title="Waitlist on the black ground" dark>
          <WaitlistInline course="Latte Art" onDark />
        </Specimen>

        <Specimen title="Course filters, nothing selected">
          <CourseFilters levels={getLevels()} skillAreas={getSkillAreas()} />
        </Specimen>

        <Specimen title="Course filters, a level selected">
          <CourseFilters
            levels={getLevels()}
            skillAreas={getSkillAreas()}
            activeLevel="foundation"
          />
        </Specimen>

        <Specimen title="Form fields">
          <div className="grid gap-6 md:max-w-lg">
            <Field id="demo-name" label="Your name" required>
              <input id="demo-name" type="text" className={fieldInputClass} />
            </Field>
            <Field
              id="demo-phone"
              label="Mobile number"
              required
              hint="We reply on WhatsApp, so use the number WhatsApp is on."
              hintId="demo-phone-hint"
              error="Enter a 10-digit Indian mobile number, without +91"
              errorId="demo-phone-error"
            >
              <input
                id="demo-phone"
                type="tel"
                defaultValue="123"
                aria-invalid
                aria-describedby="demo-phone-hint demo-phone-error"
                className={fieldInputClass}
              />
            </Field>
            <Field id="demo-message" label="Anything we should know">
              <textarea id="demo-message" rows={3} className={`${fieldControlClass} py-3`} />
            </Field>
            <FieldError id="demo-standalone-error" message="A standalone error message" />
          </div>
        </Specimen>

        <Specimen
          title="shadcn primitives"
          note="Installed via the CLI and never hand-edited. Used where behaviour matters: the mobile sheet and the FAQ accordion. The enquiry form uses a native select instead, so the conversion path needs no JavaScript to open a picker."
        >
          <div className="flex flex-wrap items-center gap-4">
            <ShadcnButton>shadcn Button</ShadcnButton>
            <Select>
              <SelectTrigger
                aria-label="Pick a course, shadcn Select specimen"
                className="h-12 min-w-56 rounded-xs border-white-2 bg-white-3 text-body"
              >
                <SelectValue placeholder="shadcn Select" />
              </SelectTrigger>
              <SelectContent>
                {courses.slice(0, 4).map((course) => (
                  <SelectItem key={course.slug} value={course.slug} className="text-body">
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Specimen>

        <Specimen
          title="Enquiry form, student"
          note="Blur a field empty for the inline error. Submitting with an invalid phone moves focus to it. With no RESEND_API_KEY set, a valid submit returns the WhatsApp handoff."
        >
          <div className="md:max-w-xl">
            <EnquiryForm variant="student" courses={courseOptions} defaultCourse="latte-art" />
          </div>
        </Specimen>

        <Specimen title="Enquiry form, cafe">
          <div className="md:max-w-xl">
            <EnquiryForm
              variant="cafe"
              courses={courseOptions}
              replyPromise="We reply on WhatsApp during academy hours."
            />
          </div>
        </Specimen>

        <Specimen title="Trainer grid">
          <TrainerGrid trainers={trainers} />
        </Specimen>

        <Specimen title="FAQ accordion" note="Answers stay in the DOM when collapsed, so they are crawlable and findable in page.">
          <FaqAccordion items={faqs.slice(0, 4)} />
        </Specimen>
      </Container>

      {/* The hero specimen renders its own H1, which is the component's job. On a real page it is
          the only one; here it is the second, so the gallery is noindex and excluded from the
          one-H1 assertion in tests/routes.json. */}
      <HomeHero
        eyebrow="Bengaluru"
        titleLead="Professional coffee training in Bengaluru,"
        titleAccent="the Florence way"
        subline="The hero specimen. The red gradient on text is allowed here and nowhere else."
        actions={
          <>
            <ButtonLink href="/courses" variant="primary">
              See courses and dates
            </ButtonLink>
            <WhatsAppButton />
          </>
        }
      />

      <ProofStrip />
      <AudienceDoors />
      <NextBatches />
      <StoryGrid />
      <FinalCta
        title="Come and pull a shot before you decide"
        body="Tell us where you are starting from and we will tell you which course fits."
      />
    </>
  );
}
