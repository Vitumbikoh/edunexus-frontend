import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  hostelApi,
  Hostel,
  HostelAllocation,
  HostelClass,
  HostelClassAllocationResult,
  HostelRoom,
  HostelSetup,
  HostelStudent,
  HostelSummary,
} from '@/services/hostelService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BedDouble, Building2, DoorOpen, Settings2, Users } from 'lucide-react';

const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

type HostelManagementView = 'manage' | 'allocate';

export default function HostelManagement({ view = 'manage' }: { view?: HostelManagementView }) {
  const { token, user } = useAuth();
  const superAdminSchoolId = user?.role === 'super_admin' ? user.schoolId : undefined;

  const [summary, setSummary] = useState<HostelSummary | null>(null);
  const [setup, setSetup] = useState<HostelSetup | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [allocationRooms, setAllocationRooms] = useState<HostelRoom[]>([]);
  const [allocationRoomsLoading, setAllocationRoomsLoading] = useState(false);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [students, setStudents] = useState<HostelStudent[]>([]);
  const [classes, setClasses] = useState<HostelClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classAllocationPreview, setClassAllocationPreview] = useState<HostelClassAllocationResult | null>(null);
  const [classAllocationPreviewLoading, setClassAllocationPreviewLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [allocationStudentSearch, setAllocationStudentSearch] = useState('');
  const [allocationStudentLoading, setAllocationStudentLoading] = useState(false);
  const [allocationListStudentSearch, setAllocationListStudentSearch] = useState('');
  const [showReleased, setShowReleased] = useState(false);

  const [createHostelOpen, setCreateHostelOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [createAllocationOpen, setCreateAllocationOpen] = useState(false);
  const [allocationTarget, setAllocationTarget] = useState<'student' | 'class'>('student');

  const [hostelForm, setHostelForm] = useState({
    name: '',
    gender: 'mixed' as 'male' | 'female' | 'mixed',
    capacity: 100,
    wardenName: '',
    wardenPhone: '',
    notes: '',
    roomCount: 0,
    roomCapacity: 10,
    floor: 'Ground Floor',
  });

  const [setupForm, setSetupForm] = useState({
    roomNamingMode: 'manual' as 'manual' | 'numeric' | 'alphabetical',
    numericPrefix: 'A',
    defaultFloor: 'Ground Floor',
    defaultRoomCapacity: 10,
  });

  const [roomForm, setRoomForm] = useState({
    hostelId: '',
    name: '',
    floor: '',
    capacity: 20,
    notes: '',
  });

  const [allocationForm, setAllocationForm] = useState({
    classId: '',
    studentId: '',
    hostelId: '',
    roomId: '',
    bedNumber: '',
    notes: '',
  });

  const activeHostel = useMemo(
    () => hostels.find((hostel) => hostel.id === selectedHostelId),
    [hostels, selectedHostelId],
  );

  const selectableRooms = useMemo(() => {
    return allocationRooms;
  }, [allocationRooms]);

  const canSubmitAllocation =
    !loading &&
    !!allocationForm.hostelId &&
    (allocationTarget === 'student'
      ? !!allocationForm.studentId && !!allocationForm.roomId
      : !!allocationForm.classId);

  const activeAllocationsCount = allocations.filter((allocation) => allocation.status === 'active').length;
  const currentNamingModeLabel =
    setupForm.roomNamingMode === 'manual'
      ? 'Manual'
      : setupForm.roomNamingMode === 'numeric'
      ? `Numeric (${setupForm.numericPrefix || 'A'}1, ${setupForm.numericPrefix || 'A'}2...)`
      : 'Alphabetical (A, B, C...)';
  const activeHostelOccupiedBeds = activeHostel?.occupiedBeds ?? 0;
  const activeHostelAvailableBeds = activeHostel ? Math.max(activeHostel.capacity - activeHostelOccupiedBeds, 0) : 0;
  const activeHostelOccupancyRate =
    activeHostel && activeHostel.capacity > 0
      ? Number(((activeHostelOccupiedBeds / activeHostel.capacity) * 100).toFixed(2))
      : 0;

  const loadSummaryAndHostels = async () => {
    const [summaryData, setupData, hostelData] = await Promise.all([
      hostelApi.getSummary({ token: token || undefined, schoolId: superAdminSchoolId }),
      hostelApi.getSetup({ token: token || undefined, schoolId: superAdminSchoolId }),
      hostelApi.listHostels({ token: token || undefined, includeRooms: false, schoolId: superAdminSchoolId }),
    ]);

    setSummary(summaryData);
    setSetup(setupData);
    setSetupForm({
      roomNamingMode: (setupData.roomNamingMode as any) || 'manual',
      numericPrefix: setupData.numericPrefix || 'A',
      defaultFloor: setupData.defaultFloor || 'Ground Floor',
      defaultRoomCapacity: setupData.defaultRoomCapacity || 10,
    });
    setHostels(hostelData);

    const selectedStillExists = hostelData.some((hostel) => hostel.id === selectedHostelId);
    const resolvedHostelId = selectedStillExists ? selectedHostelId : hostelData[0]?.id || '';

    if (resolvedHostelId) {
      if (resolvedHostelId !== selectedHostelId) {
        setSelectedHostelId(resolvedHostelId);
      }
      setRoomForm((prev) => ({ ...prev, hostelId: resolvedHostelId }));
      setAllocationForm((prev) => ({ ...prev, hostelId: resolvedHostelId, roomId: '' }));
    } else {
      setRooms([]);
    }

    setHostelForm((prev) => ({
      ...prev,
      roomCapacity: setupData.defaultRoomCapacity || prev.roomCapacity,
      floor: setupData.defaultFloor || prev.floor,
    }));

    return resolvedHostelId;
  };

  const loadAllocations = async (hostelId?: string) => {
    const targetHostelId = hostelId || selectedHostelId;
    const allocationData = await hostelApi.listAllocations({
      token: token || undefined,
      activeOnly: !showReleased,
      studentSearch: allocationListStudentSearch || undefined,
      hostelId: targetHostelId || undefined,
      schoolId: superAdminSchoolId,
    });
    setAllocations(allocationData);
  };

  const loadRooms = async (hostelId?: string) => {
    const targetHostelId = hostelId || selectedHostelId;
    if (!targetHostelId) {
      setRooms([]);
      return;
    }

    const roomData = await hostelApi.listRooms(targetHostelId, {
      token: token || undefined,
      schoolId: superAdminSchoolId,
    });
    setRooms(roomData);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const hostelId = await loadSummaryAndHostels();
      await Promise.all([loadRooms(hostelId), loadAllocations(hostelId)]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load hostel data.');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      setClassesLoading(true);
      const classRows = await hostelApi.listClasses({
        token: token || undefined,
        schoolId: superAdminSchoolId,
      });
      setClasses(classRows.filter((row) => row.isActive !== false));
    } catch {
      setError('Failed to load classes for allocation.');
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Promise.all([loadRooms(), loadAllocations()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHostelId, showReleased]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadAllocations();
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocationListStudentSearch]);

  useEffect(() => {
    const query = allocationStudentSearch.trim();
    if (!query || query.length < 2) {
      setStudents([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setAllocationStudentLoading(true);
        const rows = await hostelApi.searchStudents({
          token: token || undefined,
          schoolId: superAdminSchoolId,
          q: query,
          limit: 15,
        });
        setStudents(rows);
      } catch {
        setStudents([]);
      } finally {
        setAllocationStudentLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [allocationStudentSearch, token, superAdminSchoolId]);

  useEffect(() => {
    if (!createAllocationOpen || allocationTarget !== 'student' || !allocationForm.hostelId) {
      setAllocationRooms([]);
      return;
    }

    let cancelled = false;

    const loadAllocationRooms = async () => {
      try {
        setAllocationRoomsLoading(true);
        const roomData = await hostelApi.listRooms(allocationForm.hostelId, {
          token: token || undefined,
          schoolId: superAdminSchoolId,
        });
        if (!cancelled) {
          setAllocationRooms(roomData);
        }
      } catch {
        if (!cancelled) {
          setAllocationRooms([]);
        }
      } finally {
        if (!cancelled) {
          setAllocationRoomsLoading(false);
        }
      }
    };

    loadAllocationRooms();

    return () => {
      cancelled = true;
    };
  }, [createAllocationOpen, allocationTarget, allocationForm.hostelId, token, superAdminSchoolId]);

  useEffect(() => {
    if (
      !createAllocationOpen ||
      allocationTarget !== 'class' ||
      !allocationForm.classId ||
      !allocationForm.hostelId
    ) {
      setClassAllocationPreview(null);
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      try {
        setClassAllocationPreviewLoading(true);
        const preview = await hostelApi.getClassAllocationPreview({
          classId: allocationForm.classId,
          hostelId: allocationForm.hostelId,
          token: token || undefined,
          schoolId: superAdminSchoolId,
        });

        if (!cancelled) {
          setClassAllocationPreview(preview);
        }
      } catch {
        if (!cancelled) {
          setClassAllocationPreview(null);
        }
      } finally {
        if (!cancelled) {
          setClassAllocationPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [
    createAllocationOpen,
    allocationTarget,
    allocationForm.classId,
    allocationForm.hostelId,
    token,
    superAdminSchoolId,
  ]);

  const onAllocationDialogChange = (open: boolean) => {
    setCreateAllocationOpen(open);

    if (open) {
      if (classes.length === 0 && !classesLoading) {
        loadClasses();
      }
      const defaultHostelId = allocationForm.hostelId || selectedHostelId || hostels[0]?.id || '';
      setAllocationForm((prev) => ({
        ...prev,
        hostelId: defaultHostelId,
        roomId: prev.hostelId === defaultHostelId ? prev.roomId : '',
      }));
      return;
    }

    setAllocationRooms([]);
    setAllocationRoomsLoading(false);
    setAllocationTarget('student');
    setClassAllocationPreview(null);
  };

  const onCreateHostel = async () => {
    if (!hostelForm.name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await hostelApi.createHostel({ ...hostelForm, schoolId: superAdminSchoolId }, token || undefined);
      setCreateHostelOpen(false);
      setHostelForm({
        name: '',
        gender: 'mixed',
        capacity: 100,
        wardenName: '',
        wardenPhone: '',
        notes: '',
        roomCount: 0,
        roomCapacity: setup?.defaultRoomCapacity || 10,
        floor: setup?.defaultFloor || 'Ground Floor',
      });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to create hostel.');
    } finally {
      setLoading(false);
    }
  };

  const onSaveSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      await hostelApi.updateSetup(
        {
          roomNamingMode: setupForm.roomNamingMode,
          numericPrefix: setupForm.numericPrefix,
          defaultFloor: setupForm.defaultFloor,
          defaultRoomCapacity: setupForm.defaultRoomCapacity,
          schoolId: superAdminSchoolId,
        },
        token || undefined,
      );
      await loadSummaryAndHostels();
    } catch (err: any) {
      setError(err?.message || 'Failed to save hostel setup.');
    } finally {
      setLoading(false);
    }
  };

  const onDeleteHostel = async (id: string) => {
    if (!confirm('Delete this hostel? This only works if there are no active allocations.')) return;

    try {
      setLoading(true);
      setError(null);
      await hostelApi.deleteHostel(id, { token: token || undefined, schoolId: superAdminSchoolId });
      if (selectedHostelId === id) setSelectedHostelId('');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete hostel.');
    } finally {
      setLoading(false);
    }
  };

  const onCreateRoom = async () => {
    if (!roomForm.hostelId || !roomForm.name.trim()) return;

    try {
      setLoading(true);
      setError(null);
      await hostelApi.createRoom(
        roomForm.hostelId,
        {
          name: roomForm.name,
          floor: roomForm.floor || undefined,
          capacity: roomForm.capacity,
          notes: roomForm.notes || undefined,
          schoolId: superAdminSchoolId,
        },
        token || undefined,
      );
      setCreateRoomOpen(false);
      setRoomForm({
        hostelId: roomForm.hostelId,
        name: '',
        floor: '',
        capacity: 20,
        notes: '',
      });
      await Promise.all([loadRooms(roomForm.hostelId), loadAllocations(roomForm.hostelId)]);
      await loadSummaryAndHostels();
    } catch (err: any) {
      setError(err?.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const onDeleteRoom = async (roomId: string) => {
    if (!confirm('Delete this room? This only works if there are no active allocations.')) return;

    try {
      setLoading(true);
      setError(null);
      await hostelApi.deleteRoom(roomId, { token: token || undefined, schoolId: superAdminSchoolId });
      await Promise.all([loadRooms(), loadAllocations()]);
      await loadSummaryAndHostels();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete room.');
    } finally {
      setLoading(false);
    }
  };

  const onCreateAllocation = async () => {
    if (!allocationForm.hostelId) return;
    if (allocationTarget === 'student' && (!allocationForm.studentId || !allocationForm.roomId)) return;
    if (allocationTarget === 'class' && !allocationForm.classId) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (allocationTarget === 'student') {
        await hostelApi.createAllocation(
          {
            studentId: allocationForm.studentId,
            hostelId: allocationForm.hostelId,
            roomId: allocationForm.roomId,
            bedNumber: allocationForm.bedNumber || undefined,
            notes: allocationForm.notes || undefined,
            schoolId: superAdminSchoolId,
          },
          token || undefined,
        );
        setSuccessMessage('Student allocated successfully.');
      } else {
        const result = await hostelApi.createClassAllocation(
          {
            classId: allocationForm.classId,
            hostelId: allocationForm.hostelId,
            notes: allocationForm.notes || undefined,
            schoolId: superAdminSchoolId,
          },
          token || undefined,
        );
        setSuccessMessage(result.message);
      }

      setCreateAllocationOpen(false);
      setAllocationForm({
        classId: '',
        studentId: '',
        hostelId: selectedHostelId || hostels[0]?.id || '',
        roomId: '',
        bedNumber: '',
        notes: '',
      });
      setAllocationStudentSearch('');
      setStudents([]);
      setAllocationTarget('student');
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to allocate to hostel.');
    } finally {
      setLoading(false);
    }
  };

  const onReleaseAllocation = async (allocationId: string) => {
    if (!confirm('Release this student from hostel?')) return;

    try {
      setLoading(true);
      setError(null);
      await hostelApi.releaseAllocation(
        allocationId,
        {
          reason: 'Released by admin',
          schoolId: superAdminSchoolId,
        },
        token || undefined,
      );
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to release allocation.');
    } finally {
      setLoading(false);
    }
  };

  const onReleaseAllAllocations = async () => {
    const scopeText = selectedHostelId ? 'for the selected hostel' : 'for all hostels';
    if (!confirm(`Release all active students ${scopeText}?`)) return;

    try {
      setLoading(true);
      setError(null);
      await hostelApi.releaseAllAllocations(
        {
          hostelId: selectedHostelId || undefined,
          reason: 'Released in bulk by admin',
          schoolId: superAdminSchoolId,
        },
        token || undefined,
      );
      await loadAll();
    } catch (err: any) {
      setError(err?.message || 'Failed to release all allocations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-gradient-to-r from-background via-background to-muted/40">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">
              {view === 'allocate' ? 'Allocate Rooms' : 'Hostel Management'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {view === 'allocate'
                ? 'Assign, monitor, and release student hostel allocations.'
                : 'Configure hostels, room strategy, and boarding capacity in one place.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <Settings2 className="h-3.5 w-3.5" />
                {currentNamingModeLabel}
              </Badge>
              {activeHostel && (
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Selected: {activeHostel.name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={loadAll} disabled={loading}>
              Refresh
            </Button>

            {view === 'manage' && (
              <Dialog open={createHostelOpen} onOpenChange={setCreateHostelOpen}>
                <DialogTrigger asChild>
                  <Button>Add Hostel</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Hostel</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <Label>Name</Label>
                    <Input
                      value={hostelForm.name}
                      onChange={(e) => setHostelForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Boys East"
                    />
                    <Label>Gender</Label>
                    <Select
                      value={hostelForm.gender}
                      onValueChange={(value) =>
                        setHostelForm((prev) => ({ ...prev, gender: value as 'male' | 'female' | 'mixed' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={hostelForm.capacity}
                      onChange={(e) => setHostelForm((prev) => ({ ...prev, capacity: Number(e.target.value || 1) }))}
                    />
                    <Label>Warden Name</Label>
                    <Input
                      value={hostelForm.wardenName}
                      onChange={(e) => setHostelForm((prev) => ({ ...prev, wardenName: e.target.value }))}
                    />
                    <Label>Warden Phone</Label>
                    <Input
                      value={hostelForm.wardenPhone}
                      onChange={(e) => setHostelForm((prev) => ({ ...prev, wardenPhone: e.target.value }))}
                    />
                    <Label>Notes</Label>
                    <Textarea
                      value={hostelForm.notes}
                      onChange={(e) => setHostelForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                    {setupForm.roomNamingMode !== 'manual' && (
                      <>
                        <Label>Auto Rooms Count</Label>
                        <Input
                          type="number"
                          min={1}
                          value={hostelForm.roomCount}
                          onChange={(e) =>
                            setHostelForm((prev) => ({ ...prev, roomCount: Number(e.target.value || 0) }))
                          }
                        />
                        <Label>Auto Room Capacity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={hostelForm.roomCapacity}
                          onChange={(e) =>
                            setHostelForm((prev) => ({ ...prev, roomCapacity: Number(e.target.value || 1) }))
                          }
                        />
                        <Label>Auto Rooms Floor</Label>
                        <Input
                          value={hostelForm.floor}
                          onChange={(e) => setHostelForm((prev) => ({ ...prev, floor: e.target.value }))}
                          placeholder="Ground Floor"
                        />
                      </>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={onCreateHostel} disabled={loading}>Create Hostel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {view === 'manage' && (
              <Dialog open={createRoomOpen} onOpenChange={setCreateRoomOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Add Room</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Room</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <Label>Hostel</Label>
                    <Select
                      value={roomForm.hostelId}
                      onValueChange={(value) => setRoomForm((prev) => ({ ...prev, hostelId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map((hostel) => (
                          <SelectItem key={hostel.id} value={hostel.id}>
                            {hostel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label>Room Name</Label>
                    <Input
                      value={roomForm.name}
                      onChange={(e) => setRoomForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. A1"
                    />
                    <Label>Floor/Wing</Label>
                    <Input
                      value={roomForm.floor}
                      onChange={(e) => setRoomForm((prev) => ({ ...prev, floor: e.target.value }))}
                      placeholder="e.g. Ground Floor"
                    />
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={roomForm.capacity}
                      onChange={(e) => setRoomForm((prev) => ({ ...prev, capacity: Number(e.target.value || 1) }))}
                    />
                    <Label>Notes</Label>
                    <Textarea
                      value={roomForm.notes}
                      onChange={(e) => setRoomForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={onCreateRoom} disabled={loading}>Create Room</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={createAllocationOpen} onOpenChange={onAllocationDialogChange}>
              <DialogTrigger asChild>
                <Button variant="secondary">Allocate Bed</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {allocationTarget === 'class' ? 'Allocate Class to Hostel' : 'Allocate Student to Hostel'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <Label>Allocate To</Label>
                  <Select
                    value={allocationTarget}
                    onValueChange={(value) => {
                      const target = value as 'student' | 'class';
                      setAllocationTarget(target);
                      setAllocationForm((prev) => ({
                        ...prev,
                        studentId: '',
                        classId: '',
                        roomId: '',
                        bedNumber: target === 'class' ? '' : prev.bedNumber,
                      }));
                      setAllocationStudentSearch('');
                      setStudents([]);
                      setClassAllocationPreview(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select allocation target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                    </SelectContent>
                  </Select>

                  {allocationTarget === 'student' && (
                    <>
                      <Label>Search Student (ID or name)</Label>
                      <Input
                        value={allocationStudentSearch}
                        onChange={(e) => setAllocationStudentSearch(e.target.value)}
                        placeholder="e.g. STU-0132 / Grace / rumphiadmin"
                      />
                      {allocationStudentLoading && (
                        <p className="text-xs text-muted-foreground">Searching students...</p>
                      )}
                      <Label>Student</Label>
                      <Select
                        value={allocationForm.studentId}
                        onValueChange={(value) => setAllocationForm((prev) => ({ ...prev, studentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.studentId} - {student.firstName} {student.lastName}
                              {student.username ? ` (@${student.username})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}

                  {allocationTarget === 'class' && (
                    <>
                      <Label>Class</Label>
                      <Select
                        value={allocationForm.classId}
                        onValueChange={(value) => setAllocationForm((prev) => ({ ...prev, classId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={classesLoading ? 'Loading classes...' : 'Select class'} />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((klass) => (
                            <SelectItem key={klass.id} value={klass.id}>
                              {klass.name}
                              {klass.numericalName !== undefined ? ` (${klass.numericalName})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {(classAllocationPreviewLoading || classAllocationPreview) && (
                        <div className="rounded-md border bg-muted/20 p-3">
                          {classAllocationPreviewLoading ? (
                            <p className="text-xs text-muted-foreground">Calculating class allocation preview...</p>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-[11px] uppercase text-muted-foreground">Not Yet Assigned</p>
                                <p className="text-base font-semibold">{classAllocationPreview?.notYetAssignedCount ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase text-muted-foreground">To Be Assigned Now</p>
                                <p className="text-base font-semibold">{classAllocationPreview?.toBeAssignedNow ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase text-muted-foreground">Already Assigned</p>
                                <p className="text-base font-semibold">{classAllocationPreview?.alreadyAllocatedCount ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase text-muted-foreground">Likely Left Unassigned</p>
                                <p className="text-base font-semibold">{classAllocationPreview?.unassignedDueToCapacity ?? 0}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <Label>Hostel</Label>
                  <Select
                    value={allocationForm.hostelId}
                    onValueChange={(value) =>
                      setAllocationForm((prev) => ({ ...prev, hostelId: value, roomId: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hostel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostels.map((hostel) => (
                        <SelectItem key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {allocationTarget === 'student' ? (
                    <>
                      <Label>Room</Label>
                      <Select
                        value={allocationForm.roomId}
                        onValueChange={(value) => setAllocationForm((prev) => ({ ...prev, roomId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          {allocationRoomsLoading && (
                            <SelectItem value="__loading" disabled>
                              Loading rooms...
                            </SelectItem>
                          )}
                          {selectableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} ({room.availableBeds ?? 0} beds left)
                            </SelectItem>
                          ))}
                          {!allocationRoomsLoading && selectableRooms.length === 0 && (
                            <SelectItem value="__empty" disabled>
                              No rooms found for selected hostel
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Room selection is automatic for class allocation. Students are assigned to the first available rooms in this hostel.
                    </p>
                  )}

                  {allocationTarget === 'student' && (
                    <>
                      <Label>Bed Number (optional)</Label>
                      <Input
                        value={allocationForm.bedNumber}
                        onChange={(e) => setAllocationForm((prev) => ({ ...prev, bedNumber: e.target.value }))}
                        placeholder="e.g. B-14"
                      />
                    </>
                  )}

                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={allocationForm.notes}
                    onChange={(e) => setAllocationForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={onCreateAllocation} disabled={!canSubmitAllocation}>Allocate</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {view === 'allocate' && (
              <Button
                variant="destructive"
                onClick={onReleaseAllAllocations}
                disabled={loading || activeAllocationsCount === 0}
              >
                Release All Students
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {successMessage && (
        <Card className="border-emerald-300/50 bg-emerald-50/60">
          <CardContent className="pt-5 text-sm text-emerald-700">{successMessage}</CardContent>
        </Card>
      )}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="border-border/70 border-t-2 border-t-blue-500/70">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Number of Rooms</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.totalRooms}</p>
                </div>
                <DoorOpen className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 border-t-2 border-t-cyan-500/70">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Beds</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.totalBeds}</p>
                </div>
                <BedDouble className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 border-t-2 border-t-amber-500/70">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Occupied Beds</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.occupiedBeds}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 border-t-2 border-t-emerald-500/70">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Available Beds</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.availableBeds}</p>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 border-t-2 border-t-violet-500/70">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Occupancy Rate</p>
                  <p className="mt-2 text-2xl font-semibold">{summary.occupancyRate}%</p>
                </div>
                <Settings2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === 'manage' && activeHostel && (
        <Card className="border-border/70">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Selected Hostel Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Hostel</p>
                <p className="mt-1 text-sm font-semibold">{activeHostel.name}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Gender</p>
                <p className="mt-1 text-sm font-semibold">{toTitleCase(activeHostel.gender)}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="mt-1 text-sm font-semibold">{activeHostel.capacity} beds</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Available Beds</p>
                <p className="mt-1 text-sm font-semibold">{activeHostelAvailableBeds}</p>
              </div>
              <div className="rounded-md border bg-background p-3">
                <p className="text-xs text-muted-foreground">Occupancy</p>
                <p className="mt-1 text-sm font-semibold">{activeHostelOccupancyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'manage' && (
        <Card className="border-border/70">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-base">Hostel Setup</CardTitle>
          <p className="text-xs text-muted-foreground">
            Define naming and default room rules used when creating hostels.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Room Naming Mode</Label>
            <Select
              value={setupForm.roomNamingMode}
              onValueChange={(value) =>
                setSetupForm((prev) => ({
                  ...prev,
                  roomNamingMode: value as 'manual' | 'numeric' | 'alphabetical',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="numeric">Numeric (A1, A2 ...)</SelectItem>
                <SelectItem value="alphabetical">Alphabetical (A, B ... AA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Numeric Prefix</Label>
            <Input
              value={setupForm.numericPrefix}
              onChange={(e) => setSetupForm((prev) => ({ ...prev, numericPrefix: e.target.value }))}
              placeholder="A"
              disabled={setupForm.roomNamingMode !== 'numeric'}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Floor</Label>
            <Input
              value={setupForm.defaultFloor}
              onChange={(e) => setSetupForm((prev) => ({ ...prev, defaultFloor: e.target.value }))}
              placeholder="Ground Floor"
            />
          </div>

          <div className="space-y-2">
            <Label>Default Room Capacity</Label>
            <Input
              type="number"
              min={1}
              value={setupForm.defaultRoomCapacity}
              onChange={(e) =>
                setSetupForm((prev) => ({ ...prev, defaultRoomCapacity: Number(e.target.value || 1) }))
              }
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <Button onClick={onSaveSetup} disabled={loading}>Save Setup</Button>
          </div>

          <div className="md:col-span-4 text-xs text-muted-foreground">
            {setupForm.roomNamingMode === 'manual'
              ? 'Manual mode: rooms are created one-by-one via Add Room.'
              : setupForm.roomNamingMode === 'numeric'
              ? `Numeric mode: on Add Hostel, rooms auto-generate as ${setupForm.numericPrefix || 'A'}1, ${setupForm.numericPrefix || 'A'}2 ... based on room count.`
              : 'Alphabetical mode: on Add Hostel, rooms auto-generate as A, B ... Z, AA, AB ... based on room count.'}
          </div>
        </CardContent>
        </Card>
      )}

      {view === 'manage' && (
        <Card className="border-border/70">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
          <div>
            <CardTitle className="text-base">Hostels</CardTitle>
            <p className="text-xs text-muted-foreground">Manage hostel records and select one to inspect rooms.</p>
          </div>
          <div className="w-72">
            <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by hostel" />
              </SelectTrigger>
              <SelectContent>
                {hostels.map((hostel) => (
                  <SelectItem key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostel</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Occupied</TableHead>
                <TableHead>Warden</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hostels.map((hostel) => (
                <TableRow key={hostel.id}>
                  <TableCell className="font-medium">{hostel.name}</TableCell>
                  <TableCell>{toTitleCase(hostel.gender)}</TableCell>
                  <TableCell>{hostel.capacity}</TableCell>
                  <TableCell>{hostel.occupiedBeds ?? 0}</TableCell>
                  <TableCell>{hostel.wardenName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={hostel.isActive ? 'default' : 'secondary'}>
                      {hostel.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteHostel(hostel.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {hostels.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hostels yet. Add your first hostel to begin boarding allocation.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        </Card>
      )}

      <div className={view === 'allocate' ? 'grid gap-5' : 'grid gap-5 lg:grid-cols-2'}>
        {view === 'manage' && (
          <Card className="border-border/70">
          <CardHeader className="border-b bg-muted/20">
            <div>
              <CardTitle className="text-base">Rooms {activeHostel ? `- ${activeHostel.name}` : ''}</CardTitle>
              <p className="text-xs text-muted-foreground">Room inventory and occupancy by selected hostel.</p>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Floor/Wing</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.floor || '-'}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.occupiedBeds ?? 0}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => onDeleteRoom(room.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No rooms available for this hostel.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          </Card>
        )}

        {view === 'allocate' && (
          <Card className="border-border/70">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Allocations</CardTitle>
                <p className="text-xs text-muted-foreground">Search, filter, release, and monitor room allocations.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedHostelId} onValueChange={setSelectedHostelId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter hostel" />
                </SelectTrigger>
                <SelectContent>
                  {hostels.map((hostel) => (
                    <SelectItem key={hostel.id} value={hostel.id}>
                      {hostel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="w-48"
                value={allocationListStudentSearch}
                onChange={(e) => setAllocationListStudentSearch(e.target.value)}
                placeholder="Search student"
              />
              <Button
                variant={showReleased ? 'secondary' : 'outline'}
                onClick={() => setShowReleased((prev) => !prev)}
              >
                {showReleased ? 'Showing All' : 'Active Only'}
              </Button>
              <Button
                variant="destructive"
                onClick={onReleaseAllAllocations}
                disabled={loading || activeAllocationsCount === 0}
              >
                Release All Students
              </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Hostel/Room</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      {allocation.student
                        ? `${allocation.student.studentId} - ${allocation.student.firstName} ${allocation.student.lastName}`
                        : allocation.studentId}
                    </TableCell>
                    <TableCell>
                      {allocation.hostel?.name || '-'} / {allocation.room?.name || '-'}
                    </TableCell>
                    <TableCell>{allocation.bedNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={allocation.status === 'active' ? 'default' : 'secondary'}>
                        {toTitleCase(allocation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {allocation.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReleaseAllocation(allocation.id)}
                        >
                          Release
                        </Button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No allocations found for the current filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {allocationTarget === 'student' && createAllocationOpen && !allocationRoomsLoading && selectableRooms.length === 0 && (
              <p className="mt-3 text-xs text-amber-600">
                No rooms are available in the selected hostel. Create rooms first (Manage Hostels) or pick another hostel.
              </p>
            )}
          </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
