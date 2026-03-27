import Dexie from 'dexie';

export const db = new Dexie('StudyTrackerDB');

db.version(1).stores({
  courses: '++id, name, emoji, ects, examDate, color, createdAt',
  studySessions: '++id, courseId, duration, startedAt, endedAt',
  studyPlans: '++id, date, courseId, plannedMinutes, completed',
});
