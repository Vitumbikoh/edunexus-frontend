import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportReportParams {
  title: string;
  summary: { label: string; value: any }[];
  columns: string[];
  rows: (string | number)[][];
  filename?: string;
}

export const exportReportToPdf = ({
  title,
  summary,
  columns,
  rows,
  filename = "report.pdf",
}: ExportReportParams) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Title
  doc.setFontSize(18);
  doc.text(title, 40, 40);

  // Summary as a small table
  if (summary?.length) {
    const summaryBody = summary.map((s) => [s.label, String(s.value)]);
    autoTable(doc, {
      startY: 60,
      margin: { left: 40, right: 40 },
      head: [["Summary", "Value"]],
      body: summaryBody,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  // Grades table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 100,
    margin: { left: 40, right: 40 },
    head: [columns],
    body: rows,
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(filename);
};
