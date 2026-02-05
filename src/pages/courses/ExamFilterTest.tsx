import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/config/api';

// Simple test of the class and academic year selection
export default function ExamFilterTest() {
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        // Fetch classes
        const classResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (classResponse.ok) {
          const classData = await classResponse.json();
          console.log('Raw class data:', classData);
          setClasses([{ id: 'all', name: 'All Classes' }, ...classData]);
        }

        // Fetch academic years
        const yearResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'import.meta.env.VITE_API_BASE_URL || API_BASE_URL'}`}/setting/terms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (yearResponse.ok) {
          const yearData = await yearResponse.json();
          console.log('Raw academic year data:', yearData);
          
          // Handle different response formats
          const years = Array.isArray(yearData) ? yearData : (yearData.terms || []);
          setTerms([{ id: 'all', name: 'All Years' }, ...years]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, toast]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Exam Filter Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Raw Data Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Classes count:</strong> {classes.length}</div>
            <div><strong>Academic Years count:</strong> {terms.length}</div>
            <div><strong>Selected Class:</strong> {selectedClass}</div>
            <div><strong>Selected Year:</strong> {selectedYear}</div>
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filter Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={() => {
              setSelectedClass('all');
              setSelectedYear('all');
            }}
            className="mt-4"
          >
            Reset Filters
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Classes:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(classes, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-medium">Academic Years:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(terms, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
