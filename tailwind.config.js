/**
 * Tailwind / NativeWind 配置（react-native-reusables 风格）。
 *
 * 核心思路：直接覆盖 Tailwind 默认主题值，让 Tailwind 默认 className
 * (sm/md/lg/xl/shadow-sm/gap-2 等) 等同 Catune 老的 theme.token.
 *
 * 详细映射见 src/design/theme/MIGRATION.md。
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
        // ========== 基础主题色（reusables 必需，覆盖默认值） ==========
        border: withOpacity('border'),
        input: withOpacity('input'),
        ring: withOpacity('ring'),
        background: withOpacity('background'),       // #F2F0EC 暖中性
        foreground: withOpacity('foreground'),       // #141414
        primary: {
          DEFAULT: withOpacity('primary'),            // #FB4B00
          foreground: withOpacity('primary-foreground'), // #FFF0EA
        },
        secondary: {
          DEFAULT: withOpacity('secondary'),
          foreground: withOpacity('secondary-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('destructive'),        // = statusAlert
          foreground: withOpacity('destructive-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('muted'),              // ≈ surfaceMuted
          foreground: withOpacity('muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('accent'),             // = primary
          foreground: withOpacity('accent-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('popover'),           // = surface #FFFFFF
          foreground: withOpacity('popover-foreground'),
        },
        card: {
          DEFAULT: withOpacity('card'),               // #FFFFFF
          foreground: withOpacity('card-foreground'),
        },

        // ========== Catune 扩展语义 token ==========
        // 真正 Catune 独有 → 没办法用 Tailwind 默认名覆盖，
        // 必须保留语义 token：bg-primary-light / bg-status-normal 等
        'primary-light': withOpacity('primary-light'),  // #FFA060
        'surface-muted': withOpacity('surface-muted'),  // #F5F5F5
        'neutral-start': withOpacity('neutral-start'),  // #FFFFFF
        'neutral-end': withOpacity('neutral-end'),      // #E5E5E5
        'text-secondary': withOpacity('text-secondary'), // #666666
        'text-muted': withOpacity('text-muted'),         // #9B9590
        'status-normal': withOpacity('status-normal'),   // #7BA05B 鼠尾草绿
        'status-warning': withOpacity('status-warning'), // = primary
        'status-alert': withOpacity('status-alert'),     // #C75348 黏土红
        'status-offline': withOpacity('status-offline'), // #AFA8A0
      },

      // ========== 圆角 — 覆盖 Tailwind 默认值 ==========
      // 让 rounded-sm/md/lg 直接等同 Catune colors.radius.sm/md/lg
      borderRadius: {
        none: '0',
        sm: '8px',     // Catune radius.sm(原本 Tailwind 默认是 2px)
        md: '12px',    // Catune radius.md(原本 6px)
        lg: '16px',    // Catune radius.lg(原本 8px)
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px', // Catune radius.pill
      },

      borderWidth: {
        hairline: hairlineWidth(),
      },

      // ========== 字号 — 覆盖 Tailwind 默认值 ==========
      // 关键:text-base 从 16 改 15(Catune sizeMd)
      fontSize: {
        xs: ['12px', {lineHeight: '16px'}],    // = Catune sizeXs
        sm: ['14px', {lineHeight: '20px'}],    // = Catune sizeSm
        base: ['15px', {lineHeight: '22px'}],  // = Catune sizeMd（关键修复：16→15）
        md: ['15px', {lineHeight: '22px'}],    // 别名（同 base）
        lg: ['18px', {lineHeight: '24px'}],    // = Catune sizeLg
        xl: ['22px', {lineHeight: '28px'}],    // = Catune sizeXl（修复：20→22）
        // 2xl/3xl/4xl 保留 Tailwind 默认(24/30/36)— Catune 未使用
        score: ['56px', {lineHeight: '64px'}], // = Catune sizeScore（分数大字）
      },

      // ========== 间距 — 完全覆盖 Tailwind 默认 spacing ==========
      // 让 gap-2/p-4/mt-8 等全部直接等同 Catune colors.spacing
      // 注意：保留 Tailwind 默认档位名（0.5/1/1.5/2.5 等）
      spacing: {
        0: '0px',
        0.5: '2px',    // = Catune xxs
        1: '4px',      // = Catune xs
        1.5: '6px',    // = Catune sm
        2: '8px',      // = Catune sm2
        2.5: '10px',   // = Catune md
        3: '12px',     // = Catune md2
        3.5: '14px',   // = 0/0%/18% 间距（reusables 内部用）
        4: '16px',     // = Catune lg
        5: '20px',     // = Catune xl
        6: '24px',     // = Catune xxl
        7: '28px',
        8: '32px',     // = Catune xxxl
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
        36: '144px',
        40: '160px',
        44: '176px',
        48: '192px',
        52: '208px',
        56: '224px',
        60: '240px',
        64: '256px',
        72: '288px',
        80: '320px',
        96: '384px',
      },

      // ========== 阴影 — 覆盖 Tailwind 默认值 ==========
      // 让 shadow-sm/md 直接等同 Catune shadow.card/pill
      boxShadow: {
        none: 'none',
        sm: '0px 4px 12px 0px rgba(0,0,0,0.08)',
        md: '0px 3px 8px 0px rgba(0,0,0,0.1)',
        lg: '0px 6px 16px 0px rgba(0,0,0,0.12)',
        xl: '0px 8px 20px 0px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};