import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/db/db';

const TimerContext = createContext();

export const POMODORO_MODES = {
  FREE: { id: 'FREE', name: 'Serbest Çalışma', duration: 0, break: 0 },
  POMO_25: { id: 'POMO_25', name: 'Pomodoro (25dk Çalış, 5dk Mola)', duration: 25 * 60, break: 5 * 60 },
  POMO_50: { id: 'POMO_50', name: 'Uzun Pomodoro (50dk Çalış, 10dk Mola)', duration: 50 * 60, break: 10 * 60 },
};

export function TimerProvider({ children }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [timerMode, setTimerMode] = useState('FREE');
  const [elapsed, setElapsed] = useState(0);
  const [sessionTotalTime, setSessionTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('WORK');
  const [startTime, setStartTime] = useState(null);
  const [savedMessage, setSavedMessage] = useState('');

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/alert.mp3');
  }, []);

  const playAlert = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play disabled by browser:', e));
    }
  };

  const currentMode = POMODORO_MODES[timerMode];

  const tick = useCallback(() => {
    setElapsed((prev) => {
      const next = prev + 1;

      if (timerMode !== 'FREE') {
        const limit = phase === 'WORK' ? currentMode.duration : currentMode.break;
        if (next >= limit) {
          playAlert();
          if (phase === 'WORK') {
            setSessionTotalTime(total => total + limit);
            setPhase('BREAK');
            return 0;
          } else {
            setPhase('WORK');
            return 0;
          }
        }
      } else {
        if (phase === 'WORK') setSessionTotalTime(t => t + 1);
      }
      return next;
    });
  }, [timerMode, phase, currentMode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, tick]);

  const handleStart = () => {
    if (!selectedCourseId) return;
    if (elapsed === 0 && sessionTotalTime === 0) {
      setStartTime(new Date().toISOString());
    }
    setIsRunning(true);
    setSavedMessage('');
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async (courseName) => {
    const finalTotal = sessionTotalTime + (phase === 'WORK' && timerMode !== 'FREE' ? elapsed : (timerMode === 'FREE' ? elapsed : 0));

    if (finalTotal < 10) {
      handleReset();
      return;
    }

    setIsRunning(false);

    await db.studySessions.add({
      courseId: Number(selectedCourseId),
      duration: finalTotal,
      startedAt: startTime,
      endedAt: new Date().toISOString(),
    });

    setSavedMessage(`${courseName} — ${formatTime(finalTotal)} çalışma kaydedildi.`);
    handleReset(true);
  };

  const handleReset = (keepMessage = false) => {
    setIsRunning(false);
    setElapsed(0);
    setSessionTotalTime(0);
    setStartTime(null);
    setPhase('WORK');
    if (!keepMessage) setSavedMessage('');
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const value = {
    selectedCourseId, setSelectedCourseId,
    timerMode, setTimerMode,
    elapsed, setElapsed,
    sessionTotalTime, setSessionTotalTime,
    isRunning, setIsRunning,
    phase, setPhase,
    startTime, setStartTime,
    savedMessage, setSavedMessage,
    handleStart, handlePause, handleStop, handleReset,
    formatTime,
    currentMode,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
