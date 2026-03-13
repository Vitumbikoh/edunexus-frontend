
import type { Config } from "tailwindcss";
import { COLORS } from "./src/lib/colors";

const paletteScale = (hex: string) => ({
	50: hex,
	100: hex,
	200: hex,
	300: hex,
	400: hex,
	500: hex,
	600: hex,
	700: hex,
	800: hex,
	900: hex,
	950: hex,
});

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// School management system theme colors
				sms: {
					primary: COLORS.primary,
					secondary: COLORS.secondary,
					accent: COLORS.accent,
					light: COLORS.background,
					dark: COLORS.black,
				},
				blue: paletteScale(COLORS.primary),
				indigo: paletteScale(COLORS.primary),
				cyan: paletteScale(COLORS.primary),
				sky: paletteScale(COLORS.primary),
				green: paletteScale(COLORS.secondary),
				emerald: paletteScale(COLORS.secondary),
				teal: paletteScale(COLORS.secondary),
				yellow: paletteScale(COLORS.accent),
				orange: paletteScale(COLORS.accent),
				amber: paletteScale(COLORS.accent),
				red: paletteScale(COLORS.danger),
				rose: paletteScale(COLORS.danger),
				pink: paletteScale(COLORS.danger),
				gray: paletteScale(COLORS.grey),
				slate: paletteScale(COLORS.grey),
				zinc: paletteScale(COLORS.grey),
				neutral: paletteScale(COLORS.neutral),
				stone: paletteScale(COLORS.neutral),
				white: COLORS.white,
				black: COLORS.black,
				sidebarbrand: COLORS.sidebarBackground,
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("tailwind-scrollbar-hide")],
} satisfies Config;
