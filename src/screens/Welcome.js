import { View, StyleSheet, Image } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { appColors } from "../theme";

export default function Welcome() {
  const navigation = useNavigation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.brandBox}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate("Login")}
          contentStyle={styles.primaryButtonContent}
          style={styles.primaryButton}
        >
          Entrar
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate("Cadastro")}
          contentStyle={styles.secondaryButtonContent}
          style={styles.secondaryButton}
        >
          Criar Conta
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 32,
  },
  brandBox: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logo: {
    width: 260,
    height: 260,
  },
  subtitle: {
    color: appColors.secondaryText,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 14,
  },
  actions: {
    width: "100%",
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: appColors.primary,
  },
  primaryButtonContent: {
    paddingVertical: 12,
  },
  secondaryButton: {
    borderRadius: 16,
    borderColor: appColors.primary,
  },
  secondaryButtonContent: {
    paddingVertical: 12,
  },
});
