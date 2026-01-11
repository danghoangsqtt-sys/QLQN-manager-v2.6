import React, { useEffect } from 'react';
import { MilitaryPersonnel } from '../types';

interface ProfilePrintTemplateProps {
  data: MilitaryPersonnel | undefined;
}

const ProfilePrintTemplate: React.FC<ProfilePrintTemplateProps> = ({ data }) => {
  
  // --- 1. LOGIC TỰ ĐỘNG ĐẶT TÊN FILE (GIỮ NGUYÊN) ---
  useEffect(() => {
    if (data?.ho_ten) {
      const originalTitle = document.title;
      // Tạo tên file: SO_YEU_LY_LICH_NGUYEN_VAN_A_QN123456
      const safeName = data.ho_ten.trim().replace(/\s+/g, '_').toUpperCase();
      const safeId = data.cccd ? data.cccd.slice(-6) : '000000';
      const newTitle = `SO_YEU_LY_LICH_${safeName}_QN${safeId}`;
      
      document.title = newTitle;
      return () => { document.title = originalTitle; };
    }
  }, [data]);

  if (!data) return null;

  // Hàm helper định dạng ngày
  const fmtDate = (isoDate?: string) => {
    if (!isoDate) return '.../.../......';
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="print-area-wrapper">
      <div className="a4-page">
        {/* --- HEADER QUỐC HIỆU (CHUẨN VĂN BẢN) --- */}
        <div className="print-header">
          <div className="unit-label">
            <p className="font-bold uppercase text-[13px]">ĐƠN VỊ: {data.don_vi}</p>
            <div className="line-sm"></div>
            <p className="text-[13px]">Số: ............/HS-QN</p>
          </div>
          <div className="national-label">
            <p className="font-bold uppercase text-[13px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-[14px] underline-offset-4" style={{borderBottom: '1px solid black', paddingBottom: '3px', display: 'inline-block'}}>Độc lập - Tự do - Hạnh phúc</p>
          </div>
        </div>

        {/* --- TIÊU ĐỀ --- */}
        <div className="text-center mt-6 mb-6">
          <h1 className="text-[24px] font-bold uppercase mb-1">SƠ YẾU LÝ LỊCH QUÂN NHÂN</h1>
          <p className="italic text-[14px]">(Dùng cho công tác quản lý nội bộ)</p>
        </div>

        {/* --- THÔNG TIN CƠ BẢN VÀ ẢNH --- */}
        <div className="flex gap-6 mb-4">
          <div className="w-[3cm] h-[4cm] border border-black flex items-center justify-center shrink-0">
            {data.anh_dai_dien ? (
              <img src={data.anh_dai_dien} alt="Ảnh thẻ" className="w-full h-full object-cover grayscale" />
            ) : (
              <span className="text-[10px] font-bold text-center">ẢNH<br/>3x4</span>
            )}
          </div>
          
          <div className="flex-1 text-[14px] space-y-2 leading-relaxed">
            <div className="flex">
              <span className="w-[180px] shrink-0">1. Họ và tên khai sinh:</span>
              <span className="uppercase font-bold text-[15px]">{data.ho_ten}</span>
            </div>
            <div className="flex">
              <span className="w-[180px] shrink-0">2. Tên gọi khác:</span>
              <span>{data.ten_khac || 'Không'}</span>
            </div>
            <div className="flex">
              <span className="w-[180px] shrink-0">3. Ngày, tháng, năm sinh:</span>
              <span>{fmtDate(data.ngay_sinh)}</span>
            </div>
            <div className="flex">
              <span className="w-[180px] shrink-0">4. Số CCCD/Định danh:</span>
              <span>{data.cccd}</span>
            </div>
            <div className="flex gap-10">
              <div className="flex">
                 <span className="mr-2">5. Cấp bậc:</span>
                 <span className="font-bold">{data.cap_bac}</span>
              </div>
              <div className="flex">
                 <span className="mr-2">6. Chức vụ:</span>
                 <span>{data.chuc_vu || 'Chiến sĩ'}</span>
              </div>
            </div>
            <div className="flex">
              <span className="w-[180px] shrink-0">7. Quê quán:</span>
              <span>{data.noi_sinh}</span>
            </div>
            <div className="flex">
              <span className="w-[180px] shrink-0">8. Nơi ĐKHK thường trú:</span>
              <span>{data.ho_khau_thu_tru}</span>
            </div>
          </div>
        </div>

        {/* --- I. THÀNH PHẦN CHÍNH TRỊ --- */}
        <div className="mb-4">
          {/* Sửa: Bỏ viền, bỏ nền, chỉ để chữ đậm */}
          <h3 className="font-bold text-[14px] uppercase mb-2 mt-4">I. THÀNH PHẦN BẢN THÂN</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[14px] pl-1">
            <p><span className="font-bold">Dân tộc:</span> {data.dan_toc}</p>
            <p><span className="font-bold">Tôn giáo:</span> {data.ton_giao}</p>
            <p><span className="font-bold">Trình độ văn hóa:</span> {data.trinh_do_van_hoa}</p>
            <p><span className="font-bold">Ngày nhập ngũ:</span> {fmtDate(data.nhap_ngu_ngay)}</p>
            <p><span className="font-bold">Ngày vào Đoàn:</span> {fmtDate(data.ngay_vao_doan)}</p>
            <p><span className="font-bold">Ngày vào Đảng:</span> {fmtDate(data.vao_dang_ngay)}</p>
          </div>
        </div>

        {/* --- II. QUAN HỆ GIA ĐÌNH --- */}
        <div className="mb-4">
          {/* Sửa: Bỏ viền, bỏ nền */}
          <h3 className="font-bold text-[14px] uppercase mb-2 mt-4">II. HOÀN CẢNH GIA ĐÌNH</h3>
          <table className="w-full border-collapse border border-black text-[13px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 w-[15%]">Quan hệ</th>
                <th className="border border-black p-1 w-[25%]">Họ và tên</th>
                <th className="border border-black p-1 w-[10%]">Năm sinh</th>
                <th className="border border-black p-1">Nghề nghiệp & Nơi ở hiện nay</th>
              </tr>
            </thead>
            <tbody>
              {(data.quan_he_gia_dinh?.cha_me_anh_em || []).length > 0 ? (
                data.quan_he_gia_dinh?.cha_me_anh_em.map((f, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1 text-center font-bold">{f.quan_he}</td>
                    <td className="border border-black p-1 uppercase">{f.ho_ten}</td>
                    <td className="border border-black p-1 text-center">{f.nam_sinh}</td>
                    <td className="border border-black p-1 text-justify">{f.nghe_nghiep} - {f.cho_o}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="border border-black p-2 text-center italic">Chưa có thông tin</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- III. TÌNH HÌNH AN NINH & TÀI CHÍNH --- */}
        <div className="mb-6 page-break-avoid">
          {/* Sửa: Bỏ viền, bỏ nền */}
          <h3 className="font-bold text-[14px] uppercase mb-2 mt-4">III. TÌNH HÌNH TÀI CHÍNH & AN NINH CHÍNH TRỊ</h3>
          <div className="text-[14px] space-y-2 text-justify pl-1">
             <p>
               {/* Sửa: Bỏ gạch chân (underline) */}
               <span className="font-bold">1. Tình hình tài chính:</span>{' '}
               {data.tai_chinh_suc_khoe?.vay_no?.co_khong 
                 ? `Hiện đang vay nợ số tiền ${data.tai_chinh_suc_khoe.vay_no.so_tien} đồng. Mục đích vay: ${data.tai_chinh_suc_khoe.vay_no.muc_dich}.` 
                 : 'Khai báo tài chính ổn định, không có vay nợ.'}
             </p>
             <p>
               {/* Sửa: Bỏ gạch chân (underline) */}
               <span className="font-bold">2. Lịch sử vi phạm:</span>{' '}
               {data.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong 
                 ? `Đã từng vi phạm: ${data.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung}.` 
                 : 'Chấp hành tốt pháp luật Nhà nước, quy định địa phương.'}
             </p>
             <p>
               {/* Sửa: Bỏ gạch chân (underline) */}
               <span className="font-bold">3. Quan hệ nước ngoài:</span>{' '}
               {(data.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 
                 ? `Có thân nhân ở nước ngoài (${data.yeu_to_nuoc_ngoai?.than_nhan.map(t => t.nuoc).join(', ')}).` 
                 : 'Bản thân và gia đình không có quan hệ với người nước ngoài.'}
             </p>
             <p>
               {/* Sửa: Bỏ gạch chân (underline) */}
               <span className="font-bold">4. Nguyện vọng cá nhân:</span>{' '}
               {data.y_kien_nguyen_vong || 'Không có ý kiến, nguyện vọng gì đặc biệt. An tâm công tác.'}
             </p>
          </div>
        </div>

        {/* --- CAM ĐOAN & CHỮ KÝ --- */}
        <div className="mt-8">
            <p className="italic text-[14px] mb-6">Tôi xin cam đoan những lời khai trên là đúng sự thật và chịu hoàn toàn trách nhiệm trước pháp luật.</p>
            
            <div className="flex justify-between mt-4">
                {/* TRÁI: THỦ TRƯỞNG XÁC NHẬN */}
                <div className="text-center w-[45%]">
                    <p className="font-bold uppercase text-[13px] mb-20">THỦ TRƯỞNG ĐƠN VỊ XÁC NHẬN</p>
                </div>

                {/* PHẢI: QUÂN NHÂN KÝ TÊN */}
                <div className="text-center w-[45%]">
                    <p className="italic text-[14px] mb-1">
                        Ngày ...... tháng ...... năm {new Date().getFullYear()}
                    </p>
                    <p className="font-bold uppercase text-[13px] mb-20">QUÂN NHÂN KÝ TÊN</p>
                    <p className="font-bold uppercase text-[14px]">{data.ho_ten}</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- CSS TRIỆT TIÊU LỖI (VŨ KHÍ QUAN TRỌNG NHẤT) --- */}
      <style>{`
        /* 1. Mặc định ẩn trong App */
        .print-area-wrapper { display: none; }

        /* 2. CHẾ ĐỘ IN (Reset toàn bộ) */
        @media print {
          /* RESET CẤP ĐỘ GỐC: Vô hiệu hóa mọi hiệu ứng của App */
          body, html, #root, div, span, app-root, section, main {
             visibility: hidden;
             transform: none !important;
             animation: none !important;
             transition: none !important;
             box-shadow: none !important;
             border: none !important;
             margin: 0 !important;
             padding: 0 !important;
             position: static !important;
             overflow: visible !important;
             background: white !important;
          }

          /* THIẾT LẬP VÙNG IN */
          .print-area-wrapper {
             visibility: visible !important;
             display: block !important;
             position: absolute !important;
             top: 0 !important;
             left: 0 !important;
             width: 100% !important;
             height: auto !important;
             z-index: 99999999 !important;
             background: white !important;
          }

          /* HIỂN THỊ NỘI DUNG CON */
          .print-area-wrapper * {
             visibility: visible !important;
             color: black !important; /* Bắt buộc đen trắng */
             -webkit-print-color-adjust: exact; 
             print-color-adjust: exact;
          }
          
          /* Chuyển ảnh sang đen trắng nếu cần */
          .print-area-wrapper img {
             filter: grayscale(100%) !important;
          }

          /* CẤU HÌNH TRANG GIẤY A4 (Theo Nghị định 30) */
          @page {
            size: A4;
            /* Lề: Trên 20mm, Dưới 20mm, Trái 30mm, Phải 15mm */
            margin: 20mm 15mm 20mm 30mm; 
          }

          /* STYLES NỘI BỘ CHO TEMPLATE */
          .a4-page {
            width: 100%;
            font-family: "Times New Roman", Times, serif;
            color: black;
            line-height: 1.5;
          }
          
          .print-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .unit-label { text-align: left; width: 40%; }
          .national-label { text-align: center; width: 60%; }
          .line-sm { border-top: 1px solid black; width: 30%; margin-top: 2px; margin-bottom: 2px; }
          
          /* Tránh ngắt trang giữa dòng bảng */
          tr { page-break-inside: avoid; }
          .page-break-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default ProfilePrintTemplate;