import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url).searchParams.get('url');

    if (!url) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // Proxy the fetch request privately using the backend token 
    // This allows the server to download the private Vercel blob and pass it to the frontend!
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!res.ok) {
      return new NextResponse("Failed to proxy private media", { status: res.status });
    }

    // Stream the data back to the client directly
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    console.error("Vercel proxy error:", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
