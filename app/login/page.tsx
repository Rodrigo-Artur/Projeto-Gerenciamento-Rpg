import { AccountForm } from "@/components/auth/AccountForm";
import { currentUser } from "@/lib/server/currentUser";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{next?: string}> }) {
  const user = await currentUser();
  if (user) redirect("/");
  const params = await searchParams;
  const nextUrl = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/";
  return <AccountForm mode="login" googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} nextUrl={nextUrl} />;
}

