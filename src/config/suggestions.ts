import { ApplicationCommandOptionType, ApplicationIntegrationType } from 'discord.js';
import type { SlashCommandConfig, SlashOptionConfig, SlashSubcommandConfig } from './slash';
import { variables } from './variables';

const singular = variables.keywords.collectible.singular;
const T = ApplicationCommandOptionType;

export const suggestionLimits = {
  maxOpenPerUser: 3,
  cooldownMs: 10 * 60 * 1000,
  pageSize: 8,
  maxImageBytes: 8 * 1024 * 1024,
  stagingDir: 'assets/suggestions',
};

const regimeChoices = ['democracy', 'dictatorship', 'monarchy', 'nationalism', 'union'].map((r) => ({
  name: r.charAt(0).toUpperCase() + r.slice(1),
  value: r,
}));

const economyChoices = ['capitalism', 'communism'].map((e) => ({
  name: e.charAt(0).toUpperCase() + e.slice(1),
  value: `${e}.png`,
}));

const nationOpts = (required: boolean): SlashOptionConfig[] => [
  { type: T.String, name: 'name', description: `Full ${singular} name`, required, max_length: 48 },
  { type: T.String, name: 'catch_names', description: 'Comma-separated names players can catch it with', required, max_length: 300 },
  { type: T.String, name: 'class', description: 'Rarity class', required, autocomplete: true },
  { type: T.Number, name: 'rarity', description: 'Spawn weight (higher = more common)', required, min_value: 0.01, max_value: 100 },
  { type: T.Integer, name: 'health', description: 'Health stat', required, min_value: 1, max_value: 9999 },
  { type: T.Integer, name: 'attack', description: 'Attack stat', required, min_value: 1, max_value: 9999 },
  { type: T.String, name: 'regime', description: 'Regime (card background)', required, choices: regimeChoices },
  { type: T.String, name: 'economy', description: 'Economy (card badge)', required, choices: economyChoices },
  { type: T.String, name: 'ability_name', description: 'Ability name', required, max_length: 64 },
  { type: T.String, name: 'ability_description', description: 'Ability description', required, max_length: 256 },
  { type: T.String, name: 'artist', description: 'Artwork credit', required, max_length: 64 },
  { type: T.Attachment, name: 'image', description: 'Spawn art (PNG/JPG/WEBP)', required },
];

const nationExtraOpts: SlashOptionConfig[] = [
  { type: T.String, name: 'short_name', description: 'Short display name used on the card', required: false, max_length: 24 },
  { type: T.String, name: 'translations', description: 'Comma-separated translated catch names', required: false, max_length: 300 },
  { type: T.Attachment, name: 'alt_image', description: 'Collection card art (defaults to the spawn art)', required: false },
];

export const suggestionsCommand: SlashCommandConfig = {
  name: 'suggestions',
  description: 'Submit and browse community suggestions',
  tags: ['suggestions', 'community'],
  integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
  subcommands: {
    nation: {
      name: 'nation',
      description: `Suggest a new ${singular}`,
      tags: ['suggestions', singular],
      options: [...nationOpts(true), ...nationExtraOpts],
    },
    feature: {
      name: 'feature',
      description: 'Suggest a feature or report a bug',
      tags: ['suggestions', 'feature', 'bug'],
    },
    browse: {
      name: 'browse',
      description: 'Browse, vote on, edit and withdraw suggestions',
      tags: ['suggestions', 'browse'],
    },
  },
};

export const suggestionAdminCommand: SlashSubcommandConfig = {
  name: 'suggestions',
  description: 'Review community suggestions and set the public channel (bot staff only)',
  tags: ['admin', 'suggestions', 'queue'],
};

// Modal field metadata, keyed by suggestion field name. kind: text | number | select | file.
export const suggestionEditFields: Record<string, { type: 'nation' | 'feature'; label: string; kind: string; style?: 'short' | 'paragraph'; max?: number; optional?: boolean; hint?: string }> = {
  name: { type: 'nation', label: 'Name', kind: 'text', style: 'short', max: 48 },
  short_name: { type: 'nation', label: 'Short name', kind: 'text', style: 'short', max: 24, optional: true, hint: 'Leave empty to remove' },
  catch_names: { type: 'nation', label: 'Catch names', kind: 'text', style: 'paragraph', max: 300, hint: 'Comma-separated' },
  translations: { type: 'nation', label: 'Translations', kind: 'text', style: 'paragraph', max: 300, optional: true, hint: 'Comma-separated, empty to remove' },
  class: { type: 'nation', label: 'Class', kind: 'select' },
  rarity: { type: 'nation', label: 'Spawn weight', kind: 'number', style: 'short', max: 12, hint: '0.01 to 100, higher = more common' },
  health: { type: 'nation', label: 'Health', kind: 'number', style: 'short', max: 4, hint: '1 to 9999' },
  attack: { type: 'nation', label: 'Attack', kind: 'number', style: 'short', max: 4, hint: '1 to 9999' },
  regime: { type: 'nation', label: 'Regime', kind: 'select' },
  economy: { type: 'nation', label: 'Economy', kind: 'select' },
  ability_name: { type: 'nation', label: 'Ability name', kind: 'text', style: 'short', max: 64 },
  ability_description: { type: 'nation', label: 'Ability description', kind: 'text', style: 'paragraph', max: 256 },
  artist: { type: 'nation', label: 'Artist credit', kind: 'text', style: 'short', max: 64 },
  spawn_art: { type: 'nation', label: 'Spawn art', kind: 'file' },
  window_art: { type: 'nation', label: 'Collection art', kind: 'file' },
  title: { type: 'feature', label: 'Title', kind: 'text', style: 'short', max: 100 },
  description: { type: 'feature', label: 'Description', kind: 'text', style: 'paragraph', max: 1500 },
};

export const suggestionRegimes = regimeChoices.map((r) => r.value);
export const suggestionEconomies = economyChoices.map((e) => e.value);
