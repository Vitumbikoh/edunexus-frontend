import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal, Award, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from "@/config/api";
import { classService } from "@/services/classService";
import { termService } from "@/services/termService";

type TeacherMetric = {
  teacherId: string;
  firstName: string;
  lastName: string;
  gradeCount: number;
  studentCount: number;
  avgGrade: number;
  passRate: number;
};

type StudentMetric = {
  studentId: string;
  studentHumanId?: string;
  studentName: string;
  className?: string;
  classId?: string;
  courseCount: number;
  avgScore: number;
  passRate: number;
  rewardScore: number;
};

type RankedTeacher = TeacherMetric & { rewardScore: number };

type ScoringProfile = "balanced" | "academic-excellence" | "pass-rate-focus";

const PROFILE_WEIGHTS: Record<ScoringProfile, {
  teacher: { avgGrade: number; passRate: number; studentCoverage: number };
  student: { avgScore: number; passRate: number; consistency: number };
  label: string;
}> = {
  balanced: {
    label: "Balanced",
    teacher: { avgGrade: 50, passRate: 30, studentCoverage: 20 },
    student: { avgScore: 60, passRate: 25, consistency: 15 },
  },
  "academic-excellence": {
    label: "Academic Excellence",
    teacher: { avgGrade: 65, passRate: 25, studentCoverage: 10 },
    student: { avgScore: 75, passRate: 20, consistency: 5 },
  },
  "pass-rate-focus": {
    label: "Pass Rate Focus",
    teacher: { avgGrade: 35, passRate: 50, studentCoverage: 15 },
    student: { avgScore: 40, passRate: 45, consistency: 15 },
  },
};

const isGraduatedClass = (cls?: { name?: string; numericalName?: number }) => {
  const className = (cls?.name || "").trim().toLowerCase();
  return cls?.numericalName === 999 || className === "graduated" || className.includes("graduated");
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export default function ExamRewards() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<RankedTeacher[]>([]);
  const [students, setStudents] = useState<StudentMetric[]>([]);

  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; isCurrent?: boolean }>>([]);

  const [selectedTermId, setSelectedTermId] = useState<string>("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [scoringProfile, setScoringProfile] = useState<ScoringProfile>("balanced");

  const [teacherMinGradeCount, setTeacherMinGradeCount] = useState(20);
  const [studentMinCourseCount, setStudentMinCourseCount] = useState(3);

  const activeWeights = PROFILE_WEIGHTS[scoringProfile];

  const loadOptions = useCallback(async () => {
    if (!token) return;

    try {
      const [classData, termData] = await Promise.all([
        classService.getClasses(token),
        termService.getTerms(token),
      ]);

      const activeClasses = (classData || []).filter((cls) => !isGraduatedClass(cls));
      setClasses(activeClasses.map((c) => ({ id: c.id, name: c.name })));

      const mappedTerms = (termData || []).map((t: any) => ({
        id: t.id,
        name: t.name || t.periodName || `Term ${t.termNumber ?? ""}`.trim(),
        isCurrent: t.isCurrent === true || t.current === true,
      }));
      setTerms(mappedTerms);

      const currentTerm = mappedTerms.find((t) => t.isCurrent);
      if (currentTerm) {
        setSelectedTermId(currentTerm.id);
      }
    } catch (error) {
      console.error("Failed to load reward options:", error);
      toast({
        title: "Error",
        description: "Failed to load classes and terms for rewards",
        variant: "destructive",
      });
    }
  }, [token, toast]);

  const loadMetrics = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const teacherParams = new URLSearchParams();
      if (selectedTermId !== "all") teacherParams.set("termId", selectedTermId);
      teacherParams.set("limit", "200");

      const teacherRes = await fetch(`${API_CONFIG.BASE_URL}/analytics/teacher-performance?${teacherParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!teacherRes.ok) throw new Error("Failed to load teacher performance");
      const teacherPayload = await teacherRes.json();
      const teacherRows: TeacherMetric[] = Array.isArray(teacherPayload?.teachers) ? teacherPayload.teachers : [];

      const classIds = selectedClassId !== "all" ? [selectedClassId] : classes.map((c) => c.id);
      const studentResultPayloads = await Promise.all(
        classIds.map(async (classId) => {
          const q = new URLSearchParams();
          if (selectedTermId !== "all") q.set("termId", selectedTermId);
          const res = await fetch(`${API_CONFIG.BASE_URL}/exam-results/class/${encodeURIComponent(classId)}${q.toString() ? `?${q.toString()}` : ""}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return null;
          return res.json();
        })
      );

      const studentMap = new Map<string, {
        studentId: string;
        studentHumanId?: string;
        studentName: string;
        className?: string;
        classId?: string;
        totalScore: number;
        passCount: number;
        courseCount: number;
      }>();

      for (const classResult of studentResultPayloads.filter(Boolean) as any[]) {
        const className = classResult?.classInfo?.name;
        const classId = classResult?.classInfo?.id;

        for (const s of classResult?.students || []) {
          const key = s?.student?.id;
          if (!key) continue;

          const current = studentMap.get(key) || {
            studentId: key,
            studentHumanId: s?.student?.studentId,
            studentName: `${s?.student?.firstName || ""} ${s?.student?.lastName || ""}`.trim(),
            className,
            classId,
            totalScore: 0,
            passCount: 0,
            courseCount: 0,
          };

          for (const r of s?.results || []) {
            const score = Number(r?.finalPercentage || 0);
            current.totalScore += score;
            current.courseCount += 1;
            if (score >= 50 || r?.pass === true) current.passCount += 1;
          }

          studentMap.set(key, current);
        }
      }

      const maxTeacherStudentCount = Math.max(...teacherRows.map((t) => Number(t.studentCount || 0)), 1);

      const rankedTeachers: RankedTeacher[] = teacherRows
        .filter((t) => Number(t.gradeCount || 0) >= teacherMinGradeCount)
        .map((t) => {
          const coverageScore = (Number(t.studentCount || 0) / maxTeacherStudentCount) * 100;
          const rewardScore =
            (clampPercent(Number(t.avgGrade || 0)) * activeWeights.teacher.avgGrade) / 100 +
            (clampPercent(Number(t.passRate || 0)) * activeWeights.teacher.passRate) / 100 +
            (clampPercent(coverageScore) * activeWeights.teacher.studentCoverage) / 100;

          return {
            ...t,
            rewardScore: Number(rewardScore.toFixed(2)),
          };
        })
        .sort((a, b) => b.rewardScore - a.rewardScore);

      const rankedStudents: StudentMetric[] = Array.from(studentMap.values())
        .filter((s) => s.courseCount >= studentMinCourseCount)
        .map((s) => {
          const avgScore = s.courseCount ? s.totalScore / s.courseCount : 0;
          const passRate = s.courseCount ? (s.passCount / s.courseCount) * 100 : 0;
          const consistency = Math.min(100, (s.courseCount / 10) * 100);

          const rewardScore =
            (clampPercent(avgScore) * activeWeights.student.avgScore) / 100 +
            (clampPercent(passRate) * activeWeights.student.passRate) / 100 +
            (clampPercent(consistency) * activeWeights.student.consistency) / 100;

          return {
            studentId: s.studentId,
            studentHumanId: s.studentHumanId,
            studentName: s.studentName,
            className: s.className,
            classId: s.classId,
            courseCount: s.courseCount,
            avgScore: Number(avgScore.toFixed(2)),
            passRate: Number(passRate.toFixed(2)),
            rewardScore: Number(rewardScore.toFixed(2)),
          };
        })
        .sort((a, b) => b.rewardScore - a.rewardScore);

      setTeachers(rankedTeachers);
      setStudents(rankedStudents);
    } catch (error) {
      console.error("Failed to compute exam rewards:", error);
      toast({
        title: "Error",
        description: "Failed to compute exam rewards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    token,
    classes,
    selectedClassId,
    selectedTermId,
    activeWeights,
    teacherMinGradeCount,
    studentMinCourseCount,
    toast,
  ]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    if (!token || classes.length === 0) return;
    void loadMetrics();
  }, [token, classes.length, selectedClassId, selectedTermId, loadMetrics]);

  const topTeachers = useMemo(() => teachers.slice(0, 5), [teachers]);
  const topStudents = useMemo(() => students.slice(0, 10), [students]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exam Rewards</h1>
          <p className="text-muted-foreground mt-2">
            Reward teachers and students using configurable school performance metrics.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadMetrics()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Recalculate
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
            <CardDescription>Select the period and class scope for rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Term</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger><SelectValue placeholder="All terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All terms</SelectItem>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scoring Style</CardTitle>
            <CardDescription>Choose one profile and set minimum evidence thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Reward scoring profile</Label>
              <Select value={scoringProfile} onValueChange={(v) => setScoringProfile(v as ScoringProfile)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="academic-excellence">Academic Excellence</SelectItem>
                  <SelectItem value="pass-rate-focus">Pass Rate Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground rounded-md bg-muted/60 p-2">
              Active profile: {activeWeights.label}. Teacher weights ({activeWeights.teacher.avgGrade}/{activeWeights.teacher.passRate}/{activeWeights.teacher.studentCoverage}) and student weights ({activeWeights.student.avgScore}/{activeWeights.student.passRate}/{activeWeights.student.consistency}) are pre-set.
            </div>

            <div className="space-y-1">
              <Label>Minimum grade records per teacher</Label>
              <Input type="number" min={1} value={teacherMinGradeCount} onChange={(e) => setTeacherMinGradeCount(Math.max(1, Number(e.target.value || 1)))} />
            </div>
            <div className="space-y-1">
              <Label>Minimum graded courses per student</Label>
              <Input type="number" min={1} value={studentMinCourseCount} onChange={(e) => setStudentMinCourseCount(Math.max(1, Number(e.target.value || 1)))} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" />Top Teachers</CardTitle>
            <CardDescription>Ranked by configured teacher metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : topTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teacher reward candidates found for the selected scope.</p>
            ) : (
              topTeachers.map((t, idx) => (
                <div key={t.teacherId} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium">{`${t.firstName || ""} ${t.lastName || ""}`.trim() || "Unknown Teacher"}</p>
                    <p className="text-xs text-muted-foreground">Avg {t.avgGrade}% | Pass {t.passRate}% | Students {t.studentCount}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={idx < 3 ? "default" : "secondary"}>
                      {idx === 0 ? <Trophy className="h-3 w-3 mr-1" /> : idx === 1 ? <Medal className="h-3 w-3 mr-1" /> : idx === 2 ? <Award className="h-3 w-3 mr-1" /> : null}
                      #{idx + 1}
                    </Badge>
                    <p className="text-sm font-semibold mt-1">{t.rewardScore}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-blue-500" />Top Students</CardTitle>
            <CardDescription>Ranked by configured student metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : topStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No student reward candidates found for the selected scope.</p>
            ) : (
              topStudents.map((s, idx) => (
                <div key={s.studentId} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <p className="font-medium">{s.studentName || "Unknown Student"}</p>
                    <p className="text-xs text-muted-foreground">{s.studentHumanId || s.studentId} | {s.className || "No class"}</p>
                    <p className="text-xs text-muted-foreground">Avg {s.avgScore}% | Pass {s.passRate}% | Courses {s.courseCount}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={idx < 3 ? "default" : "secondary"}>#{idx + 1}</Badge>
                    <p className="text-sm font-semibold mt-1">{s.rewardScore}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
