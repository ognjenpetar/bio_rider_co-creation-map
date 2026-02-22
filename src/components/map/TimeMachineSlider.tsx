import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  // Generate month range from earliest location to now
  const monthRange = useMemo(() => {
    if (locations.length === 0) return [];
    const dates = locations.map(l => new Date(l.created_at));
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    earliest.setDate(1);
    const now = new Date();
    now.setDate(1);

    const months: Date[] = [];
    const current = new Date(earliest);
    while (current <= now) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    if (months.length === 0) months.push(new Date());
    return months;
  }, [locations]);

  const [sliderValue, setSliderValue] = useState(monthRange.length - 1);

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (monthRange[value]) {
      const selectedMonth = monthRange[value];
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);
      const filtered = locations.filter(l => new Date(l.created_at) <= endOfMonth);
      onFilteredLocationsChange(filtered);
    }
  };

  const currentMonth = monthRange[sliderValue];
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const filteredCount = useMemo(() => {
    if (!currentMonth) return locations.length;
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    return locations.filter(l => new Date(l.created_at) <= endOfMonth).length;
  }, [locations, currentMonth]);

  if (!visible || monthRange.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-6 py-4 min-w-[350px]"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">{t('timeMachine.title')}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-2">
          <span className="text-lg font-bold text-purple-700">
            {currentMonth ? formatMonth(currentMonth) : ''}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            ({filteredCount} {t('timeMachine.locations')})
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={monthRange.length - 1}
          value={sliderValue}
          onChange={e => handleSliderChange(Number(e.target.value))}
          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />

        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{monthRange[0] ? formatMonth(monthRange[0]) : ''}</span>
          <span>{monthRange[monthRange.length - 1] ? formatMonth(monthRange[monthRange.length - 1]) : ''}</span>
        </div>

        {/* Play animation button */}
        <div className="flex justify-center mt-2">
          <PlayButton
            monthRange={monthRange}
            onStep={handleSliderChange}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function PlayButton({
  monthRange,
  onStep,
}: {
  monthRange: Date[];
  onStep: (value: number) => void;
}) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    let i = 0;
    const interval = setInterval(() => {
      onStep(i);
      i++;
      if (i >= monthRange.length) {
        clearInterval(interval);
        setPlaying(false);
      }
    }, 800);
  };

  return (
    <button
      onClick={handlePlay}
      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
    >
      {playing ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          {t('timeMachine.pause')}
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {t('timeMachine.play')}
        </>
      )}
    </button>
  );
}
