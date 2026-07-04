// Flat config NATIVO de Next 16 (eslint-config-next expone ./core-web-vitals y ./typescript
// como arrays de flat config). Antes usábamos FlatCompat, que en ESLint 9 crasheaba al validar
// la config extendida ("Converting circular structure to JSON" en @eslint/eslintrc); estos
// imports directos lo evitan y son la forma recomendada en Next 16.
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Reglas del NUEVO eslint-plugin-react-hooks v6 (era React Compiler) que Next 16 activa por
      // defecto como ERROR. Marcan patrones que aquí son intencionales y seguros — hidratar estado
      // desde localStorage en un efecto de montaje (SSR-safe: no se puede usar el inicializador
      // perezoso porque localStorage no existe en el servidor) y usar refs para evitar closures
      // obsoletos. Se dejan en 'warn' para conservar la señal sin bloquear el pipeline por
      // falsos positivos. Revisar cuando la regla salga de su fase experimental.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Artefactos de build y de tests E2E fuera del lint.
    ignores: ['.next/', 'playwright-report/', 'test-results/'],
  },
]

export default eslintConfig
