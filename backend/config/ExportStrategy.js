import exceljs from 'exceljs';
import PDFDocument from 'pdfkit-table';
import fs from 'fs';
import path from 'path';

export class ExportStrategy {
    async exportData(data, res) {
        throw new Error('Method "exportData()" must be implemented.');
    }
}

export class ExcelExportStrategy extends ExportStrategy {
    async exportData(reportData, res) {
        try {
            const { branch, orders, startDate, endDate } = reportData;

            const workbook = new exceljs.Workbook();
            workbook.creator = 'BranchHub System';
            workbook.created = new Date();
            
            const worksheet = workbook.addWorksheet('Báo Cáo Doanh Thu');

            // --- 1. Tạo phần Header Tổng Quan bằng các Merge Cells ---
            // Tên báo cáo
            worksheet.mergeCells('A1:G1');
            const titleRow = worksheet.getCell('A1');
            titleRow.value = 'BÁO CÁO DOANH THU CHI NHÁNH';
            titleRow.font = { size: 16, bold: true, color: { argb: 'FF10B981' } };
            titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Thông tin chi nhánh
            worksheet.mergeCells('A2:G2');
            const branchRow = worksheet.getCell('A2');
            branchRow.value = `Chi nhánh: ${branch?.name || 'Không xác định'} - ${branch?.address || ''}`;
            branchRow.font = { size: 12, italic: true };
            branchRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Thời gian
            worksheet.mergeCells('A3:G3');
            const dateRow = worksheet.getCell('A3');
            const startStr = new Date(startDate).toLocaleDateString('vi-VN');
            const endStr = new Date(endDate).toLocaleDateString('vi-VN');
            dateRow.value = `Kỳ báo cáo: Từ ngày ${startStr} đến ${endStr}`;
            dateRow.font = { size: 11 };
            dateRow.alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.addRow([]); // Dòng trống cách điệu

            // Tính toán trước summary
            const totalOrders = orders.length;
            const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const avgRevenue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // --- 2. Thống kê nhanh (Cards) ---
            worksheet.addRow(['TỔNG QUAN KỲ NÀY']);
            worksheet.getRow(5).font = { bold: true, size: 12 };
            worksheet.addRow(['Tổng Đơn Hàng:', totalOrders, '', 'Doanh Thu:', totalRevenue, '', 'Trung Bình Đơn:', avgRevenue]);
            worksheet.getRow(6).font = { bold: true };
            worksheet.getCell('E6').numFmt = '#,##0';
            worksheet.getCell('H6').numFmt = '#,##0';

            worksheet.addRow([]); // Dòng trống 
            worksheet.addRow([]); // Dòng trống 

            // --- 3. Bảng Chi Tiết ---
            // Định nghĩa cột (bắt đầu từ dòng số 9)
            worksheet.getRow(9).values = ['STT', 'Ngày & Giờ', 'Mã Đơn', 'Bàn Phục Vụ', 'Tổng Tiền (VNĐ)', 'Thanh Toán', 'Người Tạo'];
            
            worksheet.columns = [
                { key: 'stt', width: 8 },
                { key: 'date', width: 22 },
                { key: 'orderId', width: 12 },
                { key: 'tables', width: 25 },
                { key: 'totalAmount', width: 20 },
                { key: 'paymentStatus', width: 15 },
                { key: 'creator', width: 20 }
            ];

            const headerRow = worksheet.getRow(9);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF10B981' } // Emerald green
                };
                cell.border = {
                    top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
                };
            });

            // Đổ dữ liệu
            orders.forEach((order, index) => {
                const tableStr = order.orderTables?.map(ot => ot.table?.tableName).filter(Boolean).join(', ') || 'Mang về/Khác';
                const createdBy = order.creator?.fullName || order.creator?.username || 'Khách/Tự order';
                const pStt = order.paymentStatus === 'Paid' ? 'Đã Thanh Toán' : order.paymentStatus;
                
                const row = worksheet.addRow({
                    stt: index + 1,
                    date: new Date(order.orderTime).toLocaleString('vi-VN'),
                    orderId: `#${order.orderID}`,
                    tables: tableStr,
                    totalAmount: Number(order.totalAmount),
                    paymentStatus: pStt,
                    creator: createdBy
                });

                row.alignment = { vertical: 'middle' };
                row.getCell('orderId').alignment = { horizontal: 'center' };
                row.getCell('paymentStatus').alignment = { horizontal: 'center' };
                row.getCell('stt').alignment = { horizontal: 'center' };
                
                // Border cho cell
                row.eachCell((cell) => {
                    cell.border = {
                        top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
                    };
                });
            });

            // Định dạng cột tiền tệ
            worksheet.getColumn('totalAmount').numFmt = '#,##0';

            // --- 4. Headers & Download ---
            res.setHeader(
                'Content-Type', 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition', 
                'attachment; filename="Bao_Cao_Doanh_Thu_Chi_Nhanh.xlsx"'
            );

            await workbook.xlsx.write(res);
            res.end();
            
        } catch (error) {
            console.error('Lỗi khi xuất file Excel:', error);
            res.status(500).json({ message: 'Lỗi xuất báo cáo.' });
        }
    }
}

export class PdfExportStrategy extends ExportStrategy {
    exportData(reportData, res) {
        return new Promise(async (resolve, reject) => {
            try {
                const { branch, orders, startDate, endDate } = reportData;

                // 1. Setup PDF Document
                const doc = new PDFDocument({ margin: 30, size: 'A4' });

                // Lắng nghe sự kiện để tránh crash server nếu client huỷ download xoay vòng
                res.on('finish', resolve);
                res.on('error', (err) => {
                    console.error('Lỗi Response stream bị ngắt:', err);
                    resolve(); // Tránh treo promise
                });
                doc.on('error', (err) => {
                    console.error('Lỗi PDF stream:', err);
                    reject(err);
                });

                // 2. Set Response Headers
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="Bao_Cao_Doanh_Thu_Chi_Nhanh.pdf"');
                
                // Stream document into response
                doc.pipe(res);

                // 3. Register Font (Fallback về Arial trên Windows để hỗ trợ Tiếng Việt)
                const regularFontPath = 'C:\\Windows\\Fonts\\arial.ttf';
                const boldFontPath = 'C:\\Windows\\Fonts\\arialbd.ttf';
                if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
                    doc.registerFont('Arial-Regular', regularFontPath);
                    doc.registerFont('Arial-Bold', boldFontPath);
                    doc.font('Arial-Regular');
                } else {
                    console.warn('Không tìm thấy font Arial, fallback về mặc định');
                }

                // 4. Header Section
                doc.font('Arial-Bold').fontSize(16).text('BÁO CÁO DOANH THU CHI NHÁNH', { align: 'center' });
                doc.fontSize(12).text(`Chi nhánh: ${branch?.name || 'Không xác định'} - ${branch?.address || ''}`, { align: 'center' });
                
                const startStr = new Date(startDate).toLocaleDateString('vi-VN');
                const endStr = new Date(endDate).toLocaleDateString('vi-VN');
                doc.font('Arial-Regular').fontSize(11).text(`Kỳ báo cáo: Từ ngày ${startStr} đến ${endStr}`, { align: 'center' });
                doc.moveDown(1);

                // 5. Summary Section
                const totalOrders = orders.length;
                const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
                const avgRevenue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

                doc.font('Arial-Bold').fontSize(12).text('TỔNG QUAN KỲ NÀY');
                doc.font('Arial-Regular').fontSize(10);
                doc.text(`Tổng Đơn Hàng: ${totalOrders}`);
                doc.text(`Doanh Thu: ${totalRevenue.toLocaleString('vi-VN')} VNĐ`);
                doc.text(`Trung Bình Đơn: ${Math.round(avgRevenue).toLocaleString('vi-VN')} VNĐ`);
                doc.moveDown(1.5);

                // 6. Report Table
                const tableData = {
                    headers: ['STT', 'Ngày', 'Mã Đơn', 'Bàn Phục Vụ', 'Tổng Tiền (VNĐ)', 'T.Toán', 'Nhân Viên'],
                    rows: orders.map((order, index) => {
                        const tableStr = order.orderTables?.map(ot => ot.table?.tableName).filter(Boolean).join(', ') || 'Mang về';
                        const createdBy = order.creator?.fullName || order.creator?.username || 'Khách';
                        const pStt = order.paymentStatus === 'Paid' ? 'Đã T.Toán' : order.paymentStatus;
                        const dateStr = new Date(order.orderTime).toLocaleDateString('vi-VN') + ' ' + new Date(order.orderTime).toLocaleTimeString('vi-VN');

                        return [
                            (index + 1).toString(),
                            dateStr,
                            `#${order.orderID}`,
                            tableStr,
                            Number(order.totalAmount).toLocaleString('vi-VN'),
                            pStt,
                            createdBy
                        ];
                    })
                };

                await doc.table(tableData, {
                    prepareHeader: () => doc.font('Arial-Bold').fontSize(9),
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font('Arial-Regular').fontSize(9);
                    },
                    width: 530
                });

                // 7. Finish
                doc.end();

            } catch (error) {
                console.error('Lỗi khi xuất file PDF:', error);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Lỗi xuất báo cáo PDF.' });
                }
                reject(error);
            }
        });
    }
}


/* ═══════════════════════════════════════════════════════════════
   OWNER EXCEL — Nhóm đơn hàng theo từng Chi nhánh
═══════════════════════════════════════════════════════════════ */
export class OwnerExcelExportStrategy extends ExportStrategy {
    async exportData(reportData, res) {
        try {
            const { branch: restaurantInfo, orders, startDate, endDate } = reportData;

            const workbook = new exceljs.Workbook();
            workbook.creator = 'BranchHub System';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Báo Cáo Doanh Thu Owner');

            // Header tổng quan
            worksheet.mergeCells('A1:G1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = 'BÁO CÁO DOANH THU TOÀN NHÀ HÀNG';
            titleCell.font = { size: 16, bold: true, color: { argb: 'FF3B82F6' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.mergeCells('A2:G2');
            const nameCell = worksheet.getCell('A2');
            nameCell.value = `Nhà hàng: ${restaurantInfo?.name || 'Không rõ'}`;
            nameCell.font = { size: 12, italic: true };
            nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

            worksheet.mergeCells('A3:G3');
            const dateCell = worksheet.getCell('A3');
            const startStr = new Date(startDate).toLocaleDateString('vi-VN');
            const endStr   = new Date(endDate).toLocaleDateString('vi-VN');
            dateCell.value = `Kỳ báo cáo: Từ ngày ${startStr} đến ${endStr}`;
            dateCell.font  = { size: 11 };
            dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.addRow([]); // spacer

            // Tổng hợp toàn bộ
            const totalOrders  = orders.length;
            const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
            const avgRevenue   = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
            worksheet.addRow(['TỔNG QUAN']);
            worksheet.getRow(5).font = { bold: true, size: 12 };
            worksheet.addRow(['Tổng Đơn Hàng:', totalOrders, '', 'Doanh Thu:', totalRevenue, '', 'TB Đơn:', avgRevenue]);
            worksheet.getRow(6).font = { bold: true };
            worksheet.getCell('E6').numFmt = '#,##0';
            worksheet.getCell('H6').numFmt = '#,##0';
            worksheet.addRow([]);

            // Nhóm theo chi nhánh
            const grouped = {};
            orders.forEach(o => {
                const bn = o.branch?.name || 'Không xác định';
                if (!grouped[bn]) grouped[bn] = [];
                grouped[bn].push(o);
            });

            worksheet.columns = [
                { key: 'stt',           width: 6  },
                { key: 'date',          width: 22 },
                { key: 'orderId',       width: 10 },
                { key: 'tables',        width: 22 },
                { key: 'totalAmount',   width: 20 },
                { key: 'paymentStatus', width: 15 },
                { key: 'creator',       width: 20 },
            ];

            const COL_COLORS = ['FF1D4ED8', 'FF059669', 'FFD97706', 'FFDC2626', 'FF7C3AED', 'FF0891B2'];
            let colorIdx = 0;
            let globalStt = 0;

            for (const [branchName, branchOrders] of Object.entries(grouped)) {
                const color = COL_COLORS[colorIdx % COL_COLORS.length];
                colorIdx++;

                // Section header — Chi nhánh
                const branchRevenue = branchOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
                const sectionRow = worksheet.addRow([
                    `📍 Chi nhánh: ${branchName}`,
                    '', '', '',
                    `${branchOrders.length} đơn — ${branchRevenue.toLocaleString('vi-VN')} đ`
                ]);
                worksheet.mergeCells(`A${sectionRow.number}:D${sectionRow.number}`);
                sectionRow.height = 20;
                sectionRow.eachCell((cell) => {
                    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
                    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
                    cell.alignment = { vertical: 'middle' };
                });

                // Column header
                const headerRow = worksheet.addRow(['STT', 'Ngày & Giờ', 'Mã Đơn', 'Bàn Phục Vụ', 'Tổng Tiền (VNĐ)', 'Thanh Toán', 'Người Tạo']);
                headerRow.eachCell(cell => {
                    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
                    cell.font   = { bold: true };
                    cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });

                // Data rows
                branchOrders.forEach(order => {
                    globalStt++;
                    const tableStr  = order.orderTables?.map(ot => ot.table?.tableName).filter(Boolean).join(', ') || 'Mang về/Khác';
                    const createdBy = order.creator?.fullName || order.creator?.username || 'Khách/Tự order';
                    const pStt      = order.paymentStatus === 'Paid' ? 'Đã Thanh Toán' : order.paymentStatus;

                    const dataRow = worksheet.addRow({
                        stt:           globalStt,
                        date:          new Date(order.orderTime).toLocaleString('vi-VN'),
                        orderId:       `#${order.orderID}`,
                        tables:        tableStr,
                        totalAmount:   Number(order.totalAmount),
                        paymentStatus: pStt,
                        creator:       createdBy,
                    });
                    dataRow.getCell('totalAmount').numFmt = '#,##0';
                    dataRow.getCell('stt').alignment      = { horizontal: 'center' };
                    dataRow.getCell('orderId').alignment  = { horizontal: 'center' };
                    dataRow.getCell('paymentStatus').alignment = { horizontal: 'center' };
                    dataRow.eachCell(cell => {
                        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
                    });
                });

                worksheet.addRow([]); // spacer between branches
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="Bao_Cao_Doanh_Thu_Owner.xlsx"');
            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error('Lỗi OwnerExcelExportStrategy:', error);
            if (!res.headersSent) res.status(500).json({ message: 'Lỗi xuất báo cáo Excel.' });
        }
    }
}

/* ═══════════════════════════════════════════════════════════════
   OWNER PDF — Nhóm đơn hàng theo từng Chi nhánh
═══════════════════════════════════════════════════════════════ */
export class OwnerPdfExportStrategy extends ExportStrategy {
    exportData(reportData, res) {
        return new Promise(async (resolve, reject) => {
            try {
                const { branch: restaurantInfo, orders, startDate, endDate } = reportData;

                const doc = new PDFDocument({ margin: 30, size: 'A4' });
                res.on('finish', resolve);
                res.on('error', (err) => { console.error('PDF stream error:', err); resolve(); });
                doc.on('error', (err) => { console.error('PDF doc error:', err); reject(err); });

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename="Bao_Cao_Doanh_Thu_Owner.pdf"');
                doc.pipe(res);

                const regularFontPath = 'C:\\Windows\\Fonts\\arial.ttf';
                const boldFontPath    = 'C:\\Windows\\Fonts\\arialbd.ttf';
                if (fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath)) {
                    doc.registerFont('Arial-Regular', regularFontPath);
                    doc.registerFont('Arial-Bold',    boldFontPath);
                    doc.font('Arial-Regular');
                }

                // Header
                doc.font('Arial-Bold').fontSize(16).text('BÁO CÁO DOANH THU TOÀN NHÀ HÀNG', { align: 'center' });
                doc.font('Arial-Regular').fontSize(12).text(`Nhà hàng: ${restaurantInfo?.name || ''}`, { align: 'center' });
                const startStr = new Date(startDate).toLocaleDateString('vi-VN');
                const endStr   = new Date(endDate).toLocaleDateString('vi-VN');
                doc.fontSize(11).text(`Kỳ báo cáo: Từ ngày ${startStr} đến ${endStr}`, { align: 'center' });
                doc.moveDown(0.8);

                // Global summary
                const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
                doc.font('Arial-Bold').fontSize(11).text('TỔNG QUAN:');
                doc.font('Arial-Regular').fontSize(10)
                    .text(`Tổng đơn hàng: ${orders.length}   |   Doanh thu: ${totalRevenue.toLocaleString('vi-VN')} VNĐ`);
                doc.moveDown(1);

                // Nhóm theo chi nhánh
                const grouped = {};
                orders.forEach(o => {
                    const bn = o.branch?.name || 'Không xác định';
                    if (!grouped[bn]) grouped[bn] = [];
                    grouped[bn].push(o);
                });

                let globalStt = 0;
                for (const [branchName, branchOrders] of Object.entries(grouped)) {
                    const branchRevenue = branchOrders.reduce((s, o) => s + Number(o.totalAmount), 0);

                    // Section header
                    doc.font('Arial-Bold').fontSize(12)
                       .text(`📍 Chi nhánh: ${branchName}`, { underline: false });
                    doc.font('Arial-Regular').fontSize(10)
                       .text(`${branchOrders.length} đơn — Doanh thu: ${branchRevenue.toLocaleString('vi-VN')} VNĐ`);
                    doc.moveDown(0.5);

                    const tableData = {
                        headers: ['STT', 'Ngày', 'Mã Đơn', 'Bàn', 'Tổng Tiền (VNĐ)', 'T.Toán', 'Nhân Viên'],
                        rows: branchOrders.map(order => {
                            globalStt++;
                            const tableStr  = order.orderTables?.map(ot => ot.table?.tableName).filter(Boolean).join(', ') || 'Mang về';
                            const createdBy = order.creator?.fullName || order.creator?.username || 'Khách';
                            const pStt      = order.paymentStatus === 'Paid' ? 'Đã T.Toán' : order.paymentStatus;
                            const dateStr   = new Date(order.orderTime).toLocaleDateString('vi-VN');
                            return [
                                globalStt.toString(),
                                dateStr,
                                `#${order.orderID}`,
                                tableStr,
                                Number(order.totalAmount).toLocaleString('vi-VN'),
                                pStt,
                                createdBy,
                            ];
                        }),
                    };

                    await doc.table(tableData, {
                        prepareHeader: () => doc.font('Arial-Bold').fontSize(8),
                        prepareRow:    () => doc.font('Arial-Regular').fontSize(8),
                        width: 530,
                    });
                    doc.moveDown(1.2);
                }

                doc.end();

            } catch (error) {
                console.error('Lỗi OwnerPdfExportStrategy:', error);
                if (!res.headersSent) res.status(500).json({ message: 'Lỗi xuất báo cáo PDF.' });
                reject(error);
            }
        });
    }
}
