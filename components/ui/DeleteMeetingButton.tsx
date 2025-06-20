import React, { useState } from "react";
import { Button } from "./button";

interface DeleteMeetingButtonProps {
  meetingId: number;
  meetingName?: string;
  onDelete: (id: number) => void;
}

export function DeleteMeetingButton({ meetingId, meetingName, onDelete }: DeleteMeetingButtonProps) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center max-w-sm w-full z-[10000]">
          <p className="mb-2 text-center text-lg font-semibold">Are you sure you want to delete this meeting?</p>
          {meetingName && <p className="mb-4 text-center text-red-700 font-bold">{meetingName}</p>}
          <div className="flex space-x-2">
            <Button variant="destructive" onClick={() => onDelete(meetingId)}>Delete</Button>
            <Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button variant="destructive" onClick={() => setConfirm(true)}>
      Delete
    </Button>
  );
} 