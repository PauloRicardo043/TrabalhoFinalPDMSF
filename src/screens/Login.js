import { useState } from "react";
import { KeyboardAvoidingView, Keyboard, Platform, StyleSheet, TouchableWithoutFeedback, View, Image } from "react-native";
import { Button, HelperText, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { supabase } from "../services/supabase";
import { appColors } from "../theme";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const emailTratado = email.trim().toLowerCase();
  const emailInvalido = email.length > 0 && !emailRegex.test(emailTratado);
  const senhaInvalida = senha.length > 0 && senha.length < 6;

  /**
   * validarCampos
   * Verifica se os dados de e-mail e senha estão preenchidos e formatados corretamente.
   */
  function validarCampos() {
    if (!emailTratado || !senha.trim()) {
      setErro("Preencha e-mail e senha.");
      return false;
    }

    if (!emailRegex.test(emailTratado)) {
      setErro("Informe um e-mail válido.");
      return false;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }

    return true;
  }

  /**
   * entrar
   * Faz autenticação pelo Supabase usando e-mail e senha.
   */
  async function entrar() {
    if (!validarCampos()) return;

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTratado,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro(error.message || "Não foi possível fazer login.");
      return;
    }

    if (!data?.session) {
      setErro("Login não confirmado. Verifique seus dados.");
      return;
    }

    // Redireciona para a rota 'Main' que contém as tabs principais (mantém Bottom Tab)
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>


        <TextInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          mode="outlined"
          error={emailInvalido}
          outlineColor={appColors.light}
          activeOutlineColor={appColors.primary}
          style={styles.input}
        />
        <HelperText type="error" visible={emailInvalido}>
          E-mail inválido.
        </HelperText>

        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry={!mostrarSenha}
          mode="outlined"
          error={senhaInvalida}
          outlineColor={appColors.light}
          activeOutlineColor={appColors.primary}
          right={
            <TextInput.Icon
              icon={({ size, color }) => (
                <MaterialCommunityIcons
                  name={mostrarSenha ? "eye-off" : "eye"}
                  size={size}
                  color={color}
                />
              )}
              onPress={() => setMostrarSenha((valorAtual) => !valorAtual)}
            />
          }
          style={styles.input}
        />
        <HelperText type="error" visible={senhaInvalida}>
          A senha precisa ter pelo menos 6 caracteres.
        </HelperText>

        <Button
          mode="contained"
          onPress={entrar}
          loading={carregando}
          disabled={carregando}
          style={styles.botaoPrincipal}
          contentStyle={styles.botaoConteudo}
        >
          Entrar
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Cadastro")}
          disabled={carregando}
          style={styles.botaoSecundario}
          labelStyle={styles.botaoSecundarioTexto}
        >
          Criar uma conta
        </Button>
        </View>

        <Snackbar visible={!!erro} onDismiss={() => setErro("")} duration={3500}>
          {erro}
        </Snackbar>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 28,
    backgroundColor: appColors.white,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  header: {
    marginBottom: 20,
  },
  titulo: {
    fontWeight: "700",
    color: appColors.dark,
    textAlign: "center",
  },
  subtitulo: {
    marginTop: 8,
    color: appColors.secondaryText,
    textAlign: "center",
  },
  input: {
    backgroundColor: appColors.white,
    borderRadius: 14,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  botaoPrincipal: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: appColors.primary,
  },
  botaoConteudo: {
    paddingVertical: 10,
  },
  botaoSecundario: {
    marginTop: 12,
  },
  botaoSecundarioTexto: {
    color: appColors.primary,
  },
});
