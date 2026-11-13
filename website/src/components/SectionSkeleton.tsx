import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { admin } from '@/lib/admin-classes';
import { cn } from '@/lib/utils';

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <Card className={cn('bg-[var(--admin-card)] overflow-x-auto rounded-xl', admin.card)}>
        <CardContent className="p-0">
          <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="divide-y divide-[var(--admin-border)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 px-5 sm:px-6">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24 opacity-60" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20 hidden md:block" />
                  <Skeleton className="h-4 w-16 hidden sm:block" />
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-18 rounded-xl" />
          ))}
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className={cn('rounded-2xl p-4 bg-[var(--admin-card)] space-y-3', admin.card)}>
            <Skeleton className="h-36 w-full rounded-xl" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-36 opacity-60" />
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-[var(--admin-border)]">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GuildsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      <Card className={cn('bg-[var(--admin-card)] overflow-x-auto rounded-xl', admin.card)}>
        <CardContent className="p-0">
          <div className="p-4 border-b border-[var(--admin-border)] flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="divide-y divide-[var(--admin-border)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 px-5 sm:px-6">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-32 opacity-60" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full hidden sm:block" />
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="relative h-80 overflow-hidden rounded-xl bg-[var(--admin-card)] p-5 flex flex-col justify-between border border-[var(--admin-border)]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3.5 w-24 opacity-60" />
              <div className="mt-3.5 pt-2.5 border-t border-[var(--admin-border)] flex items-center justify-end gap-1.5">
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BotSettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <Card className={cn('bg-[var(--admin-card)] rounded-2xl p-6', admin.card)}>
        <div className="flex flex-wrap gap-2 pb-5 border-b border-[var(--admin-border)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>

        <div className="divide-y divide-[var(--admin-border)] pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-56 opacity-60" />
              </div>
              <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function PanelUsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className={cn('bg-[var(--admin-card)] rounded-xl p-4', admin.card)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20 opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[var(--admin-border)] pb-3">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      <Card className={cn('bg-[var(--admin-card)] rounded-2xl p-5 space-y-4', admin.card)}>
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--admin-border)] last:border-0">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-52 opacity-60" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function InstancesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      <Card className={cn('bg-[var(--admin-card)] overflow-x-auto rounded-xl', admin.card)}>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--admin-border)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 px-5 sm:px-6">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28 opacity-60" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
                  <Skeleton className="h-4 w-24 hidden md:block" />
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className={cn('p-5 rounded-2xl bg-[var(--admin-card)] space-y-3', admin.card)}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32 opacity-60" />
          </Card>
        ))}
      </div>

      <Card className={cn('p-6 rounded-2xl bg-[var(--admin-card)] space-y-4', admin.card)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </Card>
    </div>
  );
}

export function SectionSkeleton({ section }: { section: string }) {
  switch (section) {
    case 'users':
      return <UsersSkeleton />;
    case 'nations':
      return <NationsSkeleton />;
    case 'guilds':
      return <GuildsSkeleton />;
    case 'cards':
      return <CardsSkeleton />;
    case 'bot_settings':
      return <BotSettingsSkeleton />;
    case 'panel_users':
      return <PanelUsersSkeleton />;
    case 'settings':
      return <SettingsSkeleton />;
    case 'instances':
      return <InstancesSkeleton />;
    case 'dashboard':
    default:
      return <DashboardSkeleton />;
  }
}