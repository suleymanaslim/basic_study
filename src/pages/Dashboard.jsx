import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Timer, TrendingUp, CalendarDays, Play, ArrowRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const sessions = useLiveQuery(() => db.studySessions.toArray()) || [];
  const plans = useLiveQuery(() => db.studyPlans.toArray()) || [];

  const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const todaySessions = sessions.filter((s) => {
    try { return isToday(parseISO(s.startedAt)); } catch { return false; }
  });
  const todayStudyTime = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Today's Plan
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysPlans = plans.filter(p => p.date === todayStr);

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 5);

  const courseStudyMap = {};
  sessions.forEach((s) => {
    courseStudyMap[s.courseId] = (courseStudyMap[s.courseId] || 0) + (s.duration || 0);
  });
  const maxStudyTime = Math.max(...Object.values(courseStudyMap), 1);

  const upcomingExams = courses
    .filter((c) => c.examDate && differenceInDays(parseISO(c.examDate), new Date()) >= 0)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
    .slice(0, 4);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  const getUrgencyBadge = (days) => {
    if (days <= 3) return <Badge variant="destructive" className="ml-auto px-2 py-0 text-[10px] h-5">{days} gün</Badge>;
    if (days <= 7) return <Badge variant="default" className="ml-auto px-2 py-0 text-[10px] h-5">{days} gün</Badge>;
    return <Badge variant="secondary" className="ml-auto px-2 py-0 text-[10px] h-5">{days} gün</Badge>;
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Akademik Panel</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">Çalışma istatistikleriniz ve bugünün planı</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2 shadow-sm font-medium" onClick={() => navigate('/planner')}>
               <CalendarDays className="h-4 w-4" /> Haftalık Plan
            </Button>
            <Button className="gap-2 shadow-sm font-medium" onClick={() => navigate('/timer')}>
               <Play className="h-4 w-4" /> Zamanlayıcı
            </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}><StatCard title="Toplam Çalışma" value={formatDuration(totalStudyTime)} subtitle={`${sessions.length} oturum`} icon={Clock} color="primary" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Bugün" value={formatDuration(todayStudyTime)} subtitle={`${todaySessions.length} oturum`} icon={Timer} color="green" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Aktif Dersler" value={courses.length} subtitle="ders kayıtlı" icon={BookOpen} color="blue" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Yaklaşan Sınavlar" value={upcomingExams.length} subtitle="sınav bekliyor" icon={CalendarDays} color="orange" /></motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Wider focus) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Start & Today's Plan Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {/* Quick Start */}
               <Card className="glass-card border-0 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <Play className="h-32 w-32" />
                    </div>
                   <CardHeader className="pb-2">
                       <CardTitle className="text-base flex items-center gap-2 text-primary">
                           <Play className="h-4 w-4" /> Hızlı Başla
                       </CardTitle>
                       <CardDescription>Hemen çalışmaya başlayın.</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-3 relative z-10 pt-4 pb-5">
                        {courses.length === 0 ? (
                            <p className="text-xs text-muted-foreground font-medium">Önce ders eklemelisiniz.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {courses.slice(0, 4).map(course => {
                                    const IconComp = Icons[course.icon || 'Book'] || Icons.Book;
                                    return (
                                        <Button
                                            key={course.id}
                                            variant="outline"
                                            onClick={() => navigate(`/timer?course=${course.id}`)}
                                            className="h-10 justify-start px-2.5 overflow-hidden group hover:border-primary/50 transition-colors"
                                        >
                                            <IconComp className="h-3.5 w-3.5 mr-2 shrink-0 group-hover:text-primary transition-colors" style={{ color: course.color }} />
                                            <span className="truncate text-xs font-medium">{course.name}</span>
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                   </CardContent>
               </Card>

               {/* Today's Plan */}
               <Card className="glass-card border-0 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500/20" />
                   <CardHeader className="pb-2">
                       <CardTitle className="text-base flex items-center gap-2">
                           <CalendarDays className="h-4 w-4 text-blue-500" /> Bugünün Planı
                       </CardTitle>
                       <CardDescription>{format(new Date(), 'd MMMM EEEE', { locale: tr })} listesi</CardDescription>
                   </CardHeader>
                   <CardContent className="pt-2">
                       {todaysPlans.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Bugün için planlanmış dersiniz yok.</p>
                                <Button variant="secondary" size="sm" onClick={() => navigate('/planner')} className="h-8 text-xs font-medium">Plan Oluştur</Button>
                           </div>
                       ) : (
                           <div className="space-y-2">
                               {todaysPlans.map(plan => {
                                   const course = courses.find(c => c.id === plan.courseId);
                                   if (!course) return null;
                                   const IconComp = Icons[course.icon || 'Book'] || Icons.Book;
                                   return (
                                       <div key={plan.id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/40 border border-border/50">
                                            <div className="flex items-center justify-center p-1.5 rounded bg-background shadow-xs shrink-0" style={{ color: course.color }}>
                                                <IconComp className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-sm font-medium truncate flex-1">{course.name}</span>
                                            {plan.completed ? (
                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-1.5">Tamamlandı</Badge>
                                            ) : (
                                                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => navigate(`/timer?course=${course.id}`)}>
                                                    <Play className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                                </Button>
                                            )}
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                   </CardContent>
               </Card>
            </motion.div>

            {/* Per-course bar chart */}
            <motion.div variants={itemVariants}>
            <Card className="glass-card border-0 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Ders Başına Çalışma Dağılımı
                </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                {courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-medium text-center py-8">
                    Henüz ders eklenmedi.
                    </p>
                ) : (
                    courses.map((course) => {
                    const time = courseStudyMap[course.id] || 0;
                    const percentage = maxStudyTime > 0 ? (time / maxStudyTime) * 100 : 0;
                    const IconComp = Icons[course.icon || 'Book'] || Icons.Book;
                    return (
                        <div key={course.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm font-medium">
                            <IconComp className="h-4 w-4" style={{ color: course.color || 'var(--primary)' }} />
                            {course.name}
                            </span>
                            <span className="text-muted-foreground text-xs font-semibold bg-secondary px-2 py-0.5 rounded-full">
                            {formatDuration(time)}
                            </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-secondary overflow-hidden shadow-inner">
                            <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: course.color || 'var(--primary)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
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

        {/* Right Column (Sidebar focus) */}
        <div className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="glass-card border-0 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-orange-500" />
                  Yaklaşan Sınavlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-3 space-y-1">
                {upcomingExams.length === 0 ? (
                    <p className="text-xs text-muted-foreground font-medium text-center py-4">Sınav bulunmuyor.</p>
                ) : (
                    upcomingExams.map((course) => {
                    const days = differenceInDays(parseISO(course.examDate), new Date());
                    const IconComp = Icons[course.icon || 'Book'] || Icons.Book;
                    return (
                        <div
                        key={course.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/40 transition-colors"
                        >
                        <div className="flex items-center justify-center p-1.5 rounded-md bg-secondary shrink-0" style={{ color: course.color }}>
                            <IconComp className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-foreground">{course.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{format(parseISO(course.examDate), 'd MMM yyyy', { locale: tr })}</p>
                        </div>
                        {getUrgencyBadge(days)}
                        </div>
                    );
                    })
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card border-0 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" /> Son Oturumlar
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('/stats')}>
                      <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-3 space-y-1">
                {recentSessions.length === 0 ? (
                  <p className="text-xs font-medium text-muted-foreground text-center py-6">
                    Henüz oturum yok.
                  </p>
                ) : (
                  recentSessions.map((session) => {
                    const course = courses.find((c) => c.id === session.courseId);
                    const IconComp = Icons[course?.icon || 'Book'] || Icons.Book;
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 transition-colors border border-transparent"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary shrink-0" style={{ color: course?.color || 'var(--primary)' }}>
                              <IconComp className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{course?.name || 'Silinmiş Ders'}</p>
                            <p className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
                              {format(parseISO(session.startedAt), 'd MMM HH:mm', { locale: tr })}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-foreground bg-secondary px-2 py-1 rounded-md">
                            {formatDuration(session.duration)}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
