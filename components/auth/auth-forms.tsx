"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, signupAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {} as AuthState);

  return (
    <form action={action} className="grid gap-4">
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        errors={state.fieldErrors?.email}
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
      />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" loading={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {} as AuthState);

  return (
    <form action={action} className="grid gap-4">
      <Field id="name" name="name" label="Name" autoComplete="name" errors={state.fieldErrors?.name} />
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        errors={state.fieldErrors?.email}
      />
      <Field
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.password}
      />
      <Field
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.confirmPassword}
      />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" loading={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  errors,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  errors?: string[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        aria-invalid={Boolean(errors?.length)}
        className="h-10"
      />
      {errors?.[0] ? (
        <p className="text-xs text-destructive">{errors[0]}</p>
      ) : null}
    </div>
  );
}
