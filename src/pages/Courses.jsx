import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { CourseCard } from '@/components/CourseCard';
import { IconPicker } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
  '#3b82f6', '#06b6d4', '#10b981', '#22c55e', '#f59e0b',
  '#f97316', '#ef4444', '#ec4899', '#d946ef', '#8b5cf6',
  '#6366f1', '#64748b',
];

const emptyForm = {
  name: '',
  icon: 'Book',
  ects: '',
  examDate: '',
  color: COLORS[0],
};

export default function Courses() {
  const courses = useLiveQuery(() => db.courses.toArray()) || [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditingCourse(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      name: course.name,
      icon: course.icon || 'Book',
      ects: course.ects?.toString() || '',
      examDate: course.examDate || '',
      color: course.color || COLORS[0],
    });
    setDialogOpen(true);
  };

  const openDelete = (course) => {
    setDeletingCourse(course);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const data = {
      name: form.name.trim(),
      icon: form.icon,
      ects: form.ects ? parseInt(form.ects) : null,
      examDate: form.examDate || null,
      color: form.color,
    };

    if (editingCourse) {
      // Remove old emoji field if exists
      const updateData = { ...data };
      if (editingCourse.emoji !== undefined) updateData.emoji = undefined;
      await db.courses.update(editingCourse.id, updateData);
    } else {
      data.createdAt = new Date().toISOString();
      await db.courses.add(data);
    }

    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (!deletingCourse) return;
    await db.courses.delete(deletingCourse.id);
    // Also delete related data
    await db.studySessions.where('courseId').equals(deletingCourse.id).delete();
    await db.studyPlans.where('courseId').equals(deletingCourse.id).delete();
    setDeleteDialogOpen(false);
    setDeletingCourse(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dersler</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Akademik döneminizi planlayın
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ders Ekle</span>
          <span className="inline sm:hidden">Ekle</span>
        </Button>
      </div>

      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-xl border border-dashed border-border p-8"
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Plus className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Ders Programı Boş</h3>
          <p className="text-muted-foreground text-sm mt-2 mb-6 max-w-sm">
            Çalışmalarınızı ve istatistiklerinizi takip edebilmek için ilk dersinizi ekleyin.
          </p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Ders Ekle
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse ? 'Ders bilgilerini güncelleyin.' : 'Yeni bir ders tanımlayın.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* Icon + Name */}
            <div className="flex gap-4 items-end">
              <div>
                <Label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">İkon</Label>
                <IconPicker
                  value={form.icon}
                  onChange={(icon) => setForm((f) => ({ ...f, icon }))}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="course-name" className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                  Ders Adı <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course-name"
                  placeholder="Örn. Matematik, Fizik..."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-12 border-muted-foreground/30 focus-visible:ring-primary/50"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* ECTS & Exam Date Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                <Label htmlFor="course-ects" className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                    AKTS (opsiyonel)
                </Label>
                <Input
                    id="course-ects"
                    type="number"
                    min="1"
                    max="30"
                    placeholder="Örn: 5"
                    value={form.ects}
                    onChange={(e) => setForm((f) => ({ ...f, ects: e.target.value }))}
                    className="h-11 border-muted-foreground/30"
                />
                </div>
                <div>
                <Label htmlFor="course-exam" className="text-xs font-semibold mb-2 block text-muted-foreground uppercase tracking-wider">
                    Sınav Tarihi (opsiyonel)
                </Label>
                <Input
                    id="course-exam"
                    type="date"
                    value={form.examDate}
                    onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                    className="h-11 border-muted-foreground/30"
                />
                </div>
            </div>

            {/* Color */}
            <div>
              <Label className="text-xs font-semibold mb-3 block text-muted-foreground uppercase tracking-wider">Tanımlayıcı Renk</Label>
              <div className="flex gap-2.5 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full transition-all cursor-pointer border-2 border-transparent ${
                      form.color === color
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md'
                        : 'hover:scale-110 hover:shadow-sm'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-muted-foreground/30">
              İptal
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="shadow-sm">
              {editingCourse ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Dersi Sil</DialogTitle>
            <DialogDescription className="text-base pt-2">
              <span className="font-bold text-foreground">"{deletingCourse?.name}"</span> dersini silmek istediğinize emin misiniz?
              <br/><br/>
              <span className="text-xs text-muted-foreground">Not: Bu derse ait tüm çalışma istatistikleri ve planlar kalıcı olarak silinecektir.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="shadow-sm">
              Evet, Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
