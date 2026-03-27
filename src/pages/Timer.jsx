import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, RotateCcw, Clock, Target, PlusCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

const POMODORO_MODES = {
  FREE: { id: 'FREE', name: 'Serbest Çalışma', duration: 0, break: 0 },
  POMO_25: { id: 'POMO_25', name: 'Pomodoro (25dk Çalış, 5dk Mola)', duration: 25 * 60, break: 5 * 60 },
  POMO_50: { id: 'POMO_50', name: 'Uzun Pomodoro (50dk Çalış, 10dk Mola)', duration: 50 * 60, break: 10 * 60 },
};

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TimerPage() {
  const [searchParams] = useSearchParams();
  const initCourseId = searchParams.get('course') || '';

  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const [selectedCourseId, setSelectedCourseId] = useState(initCourseId);
  const [timerMode, setTimerMode] = useState('FREE'); // FREE, POMO_25, POMO_50

  const [elapsed, setElapsed] = useState(0); // If Free, tracks total. If Pomo, tracks elapsed within phase
  const [sessionTotalTime, setSessionTotalTime] = useState(0); // Total time studied across all phases (only work time)

  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('WORK'); // WORK or BREAK (only applies if not FREE)
  const [startTime, setStartTime] = useState(null);
  const [savedMessage, setSavedMessage] = useState('');

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Create audio context only when needed to bypass browser autoplay rules
    audioRef.current = new Audio('/sounds/alert.mp3');
  }, []);

  const playAlert = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play disabled by browser:', e));
    }
  };

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));
  const currentMode = POMODORO_MODES[timerMode];

  // Document Title Effect
  useEffect(() => {
    if (!isRunning && elapsed === 0) {
      document.title = 'StudyTracker - Zamanlayıcı';
      return;
    }

    if (timerMode === 'FREE') {
      document.title = `${formatTime(elapsed)} | ${selectedCourse?.name || 'Zamanlayıcı'}`;
    } else {
      const remaining = Math.max(0, (phase === 'WORK' ? currentMode.duration : currentMode.break) - elapsed);
      const phaseIcon = phase === 'WORK' ? '👨‍💻' : '☕';
      document.title = `${phaseIcon} ${formatTime(remaining)} | ${selectedCourse?.name || ''}`;
    }
  }, [elapsed, isRunning, timerMode, phase, selectedCourse, currentMode]);

  const tick = useCallback(() => {
    setElapsed((prev) => {
      const next = prev + 1;

      // Handle Pomodoro transition logic inside setState to use exact values
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
            return 0; // Auto-start next work phase or stop? Let's auto-continue for flow
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

  const handleStop = async () => {
    const finalTotal = sessionTotalTime + (phase === 'WORK' && timerMode !== 'FREE' ? elapsed : (timerMode === 'FREE' ? elapsed : 0));

    if (finalTotal < 10) {
      handleReset();
      return;
    }

    setIsRunning(false);

    await db.studySessions.add({
      courseId: Number(selectedCourseId),
      duration: finalTotal, // Save ONLY work duration
      startedAt: startTime,
      endedAt: new Date().toISOString(),
    });

    setSavedMessage(`${selectedCourse?.name} — ${formatTime(finalTotal)} çalışma kaydedildi.`);
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

  const addOneHourTest = () => {
    if (timerMode === 'FREE') {
      setElapsed(prev => prev + 3600);
    } else {
      // Just visually fast forward through a phase for testing
      setElapsed(prev => prev + 60);
    }
  };

  // UI Calculation
  const isBreak = phase === 'BREAK';
  const showCountdown = timerMode !== 'FREE';
  const targetTime = showCountdown ? (isBreak ? currentMode.break : currentMode.duration) : 3600 * 12; // Free mode fills up over 12 hours

  const displayTime = showCountdown ? Math.max(0, targetTime - elapsed) : elapsed;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;

  const progressPercent = showCountdown ? (elapsed / targetTime) : (Math.min(elapsed, targetTime) / targetTime);
  const dashOffset = showCountdown
    ? circumference * progressPercent
    : circumference * (1 - progressPercent);

  const ringColor = isBreak
    ? 'oklch(0.7 0.15 140)' // Green for break 
    : (selectedCourse?.color || 'var(--primary)');

  const IconComp = Icons[selectedCourse?.icon || 'Book'] || Icons.Book;

  return (
    <div className="space-y-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Zamanlayıcı</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Odaklanın ve akademik hedeflerinize ulaşın
          </p>
        </div>

        {/* DEV Test Button */}
        <Button size="sm" variant="outline" className="opacity-50 hover:opacity-100 gap-1 transition-all active:scale-95" onClick={addOneHourTest}>
          <PlusCircle className="h-3.5 w-3.5" /> Test: +Süre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">

        {/* Left Col - Settings */}
        <div className="md:col-span-4 space-y-4">
          <Card className="glass-card border-0 shadow-sm h-full">
            <CardContent className="pt-6 space-y-6">
              {/* Course Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Çalışılacak Ders</Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  disabled={isRunning || elapsed > 0}
                >
                  <SelectTrigger className="w-full h-12 bg-background border-border/50 focus-visible:ring-primary shadow-sm font-medium">
                    <SelectValue placeholder="Bir ders seçin...">
                      {selectedCourseId && selectedCourse ? (
                         <div className="flex items-center gap-2.5">
                           <IconComp className="h-4 w-4" style={{ color: selectedCourse.color }} />
                           <span>{selectedCourse.name}</span>
                         </div>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <SelectItem value="empty" disabled>Ders bulunamadı</SelectItem>
                    ) : (
                      courses.map((course) => {
                        const CIcon = Icons[course.icon || 'Book'] || Icons.Book;
                        return (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            <span className="flex items-center gap-2.5 font-medium">
                              <CIcon className="h-4 w-4" style={{ color: course.color }} />
                              <span>{course.name}</span>
                            </span>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Çalışma Modu</Label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(POMODORO_MODES).map(mode => (
                    <button
                      key={mode.id}
                      disabled={isRunning || elapsed > 0}
                      className={`text-left border rounded-lg p-3 transition-colors ${timerMode === mode.id
                          ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                          : 'bg-background border-border/50 hover:border-border cursor-pointer disabled:opacity-50'
                        }`}
                      onClick={() => setTimerMode(mode.id)}
                    >
                      <div className="flex items-center gap-2">
                        {mode.id === 'FREE' ? <Clock className={`h-4 w-4 ${timerMode === mode.id ? 'text-primary' : 'text-muted-foreground'}`} /> : <Target className={`h-4 w-4 ${timerMode === mode.id ? 'text-primary' : 'text-muted-foreground'}`} />}
                        <span className={`text-sm font-semibold ${timerMode === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {isBreak && showCountdown && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-bold text-center mt-auto">
                  ☕ Mola Zamanı
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Timer Visual */}
        <div className="md:col-span-8">
          <Card className="glass-card border-0 shadow-sm h-full flex items-center justify-center py-10">
            <CardContent className="flex flex-col items-center justify-center p-0 flex-1 w-full relative">

              {/* SVG Ring */}
              <div className="relative flex items-center justify-center">
                <svg width="340" height="340" viewBox="0 0 340 340" className="transform -rotate-90 scale-90 sm:scale-100">
                  {/* Track */}
                  <circle cx="170" cy="170" r={radius} fill="none" stroke="currentColor" className="text-secondary opacity-50" strokeWidth="10" />
                  {/* Progress */}
                  <motion.circle
                    cx="170" cy="170" r={radius} fill="none"
                    stroke={ringColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    initial={false}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                    style={{ filter: isRunning ? `drop-shadow(0 0 10px ${ringColor}40)` : 'none' }}
                  />
                </svg>

                {/* Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center mb-2">
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={displayTime}
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`text-6xl sm:text-7xl font-sans font-bold tracking-tighter tabular-nums ${isBreak ? 'text-emerald-500/90' : 'text-foreground'}`}
                    >
                      {formatTime(displayTime)}
                    </motion.div>
                  </AnimatePresence>

                  {selectedCourse && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mt-4 text-muted-foreground">
                      <IconComp className="h-4 w-4" style={{ color: selectedCourse.color }} />
                      <span className="text-sm font-bold">{selectedCourse.name}</span>
                    </motion.div>
                  )}

                  {/* Total Work Indicator if in Pomodoro */}
                  {showCountdown && sessionTotalTime > 0 && (
                    <div className="mt-2 text-xs font-semibold text-primary/70 bg-primary/5 px-2 py-0.5 rounded-md">
                      Toplam Odak: {formatTime(sessionTotalTime)}
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 mt-8 sm:mt-12">
                {!isRunning ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="h-16 w-16 rounded-full p-0 shadow-lg glow-primary" onClick={handleStart} disabled={!selectedCourseId}>
                      <Play className="h-7 w-7 ml-1" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" variant="secondary" className="h-16 w-16 rounded-full p-0 shadow-sm border border-border" onClick={handlePause}>
                      <Pause className="h-7 w-7 text-foreground/80" />
                    </Button>
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="destructive" className="h-14 w-14 rounded-full p-0 shadow-sm" onClick={handleStop} disabled={elapsed === 0 && sessionTotalTime === 0}>
                    <Square className="h-5 w-5" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" className="h-14 w-14 rounded-full p-0 shadow-sm bg-background border-border" onClick={() => handleReset(false)} disabled={elapsed === 0 && !isRunning && sessionTotalTime === 0}>
                    <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </motion.div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* Saved message */}
      <AnimatePresence>
        {savedMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 w-full max-w-sm left-1/2 -translate-x-1/2 flex items-center justify-center p-4"
          >
            <div className="bg-emerald-500 text-white shadow-xl rounded-xl px-5 py-3 font-semibold text-sm flex items-center gap-2">
              ✅ {savedMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
