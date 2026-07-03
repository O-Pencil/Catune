/**
 * Tailwind / NativeWind 配置（react-native-reusables 风格）：
 * - 颜色全部走 CSS variables（与 global.css 一一对应）
 * - Catune 业务 token 通过 hsl(var(--xxx)) 暴露
 * - 单一来源仍是 global.css 的 CSS variables，方便"只改主题"
 */
const {hairlineWidth} = require('nativewind/theme');

function withOpacity(variableName) {
  return ({opacityValue}) => {
    if (opacityValue !== undefined) {
      return `hsl(var(--${variableName}) / ${opacityValue})`;
    }
    return `hsl(var(--${variableName}))`;
  };
}

module.exports = {
  darkMode: 'class',
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
    './src/design/primitives/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: withOpacity('border'),
        input: withOpacity('input'),
        ring: withOpacity('ring'),
        background: withOpacity('background'),
        foreground: withOpacity('foreground'),
        primary: {
          DEFAULT: withOpacity('primary'),
          foreground: withOpacity('primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('secondary'),
          foreground: withOpacity('secondary-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('destructive'),
          foreground: withOpacity('destructive-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('muted'),
          foreground: withOpacity('muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('accent'),
          foreground: withOpacity('accent-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('popover'),
          foreground: withOpacity('popover-foreground'),
        },
        card: {
          DEFAULT: withOpacity('card'),
          foreground: withOpacity('card-foreground'),
        },
        // Catune 业务语义 token（保留品牌橙 + 姿态状态色）
        'surface-muted': withOpacity('surface-muted'),
        'text-secondary': withOpacity('text-secondary'),
        'text-muted': withOpacity('text-muted'),
        'status-normal': withOpacity('status-normal'),
        'status-warning': withOpacity('status-warning'),
        'status-alert': withOpacity('status-alert'),
        'status-offline': withOpacity('status-offline'),
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};