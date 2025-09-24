
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { API_CONFIG } from '@/config/api';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
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

export interface ReportData {
  students: Array<{
    id: string;
    name: string;
    email: string;
    grade: string;
    enrollmentDate: string;
    status: string;
  }>;
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    joinDate: string;
    status: string;
  }>;
  courses: Array<{
    id: string;
    name: string;
    code: string;
    department: string;
    credits: number;
    enrollmentCount: number;
  }>;
  enrollments: Array<{
    id: string;
    studentName: string;
    courseName: string;
    enrollmentDate: string;
    status: string;
    grade?: string;
  }>;
  feePayments: Array<{
    id: string;
    studentName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
  }>;
}

export const reportService = {
  // Generate Excel report for students
  generateStudentsExcel: (students: ReportData['students']) => {
    const worksheet = XLSX.utils.json_to_sheet(students);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    // Auto-size columns
    const maxWidth = students.reduce((w, r) => Math.max(w, r.name.length), 10);
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: maxWidth }, // Name
      { wch: 25 }, // Email
      { wch: 10 }, // Grade
      { wch: 15 }, // Enrollment Date
      { wch: 10 }  // Status
    ];
    
    XLSX.writeFile(workbook, `students-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Generate Excel report for teachers
  generateTeachersExcel: (teachers: ReportData['teachers']) => {
    const worksheet = XLSX.utils.json_to_sheet(teachers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Department
      { wch: 15 }, // Join Date
      { wch: 10 }  // Status
    ];
    
    XLSX.writeFile(workbook, `teachers-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Generate Excel report for courses
  generateCoursesExcel: (courses: ReportData['courses']) => {
    const worksheet = XLSX.utils.json_to_sheet(courses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Courses');
    
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 25 }, // Name
      { wch: 10 }, // Code
      { wch: 15 }, // Department
      { wch: 10 }, // Credits
      { wch: 15 }  // Enrollment Count
    ];
    
    XLSX.writeFile(workbook, `courses-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Generate Excel report for enrollments
  generateEnrollmentsExcel: (enrollments: ReportData['enrollments']) => {
    const worksheet = XLSX.utils.json_to_sheet(enrollments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Enrollments');
    
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 20 }, // Student Name
      { wch: 25 }, // Course Name
      { wch: 15 }, // Enrollment Date
      { wch: 10 }, // Status
      { wch: 10 }  // Grade
    ];
    
    XLSX.writeFile(workbook, `enrollments-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Generate Excel report for fee payments
  generateFeePaymentsExcel: (feePayments: ReportData['feePayments']) => {
    const worksheet = XLSX.utils.json_to_sheet(feePayments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Payments');
    
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 20 }, // Student Name
      { wch: 12 }, // Amount
      { wch: 15 }, // Payment Date
      { wch: 15 }, // Payment Method
      { wch: 10 }  // Status
    ];
    
    XLSX.writeFile(workbook, `fee-payments-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Generate comprehensive Excel report
  generateComprehensiveExcel: (data: ReportData) => {
    const workbook = XLSX.utils.book_new();
    
    // Students sheet
    const studentsWs = XLSX.utils.json_to_sheet(data.students);
    XLSX.utils.book_append_sheet(workbook, studentsWs, 'Students');
    
    // Teachers sheet
    const teachersWs = XLSX.utils.json_to_sheet(data.teachers);
    XLSX.utils.book_append_sheet(workbook, teachersWs, 'Teachers');
    
    // Courses sheet
    const coursesWs = XLSX.utils.json_to_sheet(data.courses);
    XLSX.utils.book_append_sheet(workbook, coursesWs, 'Courses');
    
    // Enrollments sheet
    const enrollmentsWs = XLSX.utils.json_to_sheet(data.enrollments);
    XLSX.utils.book_append_sheet(workbook, enrollmentsWs, 'Enrollments');
    
    // Fee Payments sheet
    const feePaymentsWs = XLSX.utils.json_to_sheet(data.feePayments);
    XLSX.utils.book_append_sheet(workbook, feePaymentsWs, 'Fee Payments');
    
    XLSX.writeFile(workbook, `comprehensive-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  // Generate PDF report for students
  generateStudentsPDF: async (students: ReportData['students'], schoolLogo?: string | null) => {
    const doc = new jsPDF();
    let currentY = 22;
    
    // Add school logo if available
    if (schoolLogo) {
      const logoUrl = getLogoUrl(schoolLogo);
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
          doc.text('Students Report', 50, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 32);
          currentY = 45;
        } catch (error) {
          console.error('Error loading logo:', error);
          doc.text('Students Report', 14, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
          currentY = 40;
        }
      }
    } else {
      doc.text('Students Report', 14, 22);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      currentY = 40;
    }
    
    const tableColumn = ['ID', 'Name', 'Email', 'Grade', 'Enrollment Date', 'Status'];
    const tableRows = students.map(student => [
      student.id,
      student.name,
      student.email,
      student.grade,
      student.enrollmentDate,
      student.status
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`students-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for teachers
  generateTeachersPDF: async (teachers: ReportData['teachers'], schoolLogo?: string | null) => {
    const doc = new jsPDF();
    let currentY = 22;
    
    // Add school logo if available
    if (schoolLogo) {
      const logoUrl = getLogoUrl(schoolLogo);
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
          doc.text('Teachers Report', 50, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 32);
          currentY = 45;
        } catch (error) {
          console.error('Error loading logo:', error);
          doc.text('Teachers Report', 14, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
          currentY = 40;
        }
      }
    } else {
      doc.text('Teachers Report', 14, 22);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      currentY = 40;
    }
    
    const tableColumn = ['ID', 'Name', 'Email', 'Department', 'Join Date', 'Status'];
    const tableRows = teachers.map(teacher => [
      teacher.id,
      teacher.name,
      teacher.email,
      teacher.department,
      teacher.joinDate,
      teacher.status
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`teachers-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for courses
  generateCoursesPDF: async (courses: ReportData['courses'], schoolLogo?: string | null) => {
    const doc = new jsPDF();
    let currentY = 22;
    
    // Add school logo if available
    if (schoolLogo) {
      const logoUrl = getLogoUrl(schoolLogo);
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
          doc.text('Courses Report', 50, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 32);
          currentY = 45;
        } catch (error) {
          console.error('Error loading logo:', error);
          doc.text('Courses Report', 14, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
          currentY = 40;
        }
      }
    } else {
      doc.text('Courses Report', 14, 22);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      currentY = 40;
    }
    
    const tableColumn = ['ID', 'Name', 'Code', 'Department', 'Credits', 'Enrollments'];
    const tableRows = courses.map(course => [
      course.id,
      course.name,
      course.code,
      course.department,
      course.credits.toString(),
      course.enrollmentCount.toString()
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`courses-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for enrollments
  generateEnrollmentsPDF: async (enrollments: ReportData['enrollments'], schoolLogo?: string | null) => {
    const doc = new jsPDF();
    let currentY = 22;
    
    // Add school logo if available
    if (schoolLogo) {
      const logoUrl = getLogoUrl(schoolLogo);
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
          doc.text('Enrollments Report', 50, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 32);
          currentY = 45;
        } catch (error) {
          console.error('Error loading logo:', error);
          doc.text('Enrollments Report', 14, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
          currentY = 40;
        }
      }
    } else {
      doc.text('Enrollments Report', 14, 22);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      currentY = 40;
    }
    
    const tableColumn = ['ID', 'Student', 'Course', 'Enrollment Date', 'Status', 'Grade'];
    const tableRows = enrollments.map(enrollment => [
      enrollment.id,
      enrollment.studentName,
      enrollment.courseName,
      enrollment.enrollmentDate,
      enrollment.status,
      enrollment.grade || 'N/A'
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`enrollments-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for fee payments
  generateFeePaymentsPDF: async (feePayments: ReportData['feePayments'], schoolLogo?: string | null) => {
    const doc = new jsPDF();
    let currentY = 22;
    
    // Add school logo if available
    if (schoolLogo) {
      const logoUrl = getLogoUrl(schoolLogo);
      if (logoUrl) {
        try {
          const logoBase64 = await loadImageAsBase64(logoUrl);
          doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
          doc.text('Fee Payments Report', 50, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 32);
          currentY = 45;
        } catch (error) {
          console.error('Error loading logo:', error);
          doc.text('Fee Payments Report', 14, 22);
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
          currentY = 40;
        }
      }
    } else {
      doc.text('Fee Payments Report', 14, 22);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      currentY = 40;
    }
    
    const tableColumn = ['ID', 'Student', 'Amount', 'Payment Date', 'Method', 'Status'];
    const tableRows = feePayments.map(payment => [
      payment.id,
      payment.studentName,
      `$${payment.amount.toFixed(2)}`,
      payment.paymentDate,
      payment.paymentMethod,
      payment.status
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`fee-payments-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
