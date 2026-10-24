import { ForgeFunction } from '@tryforge/forgescript';
import { accessCapabilities } from '../../config/access';

// Every capability, plus * and one namespace wildcard (such as suggestions.*) for each namespace that has several.
const namespaces = [...new Set(accessCapabilities.map((cap) => cap.split('.')[0]))]
  .filter((ns) => accessCapabilities.filter((cap) => cap.startsWith(ns + '.')).length > 1)
  .map((ns) => ns + '.*');
const all = ['*', ...namespaces, ...accessCapabilities];

export default new ForgeFunction({
  name: 'accessCapabilityList',
  // Returns every capability a role can hold as a JSON array, for autocomplete.
  params: [
  ],
  code: `$return[${JSON.stringify(all).split(']').join('\\]')}]`,
});
