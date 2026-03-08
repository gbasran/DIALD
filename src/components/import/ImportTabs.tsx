'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MoodleImport } from '@/components/import/MoodleImport';
import { SyllabusPaste } from '@/components/import/SyllabusPaste';
import { BridgeSchedule } from '@/components/import/BridgeSchedule';
import { Calendar, FileText, School } from 'lucide-react';

export function ImportTabs() {
  return (
    <Tabs defaultValue="moodle" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="moodle" className="gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5" />
          Moodle Calendar
        </TabsTrigger>
        <TabsTrigger value="paste" className="gap-1.5 text-xs">
          <FileText className="h-3.5 w-3.5" />
          Paste Text
        </TabsTrigger>
        <TabsTrigger value="bridge" className="gap-1.5 text-xs">
          <School className="h-3.5 w-3.5" />
          Bridge Schedule
        </TabsTrigger>
      </TabsList>

      <TabsContent value="moodle" className="mt-4">
        <div className="glass glow-border rounded-xl p-5">
          <MoodleImport />
        </div>
      </TabsContent>

      <TabsContent value="paste" className="mt-4">
        <div className="glass glow-border rounded-xl p-5">
          <SyllabusPaste />
        </div>
      </TabsContent>

      <TabsContent value="bridge" className="mt-4">
        <div className="glass glow-border rounded-xl p-5">
          <BridgeSchedule />
        </div>
      </TabsContent>
    </Tabs>
  );
}
