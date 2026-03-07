'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { COURSE_COLORS } from '@/lib/types';
import type { Course, ClassTime } from '@/lib/types';
import { Plus, X } from 'lucide-react';

interface CourseFormProps {
  initialData?: Course;
  onSubmit: (data: Omit<Course, 'id'>) => void;
  onCancel: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

const emptySlot = (): ClassTime => ({
  day: 'Monday',
  startTime: '09:00',
  endTime: '09:50',
});

export function CourseForm({ initialData, onSubmit, onCancel }: CourseFormProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [schedule, setSchedule] = useState<ClassTime[]>([emptySlot()]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCode(initialData.code);
      setLocation(initialData.location);
      setColor(initialData.color);
      setSchedule(
        initialData.schedule.length > 0
          ? initialData.schedule
          : [emptySlot()]
      );
    }
  }, [initialData]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      code: code.trim(),
      location: location.trim(),
      color,
      schedule,
    });
  }

  function updateSlot(index: number, updates: Partial<ClassTime>) {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );
  }

  function removeSlot(index: number) {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  }

  function addSlot() {
    setSchedule((prev) => [...prev, emptySlot()]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="course-name">Course Name</Label>
        <Input
          id="course-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Data Structures & Algorithms"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-code">Course Code</Label>
        <Input
          id="course-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="CPSC 2620"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-location">Location</Label>
        <Input
          id="course-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="UHall C610"
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {COURSE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full transition-all"
              style={{
                backgroundColor: c,
                outline: color === c ? '2px solid currentColor' : 'none',
                outlineOffset: '2px',
              }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Schedule</Label>
        <div className="space-y-2">
          {schedule.map((slot, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={slot.day}
                onChange={(e) =>
                  updateSlot(index, {
                    day: e.target.value as ClassTime['day'],
                  })
                }
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <Input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  updateSlot(index, { startTime: e.target.value })
                }
                className="w-[110px]"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  updateSlot(index, { endTime: e.target.value })
                }
                className="w-[110px]"
              />
              {schedule.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSlot(index)}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          className="mt-1"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add time slot
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Save Changes' : 'Save Course'}
        </Button>
      </div>
    </form>
  );
}
