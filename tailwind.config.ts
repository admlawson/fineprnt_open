import type { Config } from "tailwindcss";

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
				'border-strong': 'hsl(var(--border-strong))',
				input: 'hsl(var(--input))',
				'input-border': 'hsl(var(--input-border))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				// Glass surfaces
				glass: 'hsl(var(--glass))',
				'glass-border': 'hsl(var(--glass-border))',
				'glass-hover': 'hsl(var(--glass-hover))',
				// Surfaces
				surface: 'hsl(var(--surface))',
				'surface-elevated': 'hsl(var(--surface-elevated))',
				'surface-glass': 'hsl(var(--surface-glass))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))',
					active: 'hsl(var(--primary-active))',
					glass: 'hsl(var(--primary-glass))',
					soft: 'hsl(var(--primary-soft))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))',
					glass: 'hsl(var(--secondary-glass))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
					hover: 'hsl(var(--destructive-hover))',
					glass: 'hsl(var(--destructive-glass))',
					soft: 'hsl(var(--destructive-soft))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
					glass: 'hsl(var(--muted-glass))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					hover: 'hsl(var(--accent-hover))',
					glass: 'hsl(var(--accent-glass))',
					soft: 'hsl(var(--accent-soft))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
					border: 'hsl(var(--popover-border))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					border: 'hsl(var(--card-border))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
					glass: 'hsl(var(--sidebar-glass))'
				},
				chat: {
					'message-user': 'hsl(var(--chat-message-user))',
					'message-assistant': 'hsl(var(--chat-message-assistant))',
					input: 'hsl(var(--chat-input))',
					'bubble-glass': 'hsl(var(--chat-bubble-glass))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-glass': 'var(--gradient-glass)',
				'gradient-surface': 'var(--gradient-surface)'
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
				'strong': 'var(--shadow-strong)',
				'glass': 'var(--shadow-glass)',
				'elevated': 'var(--shadow-elevated)'
			},
			spacing: {
				'xs': 'var(--space-xs)',
				'sm': 'var(--space-sm)',
				'md': 'var(--space-md)',
				'lg': 'var(--space-lg)',
				'xl': 'var(--space-xl)',
				'2xl': 'var(--space-2xl)',
				'3xl': 'var(--space-3xl)'
			},
			transitionDuration: {
				'fast': 'var(--transition-fast)',
				'medium': 'var(--transition-medium)',
				'slow': 'var(--transition-slow)',
				'spring': 'var(--transition-spring)'
			},
			borderRadius: {
				'sm': 'var(--radius-sm)',
				DEFAULT: 'var(--radius)',
				'md': 'var(--radius-md)',
				'lg': 'var(--radius-lg)',
				'xl': 'var(--radius-xl)',
				'2xl': 'var(--radius-2xl)'
			},
				fontFamily: {
					sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
				},
			fontSize: {
				'xs': ['0.75rem', { lineHeight: '1.5' }],
				'sm': ['0.875rem', { lineHeight: '1.5' }],
				'base': ['1rem', { lineHeight: '1.6' }],
				'lg': ['1.125rem', { lineHeight: '1.6' }],
				'xl': ['1.25rem', { lineHeight: '1.6' }],
				'2xl': ['1.5rem', { lineHeight: '1.4' }],
				'3xl': ['1.875rem', { lineHeight: '1.3' }],
				'4xl': ['2.25rem', { lineHeight: '1.2' }],
			},
			backdropBlur: {
				'glass': '12px',
				'strong': '20px',
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
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
