import { LoginForm } from "@/components/auth/auth-forms";

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-2 font-serif text-3xl">Welcome back</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Log in to your private shared space.
      </p>
      <LoginForm />
    </>
  );
}
