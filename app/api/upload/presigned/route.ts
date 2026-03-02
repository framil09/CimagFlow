import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generatePresignedUploadUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { fileName, contentType, isPublic } = await req.json();
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(fileName, contentType, isPublic ?? true);

    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao gerar URL" }, { status: 500 });
  }
}
