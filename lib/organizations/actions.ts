"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function cambiarOrgActivaAction(
  organizationId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireAuth();

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: user.id },
    },
    select: { id: true },
  });

  if (!membership) {
    return { success: false, error: "No perteneces a esta organización" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { currentOrgId: organizationId },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
