import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	safelist: ['dark'],
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/shadcn-svelte/dist/**/*.{js,svelte,ts}'
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		borderColor: {
			DEFAULT: 'rgba(var(--border) / 5%)'
		},
		extend: {
			colors: {
				input: 'rgba(var(--input) / <alpha-value>)',
				ring: 'rgba(var(--ring) / <alpha-value>)',
				background: 'rgba(var(--background) / <alpha-value>)',
				foreground: 'rgba(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'rgba(var(--primary) / <alpha-value>)',
					foreground: 'rgba(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'rgba(var(--secondary) / <alpha-value>)',
					foreground: 'rgba(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'rgba(var(--destructive) / <alpha-value>)',
					foreground: 'rgba(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'rgba(var(--muted) / <alpha-value>)',
					foreground: 'rgba(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'rgba(var(--accent) / <alpha-value>)',
					foreground: 'rgba(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'rgba(var(--popover) / <alpha-value>)',
					foreground: 'rgba(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'rgba(var(--card) / <alpha-value>)',
					foreground: 'rgba(var(--card-foreground) / <alpha-value>)'
				},
				sidebar: {
					DEFAULT: 'rgba(var(--sidebar-background))',
					foreground: 'rgba(var(--sidebar-foreground))',
					primary: 'rgba(var(--sidebar-primary))',
					'primary-foreground': 'rgba(var(--sidebar-primary-foreground))',
					accent: 'rgba(var(--sidebar-accent))',
					'accent-foreground': 'rgba(var(--sidebar-accent-foreground))',
					border: 'rgba(var(--sidebar-border))',
					ring: 'rgba(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				xl: 'calc(var(--radius) + 4px)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif']
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--bits-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--bits-accordion-content-height)' },
					to: { height: '0' }
				},
				'caret-blink': {
					'0%,70%,100%': { opacity: '1' },
					'20%,50%': { opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'caret-blink': 'caret-blink 1.25s ease-out infinite'
			}
		}
	},
	plugins: [tailwindcssAnimate]
};

export default config;
