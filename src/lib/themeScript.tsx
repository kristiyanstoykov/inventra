// src/components/ThemeScript.tsx
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    try {
      const theme = document.cookie.match(/(^|;)\\s*theme=([^;]+)/)?.[2];
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (theme === 'dark' || (!theme && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch (_) {}
  })();
          `.trim(),
      }}
    />
  );
}
