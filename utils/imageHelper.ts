// Hàm tạo thumbnail từ base64 string
export const createThumbnail = (base64Image: string, maxWidth: number = 64, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    // Nếu không có ảnh, trả về rỗng
    if (!base64Image) {
        resolve('');
        return;
    }

    const img = new Image();
    img.src = base64Image;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve('');
        return;
      }

      // Tính toán tỷ lệ để giữ nguyên khung hình (aspect ratio)
      const scale = maxWidth / img.width;
      const width = maxWidth;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;

      // Vẽ ảnh nhỏ lên canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Xuất ra base64 mới (nhẹ hơn rất nhiều)
      const thumbnailBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(thumbnailBase64);
    };

    img.onerror = () => {
      resolve('');
    };
  });
};