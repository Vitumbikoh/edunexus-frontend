import { apiClient } from './apiClient';

export type Book = {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  totalCopies: number;
  availableCopies: number;
  classId?: string;
  class?: { id: string; name: string; numericalName: number };
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type Borrowing = {
  id: string;
  bookId: string | null;
  bookName?: string | null;
  studentId: string;
  student?: { id: string; studentId: string; firstName: string; lastName: string };
  schoolId: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  fine: string;
};

export type PaginatedResponse<T> = {
  books: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
};

export const libraryApi = {
  listBooks: (opts: { token?: string; q?: string; schoolId?: string; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (opts.q) params.set('q', opts.q);
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    params.set('page', (opts.page || 1).toString());
    params.set('limit', (opts.limit || 10).toString());
    const query = params.toString();
    return apiClient.get(`/library/books${query ? `?${query}` : ''}`, opts.token) as Promise<PaginatedResponse<Book>>;
  },

  createBook: (data: { title: string; author?: string; isbn?: string; totalCopies: number; classId?: string; schoolId?: string }, token?: string) => {
    return apiClient.post(`/library/books${data.schoolId ? `?schoolId=${encodeURIComponent(data.schoolId)}` : ''}`, data, token) as Promise<Book>;
  },

  updateBook: (id: string, data: Partial<{ title: string; author?: string; isbn?: string; totalCopies: number; classId?: string }>, token?: string) => {
    return apiClient.put(`/library/books/${id}`, data, token) as Promise<Book>;
  },

  deleteBook: (id: string, token?: string) => {
    return apiClient.delete(`/library/books/${id}`, token) as Promise<{ success: boolean }>;
  },

  listBorrowings: (opts: { 
    token?: string; 
    studentId?: string; 
    activeOnly?: boolean; 
    schoolId?: string;
    page?: number;
    limit?: number;
    classId?: string;
    studentSearch?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (opts.studentId) params.set('studentId', opts.studentId);
    if (opts.activeOnly) params.set('activeOnly', 'true');
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    if (opts.classId) params.set('classId', opts.classId);
    if (opts.studentSearch) params.set('studentSearch', opts.studentSearch);
    if (opts.page) params.set('page', opts.page.toString());
    if (opts.limit) params.set('limit', opts.limit.toString());
    const query = params.toString();
    return apiClient.get(`/library/borrowings${query ? `?${query}` : ''}`, opts.token) as Promise<Borrowing[] | {
      borrowings: Borrowing[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    }>;
  },

  borrow: (data: { bookId?: string; bookName?: string; studentId: string; dueAt: string; schoolId?: string }, token?: string) => {
    const q = data.schoolId ? `?schoolId=${encodeURIComponent(data.schoolId)}` : '';
    return apiClient.post(`/library/borrow${q}`, data, token) as Promise<Borrowing>;
  },

  returnBook: (data: { borrowingId: string; returnedAt?: string }, token?: string) => {
    return apiClient.post(`/library/return`, data, token) as Promise<Borrowing>;
  },

  myBorrowings: (token?: string) => {
    return apiClient.get(`/library/me/borrowings`, token) as Promise<Borrowing[]>;
  },

  myHistory: (token?: string) => {
    return apiClient.get(`/library/me/history`, token) as Promise<Borrowing[]>;
  },

  reportMostBorrowed: (opts: { token?: string; schoolId?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/library/reports/most-borrowed${query ? `?${query}` : ''}`, opts.token) as Promise<Array<{ bookId: string; borrowCount: string }>>;
  },

  reportOverdue: (opts: { token?: string; schoolId?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/library/reports/overdue${query ? `?${query}` : ''}`, opts.token) as Promise<Borrowing[]>;
  },

  searchStudents: (opts: { token?: string; q: string; limit?: number; schoolId?: string }) => {
    const params = new URLSearchParams();
    params.set('q', opts.q);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/library/students/search?${query}`, opts.token) as Promise<Array<{ id: string; studentId: string; firstName: string; lastName: string; class?: { id: string; name: string; numericalName: number } }>>;
  },

  listClasses: (opts: { token?: string; schoolId?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/classes${query ? `?${query}` : ''}`, opts.token) as Promise<Array<{ id: string; name: string; numericalName: number }>>;
  },
};
