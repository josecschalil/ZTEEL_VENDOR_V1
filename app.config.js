const baseConfig = require("./app.json");

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
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
