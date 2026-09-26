import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url).searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // Extract the blob pathname from the URL
    const blobUrl = new URL(url);
    const pathname = blobUrl.pathname.replace(/^\/+/, '');

    const result = await get(pathname, {
      access: 'private',
    });

    if (!result) {
      return new NextResponse('Blob not found', { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type':
          result.blob.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Vercel Blob proxy error:', error);

    return new NextResponse(
      error?.message || 'Failed to retrieve private media',
      { status: 500 }
    );
  }
}