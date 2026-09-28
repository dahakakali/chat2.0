import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    let url = searchParams.get('pathname') || searchParams.get('url');

    if (!url) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new NextResponse('Server configuration error', { status: 500 });
    }

    const storeId = token.split('_')[3].toLowerCase();

    if (!url.startsWith('http')) {
      url = `https://${storeId}.public.blob.vercel-storage.com/${url.replace(/^\/+/, '')}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`Blob fetch failed: ${response.status} ${response.statusText} - ${url}`);
      return new NextResponse('Blob not found', { status: response.status === 404 ? 404 : 500 });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error in media proxy:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}