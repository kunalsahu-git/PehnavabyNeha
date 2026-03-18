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
  const folder = (formData.get('folder') as string) || 'pehnava/products';
  // resource_type: 'auto' is essential for video support
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

  // Use 'auto' to support images/videos/etc
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: cloudinaryForm }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data?.error?.message || 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({ 
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
  });
}

/**
 * DELETE /api/upload
 * Deletes an asset from Cloudinary using its public_id and resource_type.
 */
export async function DELETE(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const { publicId, resourceType = 'image' } = await req.json();

  if (!publicId) {
    return NextResponse.json({ error: 'publicId required' }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  // Signature for deletion only needs public_id and timestamp
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  const cloudinaryForm = new FormData();
  cloudinaryForm.append('public_id', publicId);
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('timestamp', timestamp.toString());
  cloudinaryForm.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    { method: 'POST', body: cloudinaryForm }
  );

  const data = await res.json();

  if (!res.ok || data.result !== 'ok') {
    return NextResponse.json({ error: data?.error?.message || 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ result: 'ok' });
}
