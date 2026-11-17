import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const uploadUrl = formData.get("uploadUrl");
    const contentType = formData.get("contentType") as string | null;
    const file = formData.get("file");

    if (!uploadUrl || typeof uploadUrl !== "string") {
      return NextResponse.json(
        { error: "Missing uploadUrl in form data" },
        { status: 400 }
      );
    }
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file in form data" },
        { status: 400 }
      );
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType ?? file.type },
      body: file,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `S3 upload failed: ${response.status} ${errorBody}` },
        { status: 502 }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

