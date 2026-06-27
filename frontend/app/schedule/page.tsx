"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, FileText, ArrowLeft, Check } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    duration: 30,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.start_time) newErrors.start_time = "Date and time is required";
    else if (new Date(form.start_time) <= new Date())
      newErrors.start_time = "Must be a future date and time";
    if (form.duration < 5 || form.duration > 480)
      newErrors.duration = "Duration must be between 5 and 480 minutes";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/meetings/schedule`, {
        title: form.title.trim(),
        description: form.description.trim(),
        start_time: new Date(form.start_time).toISOString(),
        duration: form.duration,
      });
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      console.error("Failed to schedule meeting", err);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Min datetime = now (for the date picker)
  const minDateTime = new Date(Date.now() + 60000)
    .toISOString()
    .slice(0, 16);

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <div className="bg-green-50 rounded-2xl p-10">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Meeting Scheduled!</h2>
          <p className="text-gray-500 text-sm">Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Schedule a Meeting</h1>
          <p className="text-sm text-gray-500">Set up a meeting for later</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card space-y-5">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            Meeting Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Team Standup, Product Review"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={`input-field ${errors.title ? "border-red-400 focus:ring-red-400" : ""}`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="What's this meeting about?"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="input-field resize-none"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            min={minDateTime}
            value={form.start_time}
            onChange={(e) => update("start_time", e.target.value)}
            className={`input-field ${errors.start_time ? "border-red-400 focus:ring-red-400" : ""}`}
          />
          {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 flex-wrap mb-2">
            {[15, 30, 45, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => update("duration", d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  form.duration === d
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
          <input
            type="number"
            min={5}
            max={480}
            value={form.duration}
            onChange={(e) => update("duration", parseInt(e.target.value) || 30)}
            className={`input-field ${errors.duration ? "border-red-400 focus:ring-red-400" : ""}`}
            placeholder="Or enter custom duration"
          />
          {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.push("/")}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 btn-primary disabled:opacity-60"
          >
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>

      </div>
    </div>
  );
}