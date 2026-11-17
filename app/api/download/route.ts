import { NextResponse } from "next/server";

/**
 * Server-side proxy that streams a remote file (e.g. an S3 presigned URL)
 * back to the browser with a `Content-Disposition: attachment` header so the
 * file is always downloaded with the correct name. Mirrors the `/api/upload`
 * proxy used for chat file uploads — avoids CORS issues with S3 presigned
 * URLs.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");
    const fileName = searchParams.get("fileName");

    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Missing fileUrl in query params" },
        { status: 400 }
      );
    }

    const remoteUrl = new URL(fileUrl);
    const isAllowedS3Url =
      remoteUrl.protocol === "https:" &&
      !remoteUrl.username &&
      !remoteUrl.password &&
      !remoteUrl.port &&
      remoteUrl.hostname.endsWith(".amazonaws.com");
    if (!isAllowedS3Url) {
      return NextResponse.json(
        { error: "Only HTTPS Amazon S3 file URLs are allowed" },
        { status: 400 }
      );
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Remote fetch failed: ${response.status} ${errorBody}` },
        { status: 502 }
      );
    }

    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const blob = await response.blob();

    const safeName = fileName
      ? fileName.replace(/["\\]/g, "")
      : "download";

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
