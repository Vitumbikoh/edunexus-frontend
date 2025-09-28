import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  FileUp,
  FileDown
} from "lucide-react";
import { API_CONFIG } from '@/config/api';

interface ImportResult {
  row: number;
  status: 'imported' | 'error';
  message?: string;
}

interface ImportResponse {
  imported: number;
  total: number;
  results: ImportResult[];
}

export default function ScheduleImportExport() {
  const { token } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel (.xlsx, .xls) or CSV file",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      setImportResults(null);
    }
  };

  const uploadSchedule = async () => {
    if (!selectedFile || !token) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_CONFIG.BASE_URL}/schedules/bulk-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: ImportResponse = await response.json();
      setImportResults(result);

      toast({
        title: "Import completed",
        description: `Successfully imported ${result.imported} out of ${result.total} schedules`,
        variant: result.imported === result.total ? "default" : "destructive"
      });

    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import schedule",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      'className',
      'day', 
      'startTime',
      'endTime',
      'courseCode',
      'classroomName',
      'isActive'
    ];
    
    const sampleData = [
      // Form One - Monday schedule
      ['Form one', 'Monday', '08:00', '09:00', 'MATH101', '', 'true'],
      ['Form one', 'Monday', '09:00', '10:00', 'ENG101', '', 'true'],
      ['Form one', 'Monday', '10:00', '11:00', 'SCI101', '', 'true'],
      ['Form one', 'Monday', '11:00', '12:00', 'HIST101', '', 'true'],
      // Form Two - Tuesday schedule
      ['Form two', 'Tuesday', '08:00', '09:00', 'ENG201', '', 'true'],
      ['Form two', 'Tuesday', '09:00', '10:00', 'MATH201', '', 'true'],
      ['Form two', 'Tuesday', '10:00', '11:00', 'PHYS201', '', 'true'],
      ['Form two', 'Tuesday', '11:00', '12:00', 'CHEM201', '', 'true'],
      // Form Three - Wednesday schedule
      ['Form Three', 'Wednesday', '08:00', '09:00', 'SCI301', '', 'true'],
      ['Form Three', 'Wednesday', '09:00', '10:00', 'HIST301', '', 'true'],
      ['Form Three', 'Wednesday', '10:00', '11:00', 'MATH301', '', 'true'],
      ['Form Three', 'Wednesday', '11:00', '12:00', 'ENG301', '', 'true'],
      // Form One - Thursday schedule
      ['Form one', 'Thursday', '08:00', '09:00', 'PHYS101', '', 'true'],
      ['Form one', 'Thursday', '09:00', '10:00', 'CHEM101', '', 'true'],
      ['Form one', 'Thursday', '10:00', '11:00', 'ENG101', '', 'true'],
      ['Form one', 'Thursday', '11:00', '12:00', 'SCI101', '', 'true'],
      // Form Two - Friday schedule
      ['Form two', 'Friday', '08:00', '09:00', 'MATH201', '', 'true'],
      ['Form two', 'Friday', '09:00', '10:00', 'HIST201', '', 'true'],
      ['Form two', 'Friday', '10:00', '11:00', 'PHYS201', '', 'true'],
      ['Form two', 'Friday', '11:00', '12:00', 'CHEM201', '', 'true']
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: "CSV template downloaded successfully"
    });
  };

  const clearResults = () => {
    setImportResults(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Schedules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="schedule-file">Select Excel or CSV file</Label>
            <div className="flex gap-2">
              <Input
                id="schedule-file"
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                className="shrink-0"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Button */}
          <Button 
            onClick={uploadSchedule}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            <FileUp className="h-4 w-4 mr-2" />
            {isUploading ? 'Importing...' : 'Import Schedules'}
          </Button>

          {/* Import Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Import Requirements:</strong>
              <ul className="mt-1 space-y-1 text-sm">
                <li>• File format: Excel (.xlsx, .xls) or CSV</li>
                <li>• Required columns: className, day, startTime, endTime, courseCode</li>
                <li>• Optional columns: classroomName, isActive</li>
                <li>• Teacher is automatically assigned from the course</li>
                <li>• Time format: HH:mm (e.g., 08:00, 14:30)</li>
                <li>• Day format: Monday, Tuesday, Wednesday, Thursday, Friday</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Import Results
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Clear Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.imported}
                </div>
                <div className="text-sm text-green-700">Imported</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.total - importResults.imported}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResults.total}
                </div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            <Separator />

            {/* Detailed Results */}
            <div className="space-y-2">
              <h4 className="font-semibold">Detailed Results</h4>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {importResults.results.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-2 rounded text-sm ${
                      result.status === 'imported' 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {result.status === 'imported' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">Row {result.row}:</span>
                    <span className="flex-1">
                      {result.status === 'imported' 
                        ? 'Successfully imported' 
                        : result.message || 'Import failed'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success/Error Summary */}
            {importResults.imported > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully imported {importResults.imported} schedule entries. 
                  You can now view them in the weekly schedule grid.
                </AlertDescription>
              </Alert>
            )}

            {importResults.total - importResults.imported > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {importResults.total - importResults.imported} entries failed to import. 
                  Please check the error messages above and fix the data before re-importing.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Export schedules using the "Export CSV" button in the weekly schedule grid after selecting a class.
          </p>
          
          <div className="flex gap-2">
            <Badge variant="outline">✓ Class-specific exports</Badge>
            <Badge variant="outline">✓ Teacher-specific exports</Badge>
            <Badge variant="outline">✓ Filtered by days</Badge>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Export Features:</strong>
              <ul className="mt-1 space-y-1 text-sm">
                <li>• Export individual class schedules as CSV</li>
                <li>• Export teacher schedules across all classes</li>
                <li>• Filter exports by specific days of the week</li>
                <li>• Professional formatting for printing and sharing</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}