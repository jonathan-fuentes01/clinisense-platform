const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Redirect @aws-amplify/react-native to a pure JS implementation so the app
// works in Expo Go (where native modules are not linked).
// computeModPow and computeS are reimplemented with BigInt arithmetic.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@aws-amplify/react-native') {
    return {
      filePath: path.resolve(__dirname, 'src/amplify-rn-js-impl.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
