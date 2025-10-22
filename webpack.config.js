// webpack.config.js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Shim missing @react-native-vector-icons/get-image for web
  config.resolve.alias['@react-native-vector-icons/get-image'] = false;

  // Fix missing @react-native-vector-icons/material-design-icons for web
  config.resolve.alias['@react-native-vector-icons/material-design-icons'] =
    require.resolve('@expo/vector-icons/MaterialCommunityIcons');

  return config;
};
