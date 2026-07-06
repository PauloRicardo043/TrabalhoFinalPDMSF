import { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Card, IconButton, Text, useTheme } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { carregarNotificacoes, marcarTodasComoLidas } from "../services/notificacoes";

/**
 * Notificacoes
 * Tela de notificações locais e de proximidade para o usuário.
 */
export default function Notificacoes() {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [notificacoes, setNotificacoes] = useState([]);

  /**
   * carregar
   * Carrega notificações locais do armazenamento para exibir na lista.
   */
  const carregar = useCallback(async () => {
    const lista = await carregarNotificacoes();
    setNotificacoes(lista);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
      marcarTodasComoLidas().then(() => carregar());
    }, [carregar])
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  /**
   * renderNotificacao
   * Renderiza cada cartão de notificação na lista.
   */
  function renderNotificacao({ item }) {
    const naoLida = !item.read;

    return (
      <Card style={[styles.card, naoLida && styles.cardNaoLida]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name={item.type === "proximidade" ? "map-marker-radius" : "bell-outline"}
              size={22}
              color={naoLida ? "#1976D2" : "#757575"}
            />
          </View>

          <View style={styles.textBox}>
            <Text variant="titleSmall" style={[styles.title, naoLida && styles.titleNaoLida]}>
              {item.title}
            </Text>
            <Text variant="bodyMedium" style={styles.message}>
              {item.message}
            </Text>
            <Text variant="bodySmall" style={styles.data}>
              {new Date(item.createdAt).toLocaleString("pt-BR")}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}> 
        <IconButton
          icon={({ size, color }) => (
            <MaterialCommunityIcons
              name="arrow-left"
              size={size}
              color={color}
            />
          )}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>Notificações</Text>
      </View>

      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 24 + insets.bottom }]}
        renderItem={renderNotificacao}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text variant="titleMedium" style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>As notificações de proximidade aparecerão aqui.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    color: "#000000",
    fontWeight: "bold",
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  cardNaoLida: {
    backgroundColor: "#EAF4FF",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconBox: {
    marginRight: 12,
    marginTop: 2,
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: "#000000",
    fontWeight: "600",
  },
  titleNaoLida: {
    fontWeight: "700",
  },
  message: {
    color: "#000000",
    marginTop: 4,
  },
  data: {
    color: "#757575",
    marginTop: 6,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    color: "#000000",
    fontWeight: "bold",
  },
  emptyText: {
    color: "#000000",
    marginTop: 6,
    textAlign: "center",
  },
});
