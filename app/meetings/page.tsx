"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Users, Clock, MapPin, RefreshCw } from "lucide-react";
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
  "meeting-room": number;
  end_date: string;
}

interface ApiResponse {
  meetings?: MeetingData[];
  error?: string;
  details?: string;
}

async function fetchMeetingsData(): Promise<{
  meetings: MeetingData[];
  error?: string;
  details?: string;
}> {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbz5OjDVKk9TUVyWJ1fXPh2PqH_bEZ3mO3ANNSggAImDiEd8lLdNJKSOs4DXpi_XvmxP/exec",
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

    return {
      meetings: [],
      error: "Network error",
      details:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export default function ViewMeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMeetings();
      setMeetings(data);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
      setError("Failed to load meetings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

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
            {meetings.map((meeting) => {
              const startDateTime = formatDateTime(meeting.date);
              const endDateTime = formatDateTime(meeting.end_date);
              const duration = getMeetingDuration(
                meeting.date,
                meeting.end_date,
              );

              return (
                <Card
                  key={meeting.id}
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
                      <span>Room {meeting["meeting-room"]}</span>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
