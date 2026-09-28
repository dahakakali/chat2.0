import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    let url = searchParams.get('pathname') || searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    if (!url.startsWith('http')) {
       url = `https://hbj2sufsillhpkkr.public.blob.vercel-storage.com/${url.replace(/^\/+/, '')}`;
    }

    // Must use '@vercel/blob' get() with full URL because these blobs are 'access: private'
    const result = await get(url, {
      access: 'private',
    });

    if (!result || result.statusCode !== 200) {
      console.error('Blob not found:', url);
      return new NextResponse('Blob not found', { status: 404 });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error in media proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}