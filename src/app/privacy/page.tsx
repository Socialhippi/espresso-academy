import type { Metadata } from "next";
import { LegalPlaceholder, LegalSection } from "@/components/site/LegalPlaceholder";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy and Your Personal Details",
  description:
    "What Espresso Academy India does with the name and phone number you send through the enquiry form, who sees it, and how to ask for it to be deleted.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPlaceholder
      title="Privacy"
      path="/privacy"
      intro="What happens to the details you send us, in plain English."
    >
      <LegalSection title="What we collect">
        <p>
          When you send an enquiry we collect your name, your mobile number, the course and batch
          you picked, anything you type in the message box, and the page you sent it from. We also
          record which campaign brought you here, if you arrived from one.
        </p>
        <p>
          The site sets one cookie, and only to remember whether you agreed to measurement. No
          analytics or advertising script runs on this site today.
        </p>
      </LegalSection>

      <LegalSection title="What we do with it">
        <p>
          We reply to you about the course you asked about. That is the whole purpose. We do not
          sell your details, and we do not pass them to anyone outside the academy.
        </p>
        <p>
          Your enquiry reaches the academy by email. Where a batch fills up we may message you
          about the next one, and you can tell us to stop at any point.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Until you tell us to delete it, or until it is clearly no longer useful to either of us.
          Ask and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can ask what we hold, ask us to correct it, or ask us to delete it. Message the
          academy on WhatsApp or call, and say what you want done.
        </p>
      </LegalSection>
    </LegalPlaceholder>
  );
}
