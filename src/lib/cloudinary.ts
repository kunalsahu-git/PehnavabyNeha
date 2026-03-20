export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
}

const IMAGE_PROXY_LIMIT = 4 * 1024 * 1024; // 4 MB — stay under Vercel's 4.5 MB limit

/**
 * Uploads a file to Cloudinary.
 * - Images under 4 MB: proxied through /api/upload (keeps credentials server-side).
 * - Videos or large files: fetches a signature from /api/upload-signature, then
 *   uploads directly from the browser to Cloudinary — the file never touches Vercel.
 */
export async function uploadFile(file: File, folder?: string): Promise<UploadResult> {
  const isVideo     = file.type.startsWith('video/');
  const isLargeFile = file.size > IMAGE_PROXY_LIMIT;

  if (isVideo || isLargeFile) {
    return uploadDirect(file, folder);
  }
  return uploadViaProxy(file, folder);
}

/** Proxy upload through /api/upload — for small images only */
async function uploadViaProxy(file: File, folder?: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const res  = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Upload failed');
  return { url: data.url, publicId: data.publicId, resourceType: data.resourceType };
}

/** Direct-to-Cloudinary upload — for videos and large files */
async function uploadDirect(file: File, folder?: string): Promise<UploadResult> {
  // 1. Get a short-lived signed signature from the server
  const sigRes  = await fetch(`/api/upload-signature?folder=${encodeURIComponent(folder || 'pehnava/uploads')}`);
  const sigData = await sigRes.json();
  if (!sigRes.ok) throw new Error(sigData?.error || 'Could not generate upload signature');

  const { signature, timestamp, apiKey, cloudName, folder: signedFolder } = sigData;

  // 2. Upload directly from browser to Cloudinary (bypasses Vercel entirely)
  const formData = new FormData();
  formData.append('file',      file);
  formData.append('api_key',   apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder',    signedFolder);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body:   formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Direct upload failed');

  return {
    url:          data.secure_url,
    publicId:     data.public_id,
    resourceType: data.resource_type,
  };
}

/**
 * Deletes a file from Cloudinary via our secure server-side API route.
 */
export async function deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
  const res = await fetch('/api/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId, resourceType }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || 'Delete failed');
  }
}

// Keep the old name for backward compatibility if needed, or update all callers
export const uploadImage = uploadFile;
