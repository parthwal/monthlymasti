import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";
import { useAuth } from "../components/AuthContext";
import { useDropzone } from "react-dropzone";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaTimes } from "react-icons/fa";

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
  const { user } = useAuth();
  const handleDrop = (acceptedFiles) => {
    const newFiles = [...photos, ...acceptedFiles].slice(0, 5);
    setPhotos(newFiles);
  };
  const handleReorder = (result) => {
    if (!result.destination) return;
    const updated = Array.from(photos);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setPhotos(updated);
  };
  const removePhoto = (index) => {
    const updated = [...photos];
    updated.splice(index, 1);
    setPhotos(updated);
  };

  useEffect(() => {
    if (user) {
      const name =
        user.user_metadata?.full_name || user.user_metadata?.name || user.email;

      setFormState((prev) => ({
        ...prev,
        name: name || "",
      }));
    }
  }, [user]);
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

  const {
    getRootProps: getPhotoRootProps,
    getInputProps: getPhotoInputProps,
    isDragActive: isPhotoDragActive,
  } = useDropzone({
    onDrop: handleDrop,
    accept: { "image/*": [] },
    multiple: true,
    maxFiles: 5 - photos.length,
  });

  const {
    getRootProps: getSelfieRootProps,
    getInputProps: getSelfieInputProps,
    isDragActive: isSelfieDragActive,
  } = useDropzone({
    onDrop: (files) => setSelfie(files[0] || null),
    accept: { "image/*": [] },
    multiple: false,
  });

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
      const filledPhotoUrls = [
        ...uploadedPhotoUrls,
        ...Array(5 - uploadedPhotoUrls.length).fill(null),
      ];

      // Upload selfie
      let selfieUrl = null;
      if (selfie) {
        const path = `selfies/${timestamp}_${selfie.name}`;
        const { error: selfErr } = await supabase.storage
          .from("dashboard-media")
          .upload(path, selfie, { cacheControl: "3600", upsert: false });
        if (selfErr) throw new Error(selfErr.message);

        // Correctly destructure data and error for getPublicUrl
        const { data: selfieData, error: selfieUrlErr } = supabase.storage
          .from("dashboard-media")
          .getPublicUrl(path);
        if (selfieUrlErr) throw new Error(selfieUrlErr.message);

        selfieUrl = selfieData.publicUrl;
      }

      const payload = {
        form_timestamp: timestamp,
        ...formState,
        date: timestamp,
        photo_urls: uploadedPhotoUrls,
        selfie_url: selfieUrl,
      };

      // 1) Submit the form data
      const apiRes = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Read as text once, then try JSON.parse
      const raw = await apiRes.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error("🛑 /api/submit did not return JSON:", raw);
        throw new Error("Server did not return JSON from /api/submit");
      }

      if (!apiRes.ok) {
        throw new Error(data.error || "Submission failed");
      }

      // 2) Now that submit succeeded, notify everyone
      const { error: notifError } = await supabase.functions.invoke(
        "submit-notifs",
        {
          body: { name: formState.name || "Someone" },
        }
      );

      if (notifError) {
        console.error("⚠️ Notification error:", notifError.message);
        // nonfatal: we still consider the form submitted
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function DropzoneArea({
    onDrop,
    maxFiles = 5,
    selfie = null,
    setSelfie = null,
    label = "Drag & drop or click to upload",
    disabled = false,
    currentCount = 0,
  }) {
    const isMaxed = currentCount >= maxFiles;

    // 📸 Selfie mode preview
    if (selfie && setSelfie) {
      return (
        <div className="relative w-24 h-24 mb-4">
          <img
            src={URL.createObjectURL(selfie)}
            className="object-cover w-full h-full rounded border"
            alt="Selfie preview"
          />
          <button
            type="button"
            onClick={() => removePhoto(idx)}
            className="absolute top-0 right-0 bg-white text-red-600 rounded-bl p-1"
            title="Remove"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // 🖼️ Normal drag-drop upload area
    return (
      <div
        {...getRootProps()}
        className={`border-dashed border-2 rounded p-6 text-center cursor-pointer transition 
          ${
            isMaxed
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-gray-400 hover:bg-gray-100"
          }
          ${isDragActive ? "bg-indigo-100 border-indigo-500" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-600">
          {isMaxed
            ? `You’ve uploaded the maximum of ${maxFiles} image${
                maxFiles > 1 ? "s" : ""
              }`
            : isDragActive
              ? "Drop image(s) here..."
              : label}
        </p>
      </div>
    );
  }

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
          {/* Photo Upload Area */}
          <div className="mb-4">
            <span className="block text-gray-700 mb-2">
              Upload up to 5 photos
            </span>
            <div
              {...getPhotoRootProps()}
              className={`
          border-dashed border-2 rounded p-6 text-center cursor-pointer transition
          ${isPhotoDragActive ? "bg-indigo-100 border-indigo-500" : "border-gray-400 hover:bg-gray-100"}
        `}
            >
              <input {...getPhotoInputProps()} />
              <p className="text-sm text-gray-600">
                {isPhotoDragActive
                  ? "Drop images here…"
                  : `Drag & drop or click to upload (${photos.length}/5)`}
              </p>
            </div>
          </div>

          {/* Reorderable Photo Previews */}
          <DragDropContext onDragEnd={handleReorder}>
            <Droppable droppableId="photo-list" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-2 mb-4 overflow-x-auto"
                >
                  {photos.map((file, idx) => (
                    <Draggable
                      key={idx}
                      draggableId={`photo-${idx}`}
                      index={idx}
                    >
                      {(dragProps) => (
                        <div
                          ref={dragProps.innerRef}
                          {...dragProps.draggableProps}
                          {...dragProps.dragHandleProps}
                          className="relative w-20 h-20 rounded overflow-hidden border"
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`preview-${idx}`}
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              removePhoto(idx);
                            }}
                            className="absolute top-0 right-0 bg-white text-red-600 rounded-bl p-1"
                            title="Remove"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Selfie Upload Area */}
          <label className="block mb-2 text-gray-700">Upload Selfie</label>
          <div
            {...getSelfieRootProps()}
            className={`
        border-dashed border-2 rounded p-6 text-center cursor-pointer transition
        ${isSelfieDragActive ? "bg-indigo-100 border-indigo-500" : "border-gray-400 hover:bg-gray-100"}
      `}
          >
            <input {...getSelfieInputProps()} />
            {selfie ? (
              <div className="relative inline-block w-24 h-24 mx-auto">
                <img
                  src={URL.createObjectURL(selfie)}
                  alt="Selfie preview"
                  className="object-cover w-full h-full rounded border"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelfie(null);
                  }}
                  className="absolute top-0 right-0 bg-white text-red-600 rounded-bl p-1"
                  title="Remove"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {isSelfieDragActive
                  ? "Drop your selfie here…"
                  : "Drag & drop or click to upload your selfie"}
              </p>
            )}
          </div>
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
