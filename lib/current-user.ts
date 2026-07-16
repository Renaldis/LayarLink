import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireCurrentUser() {
  const session = await getCurrentSession();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user;
}

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() });
}
