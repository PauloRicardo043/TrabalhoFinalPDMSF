import { useState } from "react";
import { KeyboardAvoidingView, Keyboard, Platform, StyleSheet, TouchableWithoutFeedback, View, Image } from "react-native";
import { Button, HelperText, Snackbar, Text, TextInput, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { supabase } from "../services/supabase";
import { appColors } from "../theme";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Cadastro() {
  const navigation = useNavigation();
  const theme = useTheme();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const nomeTratado = nome.trim();
  const emailTratado = email.trim().toLowerCase();
  const nomeInvalido = nome.length > 0 && nomeTratado.length < 3;
  const emailInvalido = email.length > 0 && !emailRegex.test(emailTratado);
  const senhaInvalida = senha.length > 0 && senha.length < 6;
  const confirmacaoInvalida = confirmarSenha.length > 0 && senha !== confirmarSenha;

  /**
   * validarCampos
   * Valida nome, e-mail, senha e confirmação de senha antes de cadastrar.
   */
  function validarCampos() {
    if (!nomeTratado || !emailTratado || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return false;
    }

    if (nomeTratado.length < 3) {
      setErro("Informe um nome com pelo menos 3 caracteres.");
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

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return false;
    }

    return true;
  }

  /**
   * cadastrar
   * Cria um novo usuário no Supabase Auth com nome e e-mail.
   */
  async function cadastrar() {
    if (!validarCampos()) return;

    setCarregando(true);
    setErro("");
    setMensagem("");

    const { data, error } = await supabase.auth.signUp({
      email: emailTratado,
      password: senha,
      options: {
        data: {
          full_name: nomeTratado,
        },
      },
    });

    setCarregando(false);

    if (error) {
      setErro(error.message || "Não foi possível criar a conta.");
      return;
    }

    setNome("");
    setEmail("");
    setSenha("");
    setConfirmarSenha("");

    if (data?.session) {
      // Se já tiver sessão, redireciona para a tela principal que contém as tabs.
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
      return;
    }

    setMensagem("Cadastro realizado. Agora faça login para continuar.");
    navigation.navigate("Login");
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

        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.titulo}>Criar conta</Text>
          {/* Subtítulo removido para simplificar o layout conforme especificação. */}
        </View>

        <TextInput
          label="Nome completo"
          value={nome}
          onChangeText={setNome}
          mode="outlined"
          error={nomeInvalido}
          outlineColor={appColors.light}
          activeOutlineColor={appColors.primary}
          style={styles.input}
        />
        <HelperText type="error" visible={nomeInvalido}>
          Nome muito curto.
        </HelperText>

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
          Use pelo menos 6 caracteres.
        </HelperText>

        <TextInput
          label="Confirmar senha"
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry={!mostrarSenha}
          mode="outlined"
          error={confirmacaoInvalida}
          outlineColor={appColors.light}
          activeOutlineColor={appColors.primary}
          style={styles.input}
        />
        <HelperText type="error" visible={confirmacaoInvalida}>
          As senhas precisam ser iguais.
        </HelperText>

        <Button
          mode="contained"
          onPress={cadastrar}
          loading={carregando}
          disabled={carregando}
          style={styles.botaoPrincipal}
          contentStyle={styles.botaoConteudo}
        >
          Cadastrar
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate("Login")}
          disabled={carregando}
          style={styles.botaoSecundario}
          labelStyle={styles.botaoSecundarioTexto}
        >
          Já tenho uma conta
        </Button>
        </View>

        <Snackbar visible={!!erro} onDismiss={() => setErro("")} duration={3500}>
          {erro}
        </Snackbar>
        <Snackbar visible={!!mensagem} onDismiss={() => setMensagem("")} duration={3500}>
          {mensagem}
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
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 12,
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
  botaoPrincipal: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: appColors.primary,
  },
  botaoConteudo: {
    paddingVertical: 8,
  },
  botaoSecundario: {
    marginTop: 12,
  },
  botaoSecundarioTexto: {
    color: appColors.primary,
  },
});
