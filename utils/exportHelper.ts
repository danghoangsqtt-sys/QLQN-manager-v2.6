import { MilitaryPersonnel } from '../types';

/**
 * Hàm định dạng ngày tháng
 */
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
        const [y, m, d] = dateString.split('-');
        return `${d}/${m}/${y}`;
    } catch {
        return dateString;
    }
};

/**
 * Hàm xuất ra file Excel (.xls) định dạng HTML chuẩn Microsoft Excel
 */
export const exportPersonnelToCSV = (personnelList: MilitaryPersonnel[], fileName: string = 'Danh_sach_quan_nhan.xls') => {
  if (!personnelList || personnelList.length === 0) {
    alert("Không có dữ liệu để xuất!");
    return;
  }

  const today = new Date();
  const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  // 1. ĐỊNH NGHĨA CỘT VÀ CHIỀU RỘNG (width tính theo pixel)
  const columns = [
    { header: "STT", width: 50, accessor: (p: MilitaryPersonnel, index: number) => index + 1 },
    { header: "HỌ VÀ TÊN", width: 180, accessor: (p: MilitaryPersonnel) => p.ho_ten.toUpperCase() },
    { header: "SỐ HIỆU/CCCD", width: 140, isText: true, accessor: (p: MilitaryPersonnel) => p.cccd },
    { header: "NGÀY SINH", width: 100, accessor: (p: MilitaryPersonnel) => formatDate(p.ngay_sinh) },
    { header: "CẤP BẬC", width: 100, accessor: (p: MilitaryPersonnel) => p.cap_bac },
    { header: "CHỨC VỤ", width: 120, accessor: (p: MilitaryPersonnel) => p.chuc_vu || "Chiến sĩ" },
    { header: "ĐƠN VỊ", width: 120, accessor: (p: MilitaryPersonnel) => p.don_vi },
    { header: "SỐ ĐIỆN THOẠI", width: 120, isText: true, accessor: (p: MilitaryPersonnel) => p.sdt_rieng || "" },
    { header: "QUÊ QUÁN", width: 150, accessor: (p: MilitaryPersonnel) => p.noi_sinh },
    { header: "HỘ KHẨU THƯỜNG TRÚ", width: 250, accessor: (p: MilitaryPersonnel) => p.ho_khau_thu_tru },
    { header: "DÂN TỘC", width: 80, accessor: (p: MilitaryPersonnel) => p.dan_toc },
    { header: "TÔN GIÁO", width: 80, accessor: (p: MilitaryPersonnel) => p.ton_giao },
    { header: "NHẬP NGŨ", width: 100, accessor: (p: MilitaryPersonnel) => formatDate(p.nhap_ngu_ngay) },
    { header: "VÀO ĐOÀN", width: 100, accessor: (p: MilitaryPersonnel) => formatDate(p.ngay_vao_doan) },
    { header: "VÀO ĐẢNG", width: 100, accessor: (p: MilitaryPersonnel) => formatDate(p.vao_dang_ngay) },
    { header: "TRÌNH ĐỘ", width: 100, accessor: (p: MilitaryPersonnel) => p.trinh_do_van_hoa },
    { header: "TỐT NGHIỆP", width: 100, accessor: (p: MilitaryPersonnel) => p.da_tot_nghiep ? "Đã tốt nghiệp" : "Chưa" },
    { header: "NĂNG KHIẾU", width: 150, accessor: (p: MilitaryPersonnel) => p.nang_khieu_so_truong },
    { header: "PHÉP (THỰC)", width: 80, accessor: (p: MilitaryPersonnel) => p.nghi_phep_thuc_te },
    { header: "PHÉP (QUY)", width: 80, accessor: (p: MilitaryPersonnel) => p.nghi_phep_tham_chieu },
    { header: "VAY NỢ", width: 80, accessor: (p: MilitaryPersonnel) => p.tai_chinh_suc_khoe?.vay_no?.co_khong ? "CÓ" : "Không" },
    { header: "SỐ TIỀN NỢ", width: 120, isText: true, accessor: (p: MilitaryPersonnel) => p.tai_chinh_suc_khoe?.vay_no?.so_tien || "0" },
    { header: "CHỦ NỢ", width: 150, accessor: (p: MilitaryPersonnel) => p.tai_chinh_suc_khoe?.vay_no?.nguoi_dung_ten || "" },
    { header: "VI PHẠM KỶ LUẬT", width: 200, accessor: (p: MilitaryPersonnel) => p.lich_su_vi_pham?.vi_pham_dia_phuong?.co_khong ? p.lich_su_vi_pham.vi_pham_dia_phuong.noi_dung : "Không" },
    { header: "TIỀN SỬ MA TÚY", width: 120, accessor: (p: MilitaryPersonnel) => p.lich_su_vi_pham?.ma_tuy?.co_khong ? "Có tiền sử" : "Không" },
    { header: "YẾU TỐ NƯỚC NGOÀI", width: 120, accessor: (p: MilitaryPersonnel) => (p.yeu_to_nuoc_ngoai?.than_nhan?.length || 0) > 0 ? "Có" : "Không" },
    { header: "NGUYỆN VỌNG", width: 250, accessor: (p: MilitaryPersonnel) => p.y_kien_nguyen_vong || "" },
  ];

  // 2. TẠO NỘI DUNG HTML CHUYÊN DỤNG CHO EXCEL
  // Sử dụng CSS mso-number-format để ép kiểu text và định dạng padding
  let tableContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 11pt; }
            table { border-collapse: collapse; width: 100%; table-layout: fixed; }
            
            /* Định dạng tiêu đề cột */
            th { 
                background-color: #14452F; 
                color: #ffffff; 
                border: .5pt solid #000000; 
                padding: 10px; 
                vertical-align: middle; 
                text-align: center; 
                font-weight: bold;
                white-space: normal; /* Cho phép xuống dòng tiêu đề */
            }

            /* Định dạng ô dữ liệu */
            td { 
                border: .5pt solid #000000; 
                padding: 8px 5px; /* Tăng padding để không bị dày đặc */
                vertical-align: top; /* Căn trên để dễ đọc text dài */
                white-space: normal; /* Cho phép xuống dòng (Wrap text) */
                word-wrap: break-word;
            }

            /* Class ép kiểu Text cho CCCD và SĐT để không bị mất số 0 */
            .text-mode { mso-number-format:"\\@"; }
            
            /* Class căn giữa cho các cột ngắn */
            .text-center { text-align: center; }

            .title { font-size: 18pt; font-weight: bold; text-align: center; border: none; padding: 20px; }
            .subtitle { font-size: 12pt; font-style: italic; text-align: center; border: none; padding-bottom: 20px; }
        </style>
    </head>
    <body>
        <table>
            <colgroup>
                ${columns.map(col => `<col width="${col.width}">`).join('')}
            </colgroup>

            <tr><td colspan="${columns.length}" class="title">DANH SÁCH THỐNG KÊ QUÂN NHÂN</td></tr>
            <tr><td colspan="${columns.length}" class="subtitle">${dateStr} - Xuất bởi QN-Manager Pro</td></tr>
            
            <tr style="height: 40px;">
                ${columns.map(col => `<th>${col.header}</th>`).join('')}
            </tr>
  `;

  // 3. DUYỆT DỮ LIỆU
  personnelList.forEach((person, index) => {
      tableContent += '<tr>';
      columns.forEach(col => {
          const value = col.accessor(person, index);
          // Kiểm tra nếu là cột Text (CCCD, SĐT) thì thêm class text-mode
          const cssClass = col.isText ? 'text-mode' : '';
          tableContent += `<td class="${cssClass}">${value !== null && value !== undefined ? value : ''}</td>`;
      });
      tableContent += '</tr>';
  });

  tableContent += `
        </table>
    </body>
    </html>
  `;

  // 4. TẠO FILE VÀ TẢI VỀ
  const blob = new Blob(['\uFEFF', tableContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
});
  
  // Đảm bảo tên file có đuôi .xls
  const finalFileName = fileName.endsWith('.xls') ? fileName : fileName.replace('.csv', '.xls');
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", finalFileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};