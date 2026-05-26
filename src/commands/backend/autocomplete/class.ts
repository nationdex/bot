import { BaseCommand } from '@tryforge/forgescript';

export default new BaseCommand({
  type: 'interactionCreate',
  allowedInteractionTypes: ['autocomplete'],
  code: `
  $onlyIf[$focusedOptionName==class]
  $jsonLoad[classes;$getNationsData[classes]]
  
  $onlyIf[$arrayLength[classes]>0;
    $addChoice[Classes were not set upped;null]
  ]
  
  $arrayForEach[classes;class;$addChoice[$toTitleCase[$env[class]];$env[class]]]
  `
});