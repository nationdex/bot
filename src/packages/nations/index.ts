/**
 * Nations package
 */
import type { Package } from '../../types';
import prog from './prog';

const nationsPackage: Package = {
  name: 'nations',
  description: 'Nation collection, inventory and completion tracking.',
  commands: [prog],
};

export default nationsPackage;
