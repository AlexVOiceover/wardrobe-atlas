module.exports = {
  preset: "react-native",
  setupFiles: ["./jest.setup.js"],
  // Immer, React Navigation and react-native-* packages ship ESM; transform them for Jest's CJS runtime.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native(-[^/]+)?|@react-native(-community)?|@react-navigation|immer)/)",
  ],
};
