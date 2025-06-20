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
import { Calendar, Users, Clock, X } from "lucide-react";
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
}

interface MembersApiResponse {
  members?: Member[];
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

  // สร้าง body ให้ตรงกับตัวอย่าง
  const submissionData = {
    topic: data.topic,
    description: data.description,
    type: data.type,
    date: isoDateTime,
    creator: data.creator,
    member: data.member,
    version: data.version,
    meeting_room: data.meeting_room,
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

      return "Meeting submitted successfully (no-cors mode)!";
    } catch (fallbackError) {
      console.error("No-cors fetch also failed:", fallbackError);
      console.log("Fallback error type:", (fallbackError as any).name);
      console.log("Fallback error message:", (fallbackError as any).message);

      if ((fallbackError as any).name === "AbortError") {
        throw new Error(
          "Request timed out. Please check your internet connection and try again.",
        );
      }

      if ((fallbackError as any).message && (fallbackError as any).message.includes("Failed to fetch")) {
        throw new Error(
          `Unable to reach the server at ${webhookUrl}. Please check:\n- Your internet connection\n- If the webhook server is running\n- If there are any firewall restrictions`,
        );
      }

      throw new Error(`Unable to submit meeting: ${(fallbackError as any).message}`);
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
    version: 1,
    meeting_room: 0,
    end_date: "",
    end_time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberToAdd, setMemberToAdd] = useState<string>("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Load members on component mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const result = await fetchMembers();

        if (result.error) {
          console.error("Failed to load members:", result.error);
        } else {
          setMembers(result.members);
        }
      } catch (error) {
        console.error("Error loading members:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    loadMembers();
  }, []);

  // Update member field when selectedMembers changes
  const updateMemberField = (members: string[]) => {
    setFormData((prev) => ({ ...prev, member: members }));
  };

  // Add member to selection
  const addMember = (memberName: string) => {
    const trimmedName = memberName.trim();
    if (
      trimmedName &&
      trimmedName !== "loading" &&
      trimmedName !== "no-members" &&
      !selectedMembers.includes(trimmedName)
    ) {
      const newSelectedMembers = [...selectedMembers, trimmedName];
      setSelectedMembers(newSelectedMembers);
      updateMemberField(newSelectedMembers);
      setMemberToAdd("");
    }
  };

  // Remove member from selection
  const removeMember = (memberName: string) => {
    const newSelectedMembers = selectedMembers.filter(
      (name) => name !== memberName,
    );
    setSelectedMembers(newSelectedMembers);
    updateMemberField(newSelectedMembers);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = "Date must be in YYYY-MM-DD format";
      }
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) {
        newErrors.time = "Time must be in HH:mm format";
      }
    }
    if (!formData.creator.trim()) {
      newErrors.creator = "Creator is required";
    }
    if (!formData.member || formData.member.length === 0) {
      newErrors.member = "Member is required";
    }
    if (!formData.version || formData.version <= 0) {
      newErrors.version = "Version must be a positive number";
    }
    if (!formData.meeting_room || formData.meeting_room <= 0) {
      newErrors.meeting_room = "Meeting room must be a positive number";
    } else if (formData.meeting_room > 5) {
      newErrors.meeting_room = "Meeting room number cannot exceed 5";
    }
    if (!formData.end_time) {
      newErrors.end_time = "End time is required";
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.end_time)) {
        newErrors.end_time = "End time must be in HH:mm format";
      }
      if (formData.time && formData.end_time <= formData.time) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async () => {
    if (!validateForm()) return;
    setIsChecking(true);
    setCheckResult(null);
    let isoDateTime = "";
    let isoEndDateTime = "";
    if (formData.date && formData.time) {
      isoDateTime = `${formData.date}T${formData.time}:00.000Z`;
    }
    if (formData.date && formData.end_time) {
      isoEndDateTime = `${formData.date}T${formData.end_time}:00.000Z`;
    }
    const checkData = {
      topic: formData.topic,
      description: formData.description,
      type: formData.type,
      date: isoDateTime,
      creator: formData.creator,
      member: formData.member,
      version: formData.version,
      meeting_room: formData.meeting_room,
      end_date: isoEndDateTime,
    };
    try {
      const res = await fetch("/api/meeting-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkData),
      });
      const data = await res.json();
      setCheckResult(data.output || JSON.stringify(data));
    } catch (e) {
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
    if (!checkResult) {
      setMessage({ type: "error", text: "กรุณาตรวจสอบห้องและสมาชิกว่างก่อนส่งข้อมูล" });
      return;
    }
    if (checkResult.includes("ไม่ว่าง")) {
      setMessage({ type: "error", text: checkResult });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await submitMeeting(formData);
      setMessage({ type: "success", text: result });
      setFormData({
        topic: "",
        description: "",
        type: "",
        date: "",
        time: "",
        creator: "",
        member: [],
        version: 1,
        meeting_room: 0,
        end_date: "",
        end_time: "",
      });
      setSelectedMembers([]);
      setMemberToAdd("");
      setCheckResult(null);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to submit meeting. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof MeetingData,
    value: string | number,
  ) => {
    if (field === "member") {
      if (Array.isArray(value)) {
        setFormData((prev) => ({ ...prev, member: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Get current date as default
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
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
                className="text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-md"
              >
                Add Meeting
              </Link>
              <Link
                href="/meetings"
                className="text-gray-600 hover:text-gray-800 font-medium px-3 py-2 rounded-md"
              >
                View Meetings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card
          className="rounded-xl shadow-lg"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Add New Meeting</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert
                className={`rounded-lg ${message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <AlertDescription
                  className={
                    message.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }
                >
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* ISO 8601 Preview */}
            {formData.date && formData.time && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Label className="text-sm font-medium text-green-800 mb-2 block flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  ISO 8601 Format Preview:
                </Label>
                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-green-600">Start: </span>
                    <code className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                      {`${formData.date}T${formData.time}:00.000Z`}
                    </code>
                  </div>
                  {formData.end_time && (
                    <div>
                      <span className="text-xs text-green-600">End: </span>
                      <code className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">
                        {`${formData.date}T${formData.end_time}:00.000Z`}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Version Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="version"
                    className="text-sm font-medium text-gray-700"
                  >
                    Version *
                  </Label>
                  <Input
                    id="version"
                    type="number"
                    value={formData.version || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "version",
                        Number.parseInt(e.target.value) || 0,
                      )
                    }
                    className={`rounded-lg ${errors.version ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Enter version number"
                  />
                  {errors.version && (
                    <p className="text-sm text-red-600">{errors.version}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meeting Room Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="meeting_room"
                    className="text-sm font-medium text-gray-700"
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
                    className={`rounded-lg ${errors.meeting_room ? "border-red-300" : "border-gray-300"}`}
                    placeholder="Enter room number (1-5)"
                  />
                  {errors.meeting_room && (
                    <p className="text-sm text-red-600">
                      {errors.meeting_room}
                    </p>
                  )}
                </div>

                {/* Spacer for alignment */}
                <div></div>
              </div>

              {/* Topic Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="topic"
                  className="text-sm font-medium text-gray-700"
                >
                  Topic *
                </Label>
                <Input
                  id="topic"
                  type="text"
                  value={formData.topic}
                  onChange={(e) => handleInputChange("topic", e.target.value)}
                  className={`rounded-lg ${errors.topic ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter meeting topic"
                />
                {errors.topic && (
                  <p className="text-sm text-red-600">{errors.topic}</p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={`rounded-lg min-h-[100px] ${errors.description ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter meeting description"
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Type Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="type"
                  className="text-sm font-medium text-gray-700"
                >
                  Meeting Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger
                    className={`rounded-lg ${errors.type ? "border-red-300" : "border-gray-300"}`}
                  >
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={`rounded-lg ${errors.date ? "border-red-300" : "border-gray-300"}`}
                    min={getCurrentDate()}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Time Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="time"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className={`rounded-lg ${errors.time ? "border-red-300" : "border-gray-300"}`}
                  />
                  {errors.time && (
                    <p className="text-sm text-red-600">{errors.time}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* End Time Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="end_time"
                    className="text-sm font-medium text-gray-700 flex items-center"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    End Time *
                  </Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      handleInputChange("end_time", e.target.value)
                    }
                    className={`rounded-lg ${errors.end_time ? "border-red-300" : "border-gray-300"}`}
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-600">{errors.end_time}</p>
                  )}
                </div>

                {/* Spacer for alignment */}
                <div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Creator Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="creator"
                    className="text-sm font-medium text-gray-700"
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
                      className={`rounded-lg ${errors.creator ? "border-red-300" : "border-gray-300"}`}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingMembers
                            ? "Loading members..."
                            : "Select creator"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingMembers ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : members.length === 0 ? (
                        <SelectItem value="no-members" disabled>
                          No members available
                        </SelectItem>
                      ) : (
                        members.map((member) => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.creator && (
                    <p className="text-sm text-red-600">{errors.creator}</p>
                  )}
                </div>

                {/* Member Field - Multi Select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Members *
                  </Label>

                  {/* Show different interface based on member loading status */}
                  {members.length > 0 ? (
                    <>
                      {/* Dropdown interface when members are loaded */}
                      <div className="flex space-x-2">
                        <Select
                          value={memberToAdd}
                          onValueChange={(value) => setMemberToAdd(value)}
                        >
                          <SelectTrigger
                            className={`flex-1 rounded-lg ${errors.member ? "border-red-300" : "border-gray-300"}`}
                          >
                            <SelectValue placeholder="Select member to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {members
                              .filter(
                                (member) =>
                                  !selectedMembers.includes(member.name),
                              )
                              .map((member) => (
                                <SelectItem key={member.id} value={member.name}>
                                  {member.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={() => addMember(memberToAdd)}
                          disabled={
                            !memberToAdd ||
                            selectedMembers.includes(memberToAdd)
                          }
                          className="rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual input interface when members can't be loaded */}
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            value={memberToAdd}
                            onChange={(e) => setMemberToAdd(e.target.value)}
                            className={`flex-1 rounded-lg ${errors.member ? "border-red-300" : "border-gray-300"}`}
                            placeholder="Type member name"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addMember(memberToAdd);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => addMember(memberToAdd)}
                            disabled={
                              !memberToAdd.trim() ||
                              selectedMembers.includes(memberToAdd.trim())
                            }
                            className="rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {isLoadingMembers
                            ? "Loading member list..."
                            : "Type member names and click Add"}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Selected Members Display */}
                  {selectedMembers.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">
                        Selected Members:
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedMembers.map((memberName) => (
                          <div
                            key={memberName}
                            className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{memberName}</span>
                            <button
                              type="button"
                              onClick={() => removeMember(memberName)}
                              className="hover:bg-blue-200 rounded-full p-1 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.member && (
                    <p className="text-sm text-red-600">{errors.member}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={checkAvailability}
                disabled={isChecking || isSubmitting}
                className="w-full rounded-lg font-medium py-3 text-black hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#FFD700" }}
              >
                {isChecking ? "กำลังตรวจสอบ..." : "ตรวจสอบห้องและสมาชิกว่าง"}
              </Button>
              {checkResult && (
                <Alert className="rounded-lg bg-blue-50 border-blue-200 mt-2">
                  <AlertDescription className="text-blue-800 whitespace-pre-wrap">
                    {checkResult}
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg font-medium py-3 text-black hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#90EE90" }}
              >
                {isSubmitting ? "Submitting..." : "Submit Meeting"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
