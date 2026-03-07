import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist'] },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
        ],
        languageOptions: {
            parser: tseslint.parser,
        },
        rules: {
            semi: ['error', 'always'],
            '@typescript-eslint/no-unused-vars': 'warn'
        }
    }
)