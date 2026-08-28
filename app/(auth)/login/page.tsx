import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main>
      <h1>Welcome to Pharmix</h1>

      <p>
        Sign in to manage your pharmacy operations.
      </p>

      <LoginForm />
    </main>
  );
}