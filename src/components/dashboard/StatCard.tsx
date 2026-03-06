
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
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between space-y-0 pb-1">
          <div className="text-xs font-medium text-muted-foreground leading-tight">
            {title}
          </div>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <div className="h-3.5 w-3.5 text-primary">
              {icon}
            </div>
          </div>
        </div>
        <div className="text-lg font-bold">{value}</div>
        {trend && (
          <div className="flex items-center gap-2 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={cn(
              "text-xs font-semibold",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
