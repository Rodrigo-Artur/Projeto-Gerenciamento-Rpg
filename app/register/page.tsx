import { AccountForm } from "@/components/auth/AccountForm";
import { currentUser } from "@/lib/server/currentUser";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await currentUser();
  if (user) redirect("/");
  return <AccountForm mode="register" googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} nextUrl="/" />;
}

