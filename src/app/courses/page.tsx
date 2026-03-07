import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CoursesPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Courses</h2>
        <p className="text-muted-foreground">Manage your classes</p>
      </div>

      <Card className="animate-card-enter">
        <CardHeader>
          <CardTitle className="font-heading">Your Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Course management coming in Phase 2
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
