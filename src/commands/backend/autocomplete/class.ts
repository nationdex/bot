import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$focusedOptionName==class]
  $jsonLoad[classes;$collectiblesData[classes]]
  
  $onlyIf[$arrayLength[classes]>0;
    $addChoice[Classes were not set;null]
  ]
  
  $arrayForEach[classes;class;$addChoice[$toTitleCase[$env[class]];$env[class]]]
  `,
});
