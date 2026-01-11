import React from 'react';
import { MilitaryPersonnel } from '../types';

interface ProfilePrintTemplateProps {
  data: MilitaryPersonnel | undefined;
}

const ProfilePrintTemplate: React.FC<ProfilePrintTemplateProps> = ({ data }) => {
  // Nếu không có dữ liệu thì không render gì cả
  if (!data) return null;

  return (
    <div className="print-area-wrapper">
      <div className="a4-page">
        {/* --- HEADER QUỐC HIỆU --- */}
        <div className="print-header">
          <div className="unit-label">
            <p className="font-bold uppercase tracking-tighter">ĐƠN VỊ: {data.don_vi}</p>
            <div className="line-sm"></div>
            <p className="text-[10px] font-bold">Số hồ sơ: QN-{data.cccd.slice(-6)}</p>
          </div>
          <div className="national-label">
            <p className="font-bold uppercase text-[12px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="font-bold text-[11px]">Độc lập - Tự do - Hạnh phúc</p>
            <div className="line-lg"></div>
          </div>
        </div>

        {/* --- TIÊU ĐỀ --- */}
        <h1 className="main-title">SƠ YẾU LÝ LỊCH QUÂN NHÂN</h1>
        <p className="sub-title-italic">(Dùng cho công tác quản lý quân số nội bộ)</p>

        {/* --- THÔNG TIN CƠ BẢN VÀ ẢNH --- */}
        <div className="info-grid-container">
          <div className="photo-box">
            {data.anh_dai_dien ? (
              <img src={data.anh_dai_dien} alt="Avatar" />
            ) : (
              <div className="placeholder">ẢNH 3x4</div>
            )}
          </div>
          <div className="primary-info">
            <p><strong>1. Họ và tên khai sinh:</strong> <span className="uppercase font-bold text-[16px]">{data.ho_ten}</span></p>
            <p><strong>2. Tên gọi khác:</strong> {data.ten_khac || 'Không'}</p>
            <p><strong>3. Ngày, tháng, năm sinh:</strong> {data.ngay_sinh}</p>
            <p><strong>4. Số định danh cá nhân (CCCD):</strong> {data.cccd}</p>
            <p><strong>5. Cấp bậc:</strong> <span className="font-bold">{data.cap_bac}</span></p>
            <p><strong>6. Chức vụ:</strong> {data.chuc_vu || 'Chiến sĩ'}</p>
            <p><strong>7. Quê quán:</strong> {data.noi_sinh}</p>
            <p><strong>8. Nơi đăng ký HKTT:</strong> {data.ho_khau_thu_tru}</p>
          </div>
        </div>

        {/* --- PHẦN I --- */}
        <div className="print-section">
          <h3 className="section-title">I. THÀNH PHẦN CHÍNH TRỊ - BIÊN CHẾ</h3>
          <div className="details-grid">
            <p><strong>Dân tộc:</strong> {data.dan_toc}</p>
            <p><strong>Tôn giáo:</strong> {data.ton_giao}</p>
            <p><strong>Trình độ văn hóa:</strong> {data.trinh_do_van_hoa}</p>
            <p><strong>Ngày nhập ngũ:</strong> {data.nhap_ngu_ngay}</p>
            <p><strong>Ngày vào Đoàn:</strong> {data.ngay_vao_doan || 'Chưa vào Đoàn'}</p>
            <p><strong>Ngày vào Đảng:</strong> {data.vao_dang_ngay || 'Quần chúng'}</p>
          </div>
        </div>

        {/* --- PHẦN II --- */}
        <div className="print-section">
          <h3 className="section-title">II. QUAN HỆ GIA ĐÌNH (Bố, mẹ, anh, chị, em ruột)</h3>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Quan hệ</th>
                <th style={{ width: '25%' }}>Họ và tên</th>
                <th style={{ width: '12%' }}>Năm sinh</th>
                <th>Nghề nghiệp & Nơi ở hiện nay</th>
              </tr>
            </thead>
            <tbody>
              {(data.quan_he_gia_dinh?.cha_me_anh_em || []).length > 0 ? (
                data.quan_he_gia_dinh.cha_me_anh_em.map((f, i) => (
                  <tr key={i}>
                    <td className="text-center font-bold">{f.quan_he}</td>
                    <td className="uppercase">{f.ho_ten}</td>
                    <td className="text-center">{f.nam_sinh}</td>
                    <td>{f.nghe_nghiep} - {f.cho_o}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center italic">Không có dữ liệu khai báo</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- PHẦN III --- */}
        <div className="print-section page-break-avoid">
          <h3 className="section-title">III. RÀ SOÁT AN NINH - TÀI CHÍNH - TỆ NẠN</h3>
          <div className="security-details text-[12px] leading-relaxed">
            <p><strong>1. Tình hình tài chính:</strong> {data.tai_chinh_suc_khoe?.vay_no?.co_khong ? `Cảnh báo: Có vay nợ số tiền ${data.tai_chinh_suc_khoe.vay_no.so_tien}đ. Mục đích: ${data.tai_chinh_suc_khoe.vay_no.muc_dich}.` : 'Tài chính ổn định, không có nợ xấu.'}</p>
            <p><strong>2. Tiền sử vi phạm:</strong> {data.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ? `Có vi phạm: ${data.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung}.` : 'Chấp hành tốt pháp luật và quy định địa phương.'}</p>
            <p><strong>3. Yếu tố nước ngoài:</strong> {(data.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ? `Có thân nhân định cư tại nước ngoài (${data.yeu_to_nuoc_ngoai.than_nhan.map(t => t.nuoc).join(', ')}).` : 'Không có yếu tố nước ngoài.'}</p>
            <p><strong>4. Sức khỏe & Tệ nạn:</strong> {data.lich_su_vi_pham?.ma_tuy?.co_khong ? 'Phát hiện có tiền sử liên quan đến chất gây nghiện.' : 'Sức khỏe tốt, không liên quan tệ nạn.'}</p>
          </div>
        </div>

        {/* --- CHỮ KÝ --- */}
        <div className="print-signatures">
          <div className="sig-box italic">
            <p className="mb-20 uppercase font-bold text-[11px]">Quân nhân ký tên</p>
            <p className="font-bold uppercase">({data.ho_ten})</p>
          </div>
          <div className="sig-box">
            <p className="mb-1 italic text-[11px]">Ngày ...... tháng ...... năm 20......</p>
            <p className="font-bold uppercase mb-20">Thủ trưởng đơn vị xác nhận</p>
            <p className="font-bold uppercase text-[10px]">(Ký tên, đóng dấu)</p>
          </div>
        </div>

        <div className="print-footer-mark">
          Hệ thống quản lý quân nhân QN-Manager Pro - Dữ liệu bảo mật tuyệt đối
        </div>
      </div>

      {/* --- CSS DÀNH RIÊNG CHO IN ẤN --- */}
      <style>{`
        /* THIẾT LẬP CHO PRINT */
        @media print {
          /* Ẩn tất cả các thành phần khác trong body */
          body > * { display: none !important; }
          
          /* Chỉ hiện vùng in */
          .print-area-wrapper { 
            display: block !important; 
            position: fixed !important; 
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            z-index: 99999 !important;
          }

          /* Tối ưu layout in */
          body, html { 
            height: auto !important; 
            overflow: visible !important; 
            background: white !important;
          }

          @page { 
            size: A4; 
            margin: 15mm; 
          }

          /* Bảo tồn màu sắc và đường kẻ */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Styles cho Template In A4 (Hiển thị preview) */
        .print-area-wrapper { display: none; font-family: 'Times New Roman', serif; color: black; background: white; }
        .a4-page { width: 210mm; margin: 0 auto; background: white; padding: 10mm; }
        
        .print-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .unit-label { text-align: center; width: 40%; }
        .national-label { text-align: center; width: 60%; }
        .line-sm { border-bottom: 1px solid black; width: 50px; margin: 4px auto; }
        .line-lg { border-bottom: 1px solid black; width: 150px; margin: 4px auto; }
        
        .main-title { text-align: center; font-size: 22px; font-weight: bold; margin: 25px 0 5px 0; }
        .sub-title-italic { text-align: center; font-style: italic; font-size: 11px; margin-bottom: 30px; }
        
        .info-grid-container { display: flex; gap: 30px; margin-bottom: 25px; }
        .photo-box { width: 3cm; height: 4cm; border: 1px solid black; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; }
        .photo-box .placeholder { font-size: 9px; font-weight: bold; color: #999; }
        
        .primary-info { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
        .primary-info p { border-bottom: 1px dotted #ccc; padding-bottom: 2px; }
        
        .section-title { font-size: 13px; font-weight: bold; background: #f2f2f2; padding: 4px 10px; border: 1px solid black; margin: 20px 0 10px 0; border-radius: 2px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 10px; font-size: 12px; }
        
        .print-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 11px; }
        .print-table th, .print-table td { border: 1px solid black; padding: 6px; }
        .print-table th { background: #f9f9f9; font-weight: bold; text-transform: uppercase; }
        
        .print-signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 40px; }
        .sig-box { width: 45%; text-align: center; }
        
        .print-footer-mark { margin-top: 60px; text-align: center; font-size: 8px; color: #ccc; text-transform: uppercase; letter-spacing: 1px; }
        
        .page-break-avoid { page-break-inside: avoid; }
      `}</style>
    </div>
  );
};

export default ProfilePrintTemplate;