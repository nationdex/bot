import {
  fetchCollectibles,
  fetchGrowth,
  fetchStats,
  fetchUserData,
  getCache,
  type BotStats,
  type CollectibleEntry,
  type UserEntry,
} from '@/lib/api';

export type DashboardFilter = 'All' | 'Users' | 'Nations' | 'Servers';
type Range = 'Month' | 'Annually';

// Start of the three chart buckets and the end of the last one, in the browser's time zone.
function rangeBounds(range: 'Month' | 'Annually'): [number, number, number, number] {
  const now = new Date();
  const at = (i: number) =>
    (range === 'Month'
      ? new Date(now.getFullYear(), now.getMonth() + i, 1)
      : new Date(now.getFullYear() + i, 0, 1)
    ).getTime();
  return [at(-2), at(-1), at(0), at(1)];
}

export class DashboardState {
  selectedFilter: DashboardFilter = 'All';
  selectedClassFilter = 'all';
  timeRange: Range = 'Month';
  liveStats = getCache<BotStats>('stats') ?? { userCount: 0, totalCaught: 0, catalogTotal: 0, guildCount: 0 };
  private topNations = getCache<CollectibleEntry[]>('collectibles_all') ?? [];
  private topUsers = getCache<UserEntry[]>('users_all') ?? [];
  private growth: [number, number, number] | null = null;
  private loadingGrowth = true;
  private loadingUsers = !getCache<UserEntry[]>('users_all');
  private lifetime = 0;
  private growthRequest = 0;
  nationsPage = 1;
  nationsRowsPerPage = 5;
  usersPage = 1;
  usersRowsPerPage = 5;

  constructor(private readonly notify: () => void) {}

  connect() {
    const lifetime = ++this.lifetime;
    void fetchStats()
      .then((data) => {
        if (lifetime !== this.lifetime || !data) return;
        this.liveStats = {
          userCount: data.userCount ?? this.liveStats.userCount,
          totalCaught: data.totalCaught ?? this.liveStats.totalCaught,
          catalogTotal: data.catalogTotal ?? this.liveStats.catalogTotal,
          guildCount: data.guildCount ?? this.liveStats.guildCount,
        };
        this.notify();
      })
      .catch(() => {});
    void fetchCollectibles()
      .then((data) => {
        if (lifetime !== this.lifetime || !Array.isArray(data)) return;
        this.topNations = data;
        this.nationsPage = Math.min(
          this.nationsPage,
          Math.max(1, Math.ceil(this.filteredTopNations.length / this.nationsRowsPerPage)),
        );
        this.notify();
      })
      .catch(() => {});
    void fetchUserData()
      .then((data) => {
        if (lifetime !== this.lifetime || !Array.isArray(data)) return;
        this.topUsers = data;
        this.usersPage = Math.min(
          this.usersPage,
          Math.max(1, Math.ceil(this.sortedTopUsers.length / this.usersRowsPerPage)),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (lifetime !== this.lifetime) return;
        this.loadingUsers = false;
        this.notify();
      });
    void this.refreshGrowth();
    return () => {
      ++this.lifetime;
      ++this.growthRequest;
    };
  }

  private async refreshGrowth() {
    const request = ++this.growthRequest;
    this.loadingGrowth = true;
    this.notify();
    const counts = await fetchGrowth(rangeBounds(this.timeRange)).catch(() => null);
    if (request !== this.growthRequest) return;
    this.growth = counts;
    this.loadingGrowth = false;
    this.notify();
  }

  readonly setSelectedFilter = (filter: DashboardFilter) => {
    if (filter === this.selectedFilter) return;
    this.selectedFilter = filter;
    this.nationsPage = this.usersPage = 1;
    this.notify();
  };

  readonly setSelectedClassFilter = (filter: string) => {
    this.selectedClassFilter = filter;
    this.nationsPage = 1;
    this.notify();
  };

  readonly setTimeRange = (range: Range) => {
    if (range === this.timeRange) return;
    this.timeRange = range;
    void this.refreshGrowth();
  };

  readonly setNationsPage = (page: number) => {
    this.nationsPage = page;
    this.notify();
  };
  readonly setUsersPage = (page: number) => {
    this.usersPage = page;
    this.notify();
  };
  readonly setNationsRowsPerPage = (size: number) => {
    this.nationsRowsPerPage = size;
    this.nationsPage = 1;
    this.notify();
  };
  readonly setUsersRowsPerPage = (size: number) => {
    this.usersRowsPerPage = size;
    this.usersPage = 1;
    this.notify();
  };

  get isChartLoading() {
    if (this.selectedFilter === 'Users') return this.loadingUsers;
    return this.selectedFilter !== 'Servers' && this.loadingGrowth;
  }

  get filteredTopNations() {
    return this.topNations
      .filter((entry) => this.selectedClassFilter === 'all' || entry.class === this.selectedClassFilter)
      .sort((a, b) => (b.globalCaught || 0) - (a.globalCaught || 0));
  }

  get sortedTopUsers() {
    return this.topUsers
      .filter((user) => user.total > 0 || user.totalValue > 0)
      .sort((a, b) => b.total - a.total || b.totalValue - a.totalValue);
  }

  get chartData() {
    const { liveStats, selectedFilter, timeRange, growth } = this;

    const formatPct = (val: number) => {
      if (val === 0) return '0.0%';
      return val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
    };

    const now = new Date();
    let label0 = '';
    let label1 = '';
    let label2 = '';

    if (timeRange === 'Month') {
      const d0 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const d1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const d2 = new Date(now.getFullYear(), now.getMonth(), 1);

      label0 = d0.toLocaleString('en-US', { month: 'short' });
      label1 = d1.toLocaleString('en-US', { month: 'short' });
      label2 = d2.toLocaleString('en-US', { month: 'short' });
    } else {
      const currentYear = now.getFullYear();
      label0 = String(currentYear - 2);
      label1 = String(currentYear - 1);
      label2 = String(currentYear);
    }

    let c0 = 0;
    let c1 = 0;
    let c2 = 0;

    if ((selectedFilter === 'All' || selectedFilter === 'Nations') && growth) {
      [c0, c1, c2] = growth;
    } else if (selectedFilter === 'Servers') {
      c2 = liveStats.guildCount || 0;
    }

    const baseline0 = c0 > 0 ? Math.max(1, Math.round(c0 * 0.85)) : 0;
    const pct0 = baseline0 > 0 ? Math.round(((c0 - baseline0) / baseline0) * 1000) / 10 : 0;
    const pct1 = c0 > 0 ? Math.round(((c1 - c0) / c0) * 1000) / 10 : c1 > 0 ? 100 : 0;
    const pct2 = c1 > 0 ? Math.round(((c2 - c1) / c1) * 1000) / 10 : c2 > 0 ? 100 : 0;

    return [
      { label: label0, count: c0, pct: formatPct(pct0), numGrowth: pct0, isLatest: false },
      { label: label1, count: c1, pct: formatPct(pct1), numGrowth: pct1, isLatest: false },
      { label: label2, count: c2, pct: formatPct(pct2), numGrowth: pct2, isLatest: true },
    ];
  }
}
