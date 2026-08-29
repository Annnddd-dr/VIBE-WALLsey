'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCallback } from 'react';

export function CustomerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') || '';
  const role = searchParams.get('role') || 'ALL';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[220px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          type="text"
          defaultValue={q}
          placeholder="Search customers by name, email..."
          className="input pl-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('q', (e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => updateParam('q', e.target.value)}
        />
      </div>

      <select
        value={role}
        onChange={(e) => updateParam('role', e.target.value)}
        className="input text-xs w-auto"
      >
        <option value="ALL">All Roles</option>
        <option value="CUSTOMER">Customers Only</option>
        <option value="STAFF">Staff</option>
        <option value="MANAGER">Managers</option>
        <option value="ADMIN">Admins</option>
        <option value="OWNER">Owner</option>
      </select>
    </div>
  );
}
