/**
 * Promocode package
 */
import type { Package } from '../../types';
import codes from './codes';

const promocodePackage: Package = {
  name: 'promocode',
  description: 'Promo code redemption commands.',
  commands: [codes],
};

export default promocodePackage;
