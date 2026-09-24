/**
 * Hand the browser a file the API sent. Downloads go through the API client,
 * which carries the login; a plain link or window.open does not, and the
 * endpoint answers 401 (how report exports were broken).
 */
export function saveBlob(data: BlobPart, fileName: string, type?: string): void {
  const blob = data instanceof Blob ? data : new Blob([data], type ? { type } : undefined);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
