import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://starlight.astro.build/reference/configuration/
// Optimizado para GitHub Pages: https://docs.astro.build/en/guides/deploy/github/
export default defineConfig({
  site: 'https://jhonma82.github.io',
  base: '/CNC-Docs/',
  integrations: [
    starlight({
      title: 'CNC Docs',
      description: 'Documentación definitiva en español para LinuxCNC, PrintNC y ecosistema CNC - Mesa, Remora, grblHAL, FluidNC',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Español',
          lang: 'es',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/JhonMA82/CNC-Docs' },
      ],
      editLink: {
        baseUrl: 'https://github.com/JhonMA82/CNC-Docs/edit/main/',
      },
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        {
          label: 'Inicio',
          items: [
            { label: 'Bienvenido', slug: 'index' },
            { label: 'Introducción', slug: 'guides/introduction' },
            { label: 'Cómo contribuir', slug: 'guides/contribuir' },
          ],
        },
        {
          label: 'LinuxCNC',
          items: [
            {
              label: 'Básico',
              items: [{ autogenerate: { directory: 'linuxcnc/basico' } }],
            },
            {
              label: 'Intermedio',
              items: [{ autogenerate: { directory: 'linuxcnc/intermedio' } }],
            },
            {
              label: 'Avanzado',
              items: [{ autogenerate: { directory: 'linuxcnc/avanzado' } }],
            },
            {
              label: 'Hardware',
              items: [
                { label: 'Mesa 7i96S / 7i76E', slug: 'hardware/mesa' },
                { label: 'Remora (STM32 / ESP32)', slug: 'hardware/remora' },
                { label: 'PrintNC v4', slug: 'hardware/printnc' },
              ],
            },
            {
              label: 'CAM',
              items: [{ autogenerate: { directory: 'cam' } }],
            },
            {
              label: 'Glosario',
              items: [{ autogenerate: { directory: 'glosario' } }],
            },
          ],
        },
        {
          label: 'Harness DeepSeek',
          items: [{ autogenerate: { directory: 'harness' } }],
        },
        {
          label: 'Roadmap',
          items: [
            { label: 'Futuro: grblHAL', slug: 'roadmap/grblhal' },
            { label: 'Futuro: FluidNC', slug: 'roadmap/fluidnc' },
          ],
        },
      ],
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: '/CNC-Docs/og.png' } },
      ],
    }),
  ],
});
