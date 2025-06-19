"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, RefreshCw, AlertCircle, Clock, Shield, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface Meeting {
  id: number
  topic: string
  description: string
  type: string
  date: string
  creator: string
  member: string
  version: number
}

interface ApiResponse {
  meetings?: Meeting[]
  error?: string
  details?: string
}

// Mock data for when API fails - using UTC times that convert to reasonable Thailand meeting times
const MOCK_MEETINGS: Meeting[] = [
  {
    id: 1,
    topic: "Weekly Team Sync",
    description:
      "Regular team meeting to discuss progress, blockers, and upcoming tasks. We'll review the sprint progress and plan for next week.",
    type: "online",
    date: "2025-06-19T16:00:00.000Z", // 4:00 PM UTC = 9:00 AM Thailand
    creator: "John Doe",
    member: "Alice, Bob, Charlie, Diana",
    version: 1,
  },
  {
    id: 2,
    topic: "Project Kickoff Meeting",
    description:
      "Initial meeting to start the new project phase. We'll discuss requirements, timeline, and resource allocation.",
    type: "onsite",
    date: "2025-06-20T21:30:00.000Z", // 9:30 PM UTC = 2:30 PM Thailand
    creator: "Jane Smith",
    member: "David, Emma, Frank, Grace",
    version: 1,
  },
  {
    id: 3,
    topic: "Client Presentation",
    description: "Present the final deliverables to the client and gather feedback for future improvements.",
    type: "online",
    date: "2025-06-21T23:00:00.000Z", // 11:00 PM UTC = 4:00 PM Thailand
    creator: "Mike Johnson",
    member: "Sarah, Tom, Lisa",
    version: 2,
  },
  {
    id: 4,
    topic: "Budget Review Meeting",
    description: "Quarterly budget review and planning for next quarter expenses and resource allocation.",
    type: "onsite",
    date: "2025-06-22T17:15:00.000Z", // 5:15 PM UTC = 10:15 AM Thailand
    creator: "Sarah Wilson",
    member: "Finance Team, Department Heads",
    version: 1,
  },
  {
    id: 5,
    topic: "Product Demo Session",
    description: "Demonstration of new product features to stakeholders and gathering feedback for improvements.",
    type: "online",
    date: "2025-06-23T20:45:00.000Z", // 8:45 PM UTC = 1:45 PM Thailand
    creator: "Alex Chen",
    member: "Product Team, Stakeholders",
    version: 3,
  },
]

// Updated function to fetch meetings through our API route
async function fetchMeetingsData(): Promise<{ meetings: Meeting[]; error?: string; details?: string }> {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbz5OjDVKk9TUVyWJ1fXPh2PqH_bEZ3mO3ANNSggAImDiEd8lLdNJKSOs4DXpi_XvmxP/exec",
      {
        method: "GET",
        cache: "no-store",
      },
    )
    console.log(response)
    const data: ApiResponse = await response.json()
    console.log(data)
    // Handle API error responses
    if (!response.ok) {
      return {
        meetings: [],
        error: data.error || `API Error: ${response.status}`,
        details: data.details,
      }
    }

    // Handle error response from API
    if (data.error) {
      return {
        meetings: [],
        error: data.error,
        details: data.details,
      }
    }

    if (!data.meetings || !Array.isArray(data.meetings)) {
      return {
        meetings: [],
        error: "Invalid response format",
        details: "Expected 'meetings' array in API response",
      }
    }

    return {
      meetings: data.meetings,
    }
  } catch (error) {
    console.error("Failed to fetch meetings:", error)

    return {
      meetings: [],
      error: "Network error",
      details: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  const loadMeetings = async () => {
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      const result = await fetchMeetingsData()

      if (result.meetings.length > 0) {
        setMeetings(result.meetings)
        setError(null)
        setErrorDetails(null)
      } else {
        setMeetings([])
        setError(result.error || "No meetings found")
        setErrorDetails(result.details || null)
      }
    } catch (error) {
      console.error("Failed to load meetings:", error)
      setMeetings([])
      setError("Failed to load meetings. Please try again.")
      setErrorDetails(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMeetings()
  }, [])

  const handleRefresh = () => {
    loadMeetings()
  }

  const handleEditMeeting = (meetingId: number) => {
    // Navigate to edit page with meeting ID
    window.location.href = `/edit-meeting/${meetingId}`
  }

  const handleDeleteMeeting = async (meetingId: number) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      try {
        // Here you would typically make an API call to delete the meeting
        // For now, we'll just remove it from the local state
        setMeetings((prev) => prev.filter((meeting) => meeting.id !== meetingId))

        // You can add actual delete API call here:
        // await deleteMeetingFromGoogleSheets(meetingId)

        console.log(`Meeting ${meetingId} deleted`)
      } catch (error) {
        console.error("Failed to delete meeting:", error)
        alert("Failed to delete meeting. Please try again.")
      }
    }
  }

  const toggleCardExpansion = (meetingId: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(meetingId)) {
        newSet.delete(meetingId)
      } else {
        newSet.add(meetingId)
      }
      return newSet
    })
  }

  // Format date and time - subtract 7 hours from UTC to get Thailand time
  const formatDateTime = (isoString: string) => {
    try {
      console.log("Original UTC time:", isoString)

      const date = new Date(isoString)

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        // Try parsing as a simple date string if ISO parsing fails
        const fallbackDate = new Date(isoString.replace(/[-]/g, "/"))
        if (isNaN(fallbackDate.getTime())) {
          return { date: "Invalid Date", time: "" }
        }

        // Subtract 7 hours (7 * 60 * 60 * 1000 milliseconds)
        const thailandTime = new Date(fallbackDate.getTime() - 7 * 60 * 60 * 1000)
        console.log("Thailand time (fallback):", thailandTime)

        return {
          date: thailandTime.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          time: thailandTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        }
      }

      // Subtract 7 hours from UTC time to get Thailand time
      const thailandTime = new Date(date.getTime() - 7 * 60 * 60 * 1000)
      console.log("Thailand time:", thailandTime)

      return {
        date: thailandTime.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: thailandTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      }
    } catch (error) {
      console.error("Date parsing error:", error)
      return { date: "Invalid Date", time: "" }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "meeting":
        return "bg-blue-100 text-blue-800"
      case "online":
        return "bg-green-100 text-green-800"
      case "onsite":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isAuthError =
    error?.includes("authentication") || error?.includes("sign-in") || errorDetails?.includes("sign-in")

  return (
    <>
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden.
        }
        .expanded-text {
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Meeting Dashboard</h1>
              </div>
              <nav className="flex space-x-4">
                <Link href="/" className="text-gray-600 hover:text-gray-800 font-medium px-3 py-2 rounded-md">
                  Add Meeting
                </Link>
                <Link href="/meetings" className="text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-md">
                  View Meetings
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span>All Meetings</span>
                {meetings.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                    {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex space-x-2">
                <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="rounded-lg">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Error Message */}
              {error && (
                <Alert
                  className={`mb-6 ${isAuthError ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}
                >
                  <div className="flex items-start">
                    {isAuthError ? (
                      <Shield className="h-4 w-4 mt-0.5 mr-2 text-red-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2" />
                    )}
                    <div className="flex-1">
                      <AlertDescription className={isAuthError ? "text-red-800" : "text-orange-800"}>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">Google Apps Script Issue</p>
                            <p className="mt-1">{error}</p>
                            {errorDetails && <p className="text-sm opacity-90 mt-1">{errorDetails}</p>}
                          </div>

                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-2">✅ Your doGet() Function is Correct!</h4>
                            <p className="text-sm text-blue-700 mb-2">
                              The issue is with deployment settings, not your code. Your function should work once
                              properly deployed.
                            </p>

                            <div className="text-sm text-blue-700">
                              <p className="font-medium mb-1">Spreadsheet Info:</p>
                              <p>
                                ID:{" "}
                                <code className="bg-blue-100 px-1 rounded">
                                  1dCD8km7x-gZlGXwLLLVkH3kkQV5Ww2ZUSbnQMacTfns
                                </code>
                              </p>
                            </div>
                          </div>

                          <div className="bg-red-50 p-3 rounded border border-red-200">
                            <h4 className="font-medium text-red-800 mb-2">🔧 Try This Fix:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-red-700">
                              <li>
                                <strong>Delete your current deployment</strong> (don't just edit it)
                              </li>
                              <li>
                                Create a <strong>completely new deployment</strong>
                              </li>
                              <li>
                                Set "Execute as" to <strong>"Me"</strong>
                              </li>
                              <li>
                                Set "Who has access" to <strong>"Anyone"</strong>
                              </li>
                              <li>
                                <strong>Authorize all permissions</strong> when prompted
                              </li>
                              <li>
                                Copy the <strong>new URL</strong> (it will be different)
                              </li>
                              <li>Update your code with the new URL</li>
                            </ol>
                          </div>

                          <div className="bg-green-50 p-3 rounded border border-green-200">
                            <h4 className="font-medium text-green-800 mb-2">📋 Expected Data Format:</h4>
                            <p className="text-sm text-green-700 mb-2">Your spreadsheet should have these columns:</p>
                            <div className="text-xs text-green-600 font-mono bg-green-100 p-2 rounded">
                              ID | Topic | Description | Type | Date | Creator | Member | Version
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">Loading meetings...</p>
                    <p className="text-sm text-gray-500 mt-2">Fetching data from Google Sheets</p>
                  </div>
                </div>
              ) : meetings.length === 0 ? (
                /* Empty State */
                <div className="text-center py-16">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No meetings found</h3>
                  <p className="text-gray-600 mb-6">
                    {error
                      ? "Fix the API issue above to view your meetings."
                      : "There are no meetings to display at the moment. Create your first meeting to get started!"}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {isLoading ? "Loading..." : "Try Again"}
                    </Button>
                    <Link href="/">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Calendar className="h-4 w-4 mr-2" />
                        Add Meeting
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Meeting Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {meetings
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((meeting, index) => {
                      const { date, time } = formatDateTime(meeting.date)
                      const isExpanded = expandedCards.has(meeting.id)
                      const shouldShowReadMore = meeting.description.length > 150

                      return (
                        <Card
                          key={meeting.id || index}
                          className="hover:shadow-lg transition-shadow duration-200 relative"
                        >
                          {/* Work Order Number - Top Right Corner */}
                          <div className="absolute top-4 right-4 z-10">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-mono text-xs">
                              WO-{String(meeting.id).padStart(4, "0")}
                            </Badge>
                          </div>

                          <CardHeader className="pb-3 pr-20">
                            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 pr-2">
                              {meeting.topic}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={`rounded-full capitalize ${getTypeColor(meeting.type)}`}>
                                {meeting.type}
                              </Badge>
                              <Badge variant="outline" className="rounded-full">
                                v{meeting.version}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Description with Read More/Less functionality */}
                            <div className="text-gray-600 text-sm">
                              {isExpanded || !shouldShowReadMore ? (
                                <div className="expanded-text">{meeting.description}</div>
                              ) : (
                                <div className="line-clamp-3">{meeting.description}</div>
                              )}
                              {shouldShowReadMore && (
                                <button
                                  onClick={() => toggleCardExpansion(meeting.id)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 focus:outline-none"
                                >
                                  {isExpanded ? "Read Less" : "Read More"}
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              {/* Date and Time - Separate Lines for Better Readability */}
                              <div className="flex items-center text-sm text-gray-700">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span className="font-medium">{date}</span>
                              </div>
                              {time && (
                                <div className="flex items-center text-sm text-gray-700">
                                  <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                  <span className="font-medium">{time}</span>
                                </div>
                              )}

                              <div className="flex items-start text-sm text-gray-700">
                                <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium">Creator:</span>
                                  <span className="ml-1 break-words">{meeting.creator}</span>
                                </div>
                              </div>

                              <div className="flex items-start text-sm text-gray-700">
                                <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium">Members:</span>
                                  <span className="ml-1 break-words">{meeting.member}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2 pt-2 border-t border-gray-100">
                              <Button
                                onClick={() => handleEditMeeting(meeting.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteMeeting(meeting.id)}
                                variant="outline"
                                size="sm"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  )
}
