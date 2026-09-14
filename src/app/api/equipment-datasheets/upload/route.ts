import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/neon/client";

const MAX_DATASHEET_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const client = createClient();
        const session = await client.auth.getSession();
        const user = session.data?.user;
        if (!user?.id) throw new Error("Authenticated Neon user required.");

        const { data: profile, error: profileError } = await client
          .from("profiles")
          .select("organisation_id,status")
          .eq("id", user.id)
          .single();
        if (profileError || !profile?.organisation_id || profile.status !== "active") {
          throw new Error("Active organisation membership is required.");
        }

        const payload = clientPayload ? JSON.parse(clientPayload) as { batchId?: string } : {};
        if (!payload.batchId) throw new Error("Import batch is required.");
        const { data: batch, error: batchError } = await client
          .from("equipment_import_batches")
          .select("id")
          .eq("id", payload.batchId)
          .eq("organisation_id", profile.organisation_id)
          .single();
        if (batchError || !batch) throw new Error("Import batch not found or access denied.");

        const prefix = `${profile.organisation_id}/${payload.batchId}/`;
        if (!pathname.startsWith(prefix)) throw new Error("Invalid datasheet upload path.");

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_DATASHEET_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({
            userId: user.id,
            organisationId: profile.organisation_id,
            batchId: payload.batchId,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Metadata registration and PDF extraction are performed by the governed
        // processUploadedDatasheet server action after the browser upload succeeds.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload authorization failed." },
      { status: 400 },
    );
  }
}
