"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Users, MessageSquare, Copy, Check, Loader,
  MonitorOff, ScreenShare
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

  // Daily.co iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const callFrameRef = useRef<any>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [meetingTitle, setMeetingTitle] = useState("Meeting");
  const [displayName, setDisplayName] = useState("Guest");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [copied, setCopied] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [dailyRoomUrl, setDailyRoomUrl] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  // Speech recognition ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const name = sessionStorage.getItem("displayName") || "Guest";
    setDisplayName(name);
    initMeeting(name);
    return () => stopTranscription();
  }, [meetingId]);

  const initMeeting = async (name: string) => {
    try {
      // Start the meeting (creates Daily.co room)
      const res = await axios.post(`${API_URL}/api/meetings/${meetingId}/start`);
      const { title, daily_room_url } = res.data;
      setMeetingTitle(title || "Meeting");
      setDailyRoomUrl(daily_room_url);
      loadDailyFrame(daily_room_url, name);
      fetchParticipants();
    } catch (err) {
      console.error("Failed to init meeting", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyFrame = (roomUrl: string, name: string) => {
    if (typeof window === "undefined") return;

    // Dynamically load Daily.co script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@daily-co/daily-js";
    script.onload = () => {
      const DailyIframe = (window as any).DailyIframe;
      if (!DailyIframe || !iframeRef.current) return;

      const callFrame = DailyIframe.wrap(iframeRef.current, {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "16px",
        },
      });

      callFrameRef.current = callFrame;

      callFrame.join({
        url: roomUrl,
        userName: name,
        startVideoOff: false,
        startAudioOff: false,
      });

      callFrame.on("left-meeting", () => handleEndMeeting());
    };
    document.head.appendChild(script);
  };

  const fetchParticipants = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/participants/${meetingId}`);
      setParticipants(res.data);
    } catch (err) {
      console.error("Failed to fetch participants", err);
    }
  };

  // --- Controls ---
  const toggleMic = () => {
    callFrameRef.current?.setLocalAudio(!micOn);
    setMicOn((prev) => !prev);
  };

  const toggleCam = () => {
    callFrameRef.current?.setLocalVideo(!camOn);
    setCamOn((prev) => !prev);
  };

  const toggleScreenShare = async () => {
    if (!callFrameRef.current) return;
    if (sharing) {
      await callFrameRef.current.stopScreenShare();
    } else {
      await callFrameRef.current.startScreenShare();
    }
    setSharing((prev) => !prev);
  };

  const handleEndMeeting = async () => {
    stopTranscription();
    callFrameRef.current?.destroy();
    try {
      await axios.post(`${API_URL}/api/meetings/${meetingId}/end`);
    } catch (_) {}
    setMeetingEnded(true);
    setTimeout(() => router.push("/"), 3000);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Transcription ---
  const startTranscription = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Use Chrome.");
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

      // Save to backend
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
      // Auto-restart if still transcribing
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
    if (transcribing) {
      stopTranscription();
    } else {
      startTranscription();
    }
  };

  // Meeting ended screen
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

        {/* Video Area */}
        <div className="flex-1 relative bg-gray-900 p-3">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-400" />
                <p className="text-sm text-gray-400">Starting meeting...</p>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full rounded-2xl"
              style={{ border: "none" }}
            />
          )}
        </div>

        {/* Side Panel - Participants */}
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

        {/* Side Panel - Transcript */}
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
      <div className="flex items-center justify-center gap-3 py-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">

        {/* Mic */}
        <button
          onClick={toggleMic}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition ${
            micOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500/20 text-red-400"
          }`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          <span className="text-xs">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        {/* Camera */}
        <button
          onClick={toggleCam}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition ${
            camOn ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-red-500/20 text-red-400"
          }`}
        >
          {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          <span className="text-xs">{camOn ? "Stop Video" : "Start Video"}</span>
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition ${
            sharing ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
          }`}
        >
          {sharing ? <MonitorOff className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          <span className="text-xs">{sharing ? "Stop Share" : "Share Screen"}</span>
        </button>

        {/* End Call */}
        <button
          onClick={handleEndMeeting}
          className="flex flex-col items-center gap-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition ml-4"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs">End</span>
        </button>

      </div>
    </div>
  );
}