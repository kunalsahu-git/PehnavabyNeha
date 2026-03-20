import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/upload-signature?folder=pehnava/hero
 * Returns a signed upload signature so the client can upload
 * directly to Cloudinary without routing the file through Vercel.
 * The api_secret never leaves the server.
 */
export async function GET(req: NextRequest) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  const folder    = req.nextUrl.searchParams.get('folder') || 'pehnava/uploads';
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature    = crypto
    .createHash('sha256')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
