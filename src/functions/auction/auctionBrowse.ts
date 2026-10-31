import { ForgeFunction } from '@tryforge/forgescript';
import { auctionConfig } from '../../config/auction';

export default new ForgeFunction({
  name: 'auctionBrowse',
  // Private browse panel: bullet list, filter menu, auction picker, pagination and a staff-only settle button. filter: all, mine, bidding.
  params: [
    {
      name: 'viewer',
      type: 'String',
      required: true,
    },
    {
      name: 'filter',
      type: 'String',
      required: false,
    },
    {
      name: 'page',
      type: 'String',
      required: false,
    },
  ],
  code: `
  $let[viewer;$env[viewer]]
  $let[filter;$if[$or[$env[filter]==mine;$env[filter]==bidding];$env[filter];all]]
  $let[page;$if[$and[$isNumber[$env[page]];$env[page]>0];$env[page];1]]
  $let[curName;$jsonVar[keywords;currency.plural]]
  $jsonLoad[house;$default[$getGlobalVar[auctionHouse];{}]]
  $jsonLoad[pg;$js[
    (() => {
      const h = ctx.getEnvironmentKey('house')
      const viewer = String(ctx.getKeyword('viewer'))
      const filter = String(ctx.getKeyword('filter'))
      const size = ${auctionConfig.pageSize}
      const now = Date.now()
      const num = (n) => Number(n).toLocaleString('en-US')
      const rel = (ms) => {
        const s = Math.max(0, Math.floor(ms / 1000))
        const d = Math.floor(s / 86400)
        const hr = Math.floor((s % 86400) / 3600)
        const m = Math.floor((s % 3600) / 60)
        return d ? d + 'd ' + hr + 'h' : hr ? hr + 'h ' + m + 'm' : Math.max(1, m) + 'm'
      }
      let list = h && typeof h === 'object' && h.auctions && typeof h.auctions === 'object' ? Object.values(h.auctions) : new Array()
      list = list.filter((a) => a && Number(a.ends) > now)
      const all = list.length
      if (filter === 'mine') list = list.filter((a) => String(a.seller) === viewer)
      if (filter === 'bidding') list = list.filter((a) => String(a.bidder || '') === viewer)
      list.sort((x, y) => Number(x.ends) - Number(y.ends))
      const pages = Math.max(1, Math.ceil(list.length / size))
      const page = Math.min(Math.max(1, Number(ctx.getKeyword('page')) || 1), pages)
      const items = list.slice((page - 1) * size, page * size).map((a) => {
        const bids = Number(a.bids) || 0
        return {
          id: String(a.id),
          colID: String(a.colID),
          nation: String(a.nation),
          price: num(a.bidder ? a.bid : a.start),
          bidsText: bids === 0 ? 'no bids' : bids === 1 ? '1 bid' : bids + ' bids',
          endsSec: Math.floor(Number(a.ends) / 1000),
          rel: rel(Number(a.ends) - now),
        }
      })
      return JSON.stringify({ total: list.length, all: all, pages: pages, page: page, items: items })
    })()
  ]]
  $let[page;$env[pg;page]]
  $let[pages;$env[pg;pages]]
  $let[total;$env[pg;total]]
  $jsonLoad[items;$env[pg;items]]
  $let[staff;$hasCap[$get[viewer];auction.moderate]]

  $arrayMap[items;it;
    $return[- **#$env[it;id]** · $getSpecial[$collectible[$env[it;nation];special];emoji]$appEmoji[$collectibleInfo[$env[it;colID];emoji_id]] **$collectibleInfo[$env[it;colID];name]** · $env[it;price] $get[curName] ($env[it;bidsText]) · ends <t:$env[it;endsSec]:R>]
  ;lines]
  $let[body;$arrayJoin[lines;
]]
  $let[empty;$if[$get[filter]==mine;You have no active listings. Use \`/auction create\` to list one.;$if[$get[filter]==bidding;You are not the top bidder on any auction.;No active auctions right now. Use \`/auction create\` to list one.]]]

  $let[navId;$get[viewer]-$get[filter]]
  $addContainer[
    $addTextDisplay[## Auction House$if[$get[filter]==mine; · My listings]$if[$get[filter]==bidding; · My bids]]
    $addSeparator
    $addTextDisplay[$if[$get[total]==0;- $get[empty];$get[body]]]
    $addTextDisplay[-# $get[total] active · $env[pg;all] in the house · page $get[page] of $get[pages]]
    $addSeparator
    $addActionRow
    $addStringSelectMenu[auction-filter-$get[navId]-1;Filter auctions]
    $addOption[All auctions;Every active auction;all;;$checkCondition[$get[filter]==all]]
    $addOption[My listings;Auctions you are selling;mine;;$checkCondition[$get[filter]==mine]]
    $addOption[My bids;Auctions where you are the top bidder;bidding;;$checkCondition[$get[filter]==bidding]]
    $addActionRow
    $if[$get[total]>0;
      $addStringSelectMenu[auction-pick-$get[navId]-$get[page];Select an auction to view]
      $arrayForEach[items;it;
        $addOption[$cropText[#$env[it;id] · $collectibleInfo[$env[it;colID];name];0;95;...];$env[it;price] $get[curName] ($env[it;bidsText]) · ends in $env[it;rel];$env[it;id];$appEmoji[$collectibleInfo[$env[it;colID];emoji_id]]]
      ]
    ;
      $addStringSelectMenu[auction-pick-$get[navId]-$get[page];No auctions to select;true]
      $addOption[Nothing to select;Pick another filter or list a $jsonVar[keywords;collectible.singular];none]
    ]
    $addActionRow
    $addButton[auction-page-$get[navId]-$sub[$get[page];1];Previous;Secondary;;$if[$get[page]<=1;true;false]]
    $addButton[auction-page-$get[navId]-index;$get[page] / $get[pages];Primary;;true]
    $addButton[auction-page-$get[navId]-$sum[$get[page];1];Next;Secondary;;$if[$get[page]>=$get[pages];true;false]]
    $if[$get[staff];
      $addButton[auction-settle-$get[navId]-$get[page];Settle expired;Danger]
    ]
  ;$jsonVar[config;accent]]
  `,
});
