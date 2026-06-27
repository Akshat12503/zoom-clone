"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Video, Users, Calendar, Clock, Copy, Check } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  type: string;
  status: string;
  start_time: string;
  duration: number;
  invite_link: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinId, setJoinId] = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const [upcomingRes, recentRes] = await Promise.all([
        axios.get(`${API_URL}/api/meetings/upcoming`),
        axios.get(`${API_URL}/api/meetings/recent`),
      ]);
      setUpcomingMeetings(upcomingRes.data);
      setRecentMeetings(recentRes.data);
    } catch (err) {
      console.error("Failed to fetch meetings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMeeting = async () => {
    setCreatingMeeting(true);
    try {
      const res = await axios.post(`${API_URL}/api/meetings/instant`);
      const { meeting_id } = res.data;
      router.push(`/meeting/${meeting_id}`);
    } catch (err) {
      console.error("Failed to create meeting", err);
      setCreatingMeeting(false);
    }
  };

  const handleJoin = () => {
    if (!joinId.trim()) return;
    const id = joinId.trim().replace(/\s/g, "");
    router.push(`/join/${id}`);
  };

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Welcome Banner */}
      <div className="bg-blue-600 rounded-2xl p-6 mb-8 text-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Good day, John! 👋</h1>
          <p className="text-blue-100 text-sm">What would you like to do today?</p>
        </div>
        <div className="hidden md:block opacity-20 text-8xl font-black">Z</div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

        {/* New Meeting */}
        <button
          onClick={handleNewMeeting}
          disabled={creatingMeeting}
          className="flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-70"
        >
          <div className="bg-white/20 p-3 rounded-xl">
            <Video className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm">
            {creatingMeeting ? "Starting..." : "New Meeting"}
          </span>
        </button>

        {/* Join Meeting */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex flex-col items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 p-6 rounded-2xl border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="bg-blue-50 p-3 rounded-xl">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <span className="font-semibold text-sm">Join Meeting</span>
        </button>

        {/* Schedule Meeting */}
        <button
          onClick={() => router.push("/schedule")}
          className="flex flex-col items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 p-6 rounded-2xl border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="bg-blue-50 p-3 rounded-xl">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <span className="font-semibold text-sm">Schedule</span>
        </button>

      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Join a Meeting</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the meeting ID or paste an invite link</p>
            <input
              type="text"
              placeholder="Enter Meeting ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="input-field mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowJoinModal(false); setJoinId(""); }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={!joinId.trim()}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Meetings */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Upcoming Meetings
        </h2>
        {loading ? (
          <div className="text-sm text-gray-400 py-4">Loading...</div>
        ) : upcomingMeetings.length === 0 ? (
          <div className="card text-center text-gray-400 text-sm py-8">
            No upcoming meetings scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((m) => (
              <div key={m.id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{m.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(m.start_time)} · {m.duration} min
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">ID: {m.meeting_id}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(m.invite_link, m.meeting_id)}
                    className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
                  >
                    {copiedId === m.meeting_id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === m.meeting_id ? "Copied" : "Copy Link"}
                  </button>
                  <button
                    onClick={() => router.push(`/meeting/${m.meeting_id}`)}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Meetings */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Recent Meetings
        </h2>
        {loading ? (
          <div className="text-sm text-gray-400 py-4">Loading...</div>
        ) : recentMeetings.length === 0 ? (
          <div className="card text-center text-gray-400 text-sm py-8">
            No recent meetings found.
          </div>
        ) : (
          <div className="space-y-3">
            {recentMeetings.map((m) => (
              <div key={m.id} className="card flex items-center justify-between gap-4 opacity-80">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <Video className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">{m.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(m.start_time)} · {m.duration} min
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">ID: {m.meeting_id}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full capitalize">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}