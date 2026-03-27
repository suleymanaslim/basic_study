import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Wand2, GripVertical, CheckCircle2, Circle, GraduationCap, Lock, Unlock } from 'lucide-react';
import * as Icons from 'lucide-react';
import {
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  isToday,
  parseISO,
  differenceInDays,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DraggableCourse({ course, isOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `course-${course.id}`,
    data: { type: 'course', course },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComp = Icons[course.icon || 'Book'] || Icons.Book;
  const daysUntil = course.examDate ? differenceInDays(parseISO(course.examDate), new Date()) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 p-3 w-48 rounded-xl border bg-card hover:border-primary/50 transition-colors shadow-sm cursor-grab shrink-0 ${isOverlay ? 'shadow-xl scale-105 rotate-2 cursor-grabbing' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex items-center justify-center p-1.5 rounded-md bg-secondary shrink-0" style={{ color: course.color || 'var(--primary)' }}>
           <IconComp className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold truncate flex-1">{course.name}</p>
      </div>
      
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold pl-6 pr-1">
         {course.ects ? (
             <span className="text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">{course.ects} AKTS</span>
         ) : <span />}
         {daysUntil !== null && (
             <span className={`${daysUntil < 7 ? 'text-destructive' : 'text-primary'}`}>
                 {daysUntil >= 0 ? `${daysUntil} Gün` : 'Geçti'}
             </span>
         )}
      </div>
    </div>
  );
}

function DroppableDay({ date, plans, courses, isLocked, onToggleComplete, onDelete }) {
  const { setNodeRef, isOver } = useSortable({
    id: `day-${format(date, 'yyyy-MM-dd')}`,
    data: { type: 'day', date },
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`glass-card border-0 shadow-sm relative transition-colors h-full flex flex-col ${isOver && !isLocked ? 'ring-2 ring-primary ring-offset-2' : ''} ${isLocked ? 'opacity-95' : ''}`}
    >
      {isToday(date) && (
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <CalendarIcon className="h-24 w-24" />
          </div>
      )}
      <CardHeader className="p-3 border-b border-border/40 bg-secondary/20 shrink-0">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isToday(date) ? 'text-primary' : 'text-foreground'}`}>
            {format(date, 'EEEE', { locale: tr })}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isToday(date) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {format(date, 'd MMM', { locale: tr })}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 flex-1 relative z-10 flex flex-col gap-2 min-h-[140px]">
        {plans.length === 0 ? (
           <div className="flex-1 flex items-center justify-center h-full">
               <span className="text-xs font-medium text-muted-foreground/50 border border-dashed border-border/50 rounded-lg w-full py-6 text-center">
                   {isLocked ? 'Ders yok' : 'Buraya sürükle'}
               </span>
           </div>
        ) : (
          plans.map((plan) => {
            const course = courses.find((c) => c.id === plan.courseId);
            if (!course) return null;
            const IconComp = Icons[course.icon || 'Book'] || Icons.Book;

            return (
              <div 
                key={plan.id} 
                className={`group flex items-center gap-2 p-2 rounded-md border transition-all ${plan.completed ? 'bg-secondary/40 border-border/50 opacity-60' : 'bg-background border-border shadow-sm hover:border-primary/40'}`}
              >
                <button
                  onClick={() => onToggleComplete(plan)}
                  disabled={!isLocked}
                  className={`shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-colors ${!isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={!isLocked ? 'Planı oluşturmadan işaretlenemez' : 'Tamamlandı olarak işaretle'}
                >
                  {plan.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                  )}
                </button>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                   <IconComp className="h-4 w-4 shrink-0" style={{ color: course.color || 'var(--primary)' }} />
                   <span className={`text-sm font-semibold truncate ${plan.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                     {course.name}
                   </span>
                </div>

                {!isLocked && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 -mr-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => onDelete(plan.id)}>
                          <Icons.X className="h-3.5 w-3.5" />
                      </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default function Planner() {
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const plans = useLiveQuery(() => db.studyPlans.toArray()) || [];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeId, setActiveId] = useState(null);
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysInWeek = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);
  
  const weekKey = `studyTracker_lockedWeek_${format(weekStart, 'yyyy-MM-dd')}`;
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Check if the current week is locked in localStorage
    setIsLocked(localStorage.getItem(weekKey) === 'true');
  }, [weekKey]);

  const toggleLock = () => {
    const newVal = !isLocked;
    setIsLocked(newVal);
    if (newVal) {
        localStorage.setItem(weekKey, 'true');
    } else {
        localStorage.removeItem(weekKey);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const sortedCourses = useMemo(() => {
      return [...courses].sort((a, b) => {
        const dateA = a.examDate ? new Date(a.examDate).getTime() : Infinity;
        const dateB = b.examDate ? new Date(b.examDate).getTime() : Infinity;
        if (dateA !== dateB) return dateA - dateB;
        return (b.ects || 0) - (a.ects || 0);
      });
  }, [courses]);

  const handlePreviousWeek = () => setCurrentDate(subDays(currentDate, 7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

  const handleToggleComplete = async (plan) => {
    if (!isLocked) return;
    await db.studyPlans.update(plan.id, { completed: !plan.completed });
  };

  const handleDeletePlan = async (id) => {
    if (isLocked) return;
    await db.studyPlans.delete(id);
  };

  const autoGeneratePlan = async () => {
    if (courses.length === 0 || isLocked) return;

    const newPlans = [];
    let courseIndex = 0;

    for (let i = 0; i < daysInWeek.length; i++) {
        const dateStr = format(daysInWeek[i], 'yyyy-MM-dd');
        const hasPlan = plans.some(p => p.date === dateStr);
        if (hasPlan) continue;
        
        const coursesPerDay = i % 2 === 0 ? 2 : 1; 
        for (let j = 0; j < coursesPerDay; j++) {
             const course = sortedCourses[courseIndex % sortedCourses.length];
             newPlans.push({
                date: dateStr,
                courseId: course.id,
                completed: false,
             });
             courseIndex++;
        }
    }

    if (newPlans.length > 0) {
      await db.studyPlans.bulkAdd(newPlans);
    }
  };

  const handleDragStart = (event) => {
    if (isLocked) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || isLocked) return;
    
    // Dropped a course onto a day
    if (active.data.current?.type === 'course' && over.data.current?.type === 'day') {
      const course = active.data.current.course;
      const dateStr = format(over.data.current.date, 'yyyy-MM-dd');
      
      const exists = plans.some(p => p.courseId === course.id && p.date === dateStr);
      if (!exists) {
        await db.studyPlans.add({
            date: dateStr,
            courseId: course.id,
            completed: false,
        });
      }
    }
  };

  const activeCourse = activeId && activeId.startsWith('course-') 
        ? courses.find(c => `course-${c.id}` === activeId)
        : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="space-y-6 flex flex-col h-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* Header & Lock Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Haftalık Plan</h1>
            <p className="text-muted-foreground text-sm mt-1 font-medium">
              Sınav tarihine ve AKTS ağırlığına göre programınızı yapın
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/50">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handlePreviousWeek}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Bugün</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleNextWeek}><ChevronRight className="h-4 w-4" /></Button>
             </div>
             <div className="flex items-center gap-2 px-4 shadow-sm h-10 rounded-lg bg-background border border-border">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">
                  {format(weekStart, 'd MMM yyyy', { locale: tr })} — {format(weekEnd, 'd MMM yyyy', { locale: tr })}
                </span>
             </div>
             
             {isLocked ? (
                 <Button variant="outline" className="shadow-sm font-medium gap-2 text-muted-foreground" onClick={toggleLock}>
                     <Unlock className="h-4 w-4" /> Düzenle
                 </Button>
             ) : (
                 <Button className="shadow-sm font-medium gap-2" onClick={toggleLock}>
                     <Lock className="h-4 w-4" /> Planı Oluştur
                 </Button>
             )}
          </div>
        </div>

        {/* Top Section: Draggable Courses (Hidden if locked) */}
        {!isLocked && (
            <div className="border border-border/50 bg-secondary/10 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" /> Ders Havuzu
                    </h3>
                    <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold gap-1.5" onClick={autoGeneratePlan}>
                        <Wand2 className="h-3.5 w-3.5" /> Otomatik Dağıt
                    </Button>
                </div>
                
                {sortedCourses.length === 0 ? (
                    <div className="flex items-center justify-center p-6 border border-dashed border-border/60 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground">Sürüklenecek ders bulunamadı. Lütfen ders ekleyin.</p>
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        <SortableContext items={sortedCourses.map(c => `course-${c.id}`)} strategy={rectSortingStrategy}>
                            {sortedCourses.map(course => (
                                <DraggableCourse key={course.id} course={course} />
                            ))}
                        </SortableContext>
                    </div>
                )}
            </div>
        )}

        {/* Bottom Section: Calendar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 flex-1">
            <SortableContext items={daysInWeek.map(d => `day-${format(d, 'yyyy-MM-dd')}`)}>
                {daysInWeek.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayPlans = plans.filter((p) => p.date === dateStr);
                return (
                    <div key={dateStr} className="h-full">
                        <DroppableDay 
                            date={date} 
                            plans={dayPlans} 
                            courses={courses} 
                            isLocked={isLocked}
                            onToggleComplete={handleToggleComplete}
                            onDelete={handleDeletePlan}
                        />
                    </div>
                );
                })}
            </SortableContext>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeCourse ? <DraggableCourse course={activeCourse} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
