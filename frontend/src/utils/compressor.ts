/**
 * Kompres file gambar secara client-side menggunakan HTML5 Canvas.
 * Jika file bukan gambar, fungsi ini akan langsung mengembalikan file asli.
 */
export function compressImage(
  file: File,
  maxWidth: number = 1000,
  maxHeight: number = 1000,
  quality: number = 0.70
): Promise<File> {
  return new Promise((resolve) => {
    // Hanya kompres jika file adalah gambar
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Hitung dimensi baru dengan mempertahankan aspek rasio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ? file.type
        : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          // Bersihkan canvas dari RAM GPU HP
          canvas.width = 0;
          canvas.height = 0;

          if (!blob) {
            return resolve(file);
          }
          const compressedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
  });
}
