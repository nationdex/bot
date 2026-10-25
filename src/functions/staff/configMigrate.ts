import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'configMigrate',
  // Moves the old author, dev and webDev credits of a stored config into the maintainers list. Runs at startup.
  params: [
  ],
  code: `
  $let[lock;$mutex[acquire;config:config]]
  $jsonLoad[cfg;$default[$getGlobalVar[config];{}]]
  $let[old;$or[$jsonHas[cfg;author];$jsonHas[cfg;dev];$jsonHas[cfg;webDev]]]
  $if[$and[$get[old];$jsonHas[cfg;maintainers]==false];
    $jsonLoad[people;{}]
    $if[$jsonHas[cfg;author];$!jsonSet[people;$replace[$env[cfg;author;name]; ;_];$env[cfg;author;profile]]]
    $if[$jsonHas[cfg;dev];$!jsonSet[people;$replace[$env[cfg;dev;name]; ;_];$env[cfg;dev;profile]]]
    $if[$jsonHas[cfg;webDev];$!jsonSet[people;$replace[$env[cfg;webDev;name]; ;_];$env[cfg;webDev;profile]]]
    $!jsonSet[cfg;maintainers;$env[people]]
  ]
  $if[$get[old];
    $if[$jsonHas[cfg;author];$!jsonDelete[cfg;author]]
    $if[$jsonHas[cfg;dev];$!jsonDelete[cfg;dev]]
    $if[$jsonHas[cfg;webDev];$!jsonDelete[cfg;webDev]]
    $setGlobalVar[config;$env[cfg]]
  ]
  $!mutex[release;config:config;$get[lock]]
  $return[$if[$get[old];migrated;unchanged]]
  `,
});
