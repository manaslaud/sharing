import { LoginForm } from "@/components/auth/auth-forms";
import { AccountDeletedCleanup } from "@/components/auth/account-deleted-cleanup";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;

  return (
    <>
      {deleted ? <AccountDeletedCleanup /> : null}
      <h1 className="mb-2 font-serif text-3xl">
        {deleted ? "Account deleted" : "Welcome back"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {deleted
          ? "Your account was deleted. You can create a new one anytime."
          : "Log in to your private shared space."}
      </p>
      <LoginForm />
    </>
  );
}
