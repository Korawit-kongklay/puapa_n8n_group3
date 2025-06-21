"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RoleBadge, RoleIcon, RoleLabel } from "@/components/ui/role-badge";
import { 
  Calendar, 
  Users, 
  Clock, 
  X, 
  Plus, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Building,
  Video,
  UserPlus,
  Settings,
  Info
} from "lucide-react";
import Link from "next/link";

interface MeetingData {
  topic: string;
  description: string;
  type: string;
  date: string;
  time: string;
  creator: string;
  member: string[];
  version: number;
  meeting_room: number;
  end_date: string;
  end_time: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
}

interface MembersApiResponse {
  members?: Member[];
  error?: string;
  details?: string;
}

interface FormErrors {
  topic?: string;
  description?: string;
  type?: string;
  date?: string;
  time?: string;
  creator?: string;
  member?: string;
  version?: string;
  meeting_room?: string;
  end_date?: string;
  end_time?: string;
}

async function fetchMembers(): Promise<{
  members: Member[];
  error?: string;
  details?: string;
}> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxW8z2Ba9FBtdxCcVa69JmtRFce7GBw3ahwYTEAs6ZqGajWdcKA0Pybjc0QS0JKfKmT/exec?sheet=Members",
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    const data: MembersApiResponse = await response.json();

    // Handle API error responses
    if (!response.ok) {
      return {
        members: [],
        error: data.error || `API Error: ${response.status}`,
        details: data.details,
      };
    }

    // Handle error response from API
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

    // Check if it's a timeout error
    if (error instanceof Error && error.name === "AbortError") {
      return {
        members: [],
        error: "Request timeout",
        details: "The request took too long to complete. Please try again.",
      };
    }

    // Check if it's a network error
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
      return {
        members: [],
        error: "Network error",
        details: "Unable to connect to the server. Please check your internet connection.",
      };
    }

    return {
      members: [],
      error: "Network error",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

async function submitMeeting(data: MeetingData) {
  // Combine date and time into proper ISO 8601 format
  let isoDateTime = "";
  let isoEndDateTime = "";

  if (data.date && data.time) {
    isoDateTime = `${data.date}T${data.time}:00.000Z`;
  }

  if (data.date && data.end_time) {
    isoEndDateTime = `${data.date}T${data.end_time}:00.000Z`;
  }

  // Set version to 1 and handle meeting room based on type
  const meetingRoom = data.type === 'online' ? 0 : data.meeting_room;

  // สร้าง body ให้ตรงกับตัวอย่าง
  const submissionData = {
    id: "=ROW() - 1",
    topic: data.topic,
    description: data.description,
    type: data.type,
    date: isoDateTime,
    creator: data.creator,
    member: data.member,
    version: 1, // Always set to 1
    meeting_room: meetingRoom, // 0 for online, actual room number for onsite
    end_date: isoEndDateTime,
  };

  console.log("Submitting meeting data:", submissionData);

  const webhookUrl = "https://g3.pupa-ai.com/webhook/meeting-create";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Accept: "application/json",
      },
      body: JSON.stringify(submissionData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      try {
        const responseData = await response.text();
        console.log("Response data:", responseData);
        return "Meeting submitted successfully!";
      } catch (parseError) {
        console.log("Could not parse response, but request was successful");
        return "Meeting submitted successfully!";
      }
    } else {
      throw new Error(
        `Server responded with status: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Normal fetch failed:", error);
    console.log("Error type:", (error as any).name);
    console.log("Error message:", (error as any).message);

    // Check if it's a timeout error
    if ((error as any).name === "AbortError") {
      throw new Error(
        "Request timed out. The server might be experiencing high load. Please try again.",
      );
    }

    // Fallback to no-cors if normal fetch fails
    try {
      console.log("Attempting no-cors fallback to:", webhookUrl);
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(
        () => fallbackController.abort(),
        30000,
      );

      await fetch(webhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(submissionData),
        signal: fallbackController.signal,
      });

      clearTimeout(fallbackTimeoutId);
      console.log("No-cors request completed successfully");

      return "Meeting submitted successfully!";
    } catch (fallbackError) {
      console.error("No-cors fetch also failed:", fallbackError);
      throw new Error(
        "Failed to submit meeting. Please check your internet connection and try again.",
      );
    }
  }
}

export default function HomePage() {
  const [formData, setFormData] = useState<MeetingData>({
    topic: "",
    description: "",
    type: "",
    date: "",
    time: "",
    creator: "",
    member: [],
    version: 1, // Hidden from form but kept for interface compatibility
    meeting_room: 1,
    end_date: "",
    end_time: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberToAdd, setMemberToAdd] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [isUsingFallbackMembers, setIsUsingFallbackMembers] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const result = await fetchMembers();
      
      if (result.error) {
        console.error("Failed to load members:", result.error);
        
        // Provide fallback members data if API fails
        const fallbackMembers: Member[] = [
          { id: 1, name: "John Doe", role: "PM" },
          { id: 2, name: "Jane Smith", role: "DEV" },
          { id: 3, name: "Bob Johnson", role: "OWNER" },
          { id: 4, name: "Alice Brown", role: "DEV" },
          { id: 5, name: "Charlie Wilson", role: "PM" },
        ];
        
        setMembers(fallbackMembers);
        console.log("Using fallback members data due to API error:", result.error);
        setIsUsingFallbackMembers(true);
      } else {
        setMembers(result.members);
        setIsUsingFallbackMembers(false);
      }
    } catch (error) {
      console.error("Error loading members:", error);
      
      // Provide fallback members data on any error
      const fallbackMembers: Member[] = [
        { id: 1, name: "John Doe", role: "PM" },
        { id: 2, name: "Jane Smith", role: "DEV" },
        { id: 3, name: "Bob Johnson", role: "OWNER" },
        { id: 4, name: "Alice Brown", role: "DEV" },
        { id: 5, name: "Charlie Wilson", role: "PM" },
      ];
      
      setMembers(fallbackMembers);
      console.log("Using fallback members data due to unexpected error");
      setIsUsingFallbackMembers(true);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const updateMemberField = (members: string[]) => {
    setFormData((prev) => ({ ...prev, member: members }));
  };

  const addMember = (memberName: string) => {
    if (memberName && !selectedMembers.includes(memberName)) {
      const newSelectedMembers = [...selectedMembers, memberName];
      setSelectedMembers(newSelectedMembers);
      updateMemberField(newSelectedMembers);
      setMemberToAdd("");
    }
  };

  const removeMember = (memberName: string) => {
    const newSelectedMembers = selectedMembers.filter(
      (member) => member !== memberName,
    );
    setSelectedMembers(newSelectedMembers);
    updateMemberField(newSelectedMembers);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.topic.trim()) {
      newErrors.topic = "Topic is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.type) {
      newErrors.type = "Meeting type is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.time) {
      newErrors.time = "Start time is required";
    }

    if (!formData.end_time) {
      newErrors.end_time = "End time is required";
    }

    if (!formData.creator) {
      newErrors.creator = "Creator is required";
    }

    if (formData.member.length === 0) {
      newErrors.member = "At least one member is required";
    }

    // Only validate meeting room for onsite meetings
    if (formData.type === 'onsite' && (!formData.meeting_room || formData.meeting_room < 1 || formData.meeting_room > 5)) {
      newErrors.meeting_room = "Meeting room must be between 1 and 5";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async () => {
    setIsChecking(true);
    setCheckResult(null);

    try {
      // Simulate API call for availability check
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const roomAvailability = Math.random() > 0.3; // 70% chance room is available
      const memberAvailability = Math.random() > 0.2; // 80% chance members are available

      let result = "🔍 **การตรวจสอบห้องและสมาชิก**\n\n";

      if (roomAvailability) {
        result += "✅ ห้องประชุม " + formData.meeting_room + " ว่าง\n";
      } else {
        result += "❌ ห้องประชุม " + formData.meeting_room + " ไม่ว่าง\n";
      }

      if (memberAvailability) {
        result += "✅ สมาชิกทั้งหมดว่าง\n";
      } else {
        result += "⚠️ บางสมาชิกอาจไม่ว่าง\n";
      }

      result += "\n📅 วันที่: " + formData.date;
      result += "\n⏰ เวลา: " + formData.time + " - " + formData.end_time;

      setCheckResult(result);
    } catch (error) {
      setCheckResult("เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await submitMeeting(formData);
      setMessage({
        type: "success",
        text: result,
      });

      // Reset form on success
      setFormData({
        topic: "",
        description: "",
        type: "",
        date: "",
        time: "",
        creator: "",
        member: [],
        version: 1, // Keep this for interface compatibility but it's not used in form
        meeting_room: 1,
        end_date: "",
        end_time: "",
      });
      setSelectedMembers([]);
      setErrors({});
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof MeetingData,
    value: string | number,
  ) => {
    if (field === "member" && Array.isArray(value)) {
      setFormData((prev) => ({ ...prev, member: value as string[] }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Get current date as default
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-4 w-4" />
                <span>Add Meeting</span>
              </Link>
              <Link
                href="/meetings"
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
              >
                <Eye className="h-4 w-4" />
                <span>View Meetings</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white rounded-2xl shadow-lg shadow-gray-200/50">
              <Plus className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Add New Meeting</h2>
              <p className="text-gray-600 mt-1">
                Create and schedule a new meeting for your team
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Meeting Details
              </CardTitle>
            </div>
            <p className="text-gray-600">Fill in the information below to create your meeting</p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {message && (
              <Alert
                className={`rounded-xl border-2 ${
                  message.type === "success" 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {message.type === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <AlertDescription
                    className={
                      message.type === "success"
                        ? "text-green-800"
                        : "text-red-800"
                    }
                  >
                    {message.text}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {isUsingFallbackMembers && (
              <Alert className="rounded-xl border-2 bg-yellow-50 border-yellow-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Note:</strong> Using fallback members data due to API connection issues. 
                    You can still create meetings with the available members.
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* ISO 8601 Preview */}
            {formData.date && formData.time && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Info className="h-4 w-4 text-green-600" />
                  </div>
                  <Label className="text-sm font-semibold text-green-800">
                    ISO 8601 Format Preview:
                  </Label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-green-600">Start:</span>
                    <code className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-lg font-mono">
                      {`${formData.date}T${formData.time}:00.000Z`}
                    </code>
                  </div>
                  {formData.end_time && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-green-600">End:</span>
                      <code className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-lg font-mono">
                        {`${formData.date}T${formData.end_time}:00.000Z`}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>

                {/* Topic Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="topic"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Topic *
                  </Label>
                  <Input
                    id="topic"
                    type="text"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.topic ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="Enter meeting topic"
                  />
                  {errors.topic && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.topic}</span>
                    </p>
                  )}
                </div>

                {/* Description Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px] ${errors.description ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="Enter meeting description"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.description}</span>
                    </p>
                  )}
                </div>

                {/* Type Field */}
                <div className="space-y-3">
                  <Label
                    htmlFor="type"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Meeting Type *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger
                      className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.type ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="online">
                        <div className="flex items-center space-x-2">
                          <Video className="h-4 w-4 text-green-600" />
                          <span>Online</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="onsite">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          <span>Onsite</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.type}</span>
                    </p>
                  )}
                </div>

                {/* Meeting Room Field - Only show for onsite meetings */}
                {formData.type === 'onsite' && (
                  <div className="space-y-3">
                    <Label
                      htmlFor="meeting_room"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Meeting Room * (1-5)
                    </Label>
                    <Input
                      id="meeting_room"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.meeting_room || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "meeting_room",
                          Number.parseInt(e.target.value) || 0,
                        )
                      }
                      className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.meeting_room ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      placeholder="Enter room number (1-5)"
                    />
                    {errors.meeting_room && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.meeting_room}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Schedule Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Field */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="date"
                      className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                    >
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span>Date *</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.date ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      min={getCurrentDate()}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.date}</span>
                      </p>
                    )}
                  </div>

                  {/* Time Field */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="time"
                      className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                    >
                      <Clock className="h-4 w-4 text-green-600" />
                      <span>Start Time *</span>
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.time ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                    {errors.time && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.time}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* End Time Field */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="end_time"
                      className="text-sm font-semibold text-gray-700 flex items-center space-x-2"
                    >
                      <Clock className="h-4 w-4 text-red-600" />
                      <span>End Time *</span>
                    </Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) =>
                        handleInputChange("end_time", e.target.value)
                      }
                      className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.end_time ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                    {errors.end_time && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.end_time}</span>
                      </p>
                    )}
                  </div>

                  {/* Spacer for alignment */}
                  <div></div>
                </div>
              </div>

              {/* Participants Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Creator Field */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="creator"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Creator *
                    </Label>
                    <Select
                      value={formData.creator}
                      onValueChange={(value) =>
                        handleInputChange("creator", value)
                      }
                    >
                      <SelectTrigger
                        className={`w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.creator
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : ""
                        }`}
                      >
                        {formData.creator ? (
                          (() => {
                            const creatorMember = members.find(
                              (m) => m.name === formData.creator,
                            );
                            return (
                              <div className="flex items-center space-x-3 w-full min-w-0">
                                <RoleIcon
                                  role={creatorMember?.role}
                                  size="md"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {formData.creator}
                                  </div>
                                  <RoleLabel
                                    role={creatorMember?.role}
                                    size="sm"
                                  />
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <SelectValue
                            placeholder={
                              isLoadingMembers
                                ? "Loading members..."
                                : "Select creator"
                            }
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent className="rounded-xl min-w-[300px]">
                        {isLoadingMembers ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : members.length === 0 ? (
                          <SelectItem value="no-members" disabled>
                            No members available
                          </SelectItem>
                        ) : (
                          members.map((member) => {
                            return (
                              <SelectItem key={member.id} value={member.name}>
                                <div className="flex items-center space-x-3 w-full min-w-[280px]">
                                  <RoleIcon role={member.role} size="md" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {member.name}
                                    </div>
                                    <RoleLabel
                                      role={member.role}
                                      size="sm"
                                    />
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {errors.creator && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.creator}</span>
                      </p>
                    )}
                  </div>

                  {/* Member Field - Multi Select */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">
                      Members *
                    </Label>

                    {/* Show different interface based on member loading status */}
                    {members.length > 0 ? (
                      <>
                        {/* Dropdown interface when members are loaded */}
                        <Select
                          value={memberToAdd}
                          onValueChange={(value) => {
                            if (value) {
                              addMember(value);
                              setMemberToAdd(""); // Reset select to show placeholder again
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                              errors.member
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                          >
                            <SelectValue placeholder="Click name to add member" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl min-w-[300px]">
                            {members
                              .filter(
                                (member) =>
                                  !selectedMembers.includes(member.name),
                              )
                              .map((member) => {
                                return (
                                  <SelectItem
                                    key={member.id}
                                    value={member.name}
                                  >
                                    <div className="flex items-center space-x-3 w-full min-w-[280px]">
                                      <RoleIcon
                                        role={member.role}
                                        size="md"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">
                                          {member.name}
                                        </div>
                                        <RoleLabel
                                          role={member.role}
                                          size="sm"
                                        />
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        {/* Manual input interface when members can't be loaded */}
                        <div className="space-y-3">
                          <Input
                            type="text"
                            value={memberToAdd}
                            onChange={(e) => setMemberToAdd(e.target.value)}
                            className={`w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                              errors.member
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                            placeholder="Type member name and press Enter"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (memberToAdd.trim()) {
                                  addMember(memberToAdd.trim());
                                  setMemberToAdd(""); // Clear input
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
                      </>
                    )}

                    {/* Selected Members Display */}
                    {selectedMembers.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-gray-600">
                          Selected Members:
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedMembers.map((memberName) => {
                            // Find the member object to get role information
                            const member = members.find(m => m.name === memberName);
                            
                            return (
                              <div
                                key={memberName}
                                className="flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors max-w-full"
                              >
                                <RoleIcon role={member?.role} size="md" />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium text-gray-900 truncate">{memberName}</span>
                                  {member && (
                                    <RoleLabel role={member.role} size="sm" />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMember(memberName)}
                                  className="hover:bg-black hover:bg-opacity-10 rounded-full p-1 transition-colors flex-shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {errors.member && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.member}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  onClick={checkAvailability}
                  disabled={isChecking || isSubmitting}
                  className="w-full rounded-xl font-medium py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none"
                >
                  {isChecking ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>กำลังตรวจสอบ...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>ตรวจสอบห้องและสมาชิกว่าง</span>
                    </div>
                  )}
                </Button>
                
                {checkResult && (
                  <Alert className="rounded-xl bg-blue-50 border-2 border-blue-200">
                    <AlertDescription className="text-blue-800 whitespace-pre-wrap">
                      {checkResult}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl font-medium py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 hover:shadow-xl transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Submit Meeting</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
