import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Trophy, Clock, Target, CalendarDays, TrendingUp } from 'lucide-react';
import * as Icons from 'lucide-react';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

export default function Statistics() {
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const sessions = useLiveQuery(() => db.studySessions.toArray()) || [];
  const plans = useLiveQuery(() => db.studyPlans.toArray()) || [];

  // 1. Overall Stats
  const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalSessions = sessions.length;
  const completedPlansCount = plans.filter(p => p.completed).length;
  const totalPlansCount = plans.length;
  const planCompletionRate = totalPlansCount > 0 ? Math.round((completedPlansCount / totalPlansCount) * 100) : 0;

  // 2. Last 7 Days Trend
  const today = new Date();
  const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });
  
  const dailyData = last7Days.map(date => {
    const daySessions = sessions.filter(s => {
      try { return isSameDay(parseISO(s.startedAt), date); } catch { return false; }
    });
    const duration = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return {
      date,
      label: format(date, 'EEE', { locale: tr }),
      duration,
    };
  });

  const maxDailyDuration = Math.max(...dailyData.map(d => d.duration), 1);

  // 3. Leaderboard (Course rankings)
  const courseStats = courses.map(course => {
    const courseSessions = sessions.filter(s => s.courseId === course.id);
    const duration = courseSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return { ...course, totalDuration: duration, sessionCount: courseSessions.length };
  }).sort((a, b) => b.totalDuration - a.totalDuration);

  const maxCourseDuration = Math.max(...courseStats.map(c => c.totalDuration), 1);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">İstatistikler</h1>
        <p className="text-muted-foreground text-sm mt-1 font-medium">Akademik performansınızın detaylı analizi</p>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
            <Card className="glass-card border-0 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                    <Clock className="h-32 w-32" />
                </div>
                <CardContent className="p-6 relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                        <Clock className="h-5 w-5" /> Toplam Süre
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight">{formatDuration(totalStudyTime)}</div>
                    <div className="text-sm text-muted-foreground font-medium mt-1">{totalSessions} oturum tamamlandı</div>
                </CardContent>
            </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
            <Card className="glass-card border-0 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none text-emerald-500">
                    <Target className="h-32 w-32" />
                </div>
                <CardContent className="p-6 relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-2">
                        <Target className="h-5 w-5" /> Plan Başarısı
                    </div>
                    <div className="text-4xl font-extrabold tracking-tight text-emerald-600">%{planCompletionRate}</div>
                    <div className="text-sm tracking-wide text-muted-foreground font-medium mt-1">{completedPlansCount} / {totalPlansCount} görev tamamlandı</div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="glass-card border-0 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none text-orange-500">
                    <Trophy className="h-32 w-32" />
                </div>
                <CardContent className="p-6 relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-orange-500 font-semibold mb-2">
                        <Trophy className="h-5 w-5" /> En Yoğun Ders
                    </div>
                    <div className="text-2xl mt-1 font-bold tracking-tight text-foreground truncate">{courseStats[0]?.name || '-'}</div>
                    <div className="text-sm text-muted-foreground font-medium mt-2">{courseStats[0] ? formatDuration(courseStats[0].totalDuration) : '0s 0dk'} rekor çalışma</div>
                </CardContent>
            </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7 Day Trend Line */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-0 shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Son 7 Gün Aktivitesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] flex items-end gap-2 sm:gap-4 mt-4">
                {dailyData.map((day, i) => {
                  const height = maxDailyDuration > 0 ? (day.duration / maxDailyDuration) * 100 : 0;
                  const isToday = i === dailyData.length - 1;
                  return (
                    <div key={day.label} className="flex-1 flex flex-col items-center gap-3">
                      <div className="text-xs font-semibold text-muted-foreground tooltip-trigger h-4">
                        {day.duration > 0 ? formatDuration(day.duration) : ''}
                      </div>
                      <div className="w-full bg-secondary rounded-t-lg relative flex-1 flex items-end">
                        <motion.div
                          className={`w-full rounded-t-lg shadow-sm ${isToday ? 'bg-primary' : 'bg-primary/50'}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <span className={`text-xs uppercase tracking-wider font-bold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard */}
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-0 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpenIcon className="h-4 w-4 text-primary" /> Ders Sıralaması
              </CardTitle>
              <CardDescription>Hangi derse daha çok vakit ayırdınız?</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2 space-y-5">
              {courseStats.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-sm font-medium text-muted-foreground">Kayıtlı veri yok.</div>
              ) : (
                courseStats.map((course, index) => {
                  const percentage = maxCourseDuration > 0 ? (course.totalDuration / maxCourseDuration) * 100 : 0;
                  const IconComp = Icons[course.icon || 'Book'] || Icons.Book;
                  return (
                    <div key={course.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 w-[65%]">
                          <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${index < 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                            {index + 1}
                          </span>
                          <div className="flex items-center gap-2 min-w-0">
                              <IconComp className="h-4 w-4 shrink-0" style={{ color: course.color || 'var(--primary)' }} />
                              <span className="font-semibold text-sm truncate">{course.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="text-muted-foreground">{course.sessionCount} otrm</span>
                          <span className="bg-secondary px-2 py-0.5 rounded-md min-w-[3.5rem] text-center">{formatDuration(course.totalDuration)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden ml-8">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: course.color || 'var(--primary)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function BookOpenIcon(props) {
  return <Icons.BookOpen {...props} />;
}
