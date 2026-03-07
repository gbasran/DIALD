import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const demoCourses = [
  {
    id: '1',
    name: 'CS 301 - Algorithms',
    instructor: 'Dr. Chen',
    progress: 72,
    nextClass: 'Mon 10:00 AM',
    pendingTasks: 2,
    color: 'bg-primary',
  },
  {
    id: '2',
    name: 'MATH 240 - Linear Algebra',
    instructor: 'Prof. Williams',
    progress: 58,
    nextClass: 'Tue 1:00 PM',
    pendingTasks: 1,
    color: 'bg-accent',
  },
  {
    id: '3',
    name: 'PSY 101 - Intro Psychology',
    instructor: 'Dr. Martinez',
    progress: 91,
    nextClass: 'Wed 9:00 AM',
    pendingTasks: 0,
    color: 'bg-[hsl(var(--focus-purple))]',
  },
  {
    id: '4',
    name: 'ENG 205 - Technical Writing',
    instructor: 'Prof. Adams',
    progress: 45,
    nextClass: 'Thu 2:30 PM',
    pendingTasks: 3,
    color: 'bg-[hsl(var(--warning))]',
  },
];

export default function CoursesPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Courses</h2>
        <p className="text-muted-foreground">Manage your classes and track progress</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="animate-card-enter">
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-bold text-primary">4</p>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
        <Card className="animate-card-enter">
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-bold text-accent">66%</p>
            <p className="text-xs text-muted-foreground">Avg Progress</p>
          </CardContent>
        </Card>
        <Card className="animate-card-enter">
          <CardContent className="p-3 text-center">
            <p className="font-heading text-2xl font-bold text-[hsl(var(--warning))]">6</p>
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Course cards */}
      <div className="space-y-3">
        {demoCourses.map((course) => (
          <Card key={course.id} className="animate-card-enter overflow-hidden">
            <div className="flex">
              <div className={`w-1.5 shrink-0 ${course.color}`} />
              <CardContent className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold leading-tight">{course.name}</h3>
                    <p className="text-xs text-muted-foreground">{course.instructor}</p>
                  </div>
                  <div className="ml-2 shrink-0 text-right">
                    <span className="font-heading text-lg font-bold">{course.progress}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${course.color} transition-all duration-500`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                {/* Meta row */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.nextClass}
                  </span>
                  <span className="flex items-center gap-1">
                    {course.pendingTasks > 0 ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-[hsl(var(--warning))]" />
                        <span className="text-[hsl(var(--warning))]">{course.pendingTasks} pending</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 text-accent" />
                        <span className="text-accent">All done</span>
                      </>
                    )}
                  </span>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
