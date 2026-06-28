"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  PhoneOff, Users, MessageSquare,
  Copy, Check, Loader
} from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Participant {
  id: number;
  display_name: string;
  joined_at: string;
}

interface TranscriptLine {
  speaker_name: string;
  text: string;
  timestamp: string;
}

export default function MeetingRoom() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.meetingId as string;

  const recognitionRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [meetingTitle, setMeetingTitle] = useState("Meeting");
  const [displayName, setDisplayName] = useState("Guest");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [copied, setCopied] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [jitsiRoom, setJitsiRoom] = useState("");

  useEffect(() => {
    const name = sessionStorage.getItem("displayName") || "Guest";
    setDisplayName(name);
    initMeeting(name);
    return () => stopTranscription();
  }, [meetingId]);

  const initMeeting = async (name: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/meetings/${meetingId}/start`);
      setMeetingTitle(res.data.title || "Meeting");
      // Use meetingId as the Jitsi room name (sanitized)
      setJitsiRoom(meetingId.replace(/-/g, ""));
      fetchParticipants();
    } catch (err) {
      console.error("Failed to init meeting", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/participants/${meetingId}`);
      setParticipants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndMeeting = async () => {
    stopTranscription();
    try {
      await axios.post(`${API_URL}/api/meetings/${meetingId}/end`);
    } catch (_) {}
    setMeetingEnded(true);
    setTimeout(() => router.push("/"), 3000);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${meetingId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Transcription ---
  const startTranscription = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = async (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript.trim();
      if (!text) return;
      const line: TranscriptLine = {
        speaker_name: displayName,
        text,
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => [...prev, line]);
      try {
        await axios.post(`${API_URL}/api/transcripts/${meetingId}`, {
          speaker_name: displayName,
          text,
        });
      } catch (_) {}
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") console.error("Speech error:", e.error);
    };

    recognition.onend = () => {
      if (recognitionRef.current) recognition.start();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setTranscribing(true);
  }, [displayName, meetingId]);

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setTranscribing(false);
  };

  const toggleTranscription = () => {
    transcribing ? stopTranscription() : startTranscription();
  };

  if (meetingEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Meeting Ended</h2>
          <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div>
          <h1 className="text-white font-semibold text-sm">{meetingTitle}</h1>
          <p className="text-gray-400 text-xs font-mono">{meetingId}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Invite"}
          </button>
          <button
            onClick={() => { setShowParticipants(!showParticipants); setShowTranscript(false); fetchParticipants(); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${showParticipants ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
          >
            <Users className="w-3 h-3" />
            Participants
          </button>
          <button
            onClick={() => { setShowTranscript(!showTranscript); setShowParticipants(false); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${showTranscript ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}
          >
            <MessageSquare className="w-3 h-3" />
            Transcript
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Jitsi Video Area */}
        <div className="flex-1 relative bg-gray-900 p-3">
          {loading || !jitsiRoom ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
                <p className="text-sm text-gray-400">Starting meeting...</p>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://meet.jit.si/${jitsiRoom}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","desktop","fullscreen","hangup","tileview","settings"]`}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full rounded-2xl"
              style={{ border: "none" }}
            />
          )}
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white text-sm font-semibold">
                Participants ({participants.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">No participants yet</p>
              ) : (
                participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {p.display_name[0].toUpperCase()}
                    </div>
                    <span className="text-white text-xs truncate">{p.display_name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Transcript Panel */}
        {showTranscript && (
          <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white text-sm font-semibold">Live Transcript</h3>
              <button
                onClick={toggleTranscription}
                className={`text-xs px-2 py-1 rounded-lg transition ${
                  transcribing
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                }`}
              >
                {transcribing ? "Stop" : "Start"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {transcript.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">
                  {transcribing ? "Listening..." : "Click Start to begin transcription"}
                </p>
              ) : (
                transcript.map((line, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-blue-400 font-semibold">{line.speaker_name}: </span>
                    <span className="text-gray-300">{line.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center py-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
        <button
          onClick={handleEndMeeting}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition font-medium"
        >
          <PhoneOff className="w-5 h-5" />
          Leave Meeting
        </button>
      </div>

    </div>
  );
}