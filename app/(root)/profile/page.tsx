import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ProfileBasePage() {
  // 1. Authenticate user
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // 2. Fetch user record from database
  const user = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  // 3. Redirect to username profile if it exists, otherwise to onboarding
  if (user && user.username) {
    redirect(`/profile/${user.username}`);
  } else {
    redirect("/onboarding");
  }
}
