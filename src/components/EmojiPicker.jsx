import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const EMOJI_LIST = [
  '📚', '📖', '📝', '📐', '🔬', '🧪', '🧬', '💻', '🖥️', '📊',
  '📈', '🔢', '➕', '🧮', '🎨', '🎵', '🎭', '🌍', '🗺️', '🏛️',
  '⚖️', '💰', '📜', '🔤', '🇹🇷', '🇬🇧', '🇩🇪', '🇫🇷', '🏃', '⚽',
  '🧠', '💡', '🔧', '⚙️', '🏗️', '🩺', '💊', '🧲', '⚡', '🌱',
  '🎓', '✏️', '📋', '🗂️', '📁', '🔍', '🧩', '🎯', '🏆', '⭐',
];

export function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-12 w-12 text-2xl p-0">
          {value || '📚'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent transition-colors cursor-pointer"
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
