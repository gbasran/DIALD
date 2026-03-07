import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Brain, HelpCircle, ArrowRight } from 'lucide-react';

const suggestedPrompts = [
  {
    id: '1',
    icon: BookOpen,
    title: 'Explain a concept',
    description: 'Break down a topic from your courses in simple terms',
  },
  {
    id: '2',
    icon: Brain,
    title: 'Quiz me',
    description: 'Generate practice questions for an upcoming exam',
  },
  {
    id: '3',
    icon: HelpCircle,
    title: 'Help with assignment',
    description: 'Get guidance on approaching a problem or paper',
  },
];

const recentChats = [
  { id: '1', title: 'Sorting algorithms comparison', course: 'CS 301', time: '2h ago', messages: 12 },
  { id: '2', title: 'Matrix transformations help', course: 'MATH 240', time: '1d ago', messages: 8 },
  { id: '3', title: 'Cognitive dissonance notes', course: 'PSY 101', time: '2d ago', messages: 15 },
];

export default function ChatPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Chat</h2>
        <p className="text-muted-foreground">Your AI study companion</p>
      </div>

      {/* New chat prompt area */}
      <Card className="animate-card-enter border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-md bg-primary/15 p-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-heading text-sm font-semibold text-primary">New Conversation</span>
          </div>
          <div className="rounded-lg border border-border bg-background/50 px-4 py-3 text-sm text-muted-foreground">
            Ask me anything about your courses...
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            AI chat will be available in Phase 4. Try the prompts below for a preview.
          </p>
        </CardContent>
      </Card>

      {/* Suggested prompts */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-muted-foreground">Suggested</h3>
        <div className="grid gap-2">
          {suggestedPrompts.map((prompt) => (
            <Card key={prompt.id} className="animate-card-enter cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="rounded-md bg-muted p-2">
                  <prompt.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{prompt.title}</p>
                  <p className="text-xs text-muted-foreground">{prompt.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent chats */}
      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-muted-foreground">Recent Chats</h3>
        <div className="space-y-2">
          {recentChats.map((chat) => (
            <Card key={chat.id} className="animate-card-enter cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{chat.title}</p>
                  <p className="text-xs text-muted-foreground">{chat.course} -- {chat.messages} messages</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{chat.time}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
