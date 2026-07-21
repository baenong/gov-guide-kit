import siteConfig from '../site.config';
import { meetsAA } from '../src/lib/contrast';

const pairs: Array<[string, string, string]> = [
  ['primary', siteConfig.colors.primary, '#FFFFFF'],
  ['secondary', siteConfig.colors.secondary, '#FFFFFF'],
];

let hasFailure = false;
for (const [name, foreground, background] of pairs) {
  if (!meetsAA(foreground, background)) {
    console.warn(
      `[check-contrast] "${name}" (${foreground}) on ${background} fails WCAG AA (4.5:1) for body text.`,
    );
    hasFailure = true;
  }
}

if (hasFailure) {
  console.warn('[check-contrast] Build will continue — review site.config.ts colors for accessibility.');
} else {
  console.log('[check-contrast] All configured colors meet WCAG AA contrast.');
}
