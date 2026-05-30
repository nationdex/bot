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
  /**
   * When false, the extra is skipped without removing its entry.
   * Files in an enabled extra replace core modules with the same slash path,
   * event-command filename, or ForgeFunction name.
   */
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
