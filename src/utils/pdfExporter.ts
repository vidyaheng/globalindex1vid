import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormData, CalculationResults } from '../types'; // ปรับ path ตามความเหมาะสม

// Helper function สำหรับจัดรูปแบบตัวเลข
const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

// Helper function สำหรับโหลดและแปลงฟอนต์เป็น Base64 โดยใช้ FileReader ที่เสถียร
const fetchAndEncodeFont = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch font: ${url}`);
                }
                return res.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        // ผลลัพธ์จะมี prefix "data:font/ttf;base64," ให้ตัดทิ้ง
                        resolve(reader.result.split(',')[1]);
                    } else {
                        reject(new Error('Could not read font file as Base64 string.'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            })
            .catch(reject);
    });
};

const wrapThaiText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
    if (!text) return [];

    // 1. สร้างตัวตัดคำสำหรับภาษาไทย ('th') จากเครื่องมือใน Browser
    const segmenter = new Intl.Segmenter('th', { granularity: 'word' });

    // 2. ทำการตัดคำ
    const segments = segmenter.segment(text);

    // 3. แปลงผลลัพธ์ให้เป็น Array ของ 'คำ' แต่ละคำ
    const words = Array.from(segments, ({ segment }) => segment);

    const mergedWords = words.reduce((acc, currentWord) => {
        const lastWord = acc[acc.length - 1];

        // กรณีที่ 1: ถ้าคำปัจจุบันเป็นเครื่องหมายปิดท้าย ให้ต่อท้ายคำก่อนหน้า
        if (/^[)\]}”']$/.test(currentWord) && lastWord) {
            acc[acc.length - 1] = lastWord + currentWord;
        } 
        // กรณีที่ 2: ถ้าคำ *ก่อนหน้า* เป็นเครื่องหมายเปิด ให้เอาคำปัจจุบันไปต่อท้าย
        else if (/^[({\[“‘]$/.test(lastWord) && currentWord) {
            acc[acc.length - 1] = lastWord + currentWord;
        } 
        // กรณีปกติ: เพิ่มคำใหม่เข้าไปใน array
        else {
            acc.push(currentWord);
        }
        
        return acc;
    }, [] as string[]);

    // 4. นำคำมาต่อกันทีละคำเพื่อสร้างบรรทัด (เหมือนเดิม)
    const lines: string[] = [];
    let currentLine = '';

    for (const word of mergedWords) {
        const potentialLine = currentLine + word;
        const potentialLineWidth = doc.getTextWidth(potentialLine);

        if (potentialLineWidth > maxWidth && currentLine !== '') {
            lines.push(currentLine);
        	currentLine = word;
        } else {
            currentLine = potentialLine;
        }
    }
    
    if (currentLine !== '') {
        lines.push(currentLine);
    }
    
    return lines;
};


// เพิ่มพารามิเตอร์ includeTaxBenefit เพื่อรับเงื่อนไขจากภายนอก
export const exportToPdf = async (formData: FormData, results: CalculationResults, includeTaxBenefit: boolean) => {
    // ★★★ DEBUG: ใส่ console.log เพื่อตรวจสอบค่าที่ได้รับ ★★★
    console.log(`[pdfExporter] ได้รับค่า includeTaxBenefit: ${includeTaxBenefit}`);

    try {
        // --- โหลดฟอนต์ทั้ง 2 เวอร์ชัน (Regular และ Bold) พร้อมกัน ---
        const [regularFontBase64, boldFontBase64] = await Promise.all([
            fetchAndEncodeFont('/Sarabun-Regular.ttf'),
            fetchAndEncodeFont('/Sarabun-Bold.ttf')
        ]);

        const doc = new jsPDF();

        // --- เพิ่มฟอนต์ทั้ง 2 เวอร์ชันเข้าสู่ PDF ---
        doc.addFileToVFS('Sarabun-Regular.ttf', regularFontBase64);
        doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');

        doc.addFileToVFS('Sarabun-Bold.ttf', boldFontBase64);
        doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold');

        doc.setFont('Sarabun', 'normal');

        const pageWidth = doc.internal.pageSize.getWidth();

        // --- ส่วน Header (เหมือนเดิม) ---
        doc.setFontSize(18);
        doc.setFont('Sarabun', 'bold');
        doc.text('สรุปผลประโยชน์แผนการเงิน Global Index 16/6', pageWidth / 2, 20, { align: 'center' });
        doc.setFont('Sarabun', 'normal');

        doc.setFontSize(11);
        const summaryText = `ข้อมูลผู้เอาประกัน: อายุ ${formData.age} ปี | ทุนประกัน: ${formatNumber(formData.sumAssured)} บาท | เบี้ยประกัน: ${formatNumber(formData.premium)} บาท/ปี | ผลตอบแทนคาดหวัง: ${formData.expectedReturn}% ต่อปี`;
        doc.text(summaryText, pageWidth / 2, 30, { align: 'center' });

        // --- สร้างกล่องสรุปแบบ Dynamic ตามเงื่อนไข ---
        const finalBenefit = results.yearlyData.find(d => d.policyYear === 16)?.totalSurrenderBenefit ?? 0;
        
        const summaryData = [
            { label: 'เบี้ยประกันภัยรวมตลอดสัญญา', value: formatNumber(results.totalPremium), color: [220, 53, 69] },
            { label: 'ผลประโยชน์รวมเมื่อครบสัญญา', value: formatNumber(finalBenefit), color: [25, 135, 84] },
            { label: 'อัตราผลตอบแทน (IRR)', value: `${results.irrSurrender?.toFixed(2) ?? 'N/A'} %`, color: [13, 110, 253] }
        ];
        
        if (includeTaxBenefit) {
            summaryData.splice(2, 0, {
                label: 'ผลประโยชน์ทางภาษีรวม', 
                value: formatNumber(results.totalTaxBenefit), 
                color: [255, 193, 7]
            });
        }

        const numBoxes = summaryData.length;
        const totalSpacing = (numBoxes - 1) * 10;
        const startX = 15;
        const boxWidth = (pageWidth - (startX * 2) - totalSpacing) / numBoxes;
        const boxHeight = 25;

        summaryData.forEach((item, index) => {
            doc.setFillColor(item.color[0], item.color[1], item.color[2]);
            doc.roundedRect(startX + (index * (boxWidth + 10)), 40, boxWidth, boxHeight, 3, 3, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);

            // --- ส่วนที่แก้ไขเรื่องการตัดคำ ---
            const boxContentWidth = boxWidth - 5;
            const wrappedLabel = wrapThaiText(doc, item.label, boxContentWidth);

            wrappedLabel.forEach((line, lineIndex) => {
                const yPos = 47 + (lineIndex * 4); 
                doc.text(line, startX + (index * (boxWidth + 10)) + boxWidth / 2, yPos, { align: 'center' });
            });
            // --- จบส่วนที่แก้ไข ---

            doc.setFontSize(14);
            doc.setFont('Sarabun', 'bold');
            doc.text(item.value, startX + (index * (boxWidth + 10)) + boxWidth / 2, 57, { align: 'center' });
            doc.setFont('Sarabun', 'normal');
        });
        doc.setTextColor(0, 0, 0);


        // --- ส่วนตาราง (เหมือนเดิม) ---
        type CellDef = string | number | { content: string; colSpan?: number; styles: { fontStyle?: 'bold' | 'normal' | 'italic'; halign?: 'center' | 'left' | 'right' } };
        
        const head: CellDef[][] = [[
            { content: 'ปีที่', styles: { halign: 'center' } },
            { content: 'อายุ', styles: { halign: 'center' } },
            { content: 'เบี้ยประกัน', styles: { halign: 'right' } },
        ]];

        if (includeTaxBenefit) {
            head[0].push({ content: 'ผลประโยชน์ทางภาษี', styles: { halign: 'right' } });
        }

        head[0].push(
            { content: 'เงินคืน', styles: { halign: 'right' } },
            { content: 'ผลประโยชน์รวม (กรณีเวนคืน)', styles: { halign: 'right' } },
            { content: 'ผลประโยชน์รวม (กรณีเสียชีวิต)', styles: { halign: 'right' } }
        );

        const body: CellDef[][] = results.yearlyData.map(row => {
            const rowData: CellDef[] = [ row.policyYear, row.age, formatNumber(row.premium) ];
            if (includeTaxBenefit) {
                rowData.push(formatNumber(row.taxBenefit));
            }
            rowData.push(
                formatNumber(row.cashback),
                formatNumber(row.totalSurrenderBenefit),
                formatNumber(row.totalDeathBenefit)
            );
            return rowData;
        });
        
        const summaryRow: CellDef[] = [
            { content: 'รวม', styles: { fontStyle: 'bold', halign: 'center' }, colSpan: 2 },
            { content: formatNumber(results.totalPremium), styles: { fontStyle: 'bold', halign: 'right' } },
        ];
        if (includeTaxBenefit) {
            summaryRow.push({ content: formatNumber(results.totalTaxBenefit), styles: { fontStyle: 'bold', halign: 'right' } });
        }
        summaryRow.push(
            { content: formatNumber(results.totalCashback), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `IRR: ${results.irrSurrender?.toFixed(2) ?? 'N/A'} %`, styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `IRR: ${results.irrDeath?.toFixed(2) ?? 'N/A'} %`, styles: { fontStyle: 'bold', halign: 'right' } }
        );
        body.push(summaryRow);

        const columnStyles: { [key: number]: any } = {};
        if (includeTaxBenefit) {
            columnStyles[2] = { halign: 'right' };
            columnStyles[3] = { halign: 'right' };
            columnStyles[4] = { halign: 'right' };
            columnStyles[5] = { halign: 'right' };
            columnStyles[6] = { halign: 'right' };
        } else {
            columnStyles[2] = { halign: 'right' };
            columnStyles[3] = { halign: 'right' };
            columnStyles[4] = { halign: 'right' };
            columnStyles[5] = { halign: 'right' };
        }

        autoTable(doc, {
            head: head,
            body: body,
            startY: 75,
            theme: 'grid',
            headStyles: { font: 'Sarabun', fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 },
            bodyStyles: { font: 'Sarabun', fontStyle: 'normal', cellPadding: 1.5, fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            styles: { halign: 'center' },
            columnStyles: columnStyles
        });

        doc.save('financial_report.pdf');
    } catch (error) {
        console.error("Error creating PDF:", error);
        alert("เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาตรวจสอบ Console log");
    }
};