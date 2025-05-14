import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

// LazyImage: loads src only when near viewport
function LazyImage({
  src,
  alt,
  loading,
  decoding,
  fetchPriority,
  className,
  style,
  onClick,
}) {
  const imgRef = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={visible ? src : undefined}
      data-src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      style={style}
      onClick={onClick}
    />
  );
}

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
    timeoutRef.current = setTimeout(handleNext, delay);
    return () => clearTimeout(timeoutRef.current);
  }, [index, items.length]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!items.length) return null;

  const handlePrev = () =>
    setIndex((i) => (i - 1 + items.length) % items.length);
  const handleNext = () => setIndex((i) => (i + 1) % items.length);
  const rotateImg = () => setRotation((r) => r + 90);
  const downloadImg = (src) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = src.split("/").pop() || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const slideHeight = isFullscreen ? "h-screen" : "h-[70vh]";

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen ? "h-screen" : "overflow-hidden"
      } rounded-lg mb-4 bg-black`}
    >
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(${-index * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`w-full flex-shrink-0 ${slideHeight} flex items-center justify-center bg-gray-100 relative`}
          >
            <LazyImage
              src={item.full}
              alt={`Slide ${idx + 1}`}
              loading={idx === index ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={idx === index ? "high" : "low"}
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
        className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded z-10"
      >
        ◀️
      </button>
      <button
        onClick={() => {
          clearTimeout(timeoutRef.current);
          handleNext();
        }}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded z-10"
      >
        ▶️
      </button>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex space-x-1 z-10">
        <button
          onClick={rotateImg}
          className="p-1 bg-white bg-opacity-75 rounded"
        >
          🔄
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1 bg-white bg-opacity-75 rounded"
        >
          {isFullscreen ? "❎" : "⏹️"}
        </button>
        <button
          onClick={() => downloadImg(items[index].full)}
          className="p-1 bg-white bg-opacity-75 rounded"
        >
          ⬇️
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
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

// Skeleton placeholders
const SkeletonCarousel = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg mb-4 w-full h-[70vh]"></div>
);
const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-lg shadow p-4 min-h-64">
    <div className="flex space-x-2 mb-4 w-1/3">
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      <div className="h-6 bg-gray-200 rounded flex-1"></div>
    </div>
    <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

// Entry card layout
function EntryCard({ entry }) {
  const memClass = `bg-gray-50 p-2 rounded ${
    entry.memory?.length > 80 ? "md:col-span-2" : ""
  }`;
  const stoClass = `bg-gray-50 p-2 rounded ${
    entry.story?.length > 80 ? "md:col-span-2" : ""
  }`;
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition flex flex-col min-h-64">
      <h3 className="text-lg font-semibold mb-1 text-black">
        {entry.short_desc}
      </h3>
      <p className="text-xs text-gray-500 mb-2">
        {entry.location} • {entry.date?.split("T")[0]}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        <div className={memClass}>
          <p className="text-gray-800 text-sm">📝 {entry.memory}</p>
        </div>
        {entry.story && (
          <div className={stoClass}>
            <p className="text-gray-800 text-sm">📖 {entry.story}</p>
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

// Dashboard component
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

  if (loading) {
    return (
      <div className="w-full p-4 bg-gray-50">
        <SkeletonCarousel />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      </div>
    );
  }

  // Global carousel
  const carouselItems = entries.flatMap((e) =>
    (e.photo_urls || []).map((src) => ({ full: src }))
  );

  // Group by person
  const grouped = entries.reduce((acc, e) => {
    const key = e.name || "Unknown";
    acc[key] = acc[key] || [];
    acc[key].push(e);
    return acc;
  }, {});

  const handleThumbClick = (full) => {
    if ("ontouchstart" in window) window.open(full, "_blank");
    else setFullscreenImg(full);
  };

  return (
    <div className="w-full p-4 bg-gray-50">
      <Carousel items={carouselItems} />

      {fullscreenImg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setFullscreenImg(null)}
        >
          <LazyImage
            src={fullscreenImg}
            alt="Fullscreen"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="max-w-full max-h-full"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.entries(grouped).map(([name, items]) => {
          const personPhotos = items.flatMap((e) =>
            (e.photo_urls || []).map((src) => ({
              thumb: src.replace("/upload/", "/upload/w_200,h_200,c_fill/"),
              full: src,
            }))
          );

          return (
            <section key={name} className="bg-white rounded-lg p-4 shadow">
              <header className="flex items-center mb-2">
                {items[0]?.selfie_url && (
                  <LazyImage
                    src={items[0].selfie_url}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white"
                  />
                )}
                <h2 className="text-xl font-semibold text-black">{name}</h2>
              </header>

              <div className="flex space-x-2 overflow-x-auto mb-4 pb-2">
                {personPhotos.map((p, idx) => (
                  <LazyImage
                    key={idx}
                    src={p.thumb}
                    alt={`thumb-${idx}`}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onClick={() => handleThumbClick(p.full)}
                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-75"
                  />
                ))}
              </div>

              <div className="grid grid-flow-row-dense gap-4">
                {items.map((e, i) => (
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
