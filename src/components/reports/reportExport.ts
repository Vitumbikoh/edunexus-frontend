import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_CONFIG } from "@/config/api";

export interface ExportReportParams {
  title: string;
  summary: { label: string; value: any }[];
  columns: string[];
  rows: (string | number)[][];
  filename?: string;
  schoolLogo?: string | null;
}

// Helper function to load image as base64
const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};

// Helper function to get school logo URL
const getLogoUrl = (logoPath: string | null): string | null => {
  if (!logoPath) return null;
  return `${API_CONFIG.BASE_URL}/uploads/logos/${logoPath}`;
};

export const exportReportToPdf = async ({
  title,
  summary,
  columns,
  rows,
  filename = "report.pdf",
  schoolLogo,
}: ExportReportParams) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let currentY = 40;

  // Add school logo if available
  if (schoolLogo) {
    const logoUrl = getLogoUrl(schoolLogo);
    if (logoUrl) {
      try {
        const logoBase64 = await loadImageAsBase64(logoUrl);
        doc.addImage(logoBase64, 'PNG', 40, 20, 80, 80);
        
        // Title next to logo
        doc.setFontSize(18);
        doc.text(title, 130, 50);
        currentY = 110;
      } catch (error) {
        console.error('Error loading logo:', error);
        // Fallback to regular title
        doc.setFontSize(18);
        doc.text(title, 40, 40);
        currentY = 60;
      }
    }
  } else {
    // No logo, use regular title
    doc.setFontSize(18);
    doc.text(title, 40, 40);
    currentY = 60;
  }

  // Summary as a small table
  if (summary?.length) {
    const summaryBody = summary.map((s) => [s.label, String(s.value)]);
    autoTable(doc, {
      startY: currentY,
      margin: { left: 40, right: 40 },
      head: [["Summary", "Value"]],
      body: summaryBody,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    currentY = (doc as any).lastAutoTable.finalY + 20;
  }

  // Main data table
  autoTable(doc, {
    startY: currentY,
    margin: { left: 40, right: 40 },
    head: [columns],
    body: rows,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(filename);
};
