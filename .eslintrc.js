module.exports = {
    "parser": 'babel-eslint',
    plugins: [
    ],
    extends: [
        'airbnb'
    ],
    "env": {
        "es6": true,
        "node": true,
        "browser": true,
        // "amd": true,
        "mocha": true
    },
    settings:{
         'import/resolver': 'webpack'
    },
    parserOptions: {
        ecmaVersion: 6,
        ecmaFeatures: {
            experimentalObjectRestSpread: true
        },
        sourceType: 'module'
    },
    "rules": {
        "max-len": [1, 180, 2, {"ignoreComments": true}],
        "quote-props": [1, "consistent-as-needed"],
        "comma-dangle": [0, "never"],
        // "no-unused-vars": [1, {"vars": "local", "args": "none"}],
        "indent": ["error", 4],
        "no-underscore-dangle": [0],
        "linebreak-style": ["error", "unix"],
        "semi": ["warn", "never"],
        "no-console": 0,
        "no-use-before-define": 1,
        "no-else-return": 0,
        "quotes": 0,
        'no-mixed-operators': ["error", {"allowSamePrecedence": true}],
        "import/no-extraneous-dependencies": 'off',
        "import/extensions": 'off',
        "import/no-unresolved": 'warn',
        "no-unused-vars": 1,
        "no-param-reassign": 0,
        "curly": 1,
        "class-methods-use-this": 0,
        "no-return-assign": 0,
        "object-curly-spacing": 1,
        "no-mixed-operators": 0,
        "no-plusplus": 0,
        "arrow-body-style": 0
        // "arrow-parens": 0,
        // 'arrow-spacing': 'error',
        // 'block-spacing': 'error',
        // 'comma-dangle': 'off',
        // 'comma-spacing': 'error',
        // 'comma-style': 'error',
        // 'curly': 'error',
        // 'dot-notation': 'error',
        // 'eqeqeq': 'error',
        // 'eol-last': 'error',
        // 'indent': ['error', 4, {SwitchCase: 1}],
        // 'key-spacing': 'error',
        // 'keyword-spacing': 'error',
        // 'linebreak-style': ['error', 'unix'],
        // 'no-console': 'off',
        // 'no-param-reassign': 'error',
        // 'no-tabs': 'error',
        // 'no-trailing-spaces': 'error',
        // 'no-underscore-dangle': 'error',
        // 'no-whitespace-before-property': 'error',
        // 'quotes': ['error', 'single'],
        // 'semi': ['error', 'always'],
        // 'semi-spacing': 'error',
        // 'space-before-blocks': 'error',
        // 'space-before-function-paren': ['error', 'never'],
        // 'space-in-parens': 'error',
        //
        // 'react/display-name': 'off',
        // 'react/prop-types': 'off'
    }
}
