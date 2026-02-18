import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { API_BASE_URL, getServerBaseUrl } from '@/config/api';

// Helper function to load and convert image to base64 for PDF
const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

// Type definition for school information from API
type SchoolInfo = {
  school?: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  settings?: {
    id: string;
    schoolId: string;
    schoolName?: string;
    schoolEmail?: string;
    schoolPhone?: string;
    schoolAddress?: string;
    schoolAbout?: string;
    schoolLogo?: string;
  };
};

// Basic school info used in report headers/footers. Read from env with defaults.
const getSchoolInfo = (apiSchoolInfo?: SchoolInfo) => {
  // Use API data if available, otherwise fall back to env vars
  if (apiSchoolInfo?.school || apiSchoolInfo?.settings) {
    const school = apiSchoolInfo.school;
    const settings = apiSchoolInfo.settings;
    return {
      name: settings?.schoolName || school?.name || 'School Name',
      address: settings?.schoolAddress || '123 Academy Lane, City, Country',
      phone: settings?.schoolPhone || '+1 (555) 123-4567',
      email: settings?.schoolEmail || 'info@school.com',
      website: (import.meta.env.VITE_SCHOOL_WEBSITE as string) || 'www.school.com',
      logo: settings?.schoolLogo || null,
    };
  }
  
  // Fallback to environment variables
  return {
    name: (import.meta.env.VITE_SCHOOL_NAME as string) || 'Schomas School',
    address: (import.meta.env.VITE_SCHOOL_ADDRESS as string) || '123 Academy Lane, City, Country',
    phone: (import.meta.env.VITE_SCHOOL_PHONE as string) || '+1 (555) 123-4567',
    email: (import.meta.env.VITE_SCHOOL_EMAIL as string) || 'info@schomas.com',
    website: (import.meta.env.VITE_SCHOOL_WEBSITE as string) || 'www.schomas.com',
    logo: null,
  };
};

// Returns options to pass into autoTable to draw a professional header and footer on each page.
const addPdfHeaderFooterOptions = (doc: any, apiSchoolInfo?: SchoolInfo, logoImage?: string) => {
  const school = getSchoolInfo(apiSchoolInfo);
  const headerHeight = 80; // increased header height to fit stacked contact lines
  return {
    didDrawPage: (data: any) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Professional Header Design
      // Header background rectangle — increased height so contact lines fit comfortably
      doc.setFillColor(245, 248, 251); // Light blue-gray background
      doc.rect(0, 0, pageWidth, headerHeight, 'F');
      
      // Header border line (moved down to sit under contact lines)
      doc.setDrawColor(66, 139, 202); // Professional blue
      doc.setLineWidth(0.5);
      doc.line(0, headerHeight, pageWidth, headerHeight);
      
      // School Logo - if available
      let textStartX = 20;
      if (logoImage) {
        try {
          const logoSize = 30; // Logo size in points
          const logoX = 15;
          const logoY = 7.5; // Centered vertically in header
          doc.addImage(logoImage, 'PNG', logoX, logoY, logoSize, logoSize);
          textStartX = logoX + logoSize + 10; // Adjust text start position
        } catch (error) {
          console.warn('Failed to add logo to PDF:', error);
        }
      }
      
      // School Name - left aligned; contact stacked below (address, phone, email)
      doc.setTextColor(44, 62, 80); // Dark blue-gray
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      const nameY = 28; // slightly lower for better spacing
      doc.text(school.name, textStartX, nameY);

      // Contact lines (left-aligned, with increased line spacing)
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(85, 85, 85); // Medium gray
      let currentContactY = nameY + 12; // start below the school name
      if (school.address) { doc.text(`${school.address}`, textStartX, currentContactY); currentContactY += 14; }
      if (school.phone)   { doc.text(`Phone: ${school.phone}`, textStartX, currentContactY); currentContactY += 14; }
      if (school.email)   { doc.text(`Email: ${school.email}`, textStartX, currentContactY); currentContactY += 14; }

      // Professional Footer Design
      const footerY = pageHeight - 15;
      
      // Footer separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      
      // Generated info and page number
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont(undefined, 'normal');
      
      const generateDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Left side - Generation info
      doc.text(`Generated on ${generateDate}`, 20, footerY);
      
      // Right side - Page number and school name
      const pageText = `Page ${data.pageNumber} | ${school.name}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - 20 - pageTextWidth, footerY);
    },
    margin: { top: headerHeight + 12, bottom: 25, left: 20, right: 20 }, // top margin increased to match header height
  };
};

// Helper function to get logo URL for PDFs
const getLogoUrl = (schoolInfo?: SchoolInfo): string | null => {
  const school = getSchoolInfo(schoolInfo);
  if (school.logo) {
    const baseUrl = getServerBaseUrl();
    return `${baseUrl}${school.logo}`;
  }
  return null;
};

const createPdfDoc = () =>
  new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

const formatDisplayDate = (value: any) => {
  if (!value) return 'N/A';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatCurrency = (value: any) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'N/A';
  return `$${amount.toLocaleString()}`;
};

const getTitleY = (headerFooterOpts: any) => (headerFooterOpts.margin?.top ?? 92) - 28;

const drawReportHeading = (
  doc: any,
  title: string,
  summary: string,
  headerFooterOpts: any,
) => {
  const titleY = getTitleY(headerFooterOpts);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text(title, 20, titleY);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(85, 85, 85);
  doc.text(summary, 20, titleY + 14);

  return (headerFooterOpts.margin?.top ?? 92) + 8;
};

const getProfessionalTableTheme = (
  headerFooterOpts: any,
  fillColor: [number, number, number],
  headTextColor: [number, number, number] = [255, 255, 255],
) => ({
  ...headerFooterOpts,
  styles: {
    fontSize: 7.5,
    cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
    lineColor: [226, 232, 240],
    lineWidth: 0.5,
    textColor: [31, 41, 55],
    overflow: 'ellipsize',
    valign: 'middle',
  },
  headStyles: {
    fillColor,
    textColor: headTextColor,
    fontSize: 8.5,
    fontStyle: 'bold',
    halign: 'center',
    valign: 'middle',
    cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
  },
  bodyStyles: {
    minCellHeight: 17,
  },
  alternateRowStyles: {
    fillColor: [248, 250, 252],
  },
  tableLineColor: [203, 213, 225],
  tableLineWidth: 0.6,
  tableWidth: 'auto',
  rowPageBreak: 'avoid',
});

const createPdfContext = async (schoolInfo?: SchoolInfo) => {
  const doc: any = createPdfDoc();
  const logoUrl = getLogoUrl(schoolInfo);
  let logoImage: string | undefined;

  if (logoUrl) {
    try {
      logoImage = await loadImageAsBase64(logoUrl);
    } catch (error) {
      console.warn('Failed to load logo for PDF:', error);
    }
  }

  const headerFooterOpts = addPdfHeaderFooterOptions(doc, schoolInfo, logoImage);
  return { doc, headerFooterOpts };
};

const generateStudentsExcel = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const school = getSchoolInfo(schoolInfo);
    const headerRows = [
      [school.name + (school.logo ? ' (Logo Available)' : '')],
      [school.address || ''],
      [school.phone ? `Phone: ${school.phone}` : ''],
      [school.email ? `Email: ${school.email}` : ''],
      [],
    ];

    const dataRows = data.map(item => [
      item.studentHumanId || item.studentId || 'N/A',
      item.name || 'N/A',
      item.gender || 'N/A',
      item.className || 'N/A',
      item.grade || 'N/A',
      item.address || 'N/A',
      item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
      item.age ?? 'N/A',
      item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
      item.status || 'N/A',
      item.owesBooks || 'NO',
    ]);

    const aoa = [
      ...headerRows,
      ['Student ID', 'Name', 'Gender', 'Class', 'Grade', 'Address', 'Date of Birth', 'Age', 'Enrollment Date', 'Status', 'Owes Books'],
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa as any);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students-report.xlsx');
  } catch (error) {
    console.error('Error generating students Excel:', error);
    throw new Error('Failed to generate students Excel report');
  }
};

const generateTeachersExcel = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const school = getSchoolInfo(schoolInfo);
    const headerRows = [
      [school.name + (school.logo ? ' (Logo Available)' : '')],
      [school.address || ''],
      [school.phone ? `Phone: ${school.phone}` : ''],
      [school.email ? `Email: ${school.email}` : ''],
      [],
    ];
    const dataRows = data.map(item => [
      item.name || 'N/A',
      item.gender || 'N/A',
      item.email || 'N/A',
      item.phoneNumber || 'N/A',
      item.qualification || 'N/A',
      item.yearsOfExperience ?? 'N/A',
      item.address || 'N/A',
      item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
      item.hireDate ? new Date(item.hireDate).toLocaleDateString() : (item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A'),
      item.status || 'N/A',
      item.className || 'N/A',
      item.subjectSpecialization || 'N/A',
    ]);

    const aoa = [
      ...headerRows,
      ['Name', 'Gender', 'Email', 'Phone', 'Qualification', 'Years Exp', 'Address', 'Date of Birth', 'Hire Date', 'Status', 'Class', 'Specialization'],
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa as any);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
    XLSX.writeFile(wb, 'teachers-report.xlsx');
  } catch (error) {
    console.error('Error generating teachers Excel:', error);
    throw new Error('Failed to generate teachers Excel report');
  }
};

const generateCoursesExcel = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const school = getSchoolInfo(schoolInfo);
    const headerRows = [
      [school.name + (school.logo ? ' (Logo Available)' : '')],
      [school.address || ''],
      [school.phone ? `Phone: ${school.phone}` : ''],
      [school.email ? `Email: ${school.email}` : ''],
      [],
    ];
    const dataRows = data.map(item => [
      item.name || 'N/A',
      item.code || 'N/A',
      item.className || 'N/A',
      item.teacherName || 'N/A',
      item.department || 'N/A',
      item.credits || 0,
      item.enrollmentCount || 0,
      item.status || 'N/A',
      item.active === true ? 'YES' : 'NO',
    ]);
    const aoa = [
      ...headerRows,
      ['Name', 'Code', 'Class', 'Teacher', 'Department', 'Credits', 'Enrollment Count', 'Status', 'Active'],
      ...dataRows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa as any);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'courses-report.xlsx');
  } catch (error) {
    console.error('Error generating courses Excel:', error);
    throw new Error('Failed to generate courses Excel report');
  }
};

const generateEnrollmentsExcel = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const school = getSchoolInfo(schoolInfo);
    const headerRows = [
      [school.name + (school.logo ? ' (Logo Available)' : '')],
      [school.address || ''],
      [school.phone ? `Phone: ${school.phone}` : ''],
      [school.email ? `Email: ${school.email}` : ''],
      [],
    ];
    const dataRows = data.map(item => [
      item.studentHumanId || item.studentId || 'N/A',
      item.studentName || 'N/A',
      item.courseName || 'N/A',
      item.className || 'N/A',
      item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
      item.status || 'N/A',
      item.termName || 'N/A',
      item.academicYearName || 'N/A',
    ]);
    const aoa = [
      ...headerRows,
      ['Student ID', 'Student', 'Course', 'Class', 'Enrollment Date', 'Status', 'Term', 'Academic Year'],
      ...dataRows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa as any);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollments');
    XLSX.writeFile(wb, 'enrollments-report.xlsx');
  } catch (error) {
    console.error('Error generating enrollments Excel:', error);
    throw new Error('Failed to generate enrollments Excel report');
  }
};

const generateFeePaymentsExcel = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const school = getSchoolInfo(schoolInfo);
    const headerRows = [
      [school.name + (school.logo ? ' (Logo Available)' : '')],
      [school.address || ''],
      [school.phone ? `Phone: ${school.phone}` : ''],
      [school.email ? `Email: ${school.email}` : ''],
      [],
    ];
    const dataRows = data.map(item => [
      item.studentHumanId || item.studentId || 'N/A',
      item.studentName || 'N/A',
      item.className || 'N/A',
      item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
      item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
      item.paymentMethod || 'N/A',
      item.status || 'N/A',
      item.termName || 'N/A',
    ]);
    const aoa = [
      ...headerRows,
      ['Student ID', 'Student', 'Class', 'Amount', 'Payment Date', 'Payment Method', 'Status', 'Term'],
      ...dataRows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa as any);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Payments');
    XLSX.writeFile(wb, 'fee-payments-report.xlsx');
  } catch (error) {
    console.error('Error generating fee payments Excel:', error);
    throw new Error('Failed to generate fee payments Excel report');
  }
};

const generateComprehensiveExcel = (data: {
  students: any[];
  teachers: any[];
  courses: any[];
  enrollments: any[];
  feePayments: any[];
  schoolInfo?: SchoolInfo;
}) => {
  try {
    const wb = XLSX.utils.book_new();

    // Students sheet with title row
    const studentsAoa = [
      ['Students Report'],
      [],
      ['Student ID', 'Name', 'Gender', 'Class', 'Grade', 'Address', 'Date of Birth', 'Age', 'Enrollment Date', 'Status', 'Owes Books'],
      ...data.students.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.name || 'N/A',
        item.gender || 'N/A',
        item.className || 'N/A',
        item.grade || 'N/A',
        item.address || 'N/A',
        item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
        item.age ?? 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
        item.owesBooks || 'NO',
      ])
    ];
    const studentsWs = XLSX.utils.aoa_to_sheet(studentsAoa as any);
    XLSX.utils.book_append_sheet(wb, studentsWs, 'Students');

    // Teachers sheet with title row
    const teachersAoa = [
      ['Teachers Report'],
      [],
      ['Name', 'Gender', 'Email', 'Phone', 'Qualification', 'Years Exp', 'Address', 'Date of Birth', 'Hire Date', 'Status', 'Class', 'Specialization'],
      ...data.teachers.map(item => [
        item.name || 'N/A',
        item.gender || 'N/A',
        item.email || 'N/A',
        item.phoneNumber || 'N/A',
        item.qualification || 'N/A',
        item.yearsOfExperience ?? 'N/A',
        item.address || 'N/A',
        item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
        item.hireDate ? new Date(item.hireDate).toLocaleDateString() : (item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A'),
        item.status || 'N/A',
        item.className || 'N/A',
        item.subjectSpecialization || 'N/A',
      ])
    ];
    const teachersWs = XLSX.utils.aoa_to_sheet(teachersAoa as any);
    XLSX.utils.book_append_sheet(wb, teachersWs, 'Teachers');

    // Courses sheet with title row
    const coursesAoa = [
      ['Courses Report'],
      [],
      ['Name', 'Code', 'Class', 'Teacher', 'Department', 'Credits', 'Enrollment Count', 'Status', 'Active'],
      ...data.courses.map(item => [
        item.name || 'N/A',
        item.code || 'N/A',
        item.className || 'N/A',
        item.teacherName || 'N/A',
        item.department || 'N/A',
        item.credits || 0,
        item.enrollmentCount || 0,
        item.status || 'N/A',
        item.active === true ? 'YES' : 'NO',
      ])
    ];
    const coursesWs = XLSX.utils.aoa_to_sheet(coursesAoa as any);
    XLSX.utils.book_append_sheet(wb, coursesWs, 'Courses');

    const enrollmentsAoa = [
      ['Enrollments Report'],
      [],
      ['Student ID', 'Student', 'Course', 'Class', 'Enrollment Date', 'Status', 'Term', 'Academic Year'],
      ...data.enrollments.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.className || 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
        item.academicYearName || 'N/A',
      ]),
    ];
    const enrollmentsWs = XLSX.utils.aoa_to_sheet(enrollmentsAoa as any);
    XLSX.utils.book_append_sheet(wb, enrollmentsWs, 'Enrollments');

    // Fee payments sheet with title row
    const feePaymentsAoa = [
      ['Financial / Fee Payments Report'],
      [],
      ['Student ID', 'Student', 'Class', 'Amount', 'Payment Date', 'Payment Method', 'Status', 'Term'],
      ...data.feePayments.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.className || 'N/A',
        item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
      ])
    ];
    const feePaymentsWs = XLSX.utils.aoa_to_sheet(feePaymentsAoa as any);
    XLSX.utils.book_append_sheet(wb, feePaymentsWs, 'Fee Payments');

    XLSX.writeFile(wb, 'comprehensive-report.xlsx');
  } catch (error) {
    console.error('Error generating comprehensive Excel:', error);
    throw new Error('Failed to generate comprehensive Excel report');
  }
};


// Initialize jsPDF with autoTable and generate PDF reports
const generateStudentsPDF = async (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const { doc, headerFooterOpts } = await createPdfContext(schoolInfo);
    const tableStartY = drawReportHeading(doc, 'Students Report', `Total Students: ${data.length}`, headerFooterOpts);

    autoTable(doc, {
      head: [['Student ID', 'Name', 'Gender', 'Class', 'Address', 'DOB', 'Age', 'Status', 'Owes Books']],
      body: data.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.name || 'N/A',
        item.gender || 'N/A',
        item.className || 'N/A',
        item.address || 'N/A',
        formatDisplayDate(item.dateOfBirth),
        item.age ?? 'N/A',
        item.status || 'N/A',
        item.owesBooks || 'NO',
      ]),
      startY: tableStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [33, 95, 160]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 52 },
        1: { cellWidth: 86 },
        2: { halign: 'center', cellWidth: 44 },
        3: { halign: 'center', cellWidth: 52 },
        4: { cellWidth: 118, overflow: 'linebreak' },
        5: { halign: 'center', cellWidth: 56 },
        6: { halign: 'center', cellWidth: 30 },
        7: { halign: 'center', cellWidth: 50 },
        8: { halign: 'center', cellWidth: 55 },
      },
    });
    doc.save('students-report.pdf');
  } catch (error) {
    console.error('Error generating students PDF:', error);
    throw new Error('Failed to generate students PDF report');
  }
};

const generateTeachersPDF = async (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const { doc, headerFooterOpts } = await createPdfContext(schoolInfo);
    const tableStartY = drawReportHeading(doc, 'Teachers Report', `Total Teachers: ${data.length}`, headerFooterOpts);

    autoTable(doc, {
      head: [['Name', 'Gender', 'Phone', 'Qualification', 'Experience', 'Address', 'DOB', 'Hire Date', 'Status']],
      body: data.map(item => [
        item.name || 'N/A',
        item.gender || 'N/A',
        item.phoneNumber || 'N/A',
        item.qualification || 'N/A',
        item.yearsOfExperience ? `${item.yearsOfExperience} yrs` : 'N/A',
        item.address || 'N/A',
        formatDisplayDate(item.dateOfBirth),
        formatDisplayDate(item.hireDate || item.joinDate),
        item.status || 'N/A',
      ]),
      startY: tableStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [22, 163, 74]),
      columnStyles: {
        0: { cellWidth: 74 },
        1: { halign: 'center', cellWidth: 38 },
        2: { cellWidth: 60 },
        3: { cellWidth: 76 },
        4: { halign: 'center', cellWidth: 52 },
        5: { cellWidth: 102, overflow: 'linebreak' },
        6: { halign: 'center', cellWidth: 52 },
        7: { halign: 'center', cellWidth: 52 },
        8: { halign: 'center', cellWidth: 40 },
      },
    });
    doc.save('teachers-report.pdf');
  } catch (error) {
    console.error('Error generating teachers PDF:', error);
    throw new Error('Failed to generate teachers PDF report');
  }
};

const generateCoursesPDF = async (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const { doc, headerFooterOpts } = await createPdfContext(schoolInfo);
    const tableStartY = drawReportHeading(doc, 'Courses Report', `Total Courses: ${data.length}`, headerFooterOpts);

    autoTable(doc, {
      head: [['Name', 'Code', 'Class', 'Teacher', 'Department', 'Credits', 'Enrollments', 'Status', 'Active']],
      body: data.map(item => [
        item.name || 'N/A',
        item.code || 'N/A',
        item.className || 'N/A',
        item.teacherName || 'N/A',
        item.department || 'N/A',
        item.credits ?? 0,
        item.enrollmentCount ?? 0,
        item.status || 'N/A',
        item.active === true ? 'YES' : 'NO',
      ]),
      startY: tableStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [14, 116, 144]),
      columnStyles: {
        0: { cellWidth: 88 },
        1: { halign: 'center', cellWidth: 44 },
        2: { halign: 'center', cellWidth: 48 },
        3: { cellWidth: 84 },
        4: { cellWidth: 82 },
        5: { halign: 'center', cellWidth: 46 },
        6: { halign: 'center', cellWidth: 50 },
        7: { halign: 'center', cellWidth: 58 },
        8: { halign: 'center', cellWidth: 42 },
      },
    });
    doc.save('courses-report.pdf');
  } catch (error) {
    console.error('Error generating courses PDF:', error);
    throw new Error('Failed to generate courses PDF report');
  }
};

const generateEnrollmentsPDF = async (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const { doc, headerFooterOpts } = await createPdfContext(schoolInfo);
    const tableStartY = drawReportHeading(doc, 'Enrollments Report', `Total Enrollments: ${data.length}`, headerFooterOpts);

    autoTable(doc, {
      head: [['Student ID', 'Student', 'Course', 'Class', 'Enrollment Date', 'Status', 'Term', 'Academic Year']],
      body: data.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.className || 'N/A',
        formatDisplayDate(item.enrollmentDate),
        item.status || 'N/A',
        item.termName || 'N/A',
        item.academicYearName || 'N/A',
      ]),
      startY: tableStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [194, 120, 3], [31, 41, 55]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 56 },
        1: { cellWidth: 82 },
        2: { cellWidth: 82 },
        3: { halign: 'center', cellWidth: 46 },
        4: { halign: 'center', cellWidth: 70 },
        5: { halign: 'center', cellWidth: 50 },
        6: { cellWidth: 64 },
        7: { cellWidth: 74 },
      },
    });
    doc.save('enrollments-report.pdf');
  } catch (error) {
    console.error('Error generating enrollments PDF:', error);
    throw new Error('Failed to generate enrollments PDF report');
  }
};

const generateFeePaymentsPDF = async (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const { doc, headerFooterOpts } = await createPdfContext(schoolInfo);
    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tableStartY = drawReportHeading(
      doc,
      'Fee Payments Report',
      `Total Payments: ${data.length} | Total Amount: ${formatCurrency(totalAmount)}`,
      headerFooterOpts,
    );

    autoTable(doc, {
      head: [['Student ID', 'Student', 'Class', 'Amount', 'Payment Date', 'Method', 'Status', 'Term']],
      body: data.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.className || 'N/A',
        formatCurrency(item.amount),
        formatDisplayDate(item.paymentDate),
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
      ]),
      startY: tableStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [185, 28, 28]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 54 },
        1: { cellWidth: 88 },
        2: { halign: 'center', cellWidth: 50 },
        3: { halign: 'right', cellWidth: 68 },
        4: { halign: 'center', cellWidth: 70 },
        5: { cellWidth: 68 },
        6: { halign: 'center', cellWidth: 50 },
        7: { cellWidth: 66 },
      },
    });
    doc.save('fee-payments-report.pdf');
  } catch (error) {
    console.error('Error generating fee payments PDF:', error);
    throw new Error('Failed to generate fee payments PDF report');
  }
};

const generateComprehensivePDF = async (data: {
  students: any[];
  teachers: any[];
  courses: any[];
  enrollments: any[];
  feePayments: any[];
  schoolInfo?: SchoolInfo;
}) => {
  try {
    const { doc, headerFooterOpts } = await createPdfContext(data.schoolInfo);
    const school = getSchoolInfo(data.schoolInfo);
    const totalRevenue = data.feePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const overviewStartY = drawReportHeading(
      doc,
      'Comprehensive School Report',
      'Sections: Students, Teachers, Courses, Enrollments, Financial',
      headerFooterOpts,
    );

    autoTable(doc, {
      head: [['School Profile', 'Details']],
      body: [
        ['School Name', school.name || 'N/A'],
        ['Address', school.address || 'N/A'],
        ['Phone', school.phone || 'N/A'],
        ['Email', school.email || 'N/A'],
      ],
      startY: overviewStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [33, 95, 160]),
      columnStyles: {
        0: { cellWidth: 130, fontStyle: 'bold' },
        1: { cellWidth: 410, overflow: 'linebreak' },
      },
    });

    const metricsStartY = (doc.lastAutoTable?.finalY || overviewStartY) + 10;
    autoTable(doc, {
      head: [['Overview Metric', 'Value']],
      body: [
        ['Total Students', data.students.length],
        ['Total Teachers', data.teachers.length],
        ['Total Courses', data.courses.length],
        ['Total Enrollments', data.enrollments.length],
        ['Total Fee Payments', data.feePayments.length],
        ['Total Revenue', formatCurrency(totalRevenue)],
      ],
      startY: metricsStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [14, 116, 144]),
      columnStyles: {
        0: { cellWidth: 260, fontStyle: 'bold' },
        1: { cellWidth: 180, halign: 'right' },
      },
    });

    const studentsSlice = data.students.slice(0, 50);
    doc.addPage();
    const studentsStartY = drawReportHeading(
      doc,
      'Students Report',
      `Rows shown: ${studentsSlice.length} of ${data.students.length}`,
      headerFooterOpts,
    );
    autoTable(doc, {
      head: [['Student ID', 'Name', 'Gender', 'Class', 'Address', 'Status', 'Owes Books']],
      body: studentsSlice.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.name || 'N/A',
        item.gender || 'N/A',
        item.className || 'N/A',
        item.address || 'N/A',
        item.status || 'N/A',
        item.owesBooks || 'NO',
      ]),
      startY: studentsStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [33, 95, 160]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 56 },
        1: { cellWidth: 94 },
        2: { halign: 'center', cellWidth: 48 },
        3: { halign: 'center', cellWidth: 56 },
        4: { cellWidth: 170, overflow: 'linebreak' },
        5: { halign: 'center', cellWidth: 54 },
        6: { halign: 'center', cellWidth: 65 },
      },
    });

    const teachersSlice = data.teachers.slice(0, 50);
    doc.addPage();
    const teachersStartY = drawReportHeading(
      doc,
      'Teachers Report',
      `Rows shown: ${teachersSlice.length} of ${data.teachers.length}`,
      headerFooterOpts,
    );
    autoTable(doc, {
      head: [['Name', 'Gender', 'Phone', 'Qualification', 'Experience', 'Status']],
      body: teachersSlice.map(item => [
        item.name || 'N/A',
        item.gender || 'N/A',
        item.phoneNumber || 'N/A',
        item.qualification || 'N/A',
        item.yearsOfExperience ? `${item.yearsOfExperience} yrs` : 'N/A',
        item.status || 'N/A',
      ]),
      startY: teachersStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [22, 163, 74]),
      columnStyles: {
        0: { cellWidth: 110 },
        1: { halign: 'center', cellWidth: 52 },
        2: { cellWidth: 78 },
        3: { cellWidth: 100 },
        4: { halign: 'center', cellWidth: 78 },
        5: { halign: 'center', cellWidth: 74 },
      },
    });

    const coursesSlice = data.courses.slice(0, 50);
    doc.addPage();
    const coursesStartY = drawReportHeading(
      doc,
      'Courses Report',
      `Rows shown: ${coursesSlice.length} of ${data.courses.length}`,
      headerFooterOpts,
    );
    autoTable(doc, {
      head: [['Name', 'Code', 'Class', 'Teacher', 'Enrollments', 'Status']],
      body: coursesSlice.map(item => [
        item.name || 'N/A',
        item.code || 'N/A',
        item.className || 'N/A',
        item.teacherName || 'N/A',
        item.enrollmentCount ?? 0,
        item.status || 'N/A',
      ]),
      startY: coursesStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [14, 116, 144]),
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'center', cellWidth: 56 },
        2: { halign: 'center', cellWidth: 58 },
        3: { cellWidth: 120 },
        4: { halign: 'center', cellWidth: 80 },
        5: { halign: 'center', cellWidth: 70 },
      },
    });

    const enrollmentsSlice = data.enrollments.slice(0, 50);
    doc.addPage();
    const enrollmentsStartY = drawReportHeading(
      doc,
      'Enrollments Report',
      `Rows shown: ${enrollmentsSlice.length} of ${data.enrollments.length}`,
      headerFooterOpts,
    );
    autoTable(doc, {
      head: [['Student ID', 'Student', 'Course', 'Class', 'Status', 'Term']],
      body: enrollmentsSlice.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.className || 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
      ]),
      startY: enrollmentsStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [194, 120, 3], [31, 41, 55]),
      columnStyles: {
        0: { halign: 'center', cellWidth: 60 },
        1: { cellWidth: 100 },
        2: { cellWidth: 118 },
        3: { halign: 'center', cellWidth: 64 },
        4: { halign: 'center', cellWidth: 74 },
        5: { cellWidth: 95 },
      },
    });

    const feePaymentsSlice = data.feePayments.slice(0, 50);
    doc.addPage();
    const financialStartY = drawReportHeading(
      doc,
      'Fee Payments Report',
      `Rows shown: ${feePaymentsSlice.length} of ${data.feePayments.length}`,
      headerFooterOpts,
    );
    autoTable(doc, {
      head: [['Student', 'Class', 'Amount', 'Date', 'Method', 'Status']],
      body: feePaymentsSlice.map(item => [
        item.studentName || 'N/A',
        item.className || 'N/A',
        formatCurrency(item.amount),
        formatDisplayDate(item.paymentDate),
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
      ]),
      startY: financialStartY,
      ...getProfessionalTableTheme(headerFooterOpts, [185, 28, 28]),
      columnStyles: {
        0: { cellWidth: 120 },
        1: { halign: 'center', cellWidth: 70 },
        2: { halign: 'right', cellWidth: 90 },
        3: { halign: 'center', cellWidth: 72 },
        4: { cellWidth: 86 },
        5: { halign: 'center', cellWidth: 76 },
      },
    });

    doc.save('comprehensive-report.pdf');
  } catch (error) {
    console.error('Error generating comprehensive PDF:', error);
    throw new Error('Failed to generate comprehensive PDF report');
  }
};

export {
  generateStudentsPDF,
  generateTeachersPDF,
  generateCoursesPDF,
  generateEnrollmentsPDF,
  generateFeePaymentsPDF,
  generateComprehensivePDF,
  generateStudentsExcel,
  generateTeachersExcel,
  generateCoursesExcel,
  generateEnrollmentsExcel,
  generateFeePaymentsExcel,
  generateComprehensiveExcel,
};

// Backwards-compatible aggregate export (so existing code using reportService.* keeps working)
export const reportService = {
  generateStudentsPDF,
  generateTeachersPDF,
  generateCoursesPDF,
  generateEnrollmentsPDF,
  generateFeePaymentsPDF,
  generateComprehensivePDF,
  generateStudentsExcel,
  generateTeachersExcel,
  generateCoursesExcel,
  generateEnrollmentsExcel,
  generateFeePaymentsExcel,
  generateComprehensiveExcel,
};

// export {
//   generateStudentsPDF,
//   generateTeachersPDF,
//   generateCoursesPDF,
//   generateEnrollmentsPDF,
//   generateFeePaymentsPDF,
//   generateComprehensivePDF,
// };
