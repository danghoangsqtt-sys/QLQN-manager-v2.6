import React, { useEffect } from 'react';
import { MilitaryPersonnel } from '../types';

interface ProfilePrintTemplateProps {
  data: MilitaryPersonnel | undefined;
}

const ProfilePrintTemplate: React.FC<ProfilePrintTemplateProps> = ({ data }) => {
  
  // --- 1. LOGIC TỰ ĐỘNG ĐẶT TÊN FILE KHI IN ---
  useEffect(() => {
    if (data?.ho_ten) {
      const originalTitle = document.title;
      const safeName = data.ho_ten.trim().replace(/\s+/g, '_').toUpperCase();
      const safeId = data.cccd ? data.cccd.slice(-4) : '0000';
      // Format: SYLL_NGUYEN_VAN_A_1234
      const newTitle = `SYLL_${safeName}_${safeId}`;
      
      document.title = newTitle;
      return () => { document.title = originalTitle; };
    }
  }, [data]);

  if (!data) return null;

  // Cast sang any để truy cập các trường mở rộng (custom_data) mà không bị lỗi TS
  const p = data as any;

  // --- 2. HELPER FUNCTIONS ---
  const fmtDate = (isoDate?: string) => {
    if (!isoDate) return '.../.../......';
    const [y, m, d] = isoDate.split('-');
    return (y && m && d) ? `${d}/${m}/${y}` : isoDate;
  };

  const RenderSectionTitle = ({ title, index }: { title: string, index: string }) => (
    <div className="section-title">
        <span className="section-index">{index}.</span>
        <span className="section-text">{title}</span>
    </div>
  );

  return (
    <div className="print-area-wrapper">
      <style>{`
          /* ẨN GIAO DIỆN CHÍNH KHI IN */
          @media print {
            body * { visibility: hidden; }
            .print-area-wrapper, .print-area-wrapper * { 
                visibility: visible; 
            }
            .print-area-wrapper {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
            }
            /* Ngắt trang thông minh */
            .page-break { page-break-before: always; }
            tr { page-break-inside: avoid; }
          }

          /* STYLES CHO TRANG A4 */
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 15mm 20mm; /* Lề chuẩn văn bản */
            font-family: "Times New Roman", Times, serif;
            font-size: 13pt;
            line-height: 1.4;
            color: #000;
            box-sizing: border-box;
          }

          /* HELPER CLASSES */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .mb-1 { margin-bottom: 5px; }
          .mb-2 { margin-bottom: 10px; }
          .mb-4 { margin-bottom: 20px; }
          
          /* HEADER QUỐC HIỆU */
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; }
          .quoc-hieu { text-align: center; font-weight: bold; }
          .quoc-hieu .main { font-size: 12pt; }
          .quoc-hieu .sub { font-size: 13pt; text-decoration: underline; margin-top: 3px; display: block;}
          .don-vi { font-size: 12pt; }

          /* TIÊU ĐỀ HỒ SƠ */
          .profile-title { text-align: center; margin-bottom: 30px; }
          .profile-title h1 { font-size: 18pt; font-weight: bold; margin: 0; }
          .profile-title p { font-size: 12pt; font-style: italic; margin-top: 5px; }

          /* PHẦN ẢNH & THÔNG TIN CƠ BẢN */
          .basic-info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
          .avatar-box { 
              width: 30mm; 
              height: 40mm; 
              border: 1px solid #000; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              overflow: hidden;
          }
          .avatar-box img { width: 100%; height: 100%; object-fit: cover; }
          .info-list { flex: 1; }
          .info-row { display: flex; margin-bottom: 6px; }
          .info-label { width: 160px; font-weight: bold; }
          .info-value { flex: 1; font-weight: 500; }

          /* SECTION STYLES */
          .section-title { 
              font-weight: bold; 
              text-transform: uppercase; 
              margin-top: 20px; 
              margin-bottom: 10px; 
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
              font-size: 12pt;
          }
          .section-index { margin-right: 8px; }

          /* TABLES */
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11pt; }
          th, td { border: 1px solid #000; padding: 6px; vertical-align: top; }
          th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
          .col-stt { width: 40px; text-align: center; }
          .col-date { width: 100px; text-align: center; }

          /* CHECKBOX SIMULATION */
          .checkbox-square {
              display: inline-block;
              width: 12px; height: 12px;
              border: 1px solid #000;
              margin-right: 5px;
              position: relative;
              top: 2px;
          }
          .checked::after {
              content: "✓";
              position: absolute;
              top: -3px; left: 1px;
              font-size: 12px;
              font-weight: bold;
          }
          .checkbox-label { margin-right: 20px; }

          /* FOOTER CHỮ KÝ */
          .signature-section { 
              margin-top: 40px; 
              display: flex; 
              justify-content: space-between; 
              page-break-inside: avoid;
          }
          .sign-box { text-align: center; width: 45%; }
          .sign-title { font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
          .sign-role { font-style: italic; margin-bottom: 60px; }
      `}</style>

      <div className="a4-page">
        
        {/* HEADER */}
        <div className="header-top">
            <div className="don-vi text-bold">
                ĐƠN VỊ: {p.don_vi?.toUpperCase() || '.......................'}<br/>
                Số hiệu: {p.custom_data?.so_hieu_quan_nhan || '........'}
            </div>
            <div className="quoc-hieu">
                <div className="main">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <span className="sub">Độc lập - Tự do - Hạnh phúc</span>
            </div>
        </div>

        <div className="profile-title">
            <h1>SƠ YẾU LÝ LỊCH QUÂN NHÂN</h1>
            <p>(Dùng cho quản lý nội bộ)</p>
        </div>

        {/* I. THÔNG TIN CHUNG */}
        <div className="basic-info-grid">
            <div className="avatar-box">
                {p.anh_dai_dien ? <img src={p.anh_dai_dien} alt="Avatar" /> : <span>Ảnh 3x4</span>}
            </div>
            <div className="info-list">
                <div className="info-row">
                    <span className="info-label">Họ và tên khai sinh:</span>
                    <span className="info-value uppercase text-bold" style={{fontSize: '14pt'}}>{p.ho_ten}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Tên khác (nếu có):</span>
                    <span className="info-value">{p.ten_khac || 'Không'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Cấp bậc:</span>
                    <span className="info-value" style={{marginRight: '30px'}}>{p.cap_bac}</span>
                    <span className="info-label" style={{width: '80px'}}>Chức vụ:</span>
                    <span className="info-value">{p.chuc_vu}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Ngày sinh:</span>
                    <span className="info-value" style={{marginRight: '30px'}}>{fmtDate(p.ngay_sinh)}</span>
                    <span className="info-label" style={{width: '80px'}}>Giới tính:</span>
                    <span className="info-value">Nam / Nữ</span>
                </div>
                <div className="info-row">
                    <span className="info-label">CCCD/CMND:</span>
                    <span className="info-value">{p.cccd}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Quê quán:</span>
                    <span className="info-value">{p.que_quan || p.noi_sinh}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">HKTT:</span>
                    <span className="info-value">{p.ho_khau_thu_tru}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Điện thoại:</span>
                    <span className="info-value">{p.sdt_rieng}</span>
                </div>
            </div>
        </div>

        {/* THÔNG TIN CHÍNH TRỊ & HỌC VẤN */}
        <table className="mb-4">
            <tbody>
                <tr>
                    <td style={{width: '50%'}}>
                        <strong>Ngày nhập ngũ:</strong> {fmtDate(p.nhap_ngu_ngay)}<br/>
                        <strong>Ngày vào Đảng:</strong> {fmtDate(p.vao_dang_ngay) || 'Chưa'}<br/>
                        <strong>Ngày vào Đoàn:</strong> {fmtDate(p.ngay_vao_doan) || 'Chưa'}
                    </td>
                    <td>
                        <strong>Văn hóa:</strong> {p.trinh_do_van_hoa}<br/>
                        <strong>Chuyên môn:</strong> {p.custom_data?.trinh_do_chuyen_mon || 'Không'}<br/>
                        <strong>Năng khiếu:</strong> {p.nang_khieu_so_truong || 'Không'}
                    </td>
                </tr>
            </tbody>
        </table>

        {/* II. TÓM TẮT TIỂU SỬ */}
        <RenderSectionTitle index="I" title="TÓM TẮT QUÁ TRÌNH CÔNG TÁC" />
        <table>
            <thead>
                <tr>
                    <th className="col-date">Từ tháng/năm<br/>đến tháng/năm</th>
                    <th>Làm gì, chức vụ gì, ở đâu?</th>
                </tr>
            </thead>
            <tbody>
                {p.tieu_su_ban_than && p.tieu_su_ban_than.length > 0 ? (
                    p.tieu_su_ban_than.map((row: any, idx: number) => (
                        <tr key={idx}>
                            <td className="text-center">{row.time}</td>
                            <td>
                                <strong>{row.job}</strong><br/>
                                <i>{row.place}</i>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan={2} className="text-center italic">Chưa cập nhật tiểu sử</td></tr>
                )}
            </tbody>
        </table>

        {/* III. HOÀN CẢNH GIA ĐÌNH */}
        <RenderSectionTitle index="II" title="HOÀN CẢNH GIA ĐÌNH" />
        
        <div className="mb-2">
            <strong>1. Hoàn cảnh chung: </strong> Sống cùng {p.hoan_canh_song?.song_chung_voi?.toLowerCase() || '...'}. 
            Kinh tế: {p.thong_tin_gia_dinh_chung?.muc_song || '...'}.
        </div>

        {/* Vợ/Chồng/Người yêu */}
        {p.custom_data?.tinh_trang_hon_nhan === 'ket_hon' ? (
            <div className="mb-2" style={{border: '1px solid #ccc', padding: '10px'}}>
                <div className="text-bold mb-1">2. Vợ / Chồng:</div>
                <div className="flex justify-between">
                    <span>Họ tên: <strong>{p.quan_he_gia_dinh?.vo?.ho_ten}</strong></span>
                    <span>Năm sinh: {p.quan_he_gia_dinh?.vo?.nam_sinh}</span>
                    <span>SĐT: {p.quan_he_gia_dinh?.vo?.sdt}</span>
                </div>
                <div>Nghề nghiệp: {p.quan_he_gia_dinh?.vo?.nghe_nghiep}</div>
                <div>Chỗ ở: {p.quan_he_gia_dinh?.vo?.noi_o}</div>
            </div>
        ) : (
            <div className="mb-2" style={{border: '1px solid #ccc', padding: '10px', backgroundColor: '#fafafa'}}>
                <div className="text-bold mb-1">2. Tình trạng hôn nhân: CHƯA KẾT HÔN</div>
                {p.custom_data?.co_nguoi_yeu && p.quan_he_gia_dinh?.nguoi_yeu?.length > 0 && (
                    <div>
                        <div><strong>Thông tin người yêu:</strong></div>
                        <span>Họ tên: {p.quan_he_gia_dinh.nguoi_yeu[0].ho_ten} ({p.quan_he_gia_dinh.nguoi_yeu[0].nam_sinh})</span><br/>
                        <span>Nghề nghiệp: {p.quan_he_gia_dinh.nguoi_yeu[0].nghe_nghiep} - SĐT: {p.quan_he_gia_dinh.nguoi_yeu[0].sdt}</span><br/>
                        <span>Quê quán: {p.quan_he_gia_dinh.nguoi_yeu[0].noi_o}</span>
                    </div>
                )}
            </div>
        )}

        {/* Con cái */}
        {p.quan_he_gia_dinh?.con && p.quan_he_gia_dinh.con.length > 0 && (
            <div className="mb-2">
                <div className="text-bold mb-1">3. Con cái:</div>
                <ul style={{margin: '0', paddingLeft: '20px'}}>
                    {p.quan_he_gia_dinh.con.map((c: any, i: number) => (
                        <li key={i}>{c.ten} - Năm sinh: {c.ns}</li>
                    ))}
                </ul>
            </div>
        )}

        {/* Bố mẹ anh chị em */}
        <div className="text-bold mb-1">4. Cha mẹ, anh chị em ruột:</div>
        <table>
            <thead>
                <tr>
                    <th className="col-stt">QH</th>
                    <th>Họ và tên</th>
                    <th style={{width: '50px'}}>NS</th>
                    <th>Nghề nghiệp - Nơi ở</th>
                    <th style={{width: '90px'}}>Ghi chú</th>
                </tr>
            </thead>
            <tbody>
                {p.quan_he_gia_dinh?.cha_me_anh_em?.map((m: any, idx: number) => (
                    <tr key={idx}>
                        <td className="text-center">{m.quan_he}</td>
                        <td className={p.custom_data?.nguoi_bao_tin_khancap === m.ho_ten ? 'text-bold' : ''}>
                            {m.ho_ten}
                        </td>
                        <td className="text-center">{m.nam_sinh}</td>
                        <td>{m.nghe_nghiep} - {m.cho_o}</td>
                        <td className="text-center" style={{fontSize: '10pt'}}>
                            {p.custom_data?.nguoi_bao_tin_khancap === m.ho_ten ? '(Báo tin)' : ''}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* NGẮT TRANG NẾU CẦN */}
        <div className="page-break"></div> 

        {/* IV. QUAN HỆ NƯỚC NGOÀI */}
        <RenderSectionTitle index="III" title="QUAN HỆ NƯỚC NGOÀI" />
        
        <div className="flex mb-2">
            <div className="checkbox-label">
                <span className={`checkbox-square ${p.yeu_to_nuoc_ngoai?.ho_chieu?.da_co ? 'checked' : ''}`}></span>
                Đã có Hộ chiếu
            </div>
            <div className="checkbox-label">
                <span className={`checkbox-square ${p.yeu_to_nuoc_ngoai?.xuat_canh_dinh_cu?.dang_lam_thu_tuc ? 'checked' : ''}`}></span>
                Có hồ sơ xin định cư nước ngoài
            </div>
        </div>

        {p.yeu_to_nuoc_ngoai?.than_nhan && p.yeu_to_nuoc_ngoai.than_nhan.length > 0 && (
            <table>
                <thead>
                    <tr><th colSpan={4}>Thân nhân đang ở nước ngoài</th></tr>
                    <tr><th>Quan hệ</th><th>Họ tên</th><th>Nước</th><th>Nghề nghiệp</th></tr>
                </thead>
                <tbody>
                    {p.yeu_to_nuoc_ngoai.than_nhan.map((t: any, i: number) => (
                        <tr key={i}>
                            <td className="text-center">{t.quan_he}</td>
                            <td>{t.ho_ten}</td>
                            <td className="text-center">{t.nuoc}</td>
                            <td>{t.nghe_nghiep}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}

        {/* V. TÌNH HÌNH AN NINH - KỶ LUẬT */}
        <RenderSectionTitle index="IV" title="LỊCH SỬ KỶ LUẬT & VI PHẠM" />
        
        <div className="flex justify-between mb-2">
            <div>
                <strong>Vay nợ quá khả năng: </strong> 
                {p.tai_chinh_suc_khoe?.vay_no?.co_khong ? (
                    <span style={{textDecoration: 'underline'}}>CÓ ({p.tai_chinh_suc_khoe.vay_no.so_tien})</span>
                ) : 'Không'}
            </div>
            <div>
                <strong>Đánh bạc/Lô đề: </strong> {p.lich_su_vi_pham?.danh_bac?.co_khong ? 'CÓ' : 'Không'}
            </div>
            <div>
                <strong>Ma túy: </strong> {p.lich_su_vi_pham?.ma_tuy?.co_khong ? 'CÓ' : 'Không'}
            </div>
        </div>

        {/* Bảng Vi phạm kỷ luật quân đội (Mới) */}
        {p.lich_su_vi_pham?.ky_luat_quan_doi && p.lich_su_vi_pham.ky_luat_quan_doi.length > 0 && (
            <table>
                <thead>
                    <tr><th colSpan={3}>Kỷ luật Quân đội</th></tr>
                    <tr><th className="col-date">Năm</th><th>Nội dung vi phạm</th><th>Hình thức xử lý</th></tr>
                </thead>
                <tbody>
                    {p.lich_su_vi_pham.ky_luat_quan_doi.map((vp: any, i: number) => (
                        <tr key={i}>
                            <td className="text-center">{vp.nam}</td>
                            <td>{vp.noi_dung}</td>
                            <td>{vp.hinh_thuc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}

        {/* Bảng Vi phạm pháp luật (Mới) */}
        {p.lich_su_vi_pham?.vi_pham_phap_luat && p.lich_su_vi_pham.vi_pham_phap_luat.length > 0 && (
            <table>
                <thead>
                    <tr><th colSpan={3}>Vi phạm Pháp luật (Dân sự/Hình sự)</th></tr>
                    <tr><th className="col-date">Năm</th><th>Nội dung vi phạm</th><th>Hình thức xử lý</th></tr>
                </thead>
                <tbody>
                    {p.lich_su_vi_pham.vi_pham_phap_luat.map((vp: any, i: number) => (
                        <tr key={i}>
                            <td className="text-center">{vp.nam}</td>
                            <td>{vp.noi_dung}</td>
                            <td>{vp.hinh_thuc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}

        {(!p.lich_su_vi_pham?.ky_luat_quan_doi?.length && !p.lich_su_vi_pham?.vi_pham_phap_luat?.length) && (
            <div className="italic mb-4">Chưa phát hiện vi phạm kỷ luật, pháp luật.</div>
        )}

        {/* VI. KINH TẾ & SỨC KHỎE */}
        <RenderSectionTitle index="V" title="KINH TẾ & SỨC KHỎE" />
        
        <div style={{display: 'flex', gap: '20px'}}>
            <div style={{flex: 1, border: '1px solid #000', padding: '10px'}}>
                <div className="text-bold text-center mb-2" style={{borderBottom: '1px solid #ccc'}}>KINH DOANH</div>
                {p.tai_chinh_suc_khoe?.kinh_doanh?.co_khong ? (
                    <>
                        <div>- Hình thức: {p.tai_chinh_suc_khoe.kinh_doanh.hinh_thuc}</div>
                        <div>- Loại hình: {p.tai_chinh_suc_khoe.kinh_doanh.loai_hinh}</div>
                        <div>- Vốn: {p.tai_chinh_suc_khoe.kinh_doanh.von}</div>
                        <div>- Địa điểm: {p.tai_chinh_suc_khoe.kinh_doanh.dia_diem}</div>
                    </>
                ) : (
                    <div className="text-center italic mt-4">Không tham gia kinh doanh</div>
                )}
            </div>
            
            <div style={{flex: 1, border: '1px solid #000', padding: '10px'}}>
                <div className="text-bold text-center mb-2" style={{borderBottom: '1px solid #ccc'}}>SỨC KHỎE</div>
                <div className="flex justify-between mb-2">
                    <span>Cao: {p.tai_chinh_suc_khoe?.suc_khoe?.chieu_cao} cm</span>
                    <span>Nặng: {p.tai_chinh_suc_khoe?.suc_khoe?.can_nang} kg</span>
                </div>
                <div className="text-bold">Phân loại: {p.tai_chinh_suc_khoe?.suc_khoe?.phan_loai || 'Chưa khám'}</div>
                <div className="mt-2">
                    <u>Bệnh lý cần lưu ý:</u><br/>
                    {p.tai_chinh_suc_khoe?.suc_khoe?.benh_ly || 'Không có'}
                </div>
            </div>
        </div>

        {/* VII. CAM KẾT */}
        <RenderSectionTitle index="VI" title="CAM KẾT CỦA QUÂN NHÂN" />
        <div style={{textAlign: 'justify', minHeight: '50px'}}>
            {p.y_kien_nguyen_vong || '(Chưa có nội dung cam kết)'}
        </div>
        <div className="italic mt-2">
            "Tôi xin cam đoan những lời khai trên là đúng sự thật, nếu có gì sai trái tôi xin chịu hoàn toàn trách nhiệm trước pháp luật và kỷ luật Quân đội."
        </div>

        {/* CHỮ KÝ */}
        <div className="signature-section">
            <div className="sign-box">
                <div className="sign-title">THỦ TRƯỞNG ĐƠN VỊ</div>
                <div className="sign-role">(Ký, ghi rõ họ tên, đóng dấu)</div>
            </div>
            <div className="sign-box">
                <div className="italic">Ngày ...... tháng ...... năm ......</div>
                <div className="sign-title">NGƯỜI KHAI</div>
                <div className="sign-role">(Ký, ghi rõ họ tên)</div>
                <div className="text-bold uppercase" style={{marginTop: '50px'}}>{p.ho_ten}</div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePrintTemplate;