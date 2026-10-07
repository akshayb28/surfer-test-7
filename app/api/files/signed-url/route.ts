import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { signedPrivateUrl } from "@/services/storage/r2";

/**
 * Issue a short-lived signed URL for a private KYC document.
 * Access rules: ADMIN can view any; a guide can view only their own KYC docs.
 * The key is looked up from the KycVerification record — users can't pass
 * arbitrary bucket keys.
 */
export async function GET(req: NextRequest) {
  const user = await requireRole("ADMIN", "GUIDE");
  const kycId = req.nextUrl.searchParams.get("kycId");
  const docIndex = Number(req.nextUrl.searchParams.get("doc") ?? 0);
  if (!kycId) return NextResponse.json({ error: "kycId required" }, { status: 400 });

  const kyc = await prisma.kycVerification.findUnique({ where: { id: kycId }, include: { guide: true } });
  if (!kyc?.documentUrls || !Array.isArray(kyc.documentUrls) || !kyc.documentUrls[docIndex]) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (user.role !== "ADMIN" && kyc.guide.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = await signedPrivateUrl(kyc.documentUrls[docIndex] as string);
  return NextResponse.json({ url });
}
