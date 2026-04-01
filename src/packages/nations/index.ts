/**
 * Nations package
 */
import type { Package } from '../../types';
import completion from './completion';
import list from './list';

const nationsPackage: Package = {
  name: 'nations',
  description: 'Nation collection, inventory and completion tracking.',
  commands: [completion, list],
};

export default nationsPackage;
