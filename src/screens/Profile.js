import { View, StyleSheet, ScrollView, Alert, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { TextInput, Button, Text, Appbar, SegmentedButtons, Card } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { buscarRaioAlerta, salvarRaioAlerta } from "../services/proximidade";

/**
 * getInitials
 * Retorna iniciais textuais a partir do nome ou e-mail do usuário.
 */
function getInitials(nameOrEmail) {
  if (!nameOrEmail) return "US";
  const cleanName = nameOrEmail.replace(/@.*/, "").trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * getFileExtension
 * Detecta a extensão de arquivo a partir da URI ou tipo MIME.
 */
function getFileExtension(uri, mimeType) {
  if (mimeType?.includes("png")) return "png";
  if (mimeType?.includes("webp")) return "webp";
  if (mimeType?.includes("heic")) return "heic";

  const cleanUri = uri?.split("?")?.[0] || "";
  const extension = cleanUri.split(".").pop();
  return extension && extension.length <= 5 ? extension : "jpg";
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  // Removida a funcionalidade de foto de perfil: agora armazenamos apenas nome/email/senha.
  const [loading, setLoading] = useState(false);
  const [raio, setRaio] = useState("100");

  useEffect(() => {
    /**
     * loadUser
     * Carrega os dados do usuário autenticado e o raio de alerta configurado.
     */
    const loadUser = async () => {
      const valorRaio = await buscarRaioAlerta();
      setRaio(String(valorRaio));

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) return;

      const nome = user.user_metadata?.full_name || user.email || "";

      setName(nome);
      setEmail(user.email || "");
    };

    loadUser();
  }, []);

  /**
   * atualizarPerfil
   * Atualiza os metadados do usuário no Supabase Auth.
   */
  const atualizarPerfil = async ({ nome }) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const user = session?.user;

    if (sessionError || !user) {
      throw new Error("Usuário não autenticado.");
    }

    // Atualiza apenas o nome no metadata do usuário (avatar removido).
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: nome,
      },
    });

    if (authError) throw authError;
  };

  /**
   * uploadFoto
   * Faz upload da imagem para o bucket Supabase e retorna a URL pública.
   */
  // Observação: funcionalidade de foto removida por solicitação do projeto.

  /**
   * salvarConfigRaio
   * Salva a configuração do raio de alerta em armazenamento local.
   */
  const salvarConfigRaio = async () => {
    try {
      const valor = await salvarRaioAlerta(raio);
      Alert.alert("Configuração salva", `O raio de alerta foi definido para ${valor} metros.`);
    } catch (error) {
      Alert.alert("Erro", error.message || "Não foi possível salvar o raio.");
    }
  };

  /**
   * salvarPerfil
   * Atualiza nome, e-mail e senha do usuário no Supabase Auth.
   */
  const salvarPerfil = async () => {
    const nomeTratado = name.trim();
    const emailTratado = email.trim().toLowerCase();

    if (!nomeTratado) {
      Alert.alert("Atenção", "Informe o nome do usuário.");
      return;
    }

    if (!emailTratado) {
      Alert.alert("Atenção", "Informe o e-mail do usuário.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailTratado)) {
      Alert.alert("Atenção", "Informe um e-mail válido.");
      return;
    }

    if (senha && senha.length < 6) {
      Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha && senha !== confirmarSenha) {
      Alert.alert("Atenção", "A confirmação da senha não confere.");
      return;
    }

    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;

      if (sessionError || !user) {
        throw new Error("Usuário não autenticado.");
      }

      if (emailTratado !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: emailTratado });
        if (emailError) throw emailError;
      }

      if (senha) {
        const { error: senhaError } = await supabase.auth.updateUser({ password: senha });
        if (senhaError) throw senhaError;
      }

      // Atualiza apenas o nome do usuário; avatar removido.
      await atualizarPerfil({ nome: nomeTratado });
      setName(nomeTratado);
      setEmail(emailTratado);
      setSenha("");
      setConfirmarSenha("");
      Alert.alert("Sucesso", "Perfil atualizado.");
    } catch (err) {
      Alert.alert("Erro", err.message || "Não foi possível atualizar o perfil.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>
          <Appbar.Header elevated>
            <Appbar.BackAction onPress={() => navigation.goBack()} />
            <Appbar.Content title="Editar Perfil" />
          </Appbar.Header>

          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Exibe apenas as iniciais do usuário em um círculo colorido (sem upload de foto). */}
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
        </View>

        <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="E-mail" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} autoCapitalize="none" keyboardType="email-address" />
        <TextInput label="Nova senha" value={senha} onChangeText={setSenha} mode="outlined" style={styles.input} secureTextEntry />
        <TextInput label="Confirmar nova senha" value={confirmarSenha} onChangeText={setConfirmarSenha} mode="outlined" style={styles.input} secureTextEntry />

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Raio de alerta</Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>Receba notificações quando estiver perto de uma tarefa pendente.</Text>
            <SegmentedButtons
              value={raio}
              onValueChange={setRaio}
              buttons={[
                { value: "50", label: "50 m" },
                { value: "100", label: "100 m" },
                { value: "200", label: "200 m" },
                { value: "500", label: "500 m" },
              ]}
              style={styles.segmented}
            />
            <Button mode="contained" onPress={salvarConfigRaio} style={styles.secondaryButton}>
              Salvar raio
            </Button>
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={salvarPerfil} loading={loading} disabled={loading} style={styles.saveButton}>
          Salvar perfil
        </Button>
      </ScrollView>
    </View>
  </TouchableWithoutFeedback>
</KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginVertical: 12,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1976D2",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 32,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  imageButton: {
    marginBottom: 8,
    borderRadius: 999,
  },
  input: {
    marginTop: 12,
  },
  card: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  cardTitle: {
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "#000000",
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 12,
  },
  secondaryButton: {
    borderRadius: 999,
  },
  saveButton: {
    marginTop: 16,
  },
});

