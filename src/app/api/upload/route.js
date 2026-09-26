import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const roomId = form.get('roomId') || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const rawFilename = file.name || 'upload';
    const filename = `rooms/${roomId}/${Date.now()}_${rawFilename}`;
    
    const blob = await put(filename, file, { access: 'private' });
    
    // Instead of passing back the raw private URL, we wrap it in our proxy API URL
    const proxyUrl = `/api/media?url=${encodeURIComponent(blob.url)}`;
    
    return NextResponse.json({ url: proxyUrl });
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
