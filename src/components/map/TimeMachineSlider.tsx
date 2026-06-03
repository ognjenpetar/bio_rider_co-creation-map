import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Location } from '../../types';

interface TimeMachineSliderProps {
  locations: Location[];
  visible: boolean;
  onFilteredLocationsChange: (filtered: Location[]) => void;
  onClose: () => void;
}

export function TimeMachineSlider({
  locations,
  visible,
  onFilteredLocationsChange,
  onClose,
}: TimeMachineSliderProps) {
  // Sort all locations by creation date ascending — playback order
  const sorted = useMemo(
    () => [...locations].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [locations]
  );

  // 0 = empty map, N = all N locations shown
  const [count, setCount] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // When Time Machine opens, start from empty map
  useEffect(() => {
    if (visible) {
      setCount(0);
      onFilteredLocationsChange([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Propagate filtered list whenever count changes
  useEffect(() => {
    onFilteredLocationsChange(sorted.slice(0, count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, sorted]);

  function stopPlayback() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPlaying(false);
  }

  function handleSlide(value: number) {
    stopPlayback();
    setCount(value);
  }

  function togglePlay() {
    if (playing) { stopPlayback(); return; }
    let current = count >= sorted.length ? 0 : count;
    setCount(current);
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      current += 1;
      setCount(current);
      if (current >= sorted.length) stopPlayback();
    }, 700);
  }

  useEffect(() => () => stopPlayback(), []);

  const currentLocation = sorted[count - 1];
  const dateLabel = currentLocation
    ? new Date(currentLocation.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-6 py-4 min-w-[360px] max-w-[90vw]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">Vremenska mašina</span>
          </div>
          <button onClick={() => { stopPlayback(); onClose(); }} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Counter + date */}
        <div className="text-center mb-3">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-2xl font-bold text-purple-700">{count}</span>
            <span className="text-sm text-gray-400">/ {sorted.length} lokacija</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 h-4">
            {count === 0 ? 'Prazna mapa — pomeri klizač da dodaješ lokacije' : `Poslednja: ${dateLabel}`}
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={sorted.length}
          value={count}
          onChange={e => handleSlide(Number(e.target.value))}
          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600 mb-1"
        />
        <div className="flex justify-between text-xs text-gray-400 mb-3">
          <span>Prazno</span>
          <span>Sve ({sorted.length})</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => handleSlide(0)}
            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            title="Na početak (prazna mapa)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              playing ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            {playing ? (
              <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pauza</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>Reprodukuj</>
            )}
          </button>

          <button
            onClick={() => handleSlide(sorted.length)}
            className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
            title="Na kraj (sve lokacije)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8z"/><rect x="16" y="6" width="2" height="12"/>
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
