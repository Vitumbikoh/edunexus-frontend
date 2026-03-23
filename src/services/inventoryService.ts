import { apiClient } from './apiClient';

export type InventorySummary = {
  totalAssets: number;
  activeAssets: number;
  underMaintenanceAssets: number;
  retiredAssets: number;
  totalInventoryItems: number;
  lowStockCount: number;
  pendingMaintenance: number;
  completedMaintenance: number;
  totalAssetValue: number;
  totalMaintenanceCost: number;
};

export type Asset = {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  description?: string;
  purchaseDate?: string;
  purchaseCost: number;
  supplier?: string;
  status: 'active' | 'under_maintenance' | 'retired' | string;
  location?: string;
  department?: string;
  assignedUserId?: string;
  assignedUser?: {
    id: string;
    username?: string;
    email?: string;
  };
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetAssignment = {
  id: string;
  assetId: string;
  assignedUserId?: string;
  assignedLocation?: string;
  assignedDepartment?: string;
  assignedAt: string;
  releasedAt?: string;
  releaseReason?: string;
  status: 'active' | 'transferred' | 'returned' | string;
  notes?: string;
  schoolId: string;
  asset?: Asset;
  assignedUser?: {
    id: string;
    username?: string;
    email?: string;
  };
};

export type MaintenanceLog = {
  id: string;
  assetId: string;
  issueDescription: string;
  maintenanceType: 'repair' | 'service' | 'inspection' | string;
  maintenanceDate: string;
  repairCost: number;
  status: 'pending' | 'completed' | string;
  resolutionNotes?: string;
  nextMaintenanceDate?: string;
  expenseId?: string;
  schoolId: string;
  asset?: Asset;
  reportedBy?: {
    id: string;
    username?: string;
    email?: string;
  };
};

export type InventoryItem = {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit?: string;
  description?: string;
  currentStock: number;
  minimumThreshold: number;
  unitCost: number;
  supplier?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
};

export type StockTransaction = {
  id: string;
  itemId: string;
  transactionType: 'stock_in' | 'stock_out' | 'adjustment' | string;
  quantity: number;
  unitCost?: number;
  totalCost: number;
  transactionDate: string;
  reference?: string;
  notes?: string;
  schoolId: string;
  item?: InventoryItem;
};

const withSchoolId = (endpoint: string, schoolId?: string) => {
  if (!schoolId) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}schoolId=${encodeURIComponent(schoolId)}`;
};

export const inventoryApi = {
  getSummary: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/summary', opts.schoolId), opts.token) as Promise<InventorySummary>,

  listAssets: (
    opts: {
      token?: string;
      schoolId?: string;
      q?: string;
      category?: string;
      status?: string;
    } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.q) params.set('q', opts.q);
    if (opts.category) params.set('category', opts.category);
    if (opts.status) params.set('status', opts.status);
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/inventory/assets${query ? `?${query}` : ''}`, opts.token) as Promise<Asset[]>;
  },

  listMyAssets: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/my-assets', opts.schoolId), opts.token) as Promise<Asset[]>,

  createAsset: (
    data: {
      assetTag: string;
      name: string;
      category: string;
      description?: string;
      purchaseDate?: string;
      purchaseCost?: number;
      supplier?: string;
      status?: string;
      location?: string;
      department?: string;
      assignedUserId?: string;
      schoolId?: string;
    },
    token?: string,
  ) => apiClient.post(withSchoolId('/inventory/assets', data.schoolId), data, token) as Promise<Asset>,

  createAssignment: (
    data: {
      assetId: string;
      assignedUserId?: string;
      assignedLocation?: string;
      assignedDepartment?: string;
      notes?: string;
      schoolId?: string;
    },
    token?: string,
  ) => apiClient.post(withSchoolId('/inventory/assignments', data.schoolId), data, token) as Promise<AssetAssignment>,

  listAssignments: (opts: { token?: string; schoolId?: string; activeOnly?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (opts.activeOnly !== undefined) params.set('activeOnly', String(opts.activeOnly));
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/inventory/assignments${query ? `?${query}` : ''}`, opts.token) as Promise<AssetAssignment[]>;
  },

  releaseAssignment: (
    assignmentId: string,
    data: { releaseReason?: string; schoolId?: string } = {},
    token?: string,
  ) =>
    apiClient.post(
      withSchoolId(`/inventory/assignments/${assignmentId}/release`, data.schoolId),
      data,
      token,
    ) as Promise<AssetAssignment>,

  listMaintenance: (
    opts: { token?: string; schoolId?: string; status?: string; assetId?: string } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.status) params.set('status', opts.status);
    if (opts.assetId) params.set('assetId', opts.assetId);
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/inventory/maintenance${query ? `?${query}` : ''}`, opts.token) as Promise<MaintenanceLog[]>;
  },

  createMaintenance: (
    data: {
      assetId: string;
      issueDescription: string;
      maintenanceType?: string;
      repairCost?: number;
      status?: string;
      resolutionNotes?: string;
      nextMaintenanceDate?: string;
      schoolId?: string;
    },
    token?: string,
  ) => apiClient.post(withSchoolId('/inventory/maintenance', data.schoolId), data, token) as Promise<MaintenanceLog>,

  updateMaintenance: (
    id: string,
    data: {
      issueDescription?: string;
      maintenanceType?: string;
      repairCost?: number;
      status?: string;
      resolutionNotes?: string;
      nextMaintenanceDate?: string;
      schoolId?: string;
    },
    token?: string,
  ) => apiClient.put(withSchoolId(`/inventory/maintenance/${id}`, data.schoolId), data, token) as Promise<MaintenanceLog>,

  listItems: (
    opts: {
      token?: string;
      schoolId?: string;
      q?: string;
      category?: string;
      lowStockOnly?: boolean;
    } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.q) params.set('q', opts.q);
    if (opts.category) params.set('category', opts.category);
    if (opts.lowStockOnly) params.set('lowStockOnly', 'true');
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/inventory/items${query ? `?${query}` : ''}`, opts.token) as Promise<InventoryItem[]>;
  },

  createItem: (
    data: {
      itemCode: string;
      name: string;
      category: string;
      unit?: string;
      description?: string;
      currentStock?: number;
      minimumThreshold?: number;
      unitCost?: number;
      supplier?: string;
      schoolId?: string;
    },
    token?: string,
  ) => apiClient.post(withSchoolId('/inventory/items', data.schoolId), data, token) as Promise<InventoryItem>,

  listStockTransactions: (
    opts: { token?: string; schoolId?: string; itemId?: string; type?: string } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.itemId) params.set('itemId', opts.itemId);
    if (opts.type) params.set('type', opts.type);
    if (opts.schoolId) params.set('schoolId', opts.schoolId);
    const query = params.toString();
    return apiClient.get(`/inventory/stock-transactions${query ? `?${query}` : ''}`, opts.token) as Promise<StockTransaction[]>;
  },

  createStockTransaction: (
    data: {
      itemId: string;
      transactionType: 'stock_in' | 'stock_out' | 'adjustment';
      quantity: number;
      unitCost?: number;
      reference?: string;
      notes?: string;
      schoolId?: string;
    },
    token?: string,
  ) =>
    apiClient.post(withSchoolId('/inventory/stock-transactions', data.schoolId), data, token) as Promise<StockTransaction>,

  getAssetRegisterReport: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/reports/asset-register', opts.schoolId), opts.token) as Promise<Asset[]>,

  getAssetAllocationReport: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/reports/asset-allocation', opts.schoolId), opts.token) as Promise<AssetAssignment[]>,

  getMaintenanceCostReport: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/reports/maintenance-cost', opts.schoolId), opts.token) as Promise<{
      totalCost: number;
      totalRecords: number;
      pendingCount: number;
      completedCount: number;
      logs: MaintenanceLog[];
    }>,

  getStockLevelsReport: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/reports/stock-levels', opts.schoolId), opts.token) as Promise<InventoryItem[]>,

  getLowStockReport: (opts: { token?: string; schoolId?: string } = {}) =>
    apiClient.get(withSchoolId('/inventory/reports/low-stock', opts.schoolId), opts.token) as Promise<InventoryItem[]>,
};
