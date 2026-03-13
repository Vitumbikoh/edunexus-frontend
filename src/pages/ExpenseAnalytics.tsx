import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Loader2, DollarSign, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/api';
import { formatCurrency, getDefaultCurrency } from '@/lib/currency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';

export default function ExpenseAnalytics() {
  const { token } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenseAnalytics = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_CONFIG.BASE_URL}/expenses/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        } else {
          console.error('Failed to fetch expense analytics');
          setError('Failed to load expense analytics');
        }
      } catch (err) {
        console.error('Error fetching expense analytics:', err);
        setError('Error loading expense analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading expense analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'No data available'}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary = analyticsData.summary || {};
  const monthlyTrend = analyticsData.monthlyTrend || {};
  const categoryBreakdown = analyticsData.categoryBreakdown || {};

  // Prepare chart data for monthly trends
  const monthlyChartData = Object.entries(monthlyTrend).map(([month, data]: [string, any]) => ({
    month,
    amount: data.amount || 0,
    count: data.count || 0,
    displayName: data.displayName || month
  }));

  // Prepare chart data for category breakdown
  const categoryChartData = Object.entries(categoryBreakdown).map(([category, amount]: [string, any]) => ({
    name: category,
    value: amount,
    color: ['#7AA45D', '#1B88CE', '#F5A623', '#6B7280', '#DC2626', '#6B7280'][Object.keys(categoryBreakdown).indexOf(category) % 6]
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense Analytics</h1>
          <p className="text-muted-foreground">Comprehensive expense insights and trends</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Budget Utilization</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{summary.budgetUtilization || '0%'}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Average Expense</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{summary.avgExpense ? formatCurrency(summary.avgExpense, getDefaultCurrency()) : formatCurrency(0, getDefaultCurrency())}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Approval Rate</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{summary.approvalRate || '0%'}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg. Approval Time</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{summary.avgApprovalTime || '0 days'}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Monthly Spending Trends
            </CardTitle>
            <CardDescription>Expense amounts over the last months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value, getDefaultCurrency())} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, getDefaultCurrency()), 'Amount']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#1B88CE"
                    fill="#1B88CE"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Expense Categories
            </CardTitle>
            <CardDescription>Breakdown by expense category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatCurrency(value, getDefaultCurrency())}`}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(value, getDefaultCurrency()), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No category data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Monthly Breakdown</CardTitle>
          <CardDescription>Monthly expense amounts and counts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Month</th>
                  <th className="text-right py-2 px-4 font-medium">Amount</th>
                  <th className="text-right py-2 px-4 font-medium">Expenses</th>
                  <th className="text-right py-2 px-4 font-medium">Avg per Expense</th>
                </tr>
              </thead>
              <tbody>
                {monthlyChartData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-card/90">
                    <td className="py-3 px-4 font-medium">{item.displayName.split('\n')[0]}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.amount, getDefaultCurrency())}</td>
                    <td className="py-3 px-4 text-right">{item.count}</td>
                    <td className="py-3 px-4 text-right font-mono">
                      {item.count > 0 ? formatCurrency(item.amount / item.count, getDefaultCurrency()) : formatCurrency(0, getDefaultCurrency())}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}