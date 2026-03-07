'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Course, ClassTime } from '@/lib/types';
import { MapPin, Clock, Pencil, Trash2 } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

const DAY_ABBREV: Record<ClassTime['day'], string> = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'R',
  Friday: 'F',
};

function formatSchedule(schedule: ClassTime[]): string[] {
  // Group by time range, collect day abbreviations
  const groups: Record<string, string[]> = {};
  for (const slot of schedule) {
    const timeKey = `${slot.startTime}-${slot.endTime}`;
    if (!groups[timeKey]) groups[timeKey] = [];
    groups[timeKey].push(DAY_ABBREV[slot.day]);
  }
  return Object.entries(groups).map(
    ([time, days]) => `${days.join('')} ${time}`
  );
}

export function CourseList({ courses, onEdit, onDelete }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center animate-fade-in">
        <p className="text-lg font-heading font-semibold text-foreground">
          No courses yet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Let&apos;s add your first one! Tap the button above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {courses.map((course) => (
        <Card key={course.id} className="animate-card-enter overflow-hidden">
          <div className="flex">
            <div
              className="w-1 shrink-0 rounded-l-lg"
              style={{ backgroundColor: course.color }}
            />
            <CardContent className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 space-y-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {course.code}
                  </Badge>
                  <h3 className="font-heading font-semibold leading-tight">
                    {course.name}
                  </h3>
                </div>
                <div className="ml-2 flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(course)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(course.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {course.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span>{course.location}</span>
                  </div>
                )}
                {formatSchedule(course.schedule).map((line) => (
                  <div key={line} className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
}
