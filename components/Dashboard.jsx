import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

// Carousel with controls and fullscreen resizing
export function Carousel({ items }) {
  const [index, setIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  const delay = 5000;

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    setRotation(0);
    timeoutRef.current = setTimeout(() => handleNext(), delay);
    return () => clearTimeout(timeoutRef.current);
  }, [index, items.length]);

  useEffect(() => {
    const changeHandler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changeHandler);
    return () =>
      document.removeEventListener("fullscreenchange", changeHandler);
  }, []);

  if (!items.length) return null;

  const handlePrev = () =>
    setIndex((i) => (i - 1 + items.length) % items.length);
  const handleNext = () => setIndex((i) => (i + 1) % items.length);
  const rotate = () => setRotation((r) => r + 90);
  const download = (src) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = src.split("/").pop() || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const { src } = items[index];
  const slideHeight = isFullscreen
    ? "h-screen"
    : "h-[70vh] sm:h-[50vh] md:h-[70vh]";

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen ? "h-screen" : "overflow-hidden"
      } rounded-lg mb-4 bg-black`}
    >
      <div
        className="flex transition-transform"
        style={{ transform: `translateX(${-index * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`w-full flex-shrink-0 ${slideHeight} flex items-center justify-center bg-gray-100 relative`}
          >
            <img
              src={item.src}
              alt={`Slide ${idx + 1}`}
              className="max-w-full max-h-full object-contain"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => {
          clearTimeout(timeoutRef.current);
          handlePrev();
        }}
        className="absolute top-1/2 left-2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded z-10"
      >
        ◀️
      </button>
      <button
        onClick={() => {
          clearTimeout(timeoutRef.current);
          handleNext();
        }}
        className="absolute top-1/2 right-2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded z-10"
      >
        ▶️
      </button>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex space-x-1 z-10">
        <button onClick={rotate} className="p-1 bg-white bg-opacity-75 rounded">
          🔄
        </button>
        <button
          onClick={fullscreen}
          className="p-1 bg-white bg-opacity-75 rounded"
        >
          {isFullscreen ? "❎" : "⏹️"}
        </button>
        <button
          onClick={() => download(src)}
          className="p-1 bg-white bg-opacity-75 rounded"
        >
          ⬇️
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              clearTimeout(timeoutRef.current);
              setIndex(idx);
            }}
            className={`w-2 h-2 rounded-full ${
              idx === index ? "bg-gray-800" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry }) {
  const memLong = entry.memory?.length > 80;
  const stoLong = entry.story?.length > 80;
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex flex-col">
      <h3 className="text-lg font-semibold mb-1 text-black">
        {entry.short_desc}
      </h3>
      <p className="text-xs text-gray-500 mb-2">
        {entry.location} • {entry.date?.split("T")[0]}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 text-gray-950">
        <div
          className={`bg-gray-50 p-2 rounded ${memLong ? "md:col-span-2" : ""}`}
        >
          📝 {entry.memory}
        </div>
        {entry.story && (
          <div
            className={`bg-gray-50 p-2 rounded ${
              stoLong ? "md:col-span-2" : ""
            }`}
          >
            📖 {entry.story}
          </div>
        )}
        {entry.recommendation && (
          <div className="bg-gray-50 p-2 rounded md:col-span-2">
            <p className="italic text-gray-600 text-sm">
              🎧 {entry.recommendation}
            </p>
          </div>
        )}
      </div>
      {entry.message && (
        <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-gray-600 text-sm">
          “{entry.message}”
        </blockquote>
      )}
    </div>
  );
}

// Main Dashboard

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenImg, setFullscreenImg] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setEntries(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-2 text-center text-sm">Loading...</div>;

  // Top-level carousel
  const allPhotos = entries.flatMap((e) =>
    (e.photo_urls || []).map((src) => ({ src }))
  );

  // Group by user
  const grouped = entries.reduce((acc, e) => {
    const key = e.name || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  // Combine lengths for sorting
  const calcSize = (e) =>
    (e.memory?.length || 0) +
    (e.story?.length || 0) +
    (e.recommendation?.length || 0) +
    (e.message?.length || 0);

  // Helper: decide thumbnail click behavior
  const handleThumbClick = (src) => {
    if ("ontouchstart" in window) {
      // On touch devices, open in new tab
      window.open(src, "_blank");
    } else {
      // On desktop, show fullscreen overlay
      setFullscreenImg(src);
    }
  };

  return (
    <div className="w-full p-4 bg-gray-50">
      <Carousel items={allPhotos} />

      {fullscreenImg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setFullscreenImg(null)}
        >
          <img
            src={fullscreenImg}
            alt="FullScreen"
            className="max-w-full max-h-full"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(grouped).map(([name, items]) => {
          const selfieUrl = items[0]?.selfie_url;
          const userPhotos = items.flatMap((e) => e.photo_urls || []);
          const sorted = items.sort((a, b) => calcSize(a) - calcSize(b));

          return (
            <section key={name} className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center mb-2">
                {selfieUrl && (
                  <img
                    src={selfieUrl}
                    alt={`${name}`}
                    className="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white"
                  />
                )}
                <h2 className="text-xl font-semibold text-black">{name}</h2>
              </div>

              {/* Stacked thumbnails */}
              <div className="flex space-x-2 overflow-x-auto mb-4 pb-2">
                {userPhotos.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`thumb-${idx}`}
                    onClick={() => handleThumbClick(src)}
                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-75"
                  />
                ))}
              </div>

              <div className="grid grid-flow-row-dense gap-4">
                {sorted.map((e, i) => (
                  <EntryCard key={i} entry={e} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
