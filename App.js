import "react-native-gesture-handler";

import { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  ActivityIndicator,
  Button,
  PaperProvider,
  Text,
} from "react-native-paper";
import * as Location from "expo-location";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { supabase } from "./src/services/supabase";
import { verificarProximidadeTarefas, getIntervaloVerificacaoMs } from "./src/services/proximidade";
import { paperTheme } from "./src/theme";

import Welcome from "./src/screens/Welcome";
import Login from "./src/screens/Login";
import Cadastro from "./src/screens/Cadastro";
import Home from "./src/screens/Home";
import Tarefas from "./src/screens/Tarefas";
import NovaTarefa from "./src/screens/NovaTarefa";
import EditarTarefa from "./src/screens/EditarTarefa";
import Maps from "./src/screens/Maps";
import Notificacoes from "./src/screens/Notificacoes";
import ProfileScreen from "./src/screens/Profile";
import SelecionarLocal from "./src/screens/SelecionarLocal";
import DetalhesTarefa from "./src/screens/DetalhesTarefa";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = createNativeStackNavigator();
const TarefasStack = createNativeStackNavigator();
const NovaTarefaStack = createNativeStackNavigator();
const MapsStack = createNativeStackNavigator();
const NotificacoesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const theme = paperTheme;

/**
 * LoadingScreen
 * Exibe uma tela de carregamento enquanto a sessão é verificada.
 */
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

/**
 * TelaTemporaria
 * Mostra uma tela de placeholder com título, descrição e botão de retorno.
 */
function TelaTemporaria({ titulo, descricao }) {
  const navigation = useNavigation();

  return (
    <View style={styles.placeholderContainer}>
      <Text variant="headlineSmall" style={styles.placeholderTitle}>
        {titulo}
      </Text>

      <Text variant="bodyMedium" style={styles.placeholderText}>
        {descricao}
      </Text>

      <Button
        mode="contained"
        icon={(props) => (
          <MaterialCommunityIcons
            name="home"
            size={props.size}
            color={props.color}
          />
        )}
        style={styles.placeholderButton}
        onPress={() => navigation.navigate("Home")}
      >
        Voltar para Home
      </Button>
    </View>
  );
}

/**
 * Profile
 * Encapsula a tela de perfil para uso no Stack Navigator.
 */
function Profile() {
  return <ProfileScreen />;
}

function LogoutScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    async function sair() {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }

    sair();
  }, [navigation]);

  return (
    <View style={styles.placeholderContainer}>
      <Text variant="headlineSmall" style={styles.placeholderTitle}>
        Saindo...
      </Text>
      <Text variant="bodyMedium" style={styles.placeholderText}>
        Você será redirecionado para a tela de login.
      </Text>
    </View>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={Home} />
    </HomeStack.Navigator>
  );
}

function TarefasStackScreen() {
  return (
    <TarefasStack.Navigator screenOptions={{ headerShown: false }}>
      <TarefasStack.Screen name="Tarefas" component={Tarefas} />
      <TarefasStack.Screen name="EditarTarefa" component={EditarTarefa} />
      <TarefasStack.Screen name="DetalhesTarefa" component={DetalhesTarefa} />
    </TarefasStack.Navigator>
  );
}

function NovaTarefaStackScreen() {
  return (
    <NovaTarefaStack.Navigator screenOptions={{ headerShown: false }}>
      <NovaTarefaStack.Screen name="NovaTarefa" component={NovaTarefa} />
      <NovaTarefaStack.Screen name="SelecionarLocal" component={SelecionarLocal} />
    </NovaTarefaStack.Navigator>
  );
}

function MapsStackScreen() {
  return (
    <MapsStack.Navigator screenOptions={{ headerShown: false }}>
      <MapsStack.Screen name="Maps" component={Maps} />
      <MapsStack.Screen name="DetalhesTarefa" component={DetalhesTarefa} />
    </MapsStack.Navigator>
  );
}

function NotificacoesStackScreen() {
  return (
    <NotificacoesStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificacoesStack.Screen name="Notificacoes" component={Notificacoes} />
    </NotificacoesStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#777777",
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#FFFFFF",
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: "home",
            Tarefas: "format-list-bulleted",
            NovaTarefa: "plus-box",
            Maps: "map-marker-radius",
            Notificacoes: "bell-outline",
            Profile: "account-outline",
            Logout: "logout",
          };

          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Tarefas" component={TarefasStackScreen} options={{ title: "Tarefas" }} />
      <Tab.Screen name="NovaTarefa" component={NovaTarefaStackScreen} options={{ title: "Nova tarefa" }} />
      <Tab.Screen name="Maps" component={MapsStackScreen} options={{ title: "Mapa" }} />
      <Tab.Screen name="Notificacoes" component={NotificacoesStackScreen} options={{ title: "Notificações" }} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} options={{ title: "Perfil" }} />
      <Tab.Screen name="Logout" component={LogoutScreen} options={{ title: "Sair" }} />
    </Tab.Navigator>
  );
}

/**
 * TelaPublica
 * Protege telas públicas redirecionando usuários autenticados para Home.
 */
function TelaPublica({ session, carregando, children }) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!carregando && session) {
      // Ao detectar sessão em telas públicas, redireciona para 'Main'
      // onde estão as tabs principais, garantindo que a Bottom Tab exista.
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    }
  }, [session, carregando, navigation]);

  if (carregando || session) {
    return <LoadingScreen />;
  }

  return children;
}

/**
 * TelaProtegida
 * Protege telas privadas redirecionando usuários não autenticados para Login.
 */
function TelaProtegida({ session, carregando, children }) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!carregando && !session) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, [session, carregando, navigation]);

  if (carregando || !session) {
    return <LoadingScreen />;
  }

  return children;
}

/**
 * App
 * Componente root que inicializa a sessão, configura o navigator e gerencia rotas públicas/privadas.
 */
export default function App() {
  const [session, setSession] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    /**
     * carregarSessao
     * Consulta a sessão atual do Supabase e atualiza o estado de autenticação.
     */
    async function carregarSessao() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setSession(null);
      } else {
        setSession(data?.session ?? null);
      }

      setCarregando(false);
    }

    carregarSessao();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setCarregando(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let watchSubscription = null;
    let ativo = true;

    async function iniciarMonitoramento() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        return;
      }

      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 10,
        },
        async () => {
          if (!ativo) {
            return;
          }

          try {
            await verificarProximidadeTarefas();
          } catch (error) {
            console.warn(error.message || "Erro na verificação de proximidade");
          }
        }
      );

      try {
        await verificarProximidadeTarefas();
      } catch (error) {
        console.warn(error.message || "Erro na verificação de proximidade");
      }
    }

    iniciarMonitoramento();

    const timer = setInterval(async () => {
      try {
        await verificarProximidadeTarefas();
      } catch (error) {
        console.warn(error.message || "Erro na verificação de proximidade");
      }
    }, getIntervaloVerificacaoMs());

    return () => {
      ativo = false;
      clearInterval(timer);
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [session]);

  return (
    <SafeAreaProvider>
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Welcome">
            {() => (
              <TelaPublica session={session} carregando={carregando}>
                <Welcome />
              </TelaPublica>
            )}
          </Stack.Screen>

          <Stack.Screen name="Login">
            {() => (
              <TelaPublica session={session} carregando={carregando}>
                <Login />
              </TelaPublica>
            )}
          </Stack.Screen>

          <Stack.Screen name="Cadastro">
            {() => (
              <TelaPublica session={session} carregando={carregando}>
                <Cadastro />
              </TelaPublica>
            )}
          </Stack.Screen>

          <Stack.Screen name="Main">
            {() => (
              <TelaProtegida session={session} carregando={carregando}>
                <MainTabs />
              </TelaProtegida>
            )}
          </Stack.Screen>


          {/* Rotas como EditarTarefa / DetalhesTarefa / SelecionarLocal são gerenciadas
              nas stacks internas das tabs (TarefasStack, MapsStack, NovaTarefaStack).
              Mantemos o Bottom Tab sempre visível evitando registrá-las novamente
              no root Stack que ocultaria a barra inferior. */}
        </Stack.Navigator>
      </NavigationContainer>

      <StatusBar style="auto" />
    </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F1F8F4",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#000000",
  },

  placeholderContainer: {
    flex: 1,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  placeholderTitle: {
    color: "#000000",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },

  placeholderText: {
    color: "#000000",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  placeholderButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
  },
});