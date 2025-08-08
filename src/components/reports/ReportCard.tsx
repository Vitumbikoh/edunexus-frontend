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
    <Card className="overflow-hidden border border-border shadow-sm">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="tracking-wide text-foreground">{title}</CardTitle>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {summary?.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {summary.map((item, idx) => (
                <div key={idx} className="text-center p-4 bg-muted rounded-lg border border-border shadow-sm">
                  <div className="text-2xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-wide">{item.label}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/60">
                  {columns.map((col, i) => (
                    <th key={i} className="p-3 text-left text-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row, rIdx) => (
                    <tr key={row.key ?? rIdx} className="hover:bg-muted/50 border-t border-border">
                      {row.cells.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 align-top text-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="p-3 text-center text-muted-foreground"
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
