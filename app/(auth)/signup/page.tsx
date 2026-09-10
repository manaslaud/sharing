import { SignupForm } from "@/components/auth/auth-forms";

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-2 font-serif text-3xl">Create your space</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        A private place for notes, journals, and reminders.
      </p>
      <SignupForm />
    </>
  );
}
