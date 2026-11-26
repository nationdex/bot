import { PanelChoices } from '@/components/ui/PanelChoices';
import type { PanelPagination } from '@/components/ui/PanelPagination';
import '@/components/ui/PanelPagination';
import { GrowthBars } from './GrowthBars';
import { updateRankingRows } from './RankingRows';
import { iconSvg } from '@/components/icon-svg';
import { loadAnimationPrefs } from '@/lib/animation-prefs';
import { admin } from '@/lib/admin-classes';
import { DashboardState, type DashboardFilter } from './DashboardState';
import { bot, formatRarity } from '@/lib/bot';

const filterOptions: DashboardFilter[] = ['All', 'Users', 'Nations', 'Servers'];

const growthChartTitles: Record<DashboardFilter, string> = {
  All: 'Catch Growth',
  Users: 'New Players',
  Nations: 'Catch Growth',
  Servers: 'Spawn Activity',
};

const getUnitLabel = (count: number, filter: DashboardFilter) => {
  if (filter === 'Users') {
    return count === 1 ? 'Player' : 'Players';
  }
  if (filter === 'Servers') {
    return count === 1 ? 'Server' : 'Servers';
  }
  return count === 1 ? bot.collectible.singular : bot.collectible.plural;
};

const nationsRanking = `
<div class="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 class="text-sm font-medium text-[var(--admin-muted)] capitalize">
                    Top caught <span data-plural></span>
                  </h3>
                  <div class="relative z-20 w-full sm:w-auto">
                    <div class="relative flex w-full items-center rounded-md border min-h-9 cursor-pointer touch-manipulation bg-[var(--admin-elevated)] text-[var(--admin-fg)] text-xs sm:min-w-[9rem] sm:w-auto h-9">
                      <select aria-label="Rarity class" style="color-scheme: dark" class="h-full w-full cursor-pointer appearance-none truncate rounded-[inherit] bg-transparent pl-3 pr-8 text-inherit outline-none disabled:cursor-not-allowed disabled:opacity-50"></select>
                      ${iconSvg('ChevronDown', 'pointer-events-none absolute right-3 h-4 w-4 opacity-50')}
                    </div>
                  </div>
                </div>

                <div class="overflow-x-auto w-full flex-1">
                  <table class="w-full min-w-[400px]">
                    <thead>
                      <tr class="border-b border-[var(--admin-border)]">
                        <th class="text-left text-xs text-[var(--admin-muted)] py-2.5 pl-4 sm:pl-5 pr-4">ID</th>
                        <th class="text-left text-xs text-[var(--admin-muted)] py-2.5 px-4 capitalize">
                          <span data-singular></span>
                        </th>
                        <th class="text-left text-xs text-[var(--admin-muted)] py-2.5 px-4">Class</th>
                        <th class="text-right text-xs text-[var(--admin-muted)] py-2.5 pr-4 sm:pr-5">Caught</th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
                </div>
`;

const playersRanking = `
<div class="p-4 sm:p-5 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 class="text-sm font-medium text-[var(--admin-muted)]">Top players</h3>
                </div>

                <div class="overflow-x-auto w-full flex-1">
                  <table class="w-full min-w-[400px]">
                    <thead>
                      <tr class="border-b border-[var(--admin-border)]">
                        <th class="text-left text-xs text-[var(--admin-muted)] py-2.5 pl-4 sm:pl-5 pr-4">
                          Discord ID
                        </th>
                        <th class="text-right text-xs text-[var(--admin-muted)] py-2.5 px-4">Total</th>
                        <th class="text-right text-xs text-[var(--admin-muted)] py-2.5 px-4">Unique</th>
                        <th class="text-right text-xs text-[var(--admin-muted)] py-2.5 pr-4 sm:pr-5">Value</th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
                </div>
`;

const chartCardClasses =
  'bg-[var(--admin-card)] hover:border-[var(--admin-border)] transition-colors h-full flex flex-col justify-between';

function rankingCard(markup: string) {
  const card = document.createElement('div');
  card.className = `lg:col-span-2 overflow-hidden rounded-xl ${chartCardClasses}`;
  card.innerHTML = `<div class="p-0 flex flex-col flex-1 justify-between">${markup}<pnd-panel-pagination></pnd-panel-pagination></div>`;
  return {
    card,
    body: card.querySelector('tbody')!,
    pagination: card.querySelector<PanelPagination>('pnd-panel-pagination')!,
  };
}

const choices = filterOptions.map((id) => ({ id, label: id }));

export class DashboardPage extends HTMLElement {
  private readonly state = new DashboardState(() => this.update());
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  private cleanup?: () => void;
  private readonly filters = new PanelChoices();
  private readonly stats = document.createElement('div');
  private readonly charts = document.createElement('div');
  private readonly nations = rankingCard(nationsRanking);
  private readonly players = rankingCard(playersRanking);
  private readonly chart = document.createElement('div');
  private readonly bars = new GrowthBars();
  private readonly rarity = this.nations.card.querySelector('select')!;
  private previousFilter?: DashboardFilter;

  constructor() {
    super();
    const root = document.createElement('div');
    root.className = 'w-full space-y-4 sm:space-y-6';
    const filterRow = document.createElement('div');
    filterRow.className = 'mb-4 sm:mb-6 space-y-3';
    filterRow.append(this.filters);
    const chartContent = document.createElement('div');
    chartContent.className = 'p-4 sm:p-5 flex flex-col flex-1 justify-between';
    chartContent.append(this.bars);
    this.chart.append(chartContent);
    this.charts.className = 'grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch';
    this.charts.append(this.chart);
    root.append(filterRow, this.stats, this.charts);
    this.append(root);

    this.nations.card.querySelector('[data-plural]')!.textContent = bot.collectible.plural;
    this.nations.card.querySelector('[data-singular]')!.textContent = bot.collectible.singular;
    this.rarity.add(new Option('All classes', 'all'));
    for (const rarity of bot.rarityClasses) {
      const option = new Option(formatRarity(rarity), rarity);
      option.className = 'capitalize';
      this.rarity.add(option);
    }
    this.rarity.addEventListener('change', () => this.state.setSelectedClassFilter(this.rarity.value));
  }

  connectedCallback() {
    this.style.display = 'contents';
    this.reducedMotion.addEventListener('change', this.update);
    this.update();
    this.cleanup = this.state.connect();
  }

  disconnectedCallback() {
    this.reducedMotion.removeEventListener('change', this.update);
    this.cleanup?.();
  }

  private updateStats(filterChanged: boolean, animate: boolean) {
    const { selectedFilter, liveStats } = this.state;
    const plural = bot.collectible.plural;
    const stats = [
      ['Users', 'Registered Users', liveStats.userCount, 'Users'],
      ['Nations', `${plural.charAt(0).toUpperCase()}${plural.slice(1)} Caught`, liveStats.totalCaught, 'Globe'],
      ['Nations', 'Catalog Size', liveStats.catalogTotal, 'ArrowUpRight'],
      ['Servers', 'Active Servers', liveStats.guildCount, 'ArrowUpRight'],
    ] as const;
    const visible = stats.filter(([category]) => selectedFilter === 'All' || selectedFilter === category);
    if (filterChanged) {
      const columns =
        visible.length === 1 ? 'max-w-sm' : visible.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4';
      this.stats.className = `grid grid-cols-1 gap-3 sm:gap-4 ${columns}`;
      this.stats.replaceChildren();
    }
    visible.forEach(([, label, value, icon], index) => {
      if (filterChanged) {
        const card = document.createElement('div');
        card.className =
          'rounded-lg bg-[var(--admin-card)] hover:border-[var(--admin-border)] transition-colors h-full';
        card.innerHTML = `
          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between mb-3 gap-3">
              <h3 class="text-xs sm:text-sm font-medium text-[var(--admin-muted)]"></h3>
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${admin.elevated}">
                ${iconSvg(icon, 'h-4 w-4 text-[var(--admin-accent)]')}
              </div>
            </div>
            <p class="text-xl sm:text-2xl font-bold text-[var(--admin-fg)] mb-1 tabular-nums"></p>
          </div>`;
        card.querySelector('h3')!.textContent = label;
        this.stats.append(card);
        if (animate)
          card.animate(
            [
              { opacity: 0, transform: 'translateX(-8px)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 200, delay: 50 + index * 70, fill: 'backwards' },
          );
      }
      const counter = this.stats.children[index].querySelector('p')!;
      const text = value.toLocaleString();
      if (counter.textContent === text) return;
      counter.textContent = text;
      if (animate)
        counter.animate(
          [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 200 },
        );
    });
  }

  private readonly update = () => {
    const state = this.state;
    const { selectedFilter: filter, chartData } = state;
    const prefs = loadAnimationPrefs();
    const motion = prefs.masterEnabled && !this.reducedMotion.matches;
    const animate = motion && prefs.chartMotion;
    const filterChanged = this.previousFilter !== filter;
    this.previousFilter = filter;
    this.filters.state = {
      options: choices,
      active: filter,
      select: (id) => state.setSelectedFilter(id as DashboardFilter),
      appearance: 'dashboard',
    };
    this.updateStats(filterChanged, motion && prefs.listReveal);

    const showNations = filter === 'All' || filter === 'Nations';
    const showPlayers = filter === 'Users';
    if (filterChanged) {
      this.nations.card.remove();
      this.players.card.remove();
      if (showNations) this.chart.before(this.nations.card);
      if (showPlayers) this.chart.before(this.players.card);
      this.chart.className = `rounded-lg ${chartCardClasses}${showNations || showPlayers ? '' : ' lg:col-span-3'}`;
    }

    if (showNations) {
      const entries = state.filteredTopNations;
      const start = (state.nationsPage - 1) * state.nationsRowsPerPage;
      this.rarity.value = state.selectedClassFilter;
      updateRankingRows(
        this.nations.body,
        'nations',
        entries
          .slice(start, start + state.nationsRowsPerPage)
          .map((entry) => [
            { text: entry.id },
            { text: entry.name, title: entry.name },
            { text: formatRarity(entry.class) },
            { text: entry.globalCaught.toLocaleString() },
          ]),
        animate,
      );
      this.nations.pagination.state = {
        totalItems: entries.length,
        pageSize: state.nationsRowsPerPage,
        setPageSize: state.setNationsRowsPerPage,
        currentPage: state.nationsPage,
        setCurrentPage: state.setNationsPage,
      };
    }
    if (showPlayers) {
      const entries = state.sortedTopUsers;
      const start = (state.usersPage - 1) * state.usersRowsPerPage;
      updateRankingRows(
        this.players.body,
        'players',
        entries
          .slice(start, start + state.usersRowsPerPage)
          .map((user) => [
            { text: user.discordId, title: user.username || user.discordId },
            { text: user.total.toLocaleString() },
            { text: user.unique.toLocaleString() },
            { text: user.totalValue.toLocaleString() },
          ]),
        animate,
      );
      this.players.pagination.state = {
        totalItems: entries.length,
        pageSize: state.usersRowsPerPage,
        setPageSize: state.setUsersRowsPerPage,
        currentPage: state.usersPage,
        setCurrentPage: state.setUsersPage,
      };
    }
    const latest = chartData.findIndex((item) => item.isLatest);
    this.bars.state = {
      title: growthChartTitles[filter],
      range: state.timeRange,
      onRange: state.setTimeRange,
      loading: state.isChartLoading,
      bars: chartData.map((item) => ({ ...item, unit: getUnitLabel(item.count, filter) })),
      active: Math.max(0, latest < 0 ? chartData.length - 1 : latest),
      animate,
    };
  };
}

customElements.define('pnd-dashboard-page', DashboardPage);
