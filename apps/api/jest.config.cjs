module.exports = {
  rootDir: "src",
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json", diagnostics: false }] },
  moduleFileExtensions: ["ts", "js", "json"],
};
