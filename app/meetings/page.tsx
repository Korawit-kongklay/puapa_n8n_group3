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
} from "lucide-react";
import Link from "next/link";

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
      "https://script.google.com/macros/s/AKfycbyXeVxE-jmRQgyH8fblZU7EocCy2eOT_Qnq6j22YiFoT45jVXG_RXtGPHtsRtroLcPs/exec?sheet=Members",
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

    // Set selected members based on current meeting members
    const memberNames = meeting.member
      .split(", ")
      .map((name) => name.trim())
      .filter(Boolean);
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
      };

      // Remove separate time fields
      delete (updateData as any).time;
      delete (updateData as any).end_time;

      const response = await fetch(
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

      // With no-cors mode, we can't read the response status
      // So we assume success if no error is thrown
      setUpdateMessage({
        type: "success",
        text: "Meeting updated successfully!",
      });
      setIsEditModalOpen(false);
      setEditingMeeting(null);
      // Auto refresh the page
      setTimeout(() => {
        loadMeetings();
      }, 5000);
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
    // Show popup warning
    if (
      !confirm(
        "คุณแน่ใจหรือไม่ที่จะลบการประชุมนี้? \nAre you sure you want to delete this meeting?",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Send POST request with body containing id + 1
      const response = await fetch(
        "https://g3.pupa-ai.com/webhook/meeting-delete",
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: meetingId + 1,
          }),
        },
      );

      // With no-cors mode, we can't read the response status
      // So we assume success if no error is thrown
      alert("ลบการประชุมเรียบร้อยแล้ว!\nMeeting deleted successfully!");

      // Refresh the meetings list
      await loadMeetings();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        "เกิดข้อผิดพลาดในการลบการประชุม\nError deleting meeting. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ADD8E6" }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Meeting.com</h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 font-medium px-3 py-2 rounded-md"
              >
                Add Meeting
              </Link>
              <Link
                href="/meetings"
                className="text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-md"
              >
                View Meetings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-gray-700" />
            <h2 className="text-3xl font-bold text-gray-900">All Meetings</h2>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={loadMeetings}
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-lg font-medium px-4 py-2 text-black hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#90EE90" }}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
            <Link href="/">
              <Button className="rounded-lg font-medium px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                Add New Meeting
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-600" />
              <span className="text-gray-600">Loading meetings...</span>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <Card
            className="rounded-xl shadow-lg"
            style={{ backgroundColor: "#F5F5F5" }}
          >
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Meetings Found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't created any meetings yet.
              </p>
              <Link href="/">
                <Button className="rounded-lg font-medium px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  Create Your First Meeting
                </Button>
              </Link>
            </CardContent>
          </Card>
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
                  className="rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: "#F5F5F5" }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                        {meeting.topic}
                      </CardTitle>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          meeting.type.toLowerCase() === "online"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {meeting.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {meeting.description}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Date and Time */}
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{startDateTime.date}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>
                        {startDateTime.time} - {endDateTime.time}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({duration})
                      </span>
                    </div>

                    {/* Meeting Room */}
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>Room {meeting.meeting_room}</span>
                    </div>

                    {/* Creator and Members */}
                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mb-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Created by:</span>
                        <span>{meeting.creator}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Members:</span>{" "}
                        {meeting.member}
                      </div>
                    </div>

                    {/* Meeting ID and Version */}
                    <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                      <span>ID: {meeting.id}</span>
                      <span>v{meeting.version}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 border-t pt-3 mt-3">
                      <Button
                        onClick={() => handleEditMeeting(meeting)}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        size="sm"
                        variant="outline"
                        className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Edit Meeting</h2>
              <Button
                onClick={handleCloseEditModal}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {updateMessage && (
                <Alert
                  className={`${updateMessage.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Topic */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="edit-topic"
                    className="text-sm font-medium text-gray-700"
                  >
                    Topic *
                  </Label>
                  <Input
                    id="edit-topic"
                    value={editingMeeting.topic}
                    onChange={(e) =>
                      handleEditInputChange("topic", e.target.value)
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">หัวข้อการประชุม</p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label
                    htmlFor="edit-description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingMeeting.description}
                    onChange={(e) =>
                      handleEditInputChange("description", e.target.value)
                    }
                    className="mt-1 min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    อธิบายรายละเอียดการประชุม
                  </p>
                </div>

                {/* Meeting Type */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Meeting Type *
                  </Label>
                  <Select
                    value={editingMeeting.type}
                    onValueChange={(value) =>
                      handleEditInputChange("type", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="onsite">Onsite</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">ประเภทการประชุม</p>
                </div>

                {/* Meeting Room */}
                <div>
                  <Label
                    htmlFor="edit-room"
                    className="text-sm font-medium text-gray-700"
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
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ห้องประชุม 1-5 เท่านั้น
                  </p>
                </div>

                {/* Date */}
                <div>
                  <Label
                    htmlFor="edit-date"
                    className="text-sm font-medium text-gray-700"
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
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">วันที่จัดประชุม</p>
                </div>

                {/* Start Time */}
                <div>
                  <Label
                    htmlFor="edit-time"
                    className="text-sm font-medium text-gray-700"
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
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">เวลาเริ่มประชุม</p>
                </div>

                {/* End Time */}
                <div>
                  <Label
                    htmlFor="edit-end-time"
                    className="text-sm font-medium text-gray-700"
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
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    เวลาสิ้นสุดประชุม
                  </p>
                </div>

                {/* Members */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Members *
                  </Label>

                  {/* Member Selection Dropdown */}
                  {members.length > 0 ? (
                    <Select
                      value={memberToAdd}
                      onValueChange={handleMemberSelect}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="เลือกสมาชิก" />
                      </SelectTrigger>
                      <SelectContent>
                        {members
                          .filter(
                            (member) =>
                              !selectedMembers.find(
                                (selected) => selected.id === member.id,
                              ),
                          )
                          .map((member) => (
                            <SelectItem key={member.id} value={member.name}>
                              <div className="flex items-center space-x-2">
                                <span>{member.name}</span>
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                  {member.role}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        {members.filter(
                          (member) =>
                            !selectedMembers.find(
                              (selected) => selected.id === member.id,
                            ),
                        ).length === 0 && (
                          <SelectItem value="no-more" disabled>
                            เลือกสมาชิกครบแล้ว
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">
                      {isLoadingMembers
                        ? "กำลังโหลดสมาชิก..."
                        : "ไม่มีข้อมูลสมาชิก"}
                    </div>
                  )}

                  {/* Selected Members Display */}
                  {selectedMembers.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <Label className="text-xs font-medium text-gray-600">
                        สมาชิกที่เลือก:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 bg-blue-50"
                          >
                            <span className="font-medium text-gray-900">
                              {member.name}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                              {member.role}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeMember(member.id)}
                              className="hover:bg-blue-200 rounded-full p-1 transition-colors"
                              title="ลบสมาชิก"
                            >
                              <X className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    เลือกสมาชิกจากรายการด้านบน
                  </p>
                </div>

                {/* Creator (Read-only) */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Creator
                  </Label>
                  <Input
                    value={editingMeeting.creator}
                    disabled
                    className="mt-1 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่สามารถแก้ไขผู้สร้างได้
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <Button
                onClick={handleCloseEditModal}
                variant="outline"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMeeting}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
    </div>
  );
}
