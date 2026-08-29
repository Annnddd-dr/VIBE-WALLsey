'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'OWNER'];

export function RoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (nextRole: string) => {
    if (!confirm(`Change role to ${nextRole}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json.error || 'Failed to update role.');
        setRole(currentRole);
      } else {
        setRole(nextRole);
        router.refresh();
      }
    } catch {
      alert('Error updating role.');
      setRole(currentRole);
    } finally {
      setLoading(false);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    CUSTOMER: 'bg-neutral-100 text-neutral-700',
    STAFF: 'bg-blue-50 text-blue-700',
    MANAGER: 'bg-purple-50 text-purple-700',
    ADMIN: 'bg-amber-50 text-amber-700',
    OWNER: 'bg-accent/10 text-accent font-semibold',
  };

  return (
    <select
      value={role}
      disabled={disabled || loading}
      onChange={(e) => handleRoleChange(e.target.value)}
      className={`text-xs px-2 py-1 rounded-sm border border-line cursor-pointer ${
        ROLE_COLORS[role] || 'bg-white'
      }`}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
