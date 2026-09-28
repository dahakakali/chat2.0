import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    let url = searchParams.get('pathname') || searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Attempt to parse if they passed just a pathname to the Vercel bucket domain
    if (!url.startsWith('http')) {
       url = `https://hbj2sufsillhpkkr.public.blob.vercel-storage.com/${url.replace(/^\/+/, '')}`;
    }

    const result = await fetch(url);
    if (!result.ok) {
        console.error('Blob fetch failed:', result.statusText);
        return new NextResponse('Blob not found', { status: 404 });
    }

    return new NextResponse(result.body, {
      status: 200,
      headers: {
        'Content-Type': result.headers.get('content-type') || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error in media proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}