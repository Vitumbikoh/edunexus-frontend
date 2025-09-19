import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Plus, Loader2 } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

const mockTransactions = [
  {
    id: '1',
    type: 'Payment',
    description: 'Tuition Fee - John Doe',
    amount: 2500.00,
    date: '2024-01-15',
    status: 'Completed',
    reference: 'TXN-001',
    category: 'Tuition'
  },
  {
    id: '2',
    type: 'Refund',
    description: 'Course Cancellation - Jane Smith',
    amount: -150.00,
    date: '2024-01-14',
    status: 'Processed',
    reference: 'TXN-002',
    category: 'Refund'
  },
  {
    id: '3',
    type: 'Payment',
    description: 'Library Fee - Mike Johnson',
    amount: 75.00,
    date: '2024-01-13',
    status: 'Pending',
    reference: 'TXN-003',
    category: 'Fees'
  },
  {
    id: '4',
    type: 'Payment',
    description: 'Lab Fee - Sarah Wilson',
    amount: 200.00,
    date: '2024-01-12',
    status: 'Completed',
    reference: 'TXN-004',
    category: 'Fees'
  }
];

export default function Transactions() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [searchPeriod, setSearchPeriod] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async (page = 1, search = '', status = 'all', type = 'all', start = '', end = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (search) params.append('search', search);
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRANSACTIONS}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      // Fallback to mock data if API fails
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTransactions(currentPage, searchPeriod, statusFilter, typeFilter, startDate, endDate);
    }
  }, [token, currentPage, searchPeriod, statusFilter, typeFilter, startDate, endDate]);

  // Filter transactions client-side for additional filtering
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchPeriod ||
      transaction.receiptNumber?.toLowerCase().includes(searchPeriod.toLowerCase()) ||
      transaction.studentName?.toLowerCase().includes(searchPeriod.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchPeriod.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      transaction.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'payment' && (parseFloat(transaction.amount) || 0) > 0) ||
      (typeFilter === 'refund' && (parseFloat(transaction.amount) || 0) < 0);

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAmountColor = (amount: number) => {
    return amount < 0 ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage and view all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || transactions.length}</div>
            <p className="text-xs text-muted-foreground">Total records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${transactions.reduce((sum, t) => {
                const amount = parseFloat(t.amount) || 0;
                return sum + (amount > 0 ? amount : 0);
              }, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Income from payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${transactions.filter(t => t.status?.toLowerCase() === 'pending').reduce((sum, t) => {
                const amount = parseFloat(t.amount) || 0;
                return sum + amount;
              }, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.status?.toLowerCase() === 'pending').length} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${Math.abs(transactions.filter(t => (parseFloat(t.amount) || 0) < 0).reduce((sum, t) => {
                const amount = parseFloat(t.amount) || 0;
                return sum + amount;
              }, 0)).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.amount < 0).length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View and manage all financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number or student name..."
                value={searchPeriod}
                onChange={(e) => setSearchPeriod(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-32"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-32"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="mb-4 p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
              <p className="font-medium">Error loading transactions</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Transactions Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading transactions...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.receiptNumber || transaction.id}</TableCell>
                      <TableCell>
                        {transaction.studentName ? `${transaction.studentName} - ${transaction.description || 'Payment'}` : transaction.description || 'Payment'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{(parseFloat(transaction.amount) || 0) > 0 ? 'Payment' : 'Refund'}</Badge>
                      </TableCell>
                      <TableCell>{transaction.term || 'N/A'}</TableCell>
                      <TableCell>{transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status || 'Completed')}>
                          {transaction.status || 'Completed'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getAmountColor(parseFloat(transaction.amount) || 0)}`}>
                        ${Math.abs(parseFloat(transaction.amount) || 0).toFixed(2)}
                        {(parseFloat(transaction.amount) || 0) < 0 && ' (Refund)'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {filteredTransactions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}