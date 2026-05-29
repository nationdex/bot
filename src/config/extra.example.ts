export type NationDexExtra = {
  /** Human-readable label used in startup logs. */
  name: string;
  /**
   * Git remote URL or local folder for development.
   * Examples:
   * - https://github.com/org/my-extra.git
   * - git+https://github.com/org/my-extra.git
   * - ./extra/my-local-extra
   */
  location: string;
  /** Subfolder inside the extra that contains functions/, commands/, and slash/. */
  path: string;
  /** When false, the extra is skipped without removing its entry. */
  enabled: boolean;
  /** Optional git branch or tag. Defaults to the repository default branch. */
  ref?: string;
};

export const extras: NationDexExtra[] = [
  // {
  //   name: 'Femboy Pack',
  //   location: 'https://github.com/Berk404/NationDex-Femboy-Pack.git',
  //   path: 'femboy',
  //   enabled: false,
  // },
];
