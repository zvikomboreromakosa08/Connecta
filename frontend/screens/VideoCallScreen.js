import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const VideoCallScreen = ({ route }) => {
  const { joinUrl, meetingTitle } = route.params;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: joinUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default VideoCallScreen;