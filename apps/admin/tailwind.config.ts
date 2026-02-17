import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#c68cfa',
                'primary-hover': '#d4a5fb',
                dark: '#0f0f0f',
                'card-bg': '#181818',
                'card-hover': '#282828',
            },
        },
    },
    plugins: [],
};

export default config;
