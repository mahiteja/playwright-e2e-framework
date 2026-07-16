/**
 * Author: Mahiteja Bollojula
 * LinkedIn: https://www.linkedin.com/in/mahiteja-bollojula-477a60145/
 * headerLoader.ts
 *
 * Re-exports loadHeaders from the central resourceLoader so that existing
 * imports of this module continue to work without change.
 *
 * Headers are now stored in resources/headers/<env>.yaml.
 */

export { loadHeaders } from './resourceLoader';
