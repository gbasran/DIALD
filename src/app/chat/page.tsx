import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChatPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Chat</h2>
        <p className="text-muted-foreground">Your AI study companion</p>
      </div>

      <Card className="animate-card-enter">
        <CardHeader>
          <CardTitle className="font-heading">AI Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AI chat coming in Phase 4
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
