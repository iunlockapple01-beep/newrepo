import { FileCode2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-xl font-bold text-primary">
      <FileCode2 className="h-8 w-8" />
      <span className="font-headline">HTML Insights</span>
    </div>
  );
}
