import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import * as Icons from 'lucide-react';

const COMMON_ICONS = [
  'Book', 'BookOpen', 'Atom', 'Binary', 'Calculator', 'Code', 'Dna',
  'FunctionSquare', 'Globe', 'GraduationCap', 'Landplot', 'Library',
  'Lightbulb', 'Microscope', 'Pencil', 'PiSquare', 'Ruler', 'Sigma',
  'Telescope', 'TestTube', 'Briefcase', 'Building', 'HeartPulse',
  'Activity', 'Apple', 'BadgePercent', 'BarChart', 'Brain', 'Camera',
  'Component', 'Cpu', 'Database', 'FlaskConical', 'Gem', 'Glasses',
  'Languages', 'Laptop', 'Leaf', 'Palette', 'PenTool', 'Scale',
  'TerminalSquare', 'Ticket', 'Wrench', 'PencilRuler', 'LibraryBig'
];

export function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) return COMMON_ICONS;
    const s = search.toLowerCase();
    return Object.keys(Icons).filter(
      name => name.toLowerCase().includes(s) && name !== 'createLucideIcon' && name !== 'Icon'
    ).slice(0, 100); // Limit search results to prevent lag
  }, [search]);

  const SelectedIcon = Icons[value] || Icons.Book;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-12 w-12 p-0 focus-visible:ring-primary/50">
          <SelectedIcon className="h-6 w-6 text-foreground/80" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="İkon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-11 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <ScrollArea className="h-64 p-3">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map((iconName) => {
              const IconComp = Icons[iconName];
              if (!IconComp) return null;
              const isSelected = value === iconName;
              return (
                <button
                  key={iconName}
                  title={iconName}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
