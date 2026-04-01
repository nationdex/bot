/**
 * Info package
 */
import type { Package } from '../../types';
import about from './about';
import help from './help';

const infoPackage: Package = {
  name: 'info',
  description: 'General informational commands (about, help).',
  commands: [about, help],
};

export default infoPackage;
