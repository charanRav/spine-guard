import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DailyPostureData } from '@/types/analytics';

export const exportToPDF = async (
  elementId: string,
  filename: string = 'posture-report.pdf'
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found for PDF export');
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    // Add additional pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateReportData = (
  data: DailyPostureData[],
  startDate: string,
  endDate: string
) => {
  const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0);
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalGood = data.reduce((sum, d) => sum + d.goodCount, 0);
  const totalModerate = data.reduce((sum, d) => sum + d.moderateCount, 0);
  const totalPoor = data.reduce((sum, d) => sum + d.poorCount, 0);
  const total = totalGood + totalModerate + totalPoor;

  const averageScore =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.averageScore, 0) / data.length
      : 0;

  return {
    period: `${startDate} to ${endDate}`,
    totalSessions,
    totalMinutes: Math.round(totalMinutes),
    totalHours: (totalMinutes / 60).toFixed(1),
    goodPercentage: total > 0 ? ((totalGood / total) * 100).toFixed(1) : '0',
    moderatePercentage: total > 0 ? ((totalModerate / total) * 100).toFixed(1) : '0',
    poorPercentage: total > 0 ? ((totalPoor / total) * 100).toFixed(1) : '0',
    averageScore: averageScore.toFixed(0),
    daysTracked: data.filter((d) => d.totalSessions > 0).length,
  };
};
