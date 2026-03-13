import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/upload
 * Accepts a file (multipart/form-data) and uploads it to Cloudinary
 * using a signed upload. API credentials stay server-side only.
 */
export async function POST(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Generate Cloudinary signed upload params
  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'pehnava/products';
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  // Build form data for Cloudinary
  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file);
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('timestamp', timestamp.toString());
  cloudinaryForm.append('signature', signature);
  cloudinaryForm.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: cloudinaryForm }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.error?.message || 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({ url: data.secure_url });
}
