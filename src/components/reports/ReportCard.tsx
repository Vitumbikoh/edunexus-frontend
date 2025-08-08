import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SummaryItem {
  label: string;
  value: React.ReactNode;
}

export interface ReportRow {
  key?: string | number;
  cells: React.ReactNode[];
}

interface ReportCardProps {
  title: string;
  summary: SummaryItem[];
  columns: string[];
  rows: ReportRow[];
  emptyMessage?: string;
  action?: React.ReactNode;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  summary,
  columns,
  rows,
  emptyMessage = "No records found.",
  action,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {summary?.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {summary.map((item, idx) => (
                <div key={idx} className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  {columns.map((col, i) => (
                    <th key={i} className="border border-border p-3 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row, rIdx) => (
                    <tr key={row.key ?? rIdx} className="hover:bg-muted/50">
                      {row.cells.map((cell, cIdx) => (
                        <td key={cIdx} className="border border-border p-3">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="border border-border p-3 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
