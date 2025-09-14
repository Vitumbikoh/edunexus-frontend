import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
    };
  }
  
  // Fallback to environment variables
  return {
    name: (import.meta.env.VITE_SCHOOL_NAME as string) || 'Schomas School',
    address: (import.meta.env.VITE_SCHOOL_ADDRESS as string) || '123 Academy Lane, City, Country',
    phone: (import.meta.env.VITE_SCHOOL_PHONE as string) || '+1 (555) 123-4567',
    email: (import.meta.env.VITE_SCHOOL_EMAIL as string) || 'info@schomas.com',
    website: (import.meta.env.VITE_SCHOOL_WEBSITE as string) || 'www.schomas.com',
  };
};

// Returns options to pass into autoTable to draw a professional header and footer on each page.
const addPdfHeaderFooterOptions = (doc: any, apiSchoolInfo?: SchoolInfo) => {
  const school = getSchoolInfo(apiSchoolInfo);
  return {
    didDrawPage: (data: any) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Professional Header Design
      // Header background rectangle
      doc.setFillColor(245, 248, 251); // Light blue-gray background
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Header border line
      doc.setDrawColor(66, 139, 202); // Professional blue
      doc.setLineWidth(0.5);
      doc.line(0, 45, pageWidth, 45);
      
      // School Name - Large and prominent
      doc.setTextColor(44, 62, 80); // Dark blue-gray
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text(school.name, 20, 22);
      
      // Contact Information - Properly spaced and aligned
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(85, 85, 85); // Medium gray
      
      // Address line
      if (school.address) {
        doc.text(`Address: ${school.address}`, 20, 30);
      }
      
      // Contact line - right side
      const contactInfo = [];
      if (school.phone) contactInfo.push(`Phone: ${school.phone}`);
      if (school.email) contactInfo.push(`Email: ${school.email}`);
      
      const contactText = contactInfo.join('   •   ');
      if (contactText) {
        doc.text(contactText, 20, 37);
      }
      
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
      const pageText = `Page ${data.pageNumber} • ${school.name}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - 20 - pageTextWidth, footerY);
    },
    margin: { top: 55, bottom: 25, left: 20, right: 20 }, // Added left and right margins
  };
};

const generateStudentsExcel = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const school = getSchoolInfo(schoolInfo);
    const headerRows = [
      [school.name],
      [school.address],
      [`Phone: ${school.phone}  |  Email: ${school.email}`],
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

const generateTeachersExcel = (data: any[]) => {
  try {
    const school = getSchoolInfo();
    const headerRows = [[school.name], [school.address], [`Phone: ${school.phone}  Email: ${school.email}  Website: ${school.website}`], []];
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

const generateCoursesExcel = (data: any[]) => {
  try {
    const school = getSchoolInfo();
    const headerRows = [[school.name], [school.address], [`Phone: ${school.phone}  Email: ${school.email}`], []];
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

const generateEnrollmentsExcel = (data: any[]) => {
  try {
    const school = getSchoolInfo();
    const headerRows = [[school.name], [school.address], [`Phone: ${school.phone}  Email: ${school.email}`], []];
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

const generateFeePaymentsExcel = (data: any[]) => {
  try {
    const school = getSchoolInfo();
    const headerRows = [[school.name], [school.address], [`Phone: ${school.phone}  Email: ${school.email}`], []];
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
}) => {
  try {
    const wb = XLSX.utils.book_new();

    const studentsWs = XLSX.utils.json_to_sheet(
      data.students.map(item => ({
        'Student ID': item.studentHumanId || item.studentId || 'N/A',
        Name: item.name || 'N/A',
        Gender: item.gender || 'N/A',
        Class: item.className || 'N/A',
        Grade: item.grade || 'N/A',
        Address: item.address || 'N/A',
        'Date of Birth': item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
        Age: item.age ?? 'N/A',
        'Enrollment Date': item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
        'Owes Books': item.owesBooks || 'NO',
      }))
    );
    XLSX.utils.book_append_sheet(wb, studentsWs, 'Students');

    const teachersWs = XLSX.utils.json_to_sheet(
      data.teachers.map(item => ({
        Name: item.name || 'N/A',
        Gender: item.gender || 'N/A',
        Email: item.email || 'N/A',
        Phone: item.phoneNumber || 'N/A',
        Qualification: item.qualification || 'N/A',
        'Years Exp': item.yearsOfExperience ?? 'N/A',
        Address: item.address || 'N/A',
        'Date of Birth': item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
        'Hire Date': item.hireDate ? new Date(item.hireDate).toLocaleDateString() : (item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A'),
        Status: item.status || 'N/A',
        Class: item.className || 'N/A',
        Specialization: item.subjectSpecialization || 'N/A',
      }))
    );
    XLSX.utils.book_append_sheet(wb, teachersWs, 'Teachers');

    const coursesWs = XLSX.utils.json_to_sheet(
      data.courses.map(item => ({
        Name: item.name || 'N/A',
        Code: item.code || 'N/A',
        Class: item.className || 'N/A',
        Teacher: item.teacherName || 'N/A',
        Department: item.department || 'N/A',
        Credits: item.credits || 0,
        'Enrollment Count': item.enrollmentCount || 0,
        Status: item.status || 'N/A',
        Active: item.active === true ? 'YES' : 'NO',
      }))
    );
    XLSX.utils.book_append_sheet(wb, coursesWs, 'Courses');

    const enrollmentsWs = XLSX.utils.json_to_sheet(
      data.enrollments.map(item => ({
        'Student ID': item.studentHumanId || item.studentId || 'N/A',
        Student: item.studentName || 'N/A',
        Course: item.courseName || 'N/A',
        Class: item.className || 'N/A',
        'Enrollment Date': item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        Status: item.status || 'N/A',
        Term: item.termName || 'N/A',
        AcademicYear: item.academicYearName || 'N/A',
      }))
    );
    XLSX.utils.book_append_sheet(wb, enrollmentsWs, 'Enrollments');

    const feePaymentsWs = XLSX.utils.json_to_sheet(
      data.feePayments.map(item => ({
        'Student ID': item.studentHumanId || item.studentId || 'N/A',
        Student: item.studentName || 'N/A',
        Class: item.className || 'N/A',
        Amount: item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        'Payment Date': item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        'Payment Method': item.paymentMethod || 'N/A',
        Status: item.status || 'N/A',
        Term: item.termName || 'N/A',
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
const generateStudentsPDF = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const doc: any = new jsPDF();
    const headerFooterOpts = addPdfHeaderFooterOptions(doc, schoolInfo);
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Students Report', 20, 70);
    
    // Add summary info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`Total Students: ${data.length}`, 20, 82);
    
    autoTable(doc, {
      head: [['Student ID', 'Name', 'Gender', 'Class', 'Address', 'DOB', 'Age', 'Status', 'Owes Books']],
      body: data.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.name || 'N/A',
        item.gender || 'N/A',
        item.className || 'N/A',
        item.address || 'N/A',
        item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
        item.age ?? 'N/A',
        item.status || 'N/A',
        item.owesBooks || 'NO',
      ]),
      startY: 90,
      ...headerFooterOpts,
      // Professional table styling
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [44, 62, 80],
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [52, 152, 219], // Professional blue
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250], // Light gray for alternate rows
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 }, // Student ID
        1: { cellWidth: 32 }, // Name
        2: { halign: 'center', cellWidth: 16 }, // Gender
        3: { halign: 'center', cellWidth: 18 }, // Class
        4: { cellWidth: 35 }, // Address
        5: { halign: 'center', cellWidth: 20 }, // DOB
        6: { halign: 'center', cellWidth: 12 }, // Age
        7: { halign: 'center', cellWidth: 18 }, // Status
        8: { halign: 'center', cellWidth: 18 }, // Owes Books
      },
      // Add subtle borders
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      // Ensure table fits within page margins
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });
    doc.save('students-report.pdf');
  } catch (error) {
    console.error('Error generating students PDF:', error);
    throw new Error('Failed to generate students PDF report');
  }
};

const generateTeachersPDF = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const doc: any = new jsPDF();
    const headerFooterOpts = addPdfHeaderFooterOptions(doc, schoolInfo);
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Teachers Report', 20, 70);
    
    // Add summary info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`Total Teachers: ${data.length}`, 20, 82);
    
    autoTable(doc, {
      head: [['Name', 'Gender', 'Phone', 'Qualification', 'Experience', 'Address', 'DOB', 'Hire Date', 'Status']],
      body: data.map(item => [
        item.name || 'N/A',
        item.gender || 'N/A',
        item.phoneNumber || 'N/A',
        item.qualification || 'N/A',
        item.yearsOfExperience ? `${item.yearsOfExperience} years` : 'N/A',
        item.address || 'N/A',
        item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString() : 'N/A',
        item.hireDate ? new Date(item.hireDate).toLocaleDateString() : (item.joinDate ? new Date(item.joinDate).toLocaleDateString() : 'N/A'),
        item.status || 'N/A',
      ]),
      startY: 90,
      ...headerFooterOpts,
      // Professional table styling
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [44, 62, 80],
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [46, 204, 113], // Professional green for teachers
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 32 }, // Name
        1: { halign: 'center', cellWidth: 16 }, // Gender
        2: { cellWidth: 22 }, // Phone
        3: { cellWidth: 28 }, // Qualification
        4: { halign: 'center', cellWidth: 18 }, // Experience
        5: { cellWidth: 32 }, // Address
        6: { halign: 'center', cellWidth: 20 }, // DOB
        7: { halign: 'center', cellWidth: 20 }, // Hire Date
        8: { halign: 'center', cellWidth: 16 }, // Status
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });
    doc.save('teachers-report.pdf');
  } catch (error) {
    console.error('Error generating teachers PDF:', error);
    throw new Error('Failed to generate teachers PDF report');
  }
};

const generateCoursesPDF = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const doc: any = new jsPDF();
    const headerFooterOpts = addPdfHeaderFooterOptions(doc, schoolInfo);
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Courses Report', 20, 70);
    
    // Add summary info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`Total Courses: ${data.length}`, 20, 82);
    
    autoTable(doc, {
      head: [['Name', 'Code', 'Class', 'Teacher', 'Department', 'Credits', 'Enrollments', 'Status', 'Active']],
      body: data.map(item => [
        item.name || 'N/A',
        item.code || 'N/A',
        item.className || 'N/A',
        item.teacherName || 'N/A',
        item.department || 'N/A',
        item.credits || 0,
        item.enrollmentCount || 0,
        item.status || 'N/A',
        item.active === true ? 'YES' : 'NO',
      ]),
      startY: 90,
      ...headerFooterOpts,
      // Professional table styling
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [44, 62, 80],
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [155, 89, 182], // Professional purple for courses
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { cellWidth: 28 }, // Name
        1: { halign: 'center', cellWidth: 18 }, // Code
        2: { halign: 'center', cellWidth: 18 }, // Class
        3: { cellWidth: 28 }, // Teacher
        4: { cellWidth: 22 }, // Department
        5: { halign: 'center', cellWidth: 16 }, // Credits
        6: { halign: 'center', cellWidth: 20 }, // Enrollments
        7: { halign: 'center', cellWidth: 18 }, // Status
        8: { halign: 'center', cellWidth: 12 }, // Active
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });
    doc.save('courses-report.pdf');
  } catch (error) {
    console.error('Error generating courses PDF:', error);
    throw new Error('Failed to generate courses PDF report');
  }
};

const generateEnrollmentsPDF = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const doc: any = new jsPDF();
    const headerFooterOpts = addPdfHeaderFooterOptions(doc, schoolInfo);
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Enrollments Report', 20, 70);
    
    // Add summary info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`Total Enrollments: ${data.length}`, 20, 82);
    
    autoTable(doc, {
      head: [['Student ID', 'Student', 'Course', 'Class', 'Enrollment Date', 'Status', 'Term', 'Academic Year']],
      body: data.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.className || 'N/A',
        item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
        item.academicYearName || 'N/A',
      ]),
      startY: 90,
      ...headerFooterOpts,
      // Professional table styling
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [44, 62, 80],
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [241, 196, 15], // Professional orange for enrollments
        textColor: [44, 62, 80], // Dark text for better contrast on yellow
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 }, // Student ID
        1: { cellWidth: 28 }, // Student
        2: { cellWidth: 28 }, // Course
        3: { halign: 'center', cellWidth: 18 }, // Class
        4: { halign: 'center', cellWidth: 23 }, // Enrollment Date
        5: { halign: 'center', cellWidth: 18 }, // Status
        6: { cellWidth: 22 }, // Term
        7: { cellWidth: 26 }, // Academic Year
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });
    doc.save('enrollments-report.pdf');
  } catch (error) {
    console.error('Error generating enrollments PDF:', error);
    throw new Error('Failed to generate enrollments PDF report');
  }
};

const generateFeePaymentsPDF = (data: any[], schoolInfo?: SchoolInfo) => {
  try {
    const doc: any = new jsPDF();
    const headerFooterOpts = addPdfHeaderFooterOptions(doc, schoolInfo);
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Fee Payments Report', 20, 70);
    
    // Add summary info
    const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`Total Payments: ${data.length} | Total Amount: $${totalAmount.toLocaleString()}`, 20, 82);
    
    autoTable(doc, {
      head: [['Student ID', 'Student', 'Class', 'Amount', 'Payment Date', 'Method', 'Status', 'Term']],
      body: data.map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.className || 'N/A',
        item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
      ]),
      startY: 90,
      ...headerFooterOpts,
      // Professional table styling
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [44, 62, 80],
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [231, 76, 60], // Professional red for finances
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 6,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 }, // Student ID
        1: { cellWidth: 28 }, // Student
        2: { halign: 'center', cellWidth: 18 }, // Class
        3: { halign: 'right', cellWidth: 22 }, // Amount
        4: { halign: 'center', cellWidth: 23 }, // Payment Date
        5: { cellWidth: 22 }, // Method
        6: { halign: 'center', cellWidth: 18 }, // Status
        7: { cellWidth: 26 }, // Term
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
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
  schoolInfo?: SchoolInfo;
}) => {
  try {
    const doc: any = new jsPDF();
    const headerFooterOpts = addPdfHeaderFooterOptions(doc, data.schoolInfo);
    const school = getSchoolInfo(data.schoolInfo);

    // Title Page Section with School Information
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Comprehensive School Report', 20, 80);
    
    // School Information Section
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 152, 219);
    doc.text('School Information', 20, 105);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`School Name: ${school.name}`, 20, 120);
    if (school.address) {
      doc.text(`Address: ${school.address}`, 20, 130);
    }
    if (school.phone) {
      doc.text(`Phone: ${school.phone}`, 20, 140);
    }
    if (school.email) {
      doc.text(`Email: ${school.email}`, 20, 150);
    }
    
    // Summary Statistics
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(52, 152, 219);
    doc.text('School Overview', 20, 170);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(`Total Students: ${data.students.length}`, 20, 185);
    doc.text(`Total Teachers: ${data.teachers.length}`, 20, 195);
    doc.text(`Total Courses: ${data.courses.length}`, 20, 205);
    doc.text(`Total Enrollments: ${data.enrollments.length}`, 20, 215);
    doc.text(`Total Fee Payments: ${data.feePayments.length}`, 20, 225);
    
    const totalRevenue = data.feePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 20, 235);

    // Students Section - Start on new page for better organization
    doc.addPage();
    let currentY = 70; // Start below header

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Students Report', 20, currentY);
    currentY += 15;

    autoTable(doc, {
      head: [['Student ID', 'Name', 'Gender', 'Class', 'Address', 'Status', 'Owes Books']],
      body: data.students.slice(0, 50).map(item => [ // Limit to first 50 for readability
        item.studentHumanId || item.studentId || 'N/A',
        item.name || 'N/A',
        item.gender || 'N/A',
        item.className || 'N/A',
        item.address || 'N/A',
        item.status || 'N/A',
        item.owesBooks || 'NO',
      ]),
      startY: currentY,
      ...headerFooterOpts,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        textColor: [44, 62, 80],
      },
      headStyles: { 
        fillColor: [52, 152, 219],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });

    // Teachers Section
    doc.addPage();
    currentY = 70;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Teachers Report', 20, currentY);
    currentY += 15;

    autoTable(doc, {
      head: [['Name', 'Gender', 'Phone', 'Qualification', 'Experience', 'Status']],
      body: data.teachers.slice(0, 50).map(item => [
        item.name || 'N/A',
        item.gender || 'N/A',
        item.phoneNumber || 'N/A',
        item.qualification || 'N/A',
        item.yearsOfExperience ? `${item.yearsOfExperience} years` : 'N/A',
        item.status || 'N/A',
      ]),
      startY: currentY,
      ...headerFooterOpts,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        textColor: [44, 62, 80],
      },
      headStyles: { 
        fillColor: [46, 204, 113],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });

    // Courses Section
    doc.addPage();
    currentY = 70;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Courses Report', 20, currentY);
    currentY += 15;

    autoTable(doc, {
      head: [['Name', 'Code', 'Class', 'Teacher', 'Enrollments', 'Status']],
      body: data.courses.slice(0, 50).map(item => [
        item.name || 'N/A',
        item.code || 'N/A',
        item.className || 'N/A',
        item.teacherName || 'N/A',
        item.enrollmentCount || 0,
        item.status || 'N/A',
      ]),
      startY: currentY,
      ...headerFooterOpts,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        textColor: [44, 62, 80],
      },
      headStyles: { 
        fillColor: [155, 89, 182],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });

    // Enrollments Section
    doc.addPage();
    currentY = 70;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Enrollments Report', 20, currentY);
    currentY += 15;

    autoTable(doc, {
      head: [['Student ID', 'Student', 'Course', 'Class', 'Status', 'Term']],
      body: data.enrollments.slice(0, 50).map(item => [
        item.studentHumanId || item.studentId || 'N/A',
        item.studentName || 'N/A',
        item.courseName || 'N/A',
        item.className || 'N/A',
        item.status || 'N/A',
        item.termName || 'N/A',
      ]),
      startY: currentY,
      ...headerFooterOpts,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        textColor: [44, 62, 80],
      },
      headStyles: { 
        fillColor: [241, 196, 15],
        textColor: [44, 62, 80],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
    });

    // Financial Summary Section
    doc.addPage();
    currentY = 70;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Financial Summary', 20, currentY);
    currentY += 15;

    autoTable(doc, {
      head: [['Student', 'Class', 'Amount', 'Date', 'Method', 'Status']],
      body: data.feePayments.slice(0, 50).map(item => [
        item.studentName || 'N/A',
        item.className || 'N/A',
        item.amount ? `$${item.amount.toLocaleString()}` : 'N/A',
        item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A',
        item.paymentMethod || 'N/A',
        item.status || 'N/A',
      ]),
      startY: currentY,
      ...headerFooterOpts,
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        textColor: [44, 62, 80],
      },
      headStyles: { 
        fillColor: [231, 76, 60],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        2: { halign: 'right' }, // Amount column
      },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
      tableWidth: 'auto',
      margin: { left: 20, right: 20 },
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