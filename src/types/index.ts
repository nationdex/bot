import type { IApplicationCommandData } from '@tryforge/forgescript';

/**
 * A single ForgeScript application (slash) command.
 * Mirrors IApplicationCommandData from @tryforge/forgescript so commands can
 * be handed directly to client.applicationCommands.add().
 */
export type Command = IApplicationCommandData;

/**
 * A logical grouping of related commands
 *
 * Each package directory should expose one of these as its default export
 * via its index.ts barrel file.
 */
export interface Package {
  /** Internal identifier used for logging and debugging. */
  name: string;

  /** Human-readable description of what this package provides. */
  description: string;

  /** All commands belonging to this package. */
  commands: Command[];
}
