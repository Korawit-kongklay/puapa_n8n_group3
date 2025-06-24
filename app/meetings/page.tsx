"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  Edit3,
  Trash2,
  Save,
  X,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Video,
  Building,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { RoleIcon, RoleLabel } from "@/components/ui/role-badge";
import { Toast } from "@/components/ui/toast";

interface MeetingData {
  id: number;
  topic: string;
  description: string;
  type: string;
  date: string;
  creator: string;
  member: string;
  version: number;
  meeting_room: number;
  end_date: string;
  time?: string;
  end_time?: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
}

interface ApiResponse {
  meetings?: MeetingData[];
  error?: string;
  details?: string;
}

async function fetchMembers(): Promise<{
  members: Member[];
  error?: string;
  details?: string;
}> {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxW8z2Ba9FBtdxCcVa69JmtRFce7GBw3ahwYTEAs6ZqGajWdcKA0Pybjc0QS0JKfKmT/exec?sheet=Members",
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const data = await response.json();
    if (!response.ok) {
      return {
        members: [],
        error: data.error || `API Error: ${response.status}`,
        details: data.details,
      };
    }
    if (data.error) {
      return {
        members: [],
        error: data.error,
        details: data.details,
      };
    }
    if (!data.members || !Array.isArray(data.members)) {
      return {
        members: [],
        error: "Invalid response format",
        details: "Expected 'members' array in API response",
      };
    }
    return {
      members: data.members,
    };
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return {
      members: [],
      error: "Network error",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function fetchMeetingsData(): Promise<{
  meetings: MeetingData[];
  error?: string;
  details?: string;
}> {
  try {
    // First try normal fetch
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbyXeVxE-jmRQgyH8fblZU7EocCy2eOT_Qnq6j22YiFoT45jVXG_RXtGPHtsRtroLcPs/exec?sheet=Meetings",
      {
        method: "GET",
        cache: "no-store",
      },
    );
    console.log(response);
    const data: ApiResponse = await response.json();
    console.log(data);

    // Handle API error responses
    if (!response.ok) {
      return {
        meetings: [],
        error: data.error || `API Error: ${response.status}`,
        details: data.details,
      };
    }

    // Handle error response from API
    if (data.error) {
      return {
        meetings: [],
        error: data.error,
        details: data.details,
      };
    }

    if (!data.meetings || !Array.isArray(data.meetings)) {
      return {
        meetings: [],
        error: "Invalid response format",
        details: "Expected 'meetings' array in API response",
      };
    }

    return {
      meetings: data.meetings,
    };
  } catch (error) {
    console.error("Failed to fetch meetings:", error);

    // If normal fetch fails, try with no-cors but return empty data
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbyXeVxE-jmRQgyH8fblZU7EocCy2eOT_Qnq6j22YiFoT45jVXG_RXtGPHtsRtroLcPs/exec?sheet=Meetings",
        {
          method: "GET",
          mode: "no-cors",
          cache: "no-store",
        },
      );
      // With no-cors, we can't read response, so return empty array
      return {
        meetings: [],
        error: "CORS issue - using no-cors mode",
        details:
          "Cannot read response in no-cors mode. Please check if the API supports CORS.",
      };
    } catch (noCorsError) {
      return {
        meetings: [],
        error: "Network error",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

export default function ViewMeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<MeetingData | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [memberToAdd, setMemberToAdd] = useState<string>("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<MeetingData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [refreshToastMessage, setRefreshToastMessage] = useState("");

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchMeetingsData();

      if (result.error) {
        setError(
          result.details ? `${result.error}: ${result.details}` : result.error,
        );
        setMeetings([]);
      } else {
        setMeetings(result.meetings);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setError("Failed to load meetings. Please try again.");
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  useEffect(() => {
    loadMembers();
  }, []);

  // Load members
  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const result = await fetchMembers();
      if (result.error) {
        console.error("Failed to load members:", result.error);
        setMembers([]);
      } else {
        setMembers(result.members);
      }
    } catch (error) {
      console.error("Error loading members:", error);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Add member to selection
  const addMember = (member: Member) => {
    if (member && !selectedMembers.find((m) => m.id === member.id)) {
      const newSelectedMembers = [...selectedMembers, member];
      setSelectedMembers(newSelectedMembers);
      updateMemberField(newSelectedMembers);
    }
  };

  // Remove member from selection
  const removeMember = (memberId: number) => {
    const newSelectedMembers = selectedMembers.filter(
      (member) => member.id !== memberId,
    );
    setSelectedMembers(newSelectedMembers);
    updateMemberField(newSelectedMembers);
  };

  // Update member field when selectedMembers changes
  const updateMemberField = (members: Member[]) => {
    const memberString = members.map((member) => member.name).join(", ");
    if (editingMeeting) {
      setEditingMeeting((prev) =>
        prev ? { ...prev, member: memberString } : null,
      );
    }
  };

  // Handle member selection from dropdown
  const handleMemberSelect = (memberName: string) => {
    const member = members.find((m) => m.name === memberName);
    if (member) {
      addMember(member);
      setMemberToAdd("");
    }
  };

  // Open edit modal
  const handleEditMeeting = (meeting: MeetingData) => {
    // Convert ISO dates back to date/time format for editing
    const startDate = new Date(meeting.date);
    const endDate = new Date(meeting.end_date);

    const editingData = {
      ...meeting,
      date: startDate.toISOString().split("T")[0], // YYYY-MM-DD format
      time: startDate.toTimeString().slice(0, 5), // HH:MM format
      end_time: endDate.toTimeString().slice(0, 5), // HH:MM format
    };

    setEditingMeeting(editingData);

    // Parse member field as array if it's a JSON array string
    let memberNames: string[] = [];
    if (meeting.member.trim().startsWith("[")) {
      try {
        memberNames = JSON.parse(meeting.member);
      } catch {
        memberNames = meeting.member
          .split(", ")
          .map((name) => name.trim())
          .filter(Boolean);
      }
    } else {
      memberNames = meeting.member
        .split(", ")
        .map((name) => name.trim())
        .filter(Boolean);
    }
    const selectedMemberList = members.filter((member) =>
      memberNames.includes(member.name),
    );
    setSelectedMembers(selectedMemberList);

    setIsEditModalOpen(true);
    setUpdateMessage(null);

    // Load members if not already loaded
    if (members.length === 0) {
      loadMembers();
    }
  };

  // Handle input changes in edit modal
  const handleEditInputChange = (
    field: keyof MeetingData,
    value: string | number,
  ) => {
    if (editingMeeting) {
      setEditingMeeting((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  // Save edited meeting
  const handleSaveMeeting = async () => {
    if (!editingMeeting) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      // Convert date and time back to ISO format
      const isoDateTime = `${editingMeeting.date}T${editingMeeting.time}:00.000Z`;
      const isoEndDateTime = `${editingMeeting.date}T${editingMeeting.end_time}:00.000Z`;

      const updateData = {
        ...editingMeeting,
        date: isoDateTime,
        end_date: isoEndDateTime,
        version: editingMeeting.version + 1, // Increment version by 1
      };

      // Remove separate time fields
      delete (updateData as any).time;
      delete (updateData as any).end_time;

      await fetch(
        "https://g3.pupa-ai.com/webhook/meeting-update",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        },
      );

      setUpdateMessage({
        type: "success",
        text: "Meeting updated successfully!",
      });
      setIsEditModalOpen(false);
      setEditingMeeting(null);
      // Show toast and delay refresh
      setRefreshToastMessage("กำลังอัปเดตข้อมูล กรุณารอสักครู่...");
      setShowRefreshToast(true);
      setTimeout(() => {
        loadMeetings();
        setShowRefreshToast(false);
      }, 3000);
    } catch (error) {
      console.error("Update error:", error);
      setUpdateMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update meeting. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId: number) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      setMeetingToDelete(meeting);
      setDeleteModalOpen(true);
    }
  };

  // Confirm delete meeting
  const confirmDeleteMeeting = async () => {
    if (!meetingToDelete) return;

    try {
      setIsDeleting(true);

      await fetch(
        "https://g3.pupa-ai.com/webhook/meeting-delete",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: meetingToDelete.id + 1,
          }),
        },
      );

      setDeleteModalOpen(false);
      setMeetingToDelete(null);
      // Show toast and delay refresh
      setRefreshToastMessage("กำลังอัปเดตข้อมูล กรุณารอสักครู่...");
      setShowRefreshToast(true);
      setTimeout(() => {
        loadMeetings();
        setShowRefreshToast(false);
      }, 3000);
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        "Error deleting meeting. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setMeetingToDelete(null);
    setIsDeleting(false);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMeeting(null);
    setUpdateMessage(null);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch (error) {
      return { date: "Invalid date", time: "Invalid time" };
    }
  };

  const getMeetingDuration = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const hours = Math.floor(diffHours);
      const minutes = Math.round((diffHours - hours) * 60);

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      return "Unknown";
    }
  };

  // Helper function to get member information
  const getMemberInfo = (memberName: string) => {
    return members.find(m => m.name === memberName);
  };

  // Helper function to render participants with icons and roles
  const renderParticipants = (memberString: string) => {
    // Clean the member string by removing brackets and quotes
    const cleanMemberString = memberString.replace(/[\[\]"]/g, '');
    const memberNames = cleanMemberString.split(", ").map(name => name.trim()).filter(Boolean);
    
    return (
      <div className="space-y-2">
        {memberNames.map((memberName, index) => {
          // const memberInfo = getMemberInfo(memberName); // No longer needed
          return (
            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm">👤</span>
              <span className="font-medium text-gray-900">{memberName}</span>
              {/* Role label removed */}
            </div>
          );
        })}
      </div>
    );
  };

  // Refresh button handler (immediate refresh)
  const handleManualRefresh = () => {
    loadMeetings();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Toast for delayed refresh */}
      <Toast
        type="success"
        message={refreshToastMessage}
        show={showRefreshToast}
        onClose={() => setShowRefreshToast(false)}
        duration={3000}
      />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
            </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Meeting.com
                </h1>
                <p className="text-xs text-gray-500">Professional Meeting Management</p>
              </div>
            </div>
            <nav className="flex space-x-1">
              <Link
                href="/"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Add Meeting</span>
              </Link>
              <Link
                href="/meetings"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25"
              >
                <Eye className="h-4 w-4" />
                <span>View Meetings</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-2xl shadow-lg shadow-gray-200/50">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
            <h2 className="text-3xl font-bold text-gray-900">All Meetings</h2>
                <p className="text-gray-600 mt-1">
                  Manage and organize your team meetings efficiently
                </p>
          </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleManualRefresh}
              disabled={isLoading}
                className="flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl px-4 py-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
            <Link href="/">
                <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Meeting</span>
              </Button>
            </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Meetings</p>
                <p className="text-2xl font-bold text-green-600">
                  {meetings.filter(m => m.type.toLowerCase() === 'online').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Video className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Onsite Meetings</p>
                <p className="text-2xl font-bold text-purple-600">
                  {meetings.filter(m => m.type.toLowerCase() === 'onsite').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rooms</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(meetings.filter(m => m.meeting_room !== 0).map(m => m.meeting_room)).size}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200 rounded-xl">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg shadow-gray-200/50 mb-4">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Loading meetings...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your data</p>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="p-8 bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                No Meetings Found
              </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  You haven't created any meetings yet. Start by creating your first meeting to get organized.
              </p>
              <Link href="/">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200 rounded-xl px-8 py-3">
                    <Plus className="h-5 w-5 mr-2" />
                  Create Your First Meeting
                </Button>
              </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting, index) => {
              const startDateTime = formatDateTime(meeting.date);
              const endDateTime = formatDateTime(meeting.end_date);
              const duration = getMeetingDuration(
                meeting.date,
                meeting.end_date,
              );

              // Create unique key using multiple fields to avoid duplicates
              const uniqueKey = `${meeting.id}-${meeting.topic}-${meeting.date}-${index}`;

              return (
                <Card
                  key={uniqueKey}
                  className="group bg-white rounded-2xl shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-300 border border-gray-100 overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <CardTitle className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                        {meeting.topic}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                      <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          meeting.type.toLowerCase() === "online"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {meeting.type}
                      </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                    </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                      {meeting.description}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    {/* Date and Time */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{startDateTime.date}</p>
                          <p className="text-gray-500">Meeting Date</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <Clock className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {startDateTime.time} - {endDateTime.time}
                          </p>
                          <p className="text-gray-500">Duration: {duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          {meeting.meeting_room === 0 ? (
                            <>
                              <p className="font-semibold text-green-700">Online meeting</p>
                              <p className="text-gray-500">Meeting Location</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-gray-900">Room {meeting.meeting_room}</p>
                              <p className="text-gray-500">Meeting Location</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Creator and Members */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <Users className="h-4 w-4 text-orange-600" />
                      </div>
                        <div>
                          <p className="font-semibold text-gray-900">{meeting.creator}</p>
                          <p className="text-gray-500">Meeting Creator</p>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <Users className="h-3 w-3 text-blue-600" />
                          </div>
                          <p className="font-medium text-gray-700">Participants:</p>
                        </div>
                        {renderParticipants(meeting.member)}
                      </div>
                    </div>

                    {/* Meeting Version */}
                    <div className="flex justify-end items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">v{meeting.version}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-3">
                      <Button
                        onClick={() => handleEditMeeting(meeting)}
                        size="sm"
                        className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl px-4 py-2 transition-all duration-200"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        size="sm"
                        className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl px-4 py-2 transition-all duration-200"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && editingMeeting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-8 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Edit Meeting</h2>
                  <p className="text-gray-600">Update meeting details and participants</p>
                </div>
              </div>
              <Button
                onClick={handleCloseEditModal}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {updateMessage && (
                <Alert
                  className={`rounded-xl border-2 ${
                    updateMessage.type === "success" 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <AlertDescription
                    className={
                      updateMessage.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }
                  >
                    {updateMessage.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="edit-topic"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    Topic *
                  </Label>
                  <Input
                    id="edit-topic"
                    value={editingMeeting.topic}
                    onChange={(e) =>
                      handleEditInputChange("topic", e.target.value)
                    }
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter meeting topic"
                  />
                  <p className="text-xs text-gray-500 mt-2">Meeting Topic</p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="edit-description"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingMeeting.description}
                    onChange={(e) =>
                      handleEditInputChange("description", e.target.value)
                    }
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Describe the meeting details"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Meeting Description
                  </p>
                </div>

                {/* Meeting Type */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Meeting Type *
                  </Label>
                  <Select
                    value={editingMeeting.type}
                    onValueChange={(value) => {
                      handleEditInputChange("type", value);
                      if (value === "online") {
                        handleEditInputChange("meeting_room", 0);
                      } else if (value === "onsite" && editingMeeting.meeting_room === 0) {
                        handleEditInputChange("meeting_room", ""); // clear room for user to select
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">Meeting Type</p>
                </div>

                {/* Meeting Room - only show if onsite */}
                {editingMeeting.type === "onsite" && (
                  <div>
                    <Label
                      htmlFor="edit-room"
                      className="text-sm font-semibold text-gray-700 mb-2 block"
                    >
                      Meeting Room *
                    </Label>
                    <Input
                      id="edit-room"
                      type="number"
                      min="1"
                      max="5"
                      value={editingMeeting.meeting_room}
                      onChange={(e) =>
                        handleEditInputChange(
                          "meeting_room",
                          Number.parseInt(e.target.value) || 0,
                        )
                      }
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="1-5"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Meeting Room (1-5 only)
                    </p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <Label
                    htmlFor="edit-date"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    Date *
                  </Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingMeeting.date}
                    onChange={(e) =>
                      handleEditInputChange("date", e.target.value)
                    }
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">Meeting Date</p>
                </div>

                {/* Start Time */}
                <div>
                  <Label
                    htmlFor="edit-time"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    Start Time *
                  </Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editingMeeting.time}
                    onChange={(e) =>
                      handleEditInputChange("time", e.target.value)
                    }
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">Meeting Start Time</p>
                </div>

                {/* End Time */}
                <div>
                  <Label
                    htmlFor="edit-end-time"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    End Time *
                  </Label>
                  <Input
                    id="edit-end-time"
                    type="time"
                    value={editingMeeting.end_time}
                    onChange={(e) =>
                      handleEditInputChange("end_time", e.target.value)
                    }
                    className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Meeting End Time
                  </p>
                </div>

                {/* Members */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Members *
                  </Label>
                  {members.length > 0 ? (
                    <>
                      <Select
                        value={memberToAdd}
                        onValueChange={(value) => {
                          if (value) {
                            handleMemberSelect(value);
                            setMemberToAdd("");
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue placeholder="Click name to add member" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl min-w-[300px]">
                          {members
                            .filter((member) => !selectedMembers.find((m) => m.id === member.id))
                            .map((member) => (
                              <SelectItem key={member.id} value={member.name}>
                                <div className="flex items-center space-x-3 w-full min-w-[280px]">
                                  <RoleIcon role={member.role} size="md" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{member.name}</div>
                                    <RoleLabel role={member.role} size="sm" />
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {selectedMembers.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <Label className="text-xs font-semibold text-gray-600">Selected Members:</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                <RoleIcon role={member.role} size="md" />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium text-gray-900 truncate">{member.name}</span>
                                  {member.role ? <RoleLabel role={member.role} size="sm" /> : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMember(member.id)}
                                  className="hover:bg-black hover:bg-opacity-10 rounded-full p-1 transition-colors flex-shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={memberToAdd}
                        onChange={(e) => setMemberToAdd(e.target.value)}
                        className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Type member name and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (memberToAdd.trim()) {
                              handleMemberSelect(memberToAdd.trim());
                              setMemberToAdd("");
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500">
                        {isLoadingMembers
                          ? "Loading member list..."
                          : "Could not load members. Type name and press Enter to add."}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Select members from the list above</p>
                </div>

                {/* Creator (Read-only) */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Creator
                  </Label>
                  <Input
                    value={editingMeeting.creator}
                    disabled
                    className="rounded-xl bg-gray-50 text-gray-500 border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Creator cannot be modified
                  </p>
                </div>

                {/* Version Info */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Version
                  </Label>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-sm text-gray-600">Current: v{editingMeeting.version}</span>
                    <span className="text-blue-600">→</span>
                    <span className="text-sm font-semibold text-blue-700">New: v{editingMeeting.version + 1}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Version will automatically increment when saving changes
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-4 p-8 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <Button
                onClick={handleCloseEditModal}
                variant="outline"
                disabled={isUpdating}
                className="rounded-xl border-gray-200 hover:bg-gray-50 px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMeeting}
                disabled={isUpdating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && meetingToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delete Meeting</h2>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <Button
                onClick={closeDeleteModal}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">Warning</h3>
                    <p className="text-sm text-red-700">
                      Are you sure you want to delete this meeting? This action cannot be undone and all meeting data will be permanently removed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
              <Button
                onClick={closeDeleteModal}
                variant="outline"
                disabled={isDeleting}
                className="rounded-xl border-gray-200 hover:bg-gray-50 px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteMeeting}
                disabled={isDeleting}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Meeting
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
