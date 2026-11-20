import { redirect } from "next/navigation";
import { SystemWorkspace } from "@/components/system/SystemWorkspace";
import { AccountWelcome } from "@/components/auth/AccountWelcome";
import { currentUser } from "@/lib/server/currentUser";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.isLegacyOwner) return <AccountWelcome user={user} />;
  return <SystemWorkspace />;
}
