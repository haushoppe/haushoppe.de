// Body-Klassen exakt wie live (Astra steuert den Content-Container darüber).
// Portfolio-Detailseiten sind live `ast-separate-container ast-two-container`
// (boxed, weiße Box, Bild in natürlicher Breite) — NICHT full-width wie die Home.
export function portfolioBodyClass(postId: string | number): string {
  return [
    'wp-singular',
    'portfolio-template-default',
    'single',
    'single-portfolio',
    `postid-${postId}`,
    'wp-custom-logo',
    'wp-embed-responsive',
    'wp-theme-astra',
    'wp-child-theme-astra-childtheme',
    'stk--is-astra-theme',
    'ast-desktop',
    'ast-separate-container',
    'ast-two-container',
    'ast-no-sidebar',
    'astra-4.13.6',
    'ast-header-custom-item-inside',
    'ast-single-post',
    'ast-inherit-site-logo-transparent',
    'astra-addon-4.13.5',
  ].join(' ');
}
