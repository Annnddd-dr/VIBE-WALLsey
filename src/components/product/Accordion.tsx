'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Accordion({ items }: { items: { title: string; content: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-line">
      {items.map((item, i) => (
        <div key={item.title} className="border-b border-line">
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left text-sm font-medium">
            {item.title}
            <ChevronDown size={16} className={`transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          {open === i && <p className="pb-4 text-sm text-ink/60 leading-relaxed">{item.content}</p>}
        </div>
      ))}
    </div>
  );
}
