import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const pathname = new URL(request.url).searchParams.get('pathname');

    if (!pathname) {
      return new NextResponse('Missing pathname parameter', {
        status: 400,
      });
    }

    const result = await get(pathname, {
      access: 'private',
    });

    if (!result || result.statusCode !== 200) {
      console.error('Blob not found:', pathname);

      return new NextResponse('Blob not found', {
        status: 404,
      });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        'Content-Type':
          result.blob.contentType || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache',
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