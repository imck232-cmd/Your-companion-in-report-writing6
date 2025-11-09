import { Report, GeneralEvaluationReport, ClassSessionEvaluationReport, Teacher, SpecialReport } from '../types';

declare const jspdf: any;
declare const XLSX: any;

const getScorePercentage = (score: number, maxScore: number = 4) => {
    if (maxScore === 0) return 0;
    return (score / maxScore) * 100;
};

const calculateReportPercentage = (report: Report): number => {
    let allScores: number[] = [];
    let maxScorePerItem = 4;

    if (report.evaluationType === 'general' || report.evaluationType === 'special') {
        allScores = (report as GeneralEvaluationReport).criteria.map(c => c.score);
    } else if (report.evaluationType === 'class_session') {
        allScores = (report as ClassSessionEvaluationReport).criterionGroups.flatMap(g => g.criteria).map(c => c.score);
    }
    
    if (allScores.length === 0) return 0;
    const totalScore = allScores.reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = allScores.length * maxScorePerItem;
    return (totalScore / maxPossibleScore) * 100;
};

const SEPARATOR = '\n\n━━━━━━━━━━ ✨ ━━━━━━━━━━\n\n';

const generateTextContent = (report: Report, teacher: Teacher): string => {
    let content = `*تقرير لـ:* ${teacher.name}\n`;
    content += `*تاريخ:* ${new Date(report.date).toLocaleDateString()}\n`;
    content += `*المدرسة:* ${report.school}\n*المادة:* ${report.subject}\n*الصفوف:* ${report.grades}\n*الفرع:* ${report.branch}\n`;

    if (report.evaluationType === 'general' || report.evaluationType === 'special') {
        const r = report as GeneralEvaluationReport | SpecialReport;
        const title = report.evaluationType === 'general' ? 'تقييم عام' : `تقرير خاص: ${report.templateName}`;
        content += `${SEPARATOR}--- *${title}* ---\n\n`;
        r.criteria.forEach(c => {
            content += `- *${c.label}:* ${c.score} / 4 (⭐ ${getScorePercentage(c.score, 4).toFixed(0)}%)\n`;
        });
        content += `\n*النسبة المئوية النهائية:* ${calculateReportPercentage(r).toFixed(2)}%\n`;

        if (report.evaluationType === 'general') {
            content += `${SEPARATOR}*أهم الاستراتيجيات المنفذة:*\n${report.strategies}\n`;
            content += `\n*أهم الوسائل المستخدمة:*\n${report.tools}\n`;
            content += `\n*أهم البرامج المنفذة:*\n${report.programs}\n`;
        }

    } else if (report.evaluationType === 'class_session') {
        const r = report as ClassSessionEvaluationReport;
        content += `${SEPARATOR}--- *تقييم حصة دراسية (${r.subType})* ---\n\n`;
        content += `*اسم المشرف:* ${r.supervisorName}\n`;
        content += `*الفصل الدراسي:* ${r.semester}\n`;
        content += `*نوع الزيارة:* ${r.visitType}\n`;
        content += `*الصف:* ${r.class} / ${r.section}\n`;
        content += `*عنوان الدرس:* ${r.lessonName}\n`;

        r.criterionGroups.forEach(group => {
            content += `\n*${group.title}:*\n`;
            group.criteria.forEach(c => {
                content += `  - ${c.label}: ${c.score} / 4 (⭐ ${getScorePercentage(c.score, 4).toFixed(0)}%)\n`;
            });
        });
        content += `\n*النسبة المئوية النهائية:* ${calculateReportPercentage(r).toFixed(2)}%\n`;
        content += `${SEPARATOR}*الإيجابيات:*\n${r.positives}\n`;
        content += `\n*ملاحظات للتحسين:*\n${r.notesForImprovement}\n`;
        content += `\n*التوصيات:*\n${r.recommendations}\n`;
        content += `\n*تعليق الموظف:*\n${r.employeeComment}\n`;
    }

    return content;
};

// --- SINGLE REPORT EXPORT ---

export const exportToTxt = (report: Report, teacher: Teacher) => {
    const content = generateTextContent(report, teacher).replace(/\*/g, ''); // Remove markdown for TXT
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `report_${teacher.name}_${report.date}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const addBorderToPdf = (doc: any) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(22, 120, 109); // Primary color
        doc.setLineWidth(0.5);
        doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10);
    }
}

const setupPdfDoc = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    doc.addFont('https://fonts.gstatic.com/s/amiri/v25/J7aRnpd8CGxBHqU2sQ.woff2', 'Amiri', 'normal');
    doc.setFont('Amiri');
    return doc;
}

const rtl = (text: string) => text.split(' ').reverse().join(' ');

const generatePdfForReport = (doc: any, report: Report, teacher: Teacher, startY: number) => {
    let y = startY;
    const writeRtl = (text: string, yPos: number) => doc.text(rtl(text), 200, yPos, { align: 'right' });

    writeRtl(`تقرير لـ: ${teacher.name}`, y); y += 7;
    writeRtl(`تاريخ: ${new Date(report.date).toLocaleDateString()}`, y); y += 7;
    writeRtl(`المدرسة: ${report.school} | المادة: ${report.subject} | الصفوف: ${report.grades} | الفرع: ${report.branch}`, y); y+= 10;
    
    const tableStyles = { font: 'Amiri', halign: 'right', cellPadding: 2, margin: { right: 10, left: 10 } };
    const headStyles = { halign: 'right', fillColor: [22, 120, 109], textColor: 255 };

    if (report.evaluationType === 'general' || report.evaluationType === 'special') {
        const r = report as GeneralEvaluationReport | SpecialReport;
        const title = report.evaluationType === 'general' ? 'تقييم عام' : `تقرير خاص: ${report.templateName}`;
        writeRtl(title, y); y += 7;

        doc.autoTable({
            startY: y,
            head: [[rtl('النسبة'), rtl('الدرجة'), rtl('المعيار')]],
            body: r.criteria.map(c => [`%${getScorePercentage(c.score, 4).toFixed(0)}`, c.score, rtl(c.label)]),
            styles: tableStyles, headStyles
        });
        y = doc.lastAutoTable.finalY + 10;
        writeRtl(`النسبة النهائية: ${calculateReportPercentage(r).toFixed(2)}%`, y); y+=10;
        if(report.evaluationType === 'general'){
            doc.text(rtl(`أهم الاستراتيجيات المنفذة: ${report.strategies}`), 200, y, { align: 'right', maxWidth: 180 }); y += 15;
            doc.text(rtl(`أهم الوسائل المستخدمة: ${report.tools}`), 200, y, { align: 'right', maxWidth: 180 }); y += 15;
            doc.text(rtl(`أهم البرامج المنفذة: ${report.programs}`), 200, y, { align: 'right', maxWidth: 180 }); y += 10;
        }

    } else if (report.evaluationType === 'class_session') {
        const r = report as ClassSessionEvaluationReport;
        r.criterionGroups.forEach(group => {
            doc.autoTable({
                startY: y,
                head: [[rtl(group.title)]],
                body: group.criteria.map(c => [rtl(c.label), c.score]),
                styles: tableStyles, headStyles: {...headStyles, fillColor: [75, 85, 99]},
                didParseCell: (data:any) => { data.cell.styles.halign = data.column.index === 1 ? 'center' : 'right' }
            });
            y = doc.lastAutoTable.finalY + 5;
        });
        y+=5;
        writeRtl(`النسبة النهائية: ${calculateReportPercentage(r).toFixed(2)}%`, y); y+=10;
        doc.text(rtl(`الإيجابيات: ${r.positives}`), 200, y, { align: 'right', maxWidth: 180 }); y += 15;
        doc.text(rtl(`ملاحظات للتحسين: ${r.notesForImprovement}`), 200, y, { align: 'right', maxWidth: 180 }); y += 15;
    }
    return y;
}


export const exportToPdf = (report: Report, teacher: Teacher) => {
    const doc = setupPdfDoc();
    generatePdfForReport(doc, report, teacher, 20);
    addBorderToPdf(doc);
    doc.save(`report_${teacher.name}_${report.date}.pdf`);
};

export const exportToExcel = (report: Report, teacher: Teacher) => {
    const data: any[] = [];
    data.push(["المعلم", teacher.name]);
    data.push(["التاريخ", new Date(report.date).toLocaleDateString()]);
    data.push(["المدرسة", report.school]);
    data.push(["المادة", report.subject]);
    data.push(["الصفوف", report.grades]);
    data.push(["الفرع", report.branch]);
    data.push([]); // Spacer

    if (report.evaluationType === 'general') {
        const r = report as GeneralEvaluationReport;
        data.push(["نوع التقييم", "تقييم عام"]);
        data.push([]);
        data.push(["المعيار", "الدرجة", "النسبة"]);
        r.criteria.forEach(c => {
            data.push([c.label, c.score, `${getScorePercentage(c.score, 4).toFixed(0)}%`]);
        });
        data.push([]);
        data.push(["النسبة النهائية", `${calculateReportPercentage(r).toFixed(2)}%`]);
        data.push([]);
        data.push(["الاستراتيجيات", r.strategies]);
        data.push(["الوسائل", r.tools]);
        data.push(["البرامج", r.programs]);
        data.push(["المصادر", r.sources]);
    } else if (report.evaluationType === 'class_session') {
        const r = report as ClassSessionEvaluationReport;
        data.push(["نوع التقييم", `تقييم حصة دراسية (${r.subType})`]);
        data.push(["اسم المشرف", r.supervisorName], ["الفصل الدراسي", r.semester], ["نوع الزيارة", r.visitType], ["الصف", `${r.class} / ${r.section}`], ["عنوان الدرس", r.lessonName]);
        data.push([]);
         r.criterionGroups.forEach(group => {
            data.push([group.title, "الدرجة"]);
            group.criteria.forEach(c => {
                data.push([`  - ${c.label}`, c.score]);
            });
        });
        data.push([]);
        data.push(["النسبة النهائية", `${calculateReportPercentage(r).toFixed(2)}%`]);
        data.push([]);
        data.push(["الاستراتيجيات", r.strategies]);
        data.push(["الوسائل", r.tools]);
        data.push(["المصادر", r.sources]);
        data.push(["البرامج", r.programs]);
        data.push([]);
        data.push(["الإيجابيات", r.positives]);
        data.push(["ملاحظات للتحسين", r.notesForImprovement]);
        data.push(["التوصيات", r.recommendations]);
        data.push(["تعليق الموظف", r.employeeComment]);
    } else if (report.evaluationType === 'special') {
        const r = report as SpecialReport;
        data.push(["نوع التقييم", `تقرير خاص: ${r.templateName}`]);
        data.push([]);
        data.push(["المعيار", "الدرجة", "النسبة"]);
        r.criteria.forEach(c => {
            data.push([c.label, c.score, `${getScorePercentage(c.score, 4).toFixed(0)}%`]);
        });
        data.push([]);
        data.push(["النسبة النهائية", `${calculateReportPercentage(r).toFixed(2)}%`]);
    }


    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `report_${teacher.name}_${report.date}.xlsx`);
};


export const sendToWhatsApp = (report: Report, teacher: Teacher) => {
    const content = generateTextContent(report, teacher);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(content)}`;
    window.open(whatsappUrl, '_blank');
};

// --- AGGREGATED REPORTS EXPORT ---

const generateAggregatedText = (reports: Report[], teachers: Teacher[]): string => {
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    let fullContent = "--- تقارير مجمعة ---\n\n";
    reports.forEach(report => {
        const teacher = teacherMap.get(report.teacherId);
        if (teacher) {
            fullContent += generateTextContent(report, teacher).replace(/\*/g, '');
            fullContent += "\n================================\n\n";
        }
    });
    return fullContent;
}

export const exportAggregatedToTxt = (reports: Report[], teachers: Teacher[]) => {
    const content = generateAggregatedText(reports, teachers);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aggregated_reports_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
};

export const exportAggregatedToPdf = (reports: Report[], teachers: Teacher[]) => {
    const doc = setupPdfDoc();
    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    let y = 20;

    reports.forEach((report, index) => {
        const teacher = teacherMap.get(report.teacherId);
        if (teacher) {
            if (index > 0) {
                const newY = generatePdfForReport(doc, report, teacher, 20);
                if (newY > doc.internal.pageSize.height - 20) {
                    doc.addPage();
                    y = 20;
                    generatePdfForReport(doc, report, teacher, y);
                }
            } else {
                 generatePdfForReport(doc, report, teacher, y);
            }
        }
    });
    addBorderToPdf(doc);
    doc.save(`aggregated_reports_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportAggregatedToExcel = (reports: Report[], teachers: Teacher[]) => {
    const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
    const data = reports.map(r => {
        let type = '';
        if (r.evaluationType === 'general') type = 'عام';
        else if (r.evaluationType === 'class_session') type = 'حصة دراسية';
        else if (r.evaluationType === 'special') type = r.templateName;

        return {
            "المعلم": teacherMap.get(r.teacherId) || 'غير معروف',
            "التاريخ": new Date(r.date).toLocaleDateString(),
            "المدرسة": r.school,
            "نوع التقييم": type,
            "النسبة المئوية": calculateReportPercentage(r).toFixed(2) + '%'
        };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aggregated Reports");
    XLSX.writeFile(wb, `aggregated_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const sendAggregatedToWhatsApp = (reports: Report[], teachers: Teacher[]) => {
    const content = generateAggregatedText(reports, teachers);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(content)}`;
    window.open(whatsappUrl, '_blank');
};
