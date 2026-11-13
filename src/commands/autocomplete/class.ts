import { command } from '../../core/define/commands';

export default command('autocomplete.class', `
  $onlyIf[$focusedOptionName==class]
  $jsonLoad[classes;$collectiblesData[classes]]
  
  $onlyIf[$arrayLength[classes]>0;
    $addChoice[Classes were not set;null]
  ]
  
  $arrayForEach[classes;class;$addChoice[$toTitleCase[$env[class]];$env[class]]]
`);
