const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable package exports to avoid strict ESM resolution in Node 22
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
