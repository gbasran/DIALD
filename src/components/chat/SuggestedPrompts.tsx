'use client';

import { useCourses } from '@/hooks/use-courses';
import { useAssignments } from '@/hooks/use-assignments';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Brain, HelpCircle, Target, ArrowRight } from 'lucide-react';
import type { ComponentType } from 'react';

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

interface PromptItem {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  description: string;
  text: string;
}

function buildPrompts(
  courses: ReturnType<typeof useCourses>['courses'],
  assignments: ReturnType<typeof useAssignments>['assignments']
): PromptItem[] {
  const prompts: PromptItem[] = [];

  // Nearest deadline prompt
  const upcoming = assignments
    .filter((a) => a.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (upcoming.length > 0) {
    const nearest = upcoming[0];
    const courseCode = courses.find((c) => c.id === nearest.courseId)?.code ?? 'my';
    prompts.push({
      id: 'deadline',
      icon: Target,
      label: 'Get started on assignment',
      description: `Help with your ${courseCode} work`,
      text: `Help me get started on my ${courseCode} assignment '${nearest.name}'`,
    });
  }

  // Random course concept
  if (courses.length > 0) {
    const course = courses[Math.floor(Math.random() * courses.length)];
    prompts.push({
      id: 'concept',
      icon: BookOpen,
      label: 'Explain a concept',
      description: `From ${course.code}`,
      text: `Explain an important concept from ${course.code} ${course.name} in simple terms`,
    });
  }

  // Study planning
  prompts.push({
    id: 'planning',
    icon: Brain,
    label: 'Study planning',
    description: 'Based on your deadlines',
    text: 'What should I focus on today based on my upcoming deadlines?',
  });

  // Compare courses (if multiple)
  if (courses.length >= 2) {
    const [c1, c2] = courses;
    prompts.push({
      id: 'compare',
      icon: HelpCircle,
      label: 'Compare strategies',
      description: `${c1.code} vs ${c2.code}`,
      text: `Compare study strategies for ${c1.code} vs ${c2.code}`,
    });
  }

  return prompts;
}

const GENERIC_PROMPTS: PromptItem[] = [
  {
    id: 'explain',
    icon: BookOpen,
    label: 'Explain a concept',
    description: 'Break down a topic in simple terms',
    text: 'Explain an important study concept in simple terms',
  },
  {
    id: 'plan',
    icon: Brain,
    label: 'Study planning',
    description: 'Help organize your study time',
    text: 'Help me create a study plan for this week',
  },
  {
    id: 'help',
    icon: HelpCircle,
    label: 'Assignment help',
    description: 'Get guidance on approaching work',
    text: 'Help me get started on my next assignment',
  },
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { courses, isLoaded: coursesLoaded } = useCourses();
  const { assignments, isLoaded: assignmentsLoaded } = useAssignments();

  const prompts =
    coursesLoaded && assignmentsLoaded && courses.length > 0
      ? buildPrompts(courses, assignments)
      : GENERIC_PROMPTS;

  return (
    <div>
      <h3 className="mb-3 font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Suggested
      </h3>
      <div className="grid gap-2">
        {prompts.map((prompt) => (
          <Card
            key={prompt.id}
            className="animate-card-enter cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => onSelect(prompt.text)}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <div className="rounded-md bg-muted p-2">
                <prompt.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{prompt.label}</p>
                <p className="text-xs text-muted-foreground">{prompt.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
