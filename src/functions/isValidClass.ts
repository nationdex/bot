import { ForgeFunction } from '@tryforge/forgescript';

export default new ForgeFunction({
  name: 'isValidClass',
  // Checks if a class ID is valid
  params: [
    {
      name: 'class',
      // The class ID to check
      type: 'String',
      required: true
    }
  ],
  code: `
  $jsonLoad[classes;$collectiblesData[classes]]
  $return[$arrayIncludes[classes;$env[class]]]
  `
})