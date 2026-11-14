LUMOQRA BRAND KIT
=================
Brand purple: #6D28D9   (light purple for dark backgrounds: #C4B5FD, dark bg: #12071F)

LOGO (logo/)  - letters are converted to outlines, so no font is needed
  lumoqra-logo-purple.svg             transparent background (main logo)
  lumoqra-logo-white.svg              for dark / purple backgrounds
  lumoqra-logo-black.svg              one-colour print
  lumoqra-logo-purple-on-white.svg    with white background
  lumoqra-icon-purple.svg             ring "o" symbol only

PNG (png/)  - 2000px and 800px wide; transparent unless "on-white"

FAVICON (favicon/)  - favicon.svg, favicon.ico, 32 / 180 (Apple touch) / 512 px PNG

FONT (font/)  - Outfit Bold (700), SIL Open Font License, free for commercial use
  Used as the base for the letters. Only needed if you want to set matching text on the site.
  Google Fonts: https://fonts.google.com/specimen/Outfit

WEBSITE SNIPPETS
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="apple-touch-icon" href="/favicon-180.png">

  <img src="/logo/lumoqra-logo-purple.svg" alt="Lumoqra" height="40">

  @font-face {
    font-family: "Outfit";
    font-weight: 700;
    font-display: swap;
    src: url("/font/outfit-latin-700-normal.woff2") format("woff2"),
         url("/font/outfit-latin-700-normal.woff") format("woff");
  }
  h1, h2 { font-family: "Outfit", sans-serif; font-weight: 700; }
