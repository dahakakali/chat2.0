import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const roomId = form.get('roomId') || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const rawFilename = file.name || 'upload';
    const filename = `rooms/${roomId}/${Date.now()}_${rawFilename}`;

    const blob = await put(filename, file, {
      access: 'private',
    });

    // Extract the Blob pathname
    const pathname = new URL(blob.url).pathname.replace(/^\/+/, '');

    // Send only the pathname to the media API
    const proxyUrl =
      `/api/media?pathname=${encodeURIComponent(pathname)}`;

    return NextResponse.json({ url: proxyUrl });
  } catch (error) {
    console.error('Vercel Blob Upload Error:', error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}