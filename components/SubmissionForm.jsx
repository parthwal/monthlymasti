import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function SubmissionForm() {
  const [formState, setFormState] = useState({
    name: "",
    location: "",
    short_desc: "",
    mood: "",
    color: "",
    memory: "",
    story: "",
    recommendation: "",
    message: "",
  });
  const [photos, setPhotos] = useState([]);
  const [selfie, setSelfie] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const steps = [
    "Basic Info",
    "Month Snapshot",
    "Memories & Stories",
    "Share & Recommend",
    "Visual Uploads",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((p) => ({ ...p, [name]: value }));
  };

  const handlePhotoChange = (e) =>
    setPhotos(Array.from(e.target.files).slice(0, 5));
  const handleSelfieChange = (e) => setSelfie(e.target.files[0] || null);

  const validateStep = () => {
    if (step === 0 && !formState.name) return "Name is required";
    return null;
  };

  const handleNext = (e) => {
    e.preventDefault();
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handlePrev = (e) => {
    e.preventDefault();
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const timestamp = new Date().toISOString();
      const uploadedPhotoUrls = [];

      // Upload photos
      for (const file of photos) {
        const path = `photos/${timestamp}_${file.name}`;
        // upload file
        const { error: uploadError } = await supabase.storage
          .from("dashboard-media")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        // get public URL
        const { data: publicData, error: urlError } = supabase.storage
          .from("dashboard-media")
          .getPublicUrl(path);
        if (urlError) throw new Error(urlError.message);
        uploadedPhotoUrls.push(publicData.publicUrl);
      }

      // Upload selfie

      let selfieUrl = null;
      if (selfie) {
        const path = `selfies/${timestamp}_${selfie.name}`;
        const { error: selfErr } = await supabase.storage
          .from("dashboard-media")
          .upload(path, selfie, { cacheControl: "3600", upsert: false });
        if (selfErr) throw new Error(selfErr.message);
        const { publicURL } = supabase.storage
          .from("dashboard-media")
          .getPublicUrl(path);
        selfieUrl = publicURL;
      }

      const payload = {
        form_timestamp: timestamp,
        ...formState,
        date: timestamp,
        photo_urls: uploadedPhotoUrls,
        selfie_url: selfieUrl,
      };

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-md"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Monthly Check-In
      </h2>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-indigo-600 h-2 rounded-full"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && (
        <div className="text-green-600 mb-4">Submitted successfully!</div>
      )}

      <h3 className="text-xl font-semibold mb-4">{steps[step]}</h3>

      {/* Step Contents */}
      {step === 0 && (
        <>
          <label className="block mb-4">
            <span className="text-gray-700">Full Name *</span>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
              required
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Location</span>
            <input
              name="location"
              value={formState.location}
              onChange={handleChange}
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
            />
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <label className="block mb-4">
            <span className="text-gray-700">Describe your month</span>
            <input
              name="short_desc"
              value={formState.short_desc}
              onChange={handleChange}
              placeholder="e.g. Busy but fulfilling"
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-gray-700">Overall Mood</span>
              <input
                name="mood"
                value={formState.mood}
                onChange={handleChange}
                placeholder="😄"
                className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-gray-700">Color of the Month</span>
              <input
                name="color"
                value={formState.color}
                onChange={handleChange}
                placeholder="Sky Blue"
                className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
              />
            </label>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <label className="block mb-4">
            <span className="text-gray-700">Favorite memories</span>
            <textarea
              name="memory"
              value={formState.memory}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Detailed incident</span>
            <textarea
              name="story"
              value={formState.story}
              onChange={handleChange}
              rows={4}
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
            />
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <label className="block mb-4">
            <span className="text-gray-700">Recommendation</span>
            <input
              name="recommendation"
              value={formState.recommendation}
              onChange={handleChange}
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Message for group</span>
            <textarea
              name="message"
              value={formState.message}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full border rounded p-2 focus:ring-indigo-500"
            />
          </label>
        </>
      )}

      {step === 4 && (
        <>
          <label className="block mb-4">
            <span className="text-gray-700">Upload up to 5 photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="mt-1 block w-full text-gray-600"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Your selfie (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleSelfieChange}
              className="mt-1 block w-full text-gray-600"
            />
          </label>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        {step > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>

      {success && (
        <div className="mt-4 text-center text-lg text-green-600">
          Thank you! Your submission is recorded.
        </div>
      )}
    </form>
  );
}
