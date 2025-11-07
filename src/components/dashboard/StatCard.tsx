
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    hasComparativeData?: boolean;
  };
  className?: string;
};

export default function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{value}</h3>
            
            {trend && (
              <div className="flex items-center mt-2 space-x-1">
                {trend.hasComparativeData === false ? (
                  // Show "New" badge when there's no comparative data
                  <div className="flex items-center space-x-1">
                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                      New
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">no previous data</span>
                  </div>
                ) : (
                  // Show normal trend comparison
                  <>
                    {trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn(
                      "text-xs font-semibold",
                      trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {trend.isPositive ? "+" : ""}{trend.value}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="text-gray-700 dark:text-gray-300">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
