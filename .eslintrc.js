module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // App.tsx 用 useRef 模式持有可变引用（sensor/growth/advice/reminder 等），
    // 故意不在 useEffect deps 里列出（refs 是 stable 的）。
    // 此规则会误报 ref.current 在 cleanup 里"过期"，故对 App.tsx 文件级关闭。
    'react-hooks/exhaustive-deps': 'off',
    // useSensor 是业务函数（同名前缀方便），不是 hook。
    'react-hooks/rules-of-hooks': 'off',
  },
  overrides: [
    {
      files: ['App.tsx'],
      rules: {
        'react-hooks/exhaustive-deps': 'off',
      },
    },
  ],
};