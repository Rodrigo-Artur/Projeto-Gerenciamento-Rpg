import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/currentUser";

export const dynamic = "force-dynamic";
import { PlayerWorkspace } from "@/components/system/PlayerWorkspace";

export default async function PlayerPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.isLegacyOwner) redirect("/");
  return <PlayerWorkspace />;
}
