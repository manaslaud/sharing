import { redirect } from "next/navigation";
import { getMembershipOrNull, requireUser } from "@/lib/session";
import { OnboardingForms } from "@/components/onboarding/onboarding-forms";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const membership = await getMembershipOrNull();
  if (membership) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-serif text-3xl">Set up your space</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Create a new shared space or join someone you trust.
      </p>
      <OnboardingForms />
      <div className="mt-10 text-center">
        <DeleteAccountForm
          email={user.email ?? ""}
          partnerName={null}
          compact
        />
      </div>
    </main>
  );
}
