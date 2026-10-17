/**
 * Theme resolution for the root layout.
 *
 * The preference lives in UserPreferences (saved by the settings page); the
 * <html> class must be server-rendered so logged-in users never see a theme
 * flash. SYSTEM defers to the OS via the inline script from themeScript().
 */

export type AppTheme = 'LIGHT' | 'DARK' | 'SYSTEM';

/**
 * The class for <html> as rendered by the server. SYSTEM renders dark first —
 * the inline script corrects it to the OS preference before first paint.
 */
export function themeToHtmlClass(theme: string | null | undefined): 'dark' | '' {
  return theme === 'LIGHT' ? '' : 'dark';
}

/**
 * Inline script for <body> start. Only SYSTEM needs client work: resolve the
 * OS preference immediately (before paint) and keep following it live.
 */
export function themeScript(theme: string): string {
  if (theme !== 'SYSTEM') return '';
  return `(function(){try{
var mq=window.matchMedia('(prefers-color-scheme: dark)');
document.documentElement.classList.toggle('dark',mq.matches);
var on=function(e){document.documentElement.classList.toggle('dark',e.matches);};
if(mq.addEventListener){mq.addEventListener('change',on);}
else if(mq.addListener){mq.addListener(on);}
}catch(e){}})();`;
}
