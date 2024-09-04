import { Text, View, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const ErrorScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Oops something went wrong...</Text>
    </View>
  )
}

export default ErrorScreen;