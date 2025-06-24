import React, { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Alert, AlertDescription } from "./alert";
import { Calendar, Users, Clock, X } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { RoleIcon, RoleLabel } from "./role-badge";

interface Member {
  id: number;
  name: string;
  role: string;
}

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

interface EditMeetingModalProps {
  meeting: MeetingData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMeeting: MeetingData) => void;
}

async function fetchMembers(): Promise<Member[]> {
  try {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbxW8z2Ba9FBtdxCcVa69JmtRFce7GBw3ahwYTEAs6ZqGajWdcKA0Pybjc0QS0JKfKmT/exec?sheet=Members",
      {
        method: "GET",
        cache: "no-store",
      },
    );
    const data = await response.json();
    return Array.isArray(data.members) ? data.members : [];
  } catch {
    return [];
  }
}

export function EditMeetingModal({ meeting, isOpen, onClose, onSave }: EditMeetingModalProps) {
  function toMemberArray(member: string[] | string): string[] {
    if (Array.isArray(member)) return member;
    if (typeof member === "string" && member) return member.split(",").map(m => m.trim()).filter(Boolean);
    return [];
  }

  const [formData, setFormData] = useState<MeetingData>(meeting);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(toMemberArray(meeting.member));
  const [memberToAdd, setMemberToAdd] = useState<string>("");

  useEffect(() => {
    // Parse date/time from ISO string
    let date = "";
    let time = "";
    let end_time = "";
    const timeZone = "Asia/Bangkok";
    if (meeting.date) {
      const d = toZonedTime(new Date(meeting.date), timeZone);
      date = d.toISOString().split("T")[0];
      time = d.toTimeString().slice(0,5);
    }
    if (meeting.end_date) {
      const d = toZonedTime(new Date(meeting.end_date), timeZone);
      end_time = d.toTimeString().slice(0,5);
    }
    if (!date) {
      const today = new Date();
      date = today.toISOString().split("T")[0];
    }
    setFormData({ ...meeting, date, time, end_time });
    setSelectedMembers(toMemberArray(meeting.member));
  }, [meeting, isOpen]);

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      setMembers(await fetchMembers());
      setIsLoadingMembers(false);
    };
    if (isOpen) loadMembers();
  }, [isOpen]);

  // Update member field when selectedMembers changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, member: selectedMembers }));
  }, [selectedMembers]);

  const addMember = (memberName: string) => {
    const trimmedName = memberName.trim();
    if (
      trimmedName &&
      trimmedName !== "loading" &&
      trimmedName !== "no-members" &&
      !selectedMembers.includes(trimmedName)
    ) {
      setSelectedMembers((prev) => [...prev, trimmedName]);
      setMemberToAdd("");
    }
  };

  const removeMember = (memberName: string) => {
    setSelectedMembers((prev) => prev.filter((name) => name !== memberName));
  };

  const handleInputChange = (
    field: keyof MeetingData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.topic.trim()) newErrors.topic = "Topic is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.type) newErrors.type = "Meeting type is required";
    if (!formData.date) newErrors.date = "Date is required";
    else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date)) newErrors.date = "Date must be in YYYY-MM-DD format";
    }
    if (!formData.time) newErrors.time = "Time is required";
    else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.time)) newErrors.time = "Time must be in HH:mm format";
    }
    if (!formData.creator.trim()) newErrors.creator = "Creator is required";
    if (!formData.member || formData.member.length === 0) newErrors.member = "Member is required";
    if (!formData.version || formData.version <= 0) newErrors.version = "Version must be a positive number";
    if (!formData.meeting_room || formData.meeting_room <= 0) newErrors.meeting_room = "Meeting room must be a positive number";
    else if (formData.meeting_room > 5) newErrors.meeting_room = "Meeting room number cannot exceed 5";
    if (!formData.end_time) newErrors.end_time = "End time is required";
    else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.end_time)) newErrors.end_time = "End time must be in HH:mm format";
      if (formData.time && formData.end_time <= formData.time) newErrors.end_time = "End time must be after start time";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave({ ...formData, member: selectedMembers });
    onClose();
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
            <Users className="h-6 w-6" />
            <span>Edit Meeting</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <Label htmlFor="version" className="text-sm font-medium text-gray-700">Version *</Label>
                <Input id="version" type="number" value={formData.version ?? ""} onChange={e => handleInputChange("version", Number.parseInt(e.target.value) || 0)} className={`rounded-lg ${errors.version ? "border-red-300" : "border-gray-300"}`} placeholder="Enter version number" />
                {errors.version && <p className="text-sm text-red-600">{errors.version}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Meeting Room Field */}
              <div className="space-y-2">
                <Label htmlFor="meeting_room" className="text-sm font-medium text-gray-700">Meeting Room * (1-5)</Label>
                <Input id="meeting_room" type="number" min="1" max="5" value={formData.meeting_room ?? ""} onChange={e => handleInputChange("meeting_room", Number.parseInt(e.target.value) || 0)} className={`rounded-lg ${errors.meeting_room ? "border-red-300" : "border-gray-300"}`} placeholder="Enter room number (1-5)" />
                {errors.meeting_room && <p className="text-sm text-red-600">{errors.meeting_room}</p>}
              </div>
              <div></div>
            </div>

            {/* Topic Field */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium text-gray-700">Topic *</Label>
              <Input id="topic" type="text" value={formData.topic ?? ""} onChange={e => handleInputChange("topic", e.target.value)} className={`rounded-lg ${errors.topic ? "border-red-300" : "border-gray-300"}`} placeholder="Enter meeting topic" />
              {errors.topic && <p className="text-sm text-red-600">{errors.topic}</p>}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description *</Label>
              <Textarea id="description" value={formData.description ?? ""} onChange={e => handleInputChange("description", e.target.value)} className={`rounded-lg min-h-[100px] ${errors.description ? "border-red-300" : "border-gray-300"}`} placeholder="Enter meeting description" />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Type Field */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-gray-700">Meeting Type *</Label>
              <Select value={formData.type ?? ""} onValueChange={value => handleInputChange("type", value)}>
                <SelectTrigger className={`rounded-lg ${errors.type ? "border-red-300" : "border-gray-300"}`}><SelectValue placeholder="Select meeting type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Field */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center"><Calendar className="h-4 w-4 mr-2" />Date *</Label>
                <Input id="date" type="date" value={formData.date ?? ""} onChange={e => handleInputChange("date", e.target.value)} className={`rounded-lg ${errors.date ? "border-red-300" : "border-gray-300"}`} min={getCurrentDate()} />
                {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
              </div>
              {/* Time Field */}
              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium text-gray-700 flex items-center"><Clock className="h-4 w-4 mr-2" />Start Time *</Label>
                <Input id="time" type="time" value={formData.time ?? ""} onChange={e => handleInputChange("time", e.target.value)} className={`rounded-lg ${errors.time ? "border-red-300" : "border-gray-300"}`} />
                {errors.time && <p className="text-sm text-red-600">{errors.time}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* End Time Field */}
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-sm font-medium text-gray-700 flex items-center"><Clock className="h-4 w-4 mr-2" />End Time *</Label>
                <Input id="end_time" type="time" value={formData.end_time ?? ""} onChange={e => handleInputChange("end_time", e.target.value)} className={`rounded-lg ${errors.end_time ? "border-red-300" : "border-gray-300"}`} />
                {errors.end_time && <p className="text-sm text-red-600">{errors.end_time}</p>}
              </div>
              <div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Creator Field */}
              <div className="space-y-2">
                <Label htmlFor="creator" className="text-sm font-medium text-gray-700">Creator *</Label>
                <Select value={formData.creator ?? ""} onValueChange={value => handleInputChange("creator", value)}>
                  <SelectTrigger className={`rounded-lg ${errors.creator ? "border-red-300" : "border-gray-300"}`}><SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select creator"} /></SelectTrigger>
                  <SelectContent>
                    {isLoadingMembers ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : members.length === 0 ? (
                      <SelectItem value="no-members" disabled>No members available</SelectItem>
                    ) : (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          <div className="flex items-center space-x-2">
                            <RoleIcon role={member.role} size="md" />
                            <span>{member.name}</span>
                            <RoleLabel role={member.role} size="sm" />
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.creator && <p className="text-sm text-red-600">{errors.creator}</p>}
              </div>
              {/* Member Field - Multi Select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Members *</Label>
                {members.length > 0 ? (
                  <>
                    <div className="flex space-x-2">
                      <Select value={memberToAdd} onValueChange={value => setMemberToAdd(value)}>
                        <SelectTrigger className={`flex-1 rounded-lg ${errors.member ? "border-red-300" : "border-gray-300"}`}><SelectValue placeholder="Select member to add" /></SelectTrigger>
                        <SelectContent>
                          {members.filter(member => !selectedMembers.includes(member.name)).map(member => (
                            <SelectItem key={member.id} value={member.name}>
                              <div className="flex items-center space-x-2">
                                <RoleIcon role={member.role} size="md" />
                                <span>{member.name}</span>
                                <RoleLabel role={member.role} size="sm" />
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={() => addMember(memberToAdd)} disabled={!memberToAdd || selectedMembers.includes(memberToAdd)} className="rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors">Add</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Input type="text" value={memberToAdd} onChange={e => setMemberToAdd(e.target.value)} className={`flex-1 rounded-lg ${errors.member ? "border-red-300" : "border-gray-300"}`} placeholder="Type member name" onKeyPress={e => { if (e.key === "Enter") { e.preventDefault(); addMember(memberToAdd); } }} />
                        <Button type="button" onClick={() => addMember(memberToAdd)} disabled={!memberToAdd.trim() || selectedMembers.includes(memberToAdd.trim())} className="rounded-lg px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-colors">Add</Button>
                      </div>
                      <p className="text-xs text-gray-500">{isLoadingMembers ? "Loading member list..." : "Type member names and click Add"}</p>
                    </div>
                  </>
                )}
                {selectedMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Selected Members:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((memberName) => (
                        <div key={memberName} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {(() => {
                            const member = members.find(m => m.name === memberName);
                            return (
                              <>
                                <RoleIcon role={member?.role} size="md" />
                                <span>{memberName}</span>
                                {member && <RoleLabel role={member.role} size="sm" />}
                              </>
                            );
                          })()}
                          <button type="button" onClick={() => removeMember(memberName)} className="hover:bg-blue-200 rounded-full p-1 transition-colors"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.member && <p className="text-sm text-red-600">{errors.member}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 