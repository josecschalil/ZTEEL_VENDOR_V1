const baseConfig = require("./app.json");

const googleMapsApiKey = "";
const plugins = [...baseConfig.expo.plugins];

if (googleMapsApiKey) {
  plugins.push([
    "react-native-maps",
    {
      androidGoogleMapsApiKey: googleMapsApiKey,
      iosGoogleMapsApiKey: googleMapsApiKey,
    },
  ]);
}

module.exports = {
  expo: {
    ...baseConfig.expo,
    plugins,
    extra: {
      ...baseConfig.expo.extra,
      googleMapsApiKey,
    },
  },
};
