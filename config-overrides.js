// config-overrides.js
module.exports = function override(config) {
  // Add fallback for missing vector icons
  if (!config.resolve.alias) {
    config.resolve.alias = {};
  }

  config.resolve.alias['@react-native-vector-icons/material-design-icons'] =
    require.resolve('@expo/vector-icons/MaterialCommunityIcons');

  return config;
};
