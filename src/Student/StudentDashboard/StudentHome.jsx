import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Clock,
  Calendar,
  GraduationCap,
  Building2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bell,
  Eye,
  Download,
  Upload,
  Circle,
  Pencil,
  Trash2
} from 'lucide-react';

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from 'react-toastify';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDropzone } from 'react-dropzone';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

function StudentHome() {
  const [stats, setStats] = useState(null);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOJTHours, setTotalOJTHours] = useState(0);
  const [totalRenderedHours, setTotalRenderedHours] = useState(0);
  const [isProgressLoading, setIsProgressLoading] = useState(true);

  const [requirements, setRequirements] = useState([]);
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState('new');
  const [fileToUpdate, setFileToUpdate] = useState(null);

  // Fetch requirements from company
  const fetchRequirements = async () => {
    try {
      const response = await axios.get('/company/student-requirements', {
        params: {
          student_id: loggedInUser.id
        }
      });

      if (response.data.success) {
        const companyReqs = response.data.data;
        setRequirements(companyReqs);
      }
    } catch (error) {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to fetch requirements');
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  // Fetch total hours data
  const fetchTotalHoursData = async () => {
    try {
      setIsProgressLoading(true);

      // Get total required OJT hours
      const dashboardResponse = await axios.get('/student/dashboard-stats');
      if (dashboardResponse.data.success) {
        setTotalOJTHours(dashboardResponse.data.data.traineeDetails.remaining_hours || 360);
      }



      // Get total rendered hours
      const totalHoursResponse = await axios.get(`/student/total-hours-rendered/${loggedInUser.userID}`);


      if (totalHoursResponse.data.success) {

        console.log("setTotalRenderedHours")

        console.log(totalHoursResponse.data.data.totalHours)
        setTotalRenderedHours(parseFloat(totalHoursResponse.data.data.totalHours).toFixed(2));
      }

      setIsProgressLoading(false);
    } catch (error) {
      console.error('Error fetching hours data:', error);
      setTotalOJTHours(360); // Default fallback
      setTotalRenderedHours(0);
      setIsProgressLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchTotalHoursData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/student/dashboard-stats');
      setStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stats?.traineeDetails?.traineeID) {
      fetchSubmittedFiles();
    }
  }, [stats?.traineeDetails?.traineeID]);

  const fetchSubmittedFiles = async () => {
    try {
      const response = await axios.get(`/trainee/submitted-files/of/${stats.traineeDetails.userID}`);
      setSubmittedFiles(response.data.data);
    } catch (error) {
      console.error('Error fetching submitted files:', error);
    }
  };

  // Add file upload handler
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length) {
      setUploadingFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  // Handle file deletion
  const handleDeleteFile = async (fileId) => {
    try {
      const response = await axios.delete(`/trainee/requirement-file/${fileId}`);
      if (response.data.success) {
        toast.success('File deleted successfully');
        fetchSubmittedFiles();
        fetchRequirements();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
    setIsDeleteDialogOpen(false);
  };

  // Handle file update
  const handleUpdateFile = (req, file) => {
    setSelectedRequirement(req);
    setIsUploadModalOpen(true);
    // Set mode to update
    setUploadMode('update');
    setFileToUpdate(file);
  };

  // Modify handleUploadRequirement to handle both new uploads and updates
  const handleUploadRequirement = async () => {
    if (!uploadingFile || !selectedRequirement) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadingFile);
    formData.append('requirementId', selectedRequirement.label);
    formData.append('companyID', stats.traineeDetails.companyID);

    // If updating existing file, add file ID
    if (fileToUpdate) {
      formData.append('fileId', fileToUpdate.id);
    }

    try {
      const url = fileToUpdate
        ? `/trainee/requirement-file/${fileToUpdate.id}`
        : '/trainee/upload-requirement/upload-file';

      const response = fileToUpdate
        ? await axios.put(url, formData)
        : await axios.post(url, formData);

      if (response.data.success) {
        toast.success(fileToUpdate ? 'File updated successfully' : 'File uploaded successfully');
        fetchSubmittedFiles();
        fetchRequirements();
        setIsUploadModalOpen(false);
        setFileToUpdate(null);
      }
    } catch (error) {
      console.error('Error uploading requirement:', error);
      toast.error('Failed to upload requirement');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  const { traineeDetails, recentDTRs, recentAnnouncements, weeklyProgress } = stats;

  const calculateProgress = (requirements) => {
    if (!requirements || requirements.length === 0) return 0;

    const completed = requirements.filter((req) =>
      submittedFiles.some(file => file.requirement_id === req.label)
    ).length;

    return Math.round((completed / requirements.length) * 100);
  };


  console.log({ totalRenderedHours })
  return (
    <div className="p-0">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-blue-100 p-2 rounded-full mb-4">
                <Clock className="h-6 w-6 text-blue-700" />
            </div>
            <CardTitle className="text-lg font-semibold mb-2">Total Hours</CardTitle>
            {isProgressLoading ? (
                <Skeleton className="h-16 w-24" />
            ) : (
                <>
                    <div className="text-3xl font-semibold text-blue-700">{totalRenderedHours}</div>
                    <div className="text-sm text-gray-500 mt-1">
                        out of {totalOJTHours} required hours
                    </div>
                    <div className="w-full mt-2">
                        <Progress
                            value={Math.min((parseFloat(totalRenderedHours) / totalOJTHours) * 100, 100)}
                            className="h-2"
                        />
                    </div>
                </>
            )}
        </CardContent>
    </Card>
        {/* <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-green-100 p-2 rounded-full mb-4">
              <Calendar className="h-6 w-6 text-green-700" />
            </div>
            <CardTitle className="text-lg font-medium mb-2">Time Remaining</CardTitle>
            <div className="text-3xl font-bold text-green-700">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${stats?.traineeDetails?.remaining_days || 0}`
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">days left</div>
          </CardContent>
        </Card> */}

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-purple-100 p-2 rounded-full mb-4">
              <GraduationCap className="h-6 w-6 text-purple-700" />
            </div>
            <CardTitle className="text-lg font-semibold mb-2">Program</CardTitle>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-lg font-medium text-center text-purple-700">
                {stats?.traineeDetails?.programName || 'Not assigned'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-amber-100 p-2 rounded-full mb-4">
              <Building2 className="h-6 w-6 text-amber-700" />
            </div>
            <CardTitle className="text-lg font-semibold mb-2">Company</CardTitle>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-lg font-medium text-center text-amber-700">
                {stats?.traineeDetails?.companyName || 'Not assigned'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent DTRs */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Time Records</h2>
          <div className="space-y-4">
            {recentDTRs.map((dtr, index) => (
              <div key={index} className="flex items-start space-x-4 border-b pb-3 last:border-0">
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{new Date(dtr.date).toLocaleDateString()}</p>
                    <span className={`text-sm ${dtr.status === 'approved' ? 'text-green-500' : 'text-yellow-500'
                      }`}>
                      {dtr.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {dtr.time_in} - {dtr.time_out}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Requirements Progress */}
        {requirements.map((company) => (
          <Card key={company.id} className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">{company.name}</CardTitle>
              <div className="text-sm text-gray-500">Requirements Progress</div>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              <div className="mb-4">
                <Progress value={calculateProgress(company.requirements)} className="h-2" />
                <div className="mt-1 text-sm text-gray-500">
                  {calculateProgress(company.requirements)}% Complete
                </div>
              </div>

              {
                console.log({ submittedFiles })
              }
              {/* Requirements List */}
              <div className="space-y-4">
                {company.requirements.map((req, index) => {
                  const submittedFile = submittedFiles.find(f => f.requirement_id === req.label);
                  const isSubmitted = !!submittedFile;
                  const status = isSubmitted ? "completed" : "pending";

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      {/* Status Icon */}
                      <CheckCircle2
                        className={`h-5 w-5 ${status === "completed" ? "text-green-500" : "text-gray-400"
                          }`}
                      />

                      {/* Requirement Details */}
                      <div className="flex-1">
                        <div className="font-medium">
                          {req.label}{" "}
                          <span
                            className={`text-xs font-semibold ${req.isRequired ? "text-red-500" : "text-gray-500"
                              }`}
                          >
                            ({req.isRequired ? "Required" : "Optional"})
                          </span>
                        </div>

                        {/* Submission Date */}
                        {status === "completed" && (
                          <div className="text-sm text-gray-500">
                            Submitted on {new Date(submittedFile.uploaded_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* View/Download/Update/Delete Buttons for Submitted Files */}
                      {isSubmitted && (
                        <div className="flex flex-wrap gap-2 md:flex-row md:gap-2 md:items-center md:justify-start flex-col">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={submittedFile.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={submittedFile.file_url}
                              download
                              className="flex items-center gap-1"
                            >
                              <Download className="h-4 w-4 mr-1" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateFile(req, submittedFile)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setFileToDelete(submittedFile);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      )}

                      {/* Upload Button for Pending Requirements */}
                      {!isSubmitted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequirement(req);
                            setIsUploadModalOpen(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

      </div>

      {/* Recent Announcements */}
      <Card className="mt-6 p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
        <div className="space-y-4">
          {recentAnnouncements.map((announcement, index) => (
            <div key={index} className="border-b last:border-0 pb-3">
              <div className="flex items-start justify-between">
                <h3 className="font-medium">{announcement.title}</h3>
                <span className={`text-xs px-2 py-1 rounded ${announcement.status === 'Urgent'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
                  }`}>
                  {announcement.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {announcement.description}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Posted by {announcement.first_name} {announcement.last_name}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-w-[95%] mx-auto max-h-[90vh] overflow-y-auto p-4 rounded-lg">
          <DialogHeader>
            <DialogTitle>Upload Requirement</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500">
              <input {...getInputProps()} />
              {uploadingFile ? (
                <div className="text-sm">
                  Selected file: {uploadingFile.name}
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p>Drag & drop a file here, or click to select</p>
                  <p className="text-xs mt-1">Supported formats: PDF, PNG, JPG</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadRequirement}
              disabled={!uploadingFile || isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[92%] sm:w-full mx-auto rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogAction
              onClick={() => handleDeleteFile(fileToDelete?.id)}
              className="bg-red-600 hover:bg-red-700 mt-2 w-full sm:w-auto"
            >
              Delete
            </AlertDialogAction>
            <AlertDialogCancel className=" w-full sm:w-auto">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default StudentHome; 