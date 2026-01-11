import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  numericalName: number;
  description: string;
  isActive: boolean;
}

export default function ClassManagement() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isAdmin] = useState(user?.role === 'admin');

  // Form state
  const [classForm, setClassForm] = useState({
    name: '',
    numericalName: 1
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    numericalName: 1,
    description: ''
  });

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      
      const response = await fetch("http://localhost:5000/api/v1/classes", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const classesData = await response.json();
      const sorted = Array.isArray(classesData)
        ? [...classesData].sort((a: Class, b: Class) => (a.numericalName ?? 0) - (b.numericalName ?? 0))
        : [];
      setClasses(sorted);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to fetch classes");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/v1/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: classForm.name,
          numericalName: Number(classForm.numericalName),
          description: `Grade ${classForm.numericalName} class`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create class");
      }

      const result = await response.json();
      setClasses([...classes, result]);
      setClassForm({ name: '', numericalName: 1 });
      toast({ title: "Class created successfully!" });
      fetchClasses();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to create class");
    }
  };

  // Delete class
  const deleteClass = async (id: string) => {
    if (!window.confirm("Delete this class?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/v1/classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete class");
      setClasses(classes.filter(c => c.id !== id));
      toast({ title: "Class deleted successfully!" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to delete class");
    }
  };

  // Update class
  const updateClass = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/classes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          numericalName: Number(editForm.numericalName),
          description: editForm.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update class");
      }

      const result = await response.json();
      setClasses(classes.map(c => c.id === id ? result : c));
      setEditingId(null);
      toast({ title: "Class updated successfully!" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to update class");
    }
  };

  // Deactivate class
  const deactivateClass = async (id: string) => {
    if (!window.confirm("Deactivate this class?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/v1/classes/${id}/deactivate`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to deactivate class");
      setClasses(classes.map(c => c.id === id ? { ...c, isActive: false } : c));
      toast({ title: "Class deactivated successfully!" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Failed to deactivate class");
    }
  };

  // Start editing
  const startEditing = (cls: Class) => {
    setEditingId(cls.id);
    setEditForm({
      name: cls.name,
      numericalName: cls.numericalName,
      description: cls.description
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: '', numericalName: 1, description: '' });
  };

  // Initial data load
  useEffect(() => {
    if (token) {
      fetchClasses();
    }
  }, [token]);

  if (isLoading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Class Management</h1>
        {!isAdmin && (
          <Badge variant="destructive" className="ml-auto">
            Admin Access Required
          </Badge>
        )}
      </div>

      {apiError && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {apiError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Class</CardTitle>
          <CardDescription>
            {isAdmin ? "Add a new class to the system" : "Admin access required"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClass} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  value={classForm.name}
                  onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                  placeholder="e.g., Form One"
                  required
                  disabled={!isAdmin}
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Input
                  type="number"
                  value={classForm.numericalName}
                  onChange={(e) => setClassForm({...classForm, numericalName: Number(e.target.value)})}
                  placeholder="e.g., 1"
                  min="1"
                  required
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <Button type="submit" disabled={!isAdmin}>
              <Plus className="mr-2" /> Create Class
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class List</CardTitle>
          <CardDescription>All classes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Description</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map(cls => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">
                    {editingId === cls.id ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        placeholder="Class name"
                      />
                    ) : (
                      cls.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === cls.id ? (
                      <Input
                        type="number"
                        value={editForm.numericalName}
                        onChange={(e) => setEditForm({...editForm, numericalName: Number(e.target.value)})}
                        placeholder="Grade level"
                        min="1"
                      />
                    ) : (
                      `Grade ${cls.numericalName}`
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === cls.id ? (
                      <Input
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Description"
                      />
                    ) : (
                      cls.description
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === cls.id ? (
                          <>
                            <Button variant="outline" size="sm" onClick={() => updateClass(cls.id)}>
                              Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={cancelEditing}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => startEditing(cls)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deactivateClass(cls.id)}
                            >
                              Deactivate
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}