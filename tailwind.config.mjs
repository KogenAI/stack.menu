// Tailwind settings shared by every Stack Menu page. Load right after the Tailwind CDN script.
export default {
  // Tailwind's own `container` rule widens the page past 1200px at some screen sizes; site.css defines .container instead.
  content: ['./src/**/*.{astro,html,js}', './scripts/**/*.py', './public/design/*.js'],
  corePlugins: { container: false },
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        elevated: 'var(--elevated)',
        ink: 'var(--ink)',
        body: 'var(--body)',
        mute: 'var(--mute)',
        hairline: 'var(--hairline)',
        soft: 'var(--hairline-soft)',
        'on-primary': 'var(--on-primary)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'Arial', 'sans-serif'],
      },
      borderRadius: { lg: '16px' },
    },
  },
};
