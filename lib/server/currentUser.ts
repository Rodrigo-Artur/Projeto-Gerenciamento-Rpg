import { auth } from "@/auth";
import { userById, type AppUser } from "@/lib/server/authDatabase";

export async function currentUser(): Promise<AppUser | null> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ? userById(id) : null;
}

