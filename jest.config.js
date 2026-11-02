module.exports = {
  preset: 'react-native',
  // Immer exposes an ESM React Native entry point; transform it for Jest's CJS runtime.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer)/)',
  ],
};
