import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/currentUser";

export const dynamic = "force-dynamic";
import { FocusWorkspace } from "@/components/system/FocusWorkspace";

export default async function FocusPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.isLegacyOwner) redirect("/");
  return <FocusWorkspace />;
}
