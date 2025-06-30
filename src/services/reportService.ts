
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  generateStudentsPDF: (students: ReportData['students']) => {
    const doc = new jsPDF();
    
    doc.text('Students Report', 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
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
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`students-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for teachers
  generateTeachersPDF: (teachers: ReportData['teachers']) => {
    const doc = new jsPDF();
    
    doc.text('Teachers Report', 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
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
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`teachers-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for courses
  generateCoursesPDF: (courses: ReportData['courses']) => {
    const doc = new jsPDF();
    
    doc.text('Courses Report', 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
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
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`courses-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for enrollments
  generateEnrollmentsPDF: (enrollments: ReportData['enrollments']) => {
    const doc = new jsPDF();
    
    doc.text('Enrollments Report', 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
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
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`enrollments-report-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Generate PDF report for fee payments
  generateFeePaymentsPDF: (feePayments: ReportData['feePayments']) => {
    const doc = new jsPDF();
    
    doc.text('Fee Payments Report', 14, 22);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    
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
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save(`fee-payments-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
