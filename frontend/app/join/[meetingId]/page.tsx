"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Video, User, ArrowLeft, AlertCircle, Loader } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.meetingId as string;

  const [displayName, setDisplayName] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [validating, setValidating] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Validate the meeting exists when page loads
  useEffect(() => {
    if (!meetingId) return;
    validateMeeting();
  }, [meetingId]);

  const validateMeeting = async () => {
    setValidating(true);
    try {
      const res = await axios.get(`${API_URL}/api/meetings/${meetingId}`);
      setMeetingTitle(res.data.title || "Meeting");
      if (res.data.status === "ended") {
        setError("This meeting has already ended.");
      }
    } catch (err) {
      setNotFound(true);
    } finally {
      setValidating(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    setJoining(true);
    setError("");
    try {
      await axios.post(`${API_URL}/api/participants/${meetingId}/join`, {
        display_name: displayName.trim(),
      });
      // Store name in sessionStorage so the meeting room can use it
      sessionStorage.setItem("displayName", displayName.trim());
      router.push(`/meeting/${meetingId}`);
    } catch (err) {
      setError("Failed to join meeting. Please try again.");
      setJoining(false);
    }
  };

  // Loading state while validating
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Checking meeting...</p>
        </div>
      </div>
    );
  }

  // Meeting not found
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-gray-100">
          <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Meeting Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            The meeting ID <span className="font-mono font-semibold text-gray-700">{meetingId}</span> doesn't exist or the link is invalid.
          </p>
          <button onClick={() => router.push("/")} className="btn-primary w-full">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">

        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Icon */}
        <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
          <Video className="w-7 h-7 text-blue-600" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-800 mb-1">Join Meeting</h1>
        <p className="text-sm text-gray-500 mb-1">
          You're joining: <span className="font-semibold text-gray-700">{meetingTitle}</span>
        </p>
        <p className="text-xs text-gray-400 font-mono mb-6">ID: {meetingId}</p>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            Your Display Name
          </label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            className={`input-field ${error ? "border-red-400 focus:ring-red-400" : ""}`}
            autoFocus
            maxLength={50}
          />
          {error && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={joining || !displayName.trim()}
          className="btn-primary w-full disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {joining ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Meeting"
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          By joining, you agree to be listed as a participant.
        </p>

      </div>
    </div>
  );
}