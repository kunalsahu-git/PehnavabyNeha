export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
}

/**
 * Uploads a file (image or video) to Cloudinary via our secure server-side API route.
 * API credentials never leave the server.
 */
export async function uploadFile(file: File, folder?: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || 'Upload failed');
  }

  return {
    url: data.url,
    publicId: data.publicId,
    resourceType: data.resourceType,
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
