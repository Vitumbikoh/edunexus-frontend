import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ... existing PDF functions ...

const generateStudentsExcel = (data: any[]) => {
  try {
    const ws = XLSX.utils.json_to_sheet(
      data.map(item => ({
        ID: item.id || 'N/A',
        Name: item.name || 'N/A',
        Email: item.email || 'N/A',
        Grade: item.grade || 'N/A',
        'Enrollment Date': item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students-report.xlsx');
  } catch (error) {
    console.error('Error generating students Excel:', error);
    throw new Error('Failed to generate students Excel report');
  }
};

const generateTeachersExcel = (data: any[]) => {
  try {
    const ws = XLSX.utils.json_to_sheet(
      data.map(item => ({
        ID: item.id || 'N/A',
        Name: item.name || 'N/A',
        Email: item.email || 'N/A',
        Department: item.department || 'N/A',
        'Join Date': item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
    XLSX.writeFile(wb, 'teachers-report.xlsx');
  } catch (error) {
    console.error('Error generating teachers Excel:', error);
    throw new Error('Failed to generate teachers Excel report');
  }
};

const generateCoursesExcel = (data: any[]) => {
  try {
    const ws = XLSX.utils.json_to_sheet(
      data.map(item => ({
        ID: item.id || 'N/A',
        Name: item.name || 'N/A',
        Code: item.code || 'N/A',
        Department: item.department || 'N/A',
        Credits: item.credits || 0,
        'Enrollment Count': item.enrollmentCount || 0,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'courses-report.xlsx');
  } catch (error) {
    console.error('Error generating courses Excel:', error);
    throw new Error('Failed to generate courses Excel report');
  }
};

const generateEnrollmentsExcel = (data: any[]) => {
  try {
    const ws = XLSX.utils.json_to_sheet(
      data.map(item => ({
        ID: item.id || 'N/A',
        'Student Name': item.studentName || 'N/A',
        'Course Name': item.courseName || 'N/A',
        'Enrollment Date': item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
        Grade: item.grade || 'N/A',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollments');
    XLSX.writeFile(wb, 'enrollments-report.xlsx');
  } catch (error) {
    console.error('Error generating enrollments Excel:', error);
    throw new Error('Failed to generate enrollments Excel report');
  }
};

const generateFeePaymentsExcel = (data: any[]) => {
  try {
    const ws = XLSX.utils.json_to_sheet(
      data.map(item => ({
        ID: item.id || 'N/A',
        'Student Name': item.studentName || 'N/A',
        Amount: item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        'Payment Date': item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        'Payment Method': item.paymentMethod || 'N/A',
        Status: item.status || 'N/A',
      }))
    );
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
}) => {
  try {
    const wb = XLSX.utils.book_new();

    const studentsWs = XLSX.utils.json_to_sheet(
      data.students.map(item => ({
        ID: item.id || 'N/A',
        Name: item.name || 'N/A',
        Email: item.email || 'N/A',
        Grade: item.grade || 'N/A',
        'Enrollment Date': item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
      }))
    );
    XLSX.utils.book_append_sheet(wb, studentsWs, 'Students');

    const teachersWs = XLSX.utils.json_to_sheet(
      data.teachers.map(item => ({
        ID: item.id || 'N/A',
        Name: item.name || 'N/A',
        Email: item.email || 'N/A',
        Department: item.department || 'N/A',
        'Join Date': item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
      }))
    );
    XLSX.utils.book_append_sheet(wb, teachersWs, 'Teachers');

    const coursesWs = XLSX.utils.json_to_sheet(
      data.courses.map(item => ({
        ID: item.id || 'N/A',
        Name: item.name || 'N/A',
        Code: item.code || 'N/A',
        Department: item.department || 'N/A',
        Credits: item.credits || 0,
        'Enrollment Count': item.enrollmentCount || 0,
      }))
    );
    XLSX.utils.book_append_sheet(wb, coursesWs, 'Courses');

    const enrollmentsWs = XLSX.utils.json_to_sheet(
      data.enrollments.map(item => ({
        ID: item.id || 'N/A',
        'Student Name': item.studentName || 'N/A',
        'Course Name': item.courseName || 'N/A',
        'Enrollment Date': item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
        Grade: item.grade || 'N/A',
      }))
    );
    XLSX.utils.book_append_sheet(wb, enrollmentsWs, 'Enrollments');

    const feePaymentsWs = XLSX.utils.json_to_sheet(
      data.feePayments.map(item => ({
        ID: item.id || 'N/A',
        'Student Name': item.studentName || 'N/A',
        Amount: item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        'Payment Date': item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        'Payment Method': item.paymentMethod || 'N/A',
        Status: item.status || 'N/A',
      }))
    );
    XLSX.utils.book_append_sheet(wb, feePaymentsWs, 'Fee Payments');

    XLSX.writeFile(wb, 'comprehensive-report.xlsx');
  } catch (error) {
    console.error('Error generating comprehensive Excel:', error);
    throw new Error('Failed to generate comprehensive Excel report');
  }
};


// Initialize jsPDF with autoTable and generate PDF reports
const generateStudentsPDF = (data: any[]) => {
  try {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Name', 'Email', 'Grade', 'Enrollment Date', 'Status']],
      body: data.map(item => [
        item.id || 'N/A',
        item.name || 'N/A',
        item.email || 'N/A',
        item.grade || 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
      ]),
    });
    doc.save('students-report.pdf');
  } catch (error) {
    console.error('Error generating students PDF:', error);
    throw new Error('Failed to generate students PDF report');
  }
};

const generateTeachersPDF = (data: any[]) => {
  try {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Name', 'Email', 'Department', 'Join Date', 'Status']],
      body: data.map(item => [
        item.id || 'N/A',
        item.name || 'N/A',
        item.email || 'N/A',
        item.department || 'N/A',
        item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
      ]),
    });
    doc.save('teachers-report.pdf');
  } catch (error) {
    console.error('Error generating teachers PDF:', error);
    throw new Error('Failed to generate teachers PDF report');
  }
};

const generateCoursesPDF = (data: any[]) => {
  try {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Name', 'Code', 'Department', 'Credits', 'Enrollment Count']],
      body: data.map(item => [
        item.id || 'N/A',
        item.name || 'N/A',
        item.code || 'N/A',
        item.department || 'N/A',
        item.credits || 0,
        item.enrollmentCount || 0,
      ]),
    });
    doc.save('courses-report.pdf');
  } catch (error) {
    console.error('Error generating courses PDF:', error);
    throw new Error('Failed to generate courses PDF report');
  }
};

const generateEnrollmentsPDF = (data: any[]) => {
  try {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Student Name', 'Course Name', 'Enrollment Date', 'Status', 'Grade']],
      body: data.map(item => [
        item.id || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
        item.grade || 'N/A',
      ]),
    });
    doc.save('enrollments-report.pdf');
  } catch (error) {
    console.error('Error generating enrollments PDF:', error);
    throw new Error('Failed to generate enrollments PDF report');
  }
};

const generateFeePaymentsPDF = (data: any[]) => {
  try {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Student Name', 'Amount', 'Payment Date', 'Payment Method', 'Status']],
      body: data.map(item => [
        item.id || 'N/A',
        item.studentName || 'N/A',
        item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
      ]),
    });
    doc.save('fee-payments-report.pdf');
  } catch (error) {
    console.error('Error generating fee payments PDF:', error);
    throw new Error('Failed to generate fee payments PDF report');
  }
};

const generateComprehensivePDF = (data: {
  students: any[];
  teachers: any[];
  courses: any[];
  enrollments: any[];
  feePayments: any[];
}) => {
  try {
    const doc = new jsPDF();

    // Students Table
    doc.text('Students Report', 14, 10);
    autoTable(doc, {
      head: [['ID', 'Name', 'Email', 'Grade', 'Enrollment Date', 'Status']],
      body: data.students.map(item => [
        item.id || 'N/A',
        item.name || 'N/A',
        item.email || 'N/A',
        item.grade || 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
      ]),
      startY: 20,
    });

    // Teachers Table
    doc.text('Teachers Report', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [['ID', 'Name', 'Email', 'Department', 'Join Date', 'Status']],
      body: data.teachers.map(item => [
        item.id || 'N/A',
        item.name || 'N/A',
        item.email || 'N/A',
        item.department || 'N/A',
        item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
      ]),
      startY: (doc as any).lastAutoTable.finalY + 20,
    });

    // Courses Table
    doc.text('Courses Report', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [['ID', 'Name', 'Code', 'Department', 'Credits', 'Enrollment Count']],
      body: data.courses.map(item => [
        item.id || 'N/A',
        item.name || 'N/A',
        item.code || 'N/A',
        item.department || 'N/A',
        item.credits || 0,
        item.enrollmentCount || 0,
      ]),
      startY: (doc as any).lastAutoTable.finalY + 20,
    });

    // Enrollments Table
    doc.text('Enrollments Report', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [['ID', 'Student Name', 'Course Name', 'Enrollment Date', 'Status', 'Grade']],
      body: data.enrollments.map(item => [
        item.id || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
        item.grade || 'N/A',
      ]),
      startY: (doc as any).lastAutoTable.finalY + 20,
    });

    // Fee Payments Table
    doc.text('Fee Payments Report', 14, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      head: [['ID', 'Student Name', 'Amount', 'Payment Date', 'Payment Method', 'Status']],
      body: data.feePayments.map(item => [
        item.id || 'N/A',
        item.studentName || 'N/A',
        item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
      ]),
      startY: (doc as any).lastAutoTable.finalY + 20,
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

// export {
//   generateStudentsPDF,
//   generateTeachersPDF,
//   generateCoursesPDF,
//   generateEnrollmentsPDF,
//   generateFeePaymentsPDF,
//   generateComprehensivePDF,
// };