import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { admin } from '@/lib/admin-classes';
import { fetchUserData, getCache, type UserEntry } from '@/lib/api';
import { collectibleLabel } from '@/lib/bot';
import { TablePagination } from '@/components/TablePagination';
import UserEdit from '@/components/UserEdit';
import { useMotionPref } from '@/hooks/useReducedMotion';
import { listItem, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export default function UsersPage({ searchQuery = '' }: { searchQuery?: string }) {
  const listReveal = useMotionPref('listReveal');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');
  const [giftsFilter, setGiftsFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserEntry[]>(() => {
    const cached = getCache<UserEntry[]>('users_all');
    if (Array.isArray(cached)) {
      const valid = cached.filter(
        (u) => u && typeof u.discordId === 'string' && /^\d{15,22}$/.test(u.discordId)
      );
      if (valid.length > 0) return valid;
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => !getCache<UserEntry[]>('users_all')?.length);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setLocalQuery(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [privacyFilter, giftsFilter]);

  useEffect(() => {
    let active = true;
    void fetchUserData()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          const valid = data.filter(
            (u) => u && typeof u.discordId === 'string' && /^\d{15,22}$/.test(u.discordId)
          );
          if (valid.length > 0) {
            setUsers(valid);
          }
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (selectedUserId) {
    return <UserEdit userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  const filteredUsers = users.filter((user) => {
    const matchesQuery = /^\d{15,22}$/.test(user.discordId) && user.discordId.includes(localQuery);
    const matchesPrivacy =
      privacyFilter === 'all' ||
      (user.inventoryPrivacy && user.inventoryPrivacy.toLowerCase() === privacyFilter);
    const matchesGifts =
      giftsFilter === 'all' ||
      (giftsFilter === 'yes' ? Boolean(user.acceptGifts) : !user.acceptGifts);
    return matchesQuery && matchesPrivacy && matchesGifts;
  });
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', admin.muted)}
            />
            <Input
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={cn('pl-9', admin.input)}
              placeholder="Search by Discord ID..."
            />
          </div>
          <Select
            value={privacyFilter}
            onValueChange={(val) => {
              setPrivacyFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={cn('h-9 w-full sm:w-32 text-xs rounded-lg bg-[var(--admin-card)] text-[var(--admin-fg)] border-0 shadow-none', admin.elevated)}>
              <SelectValue placeholder="All Privacy" />
            </SelectTrigger>
            <SelectContent className={cn(admin.elevated, admin.fg)}>
              <SelectItem value="all">All Privacy</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={giftsFilter}
            onValueChange={(val) => {
              setGiftsFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={cn('h-9 w-full sm:w-28 text-xs rounded-lg bg-[var(--admin-card)] text-[var(--admin-fg)] border-0 shadow-none', admin.elevated)}>
              <SelectValue placeholder="All Gifts" />
            </SelectTrigger>
            <SelectContent className={cn(admin.elevated, admin.fg)}>
              <SelectItem value="all">All Gifts</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className={cn('bg-[var(--admin-card)] overflow-x-auto rounded-xl', admin.card)}>
        <CardContent className="p-0">
          <div>
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className={cn('py-4 pl-5 sm:pl-6 pr-4 text-left text-xs', admin.muted)}>Discord ID</th>
                  <th className={cn('py-4 px-4 text-left text-xs', admin.muted)}>Total</th>
                  <th className={cn('py-4 px-4 text-left text-xs', admin.muted)}>Unique</th>
                  <th className={cn('py-4 px-4 text-left text-xs', admin.muted)}>Value</th>
                  <th className={cn('py-4 px-4 text-left text-xs', admin.muted)}>Privacy</th>
                  <th className={cn('py-4 px-4 text-left text-xs', admin.muted)}>Gifts</th>
                  <th className={cn('py-4 pr-5 sm:pr-6 text-right text-xs', admin.muted)}>Actions</th>
                </tr>
              </thead>
              {isLoading ? (
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--admin-border)] last:border-0"
                    >
                      <td className="py-3 pl-5 sm:pl-6 pr-4">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="py-3 pr-5 sm:pr-6 text-right">
                        <Skeleton className="h-7 w-14 rounded-lg ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : listReveal ? (
                <motion.tbody
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  key={localQuery + '-' + currentPage + '-' + pageSize}
                >
                  {paginatedUsers.map((user) => (
                    <motion.tr
                      key={user.discordId}
                      variants={listItem}
                      className={cn(
                        'border-b border-[var(--admin-border)] last:border-0 transition-colors',
                        admin.hoverRow
                      )}
                    >
                      <td className={cn('py-3 pl-5 sm:pl-6 pr-4 text-sm font-medium', admin.fg)}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.discordId)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {user.discordId}
                        </button>
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>
                        {user.total} {collectibleLabel(user.total)}
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{user.unique}</td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{user.totalValue}</td>
                      <td className={cn('py-3 px-4 text-sm capitalize', admin.muted)}>
                        {user.inventoryPrivacy}
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.muted)}>
                        {user.acceptGifts ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 pr-5 sm:pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUserId(user.discordId)}
                          className={cn(admin.muted, 'hover:text-[var(--admin-fg)] cursor-pointer')}
                        >
                          Edit
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              ) : (
                <tbody key={localQuery + '-' + currentPage + '-' + pageSize}>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.discordId}
                      className={cn(
                        'border-b border-[var(--admin-border)] last:border-0 transition-colors',
                        admin.hoverRow
                      )}
                    >
                      <td className={cn('py-3 pl-5 sm:pl-6 pr-4 text-sm font-medium', admin.fg)}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.discordId)}
                          className="hover:underline text-left cursor-pointer"
                        >
                          {user.discordId}
                        </button>
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{user.total}</td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{user.unique}</td>
                      <td className={cn('py-3 px-4 text-sm', admin.fg)}>{user.totalValue}</td>
                      <td className={cn('py-3 px-4 text-sm capitalize', admin.muted)}>
                        {user.inventoryPrivacy}
                      </td>
                      <td className={cn('py-3 px-4 text-sm', admin.muted)}>
                        {user.acceptGifts ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 pr-5 sm:pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUserId(user.discordId)}
                          className={cn(admin.muted, 'hover:text-[var(--admin-fg)] cursor-pointer')}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          {!isLoading && filteredUsers.length === 0 && (
            <p className={cn('py-8 text-center text-sm', admin.muted)}>No users found.</p>
          )}

          <TablePagination
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}