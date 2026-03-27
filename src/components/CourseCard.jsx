import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export function CourseCard({ course, onEdit, onDelete }) {
  const daysUntilExam = course.examDate
    ? differenceInDays(parseISO(course.examDate), new Date())
    : null;

  const getUrgencyColor = (days) => {
    if (days === null) return 'secondary';
    if (days <= 3) return 'destructive';
    if (days <= 7) return 'default';
    if (days <= 14) return 'secondary';
    return 'outline';
  };

  const IconComp = Icons[course.icon || 'Book'] || Icons.Book;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <Card className="glass-card border-0 group relative overflow-hidden h-full flex flex-col">
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-lg"
          style={{ backgroundColor: course.color || 'var(--primary)' }}
        />
        <CardContent className="p-5 pt-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div 
                className="flex items-center justify-center p-3 sm:p-4 rounded-xl shrink-0 transition-colors"
                style={{ backgroundColor: `${course.color || 'var(--primary)'}20`, color: course.color || 'var(--primary)' }}
              >
                <IconComp className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="mt-1">
                <h3 className="font-bold text-[15px] sm:text-base leading-tight break-words pr-2">{course.name}</h3>
                {course.ects && (
                  <span className="text-xs text-muted-foreground font-medium inline-block mt-1 bg-secondary/70 px-2 py-0.5 rounded-md">
                    {course.ects} AKTS
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-secondary/80"
                onClick={() => onEdit(course)}
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(course)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-border/40">
            {course.examDate ? (
              <>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {format(parseISO(course.examDate), 'd MMM yyyy', { locale: tr })}
                  </span>
                </div>
                <Badge variant={getUrgencyColor(daysUntilExam)} className="text-[10px] px-1.5 py-0 sm:px-2.5 sm:text-xs">
                  {daysUntilExam !== null && daysUntilExam >= 0
                    ? `${daysUntilExam} gün`
                    : daysUntilExam !== null
                      ? 'Geçti'
                      : ''}
                </Badge>
              </>
            ) : (
                <div className="text-xs text-muted-foreground italic opacity-70">
                    Sınav tarihi yok
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
