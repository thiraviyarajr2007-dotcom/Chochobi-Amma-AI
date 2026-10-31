/**
 * Client-Side Image Compression (< 1MB)
 * Uses HTML Canvas to resize and compress photos/screenshots before API transmission.
 */
export async function compressImageClientSide(
  file: File | Blob,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ base64: string; mimeType: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = 'image/jpeg';
        const base64 = canvas.toDataURL(mimeType, quality);
        const sizeKb = Math.round((base64.length * 3) / 4 / 1024);

        resolve({ base64, mimeType, sizeKb });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

