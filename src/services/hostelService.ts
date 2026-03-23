import { apiClient } from './apiClient';

export type Hostel = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'mixed' | string;
  capacity: number;
  occupiedBeds?: number;
  availableBeds?: number;
  isActive: boolean;
  wardenName?: string;
  wardenPhone?: string;
  notes?: string;
  roomCount?: number;
  roomCapacity?: number;
  floor?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  rooms?: HostelRoom[];
};

export type HostelSetup = {
  id: string;
  schoolId: string;
  roomNamingMode: 'manual' | 'numeric' | 'alphabetical' | string;
  numericPrefix: string;
  defaultFloor: string;
  defaultRoomCapacity: number;
  createdAt: string;
  updatedAt: string;
};

export type HostelRoom = {
  id: string;
  hostelId: string;
  name: string;
  floor?: string;
  capacity: number;
  occupiedBeds?: number;
  availableBeds?: number;
  isActive: boolean;
  notes?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type HostelSummary = {
  totalHostels: number;
  activeHostels: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
};

export type HostelStudent = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  username?: string;
  gender?: string;
  class?: {
    id: string;
    name: string;
    numericalName: number;
  };
};

export type HostelClass = {
  id: string;
  name: string;
  numericalName?: number;
  isActive?: boolean;
};

export type HostelAllocation = {
  id: string;
  studentId: string;
  hostelId: string;
  roomId: string;
  schoolId: string;
  status: 'active' | 'released' | string;
  bedNumber?: string;
  notes?: string;
  releaseReason?: string;
  assignedAt: string;
  releasedAt?: string;
  student?: HostelStudent;
  hostel?: Hostel;
  room?: HostelRoom;
};

export type HostelClassAllocationResult = {
  success: boolean;
  classId: string;
  className: string;
  hostelId?: string;
  hostelName?: string;
  totalClassStudents: number;
  assignedCount: number;
  alreadyAllocatedCount: number;
  genderMismatchCount: number;
  notYetAssignedCount?: number;
  toBeAssignedNow?: number;
  unassignedDueToCapacity: number;
  availableBedsAtStart?: number;
  message: string;
};

const withSchoolId = (endpoint: string, schoolId?: string) => {
  if (!schoolId) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}schoolId=${encodeURIComponent(schoolId)}`;
};

export const hostelApi = {
  getSummary: (opts: { token?: string; schoolId?: string } = {}) => {
    return apiClient.get(withSchoolId('/hostels/summary', opts.schoolId), opts.token) as Promise<HostelSummary>;
  },

  getSetup: (opts: { token?: string; schoolId?: string } = {}) => {
    return apiClient.get(withSchoolId('/hostels/setup', opts.schoolId), opts.token) as Promise<HostelSetup>;
  },

  listClasses: (opts: { token?: string; schoolId?: string } = {}) => {
    return apiClient.get(withSchoolId('/classes', opts.schoolId), opts.token) as Promise<HostelClass[]>;
  },

  updateSetup: (
    data: Partial<{
      roomNamingMode: 'manual' | 'numeric' | 'alphabetical';
      numericPrefix: string;
      defaultFloor: string;
      defaultRoomCapacity: number;
      schoolId?: string;
    }>,
    token?: string,
  ) => {
    return apiClient.put(withSchoolId('/hostels/setup', data.schoolId), data, token) as Promise<HostelSetup>;
  },

  listHostels: (opts: { token?: string; includeRooms?: boolean; schoolId?: string } = {}) => {
    const params = new URLSearchParams();
    if (opts.includeRooms) params.set('includeRooms', 'true');
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/hostels${query ? `?${query}` : ''}`, opts.token) as Promise<Hostel[]>;
  },

  createHostel: (
    data: {
      name: string;
      gender: 'male' | 'female' | 'mixed';
      capacity: number;
      isActive?: boolean;
      wardenName?: string;
      wardenPhone?: string;
      notes?: string;
      roomCount?: number;
      roomCapacity?: number;
      floor?: string;
      schoolId?: string;
    },
    token?: string,
  ) => {
    return apiClient.post(withSchoolId('/hostels', data.schoolId), data, token) as Promise<Hostel>;
  },

  updateHostel: (
    id: string,
    data: Partial<{
      name: string;
      gender: 'male' | 'female' | 'mixed';
      capacity: number;
      isActive: boolean;
      wardenName?: string;
      wardenPhone?: string;
      notes?: string;
      schoolId?: string;
    }>,
    token?: string,
  ) => {
    return apiClient.put(withSchoolId(`/hostels/${id}`, data.schoolId), data, token) as Promise<Hostel>;
  },

  deleteHostel: (id: string, opts: { token?: string; schoolId?: string } = {}) => {
    return apiClient.delete(withSchoolId(`/hostels/${id}`, opts.schoolId), opts.token) as Promise<{ success: boolean }>;
  },

  listRooms: (hostelId: string, opts: { token?: string; schoolId?: string } = {}) => {
    return apiClient.get(withSchoolId(`/hostels/${hostelId}/rooms`, opts.schoolId), opts.token) as Promise<HostelRoom[]>;
  },

  createRoom: (
    hostelId: string,
    data: {
      name: string;
      capacity: number;
      floor?: string;
      isActive?: boolean;
      notes?: string;
      schoolId?: string;
    },
    token?: string,
  ) => {
    return apiClient.post(withSchoolId(`/hostels/${hostelId}/rooms`, data.schoolId), data, token) as Promise<HostelRoom>;
  },

  updateRoom: (
    roomId: string,
    data: Partial<{
      name: string;
      capacity: number;
      floor?: string;
      isActive?: boolean;
      notes?: string;
      schoolId?: string;
    }>,
    token?: string,
  ) => {
    return apiClient.put(withSchoolId(`/hostels/rooms/${roomId}`, data.schoolId), data, token) as Promise<HostelRoom>;
  },

  deleteRoom: (roomId: string, opts: { token?: string; schoolId?: string } = {}) => {
    return apiClient.delete(withSchoolId(`/hostels/rooms/${roomId}`, opts.schoolId), opts.token) as Promise<{ success: boolean }>;
  },

  listAllocations: (
    opts: {
      token?: string;
      activeOnly?: boolean;
      hostelId?: string;
      studentSearch?: string;
      schoolId?: string;
    } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.activeOnly !== undefined) params.set('activeOnly', String(opts.activeOnly));
    if (opts.hostelId) params.set('hostelId', opts.hostelId);
    if (opts.studentSearch) params.set('studentSearch', opts.studentSearch);
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/hostels/allocations${query ? `?${query}` : ''}`, opts.token) as Promise<HostelAllocation[]>;
  },

  createAllocation: (
    data: {
      studentId: string;
      hostelId: string;
      roomId: string;
      bedNumber?: string;
      assignedAt?: string;
      notes?: string;
      schoolId?: string;
    },
    token?: string,
  ) => {
    return apiClient.post(withSchoolId('/hostels/allocations', data.schoolId), data, token) as Promise<HostelAllocation>;
  },

  createClassAllocation: (
    data: {
      classId: string;
      hostelId: string;
      assignedAt?: string;
      notes?: string;
      schoolId?: string;
    },
    token?: string,
  ) => {
    return apiClient.post(withSchoolId('/hostels/allocations/class', data.schoolId), data, token) as Promise<HostelClassAllocationResult>;
  },

  getClassAllocationPreview: (
    opts: {
      classId: string;
      hostelId: string;
      token?: string;
      schoolId?: string;
    },
  ) => {
    const params = new URLSearchParams();
    params.set('classId', opts.classId);
    params.set('hostelId', opts.hostelId);
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    return apiClient.get(`/hostels/allocations/class-preview?${params.toString()}`, opts.token) as Promise<HostelClassAllocationResult>;
  },

  releaseAllocation: (
    allocationId: string,
    data: {
      releasedAt?: string;
      reason?: string;
      schoolId?: string;
    },
    token?: string,
  ) => {
    return apiClient.post(withSchoolId(`/hostels/allocations/${allocationId}/release`, data.schoolId), data, token) as Promise<HostelAllocation>;
  },

  releaseAllAllocations: (
    data: {
      hostelId?: string;
      reason?: string;
      schoolId?: string;
    },
    token?: string,
  ) => {
    return apiClient.post(withSchoolId('/hostels/allocations/release-all', data.schoolId), data, token) as Promise<{
      success: boolean;
      releasedCount: number;
    }>;
  },

  searchStudents: (opts: { token?: string; q: string; limit?: number; schoolId?: string }) => {
    const params = new URLSearchParams();
    params.set('q', opts.q);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    return apiClient.get(`/hostels/students/search?${params.toString()}`, opts.token) as Promise<HostelStudent[]>;
  },
};
