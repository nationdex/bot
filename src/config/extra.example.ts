export type NationDexExtra = {
  /** Human-readable label used in startup logs. */
  name: string;
  /**
   * npm install target.
   * Examples:
   * - github:org/my-extra#main
   * - @scope/my-extra
   * - file:../my-local-extra
   */
  location: string;
  /** Optional subfolder inside the package with functions/, commands/, and slash/. */
  path?: string;
  /** When false, the extra is skipped without removing its entry. */
  enabled: boolean;
};

export const extras: NationDexExtra[] = [
  // {
  //   name: 'Femboy Pack',
  //   location: 'github:Berk404/NationDex-Femboy-Pack#main',
  //   path: 'dist',
  //   enabled: false,
  // },
];
