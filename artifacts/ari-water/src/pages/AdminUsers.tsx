import React, { useState } from 'react';
import { useAuth } from '@/lib/clerk-auth-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck, UserCog, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Role = 'admin' | 'marketing' | 'sales' | 'accounting' | 'customer';

interface ClerkUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  approved: boolean;
  createdAt: number;
}

const ROLE_OPTIONS: Role[] = ['admin', 'marketing', 'sales', 'accounting', 'customer'];

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  marketing: 'bg-purple-100 text-purple-800 border-purple-200',
  sales: 'bg-blue-100 text-blue-800 border-blue-200',
  accounting: 'bg-amber-100 text-amber-800 border-amber-200',
  customer: 'bg-slate-100 text-slate-700 border-slate-200',
};

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingRole, setPendingRole] = useState<Record<string, Role>>({});

  const { data, isLoading, error, refetch } = useQuery<{ users: ClerkUser[] }>({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch('/admin/users'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      apiFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: (_data, { userId, role }) => {
      toast({ title: 'Role updated', description: `User role set to ${role}.` });
      // Clear pending selection and refresh list
      setPendingRole((prev) => { const next = { ...prev }; delete next[userId]; return next; });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update role', description: err.message, variant: 'destructive' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, approved }: { userId: string; approved: boolean }) =>
      apiFetch(`/admin/users/${userId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ approved }),
      }),
    onSuccess: (_data, { approved }) => {
      toast({ title: approved ? 'User approved' : 'User suspended' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update approval', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-red-900 mb-2">Failed to load users</h2>
          <p className="text-red-700 text-sm">{(error as Error).message}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const users = data?.users ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="h-6 w-6" /> User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage roles and access for all registered users
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Users ({users.length})</CardTitle>
          <CardDescription>
            Changes take effect immediately — the user's role updates on their next page load.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.userId;
              const selectedRole = pendingRole[u.id] ?? u.role;
              const isDirty = selectedRole !== u.role;

              return (
                <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-semibold text-sm">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {u.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-slate-400 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>

                  {/* Current role badge */}
                  <Badge
                    variant="outline"
                    className={`text-xs hidden sm:inline-flex ${ROLE_COLORS[u.role]}`}
                  >
                    {u.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                    {u.role}
                  </Badge>

                  {/* Role selector */}
                  <Select
                    value={selectedRole}
                    onValueChange={(val) =>
                      setPendingRole((prev) => ({ ...prev, [u.id]: val as Role }))
                    }
                    disabled={isSelf}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Save role button */}
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!isDirty || isSelf || roleMutation.isPending}
                    onClick={() => roleMutation.mutate({ userId: u.id, role: selectedRole })}
                  >
                    {roleMutation.isPending && roleMutation.variables?.userId === u.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </Button>

                  {/* Approve / suspend */}
                  <Button
                    size="sm"
                    variant={u.approved ? 'outline' : 'default'}
                    className="h-8 text-xs"
                    disabled={isSelf || approveMutation.isPending}
                    onClick={() =>
                      approveMutation.mutate({ userId: u.id, approved: !u.approved })
                    }
                  >
                    {u.approved ? 'Suspend' : 'Approve'}
                  </Button>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
