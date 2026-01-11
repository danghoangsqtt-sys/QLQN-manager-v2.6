// File: utils/imageHelper.ts
export const createThumbnail = (base64String: string, maxWidth: number = 200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64String;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64String); // Nếu lỗi, trả về ảnh gốc
        return;
      }

      // Tính toán tỷ lệ để ảnh không bị méo
      const scaleFactor = maxWidth / img.width;
      const newWidth = maxWidth;
      const newHeight = img.height * scaleFactor;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Vẽ ảnh mới lên canvas
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Xuất ra dạng base64 chất lượng thấp hơn (0.7) để nhẹ máy
      const thumbnailData = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailData);
    };

    img.onerror = () => {
      resolve(base64String); // Nếu lỗi load ảnh, trả về ảnh gốc
    };
  });
};