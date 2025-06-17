
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';

export default function ParentChildrenPerformance() {
  const { user } = useAuth();
  
  if (!user?.parentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No children data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Children's Performance</h1>
        <p className="text-muted-foreground">Monitor your children's academic progress</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {user.parentData.children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <CardTitle>{child.name}'s Academic Performance</CardTitle>
              <CardDescription>Course-wise performance breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course-wise grades */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Course Grades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {child.grades.map((grade, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-background/50 border">
                      <span className="font-medium">{grade.course}</span>
                      <Badge variant={
                        grade.grade.startsWith('A') ? 'default' :
                        grade.grade.startsWith('B') ? 'secondary' :
                        'outline'
                      }>
                        {grade.grade}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Performance Chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance Trend</h3>
                <div className="h-64">
                  <ChartContainer
                    config={{
                      score: { theme: { light: "#7c3aed", dark: "#7c3aed" } },
                      average: { theme: { light: "#94a3b8", dark: "#94a3b8" } },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={child.grades.map(grade => {
                          let score = 0;
                          if (grade.grade.startsWith('A')) score = 90 + Math.floor(Math.random() * 10);
                          else if (grade.grade.startsWith('B')) score = 80 + Math.floor(Math.random() * 10);
                          else if (grade.grade.startsWith('C')) score = 70 + Math.floor(Math.random() * 10);
                          else if (grade.grade.startsWith('D')) score = 60 + Math.floor(Math.random() * 10);
                          else score = 50 + Math.floor(Math.random() * 10);
                          
                          return {
                            name: grade.course,
                            score: score,
                            average: Math.min(Math.max(score - 5 - Math.floor(Math.random() * 10), 50), 95)
                          };
                        })}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="score" fill="var(--color-score)" name="Student Score" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="average" fill="var(--color-average)" name="Class Average" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </div>
              
              {/* Overall Progress */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Overall Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Academic Performance</span>
                    <span className="font-medium">{Math.floor(80 + Math.random() * 15)}%</span>
                  </div>
                  <Progress value={Math.floor(80 + Math.random() * 15)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
