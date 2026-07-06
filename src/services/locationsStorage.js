import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const FAVORITOS_KEY = "@rotinaapp:locais-favoritos";

/**
 * obterLocaisFavoritos
 * Retorna somente os favoritos pertencentes ao usuário autenticado.
 */
export async function obterLocaisFavoritos(userId) {
  if (!userId) {
    return [];
  }

  try {
    const valor = await AsyncStorage.getItem(FAVORITOS_KEY);
    const lista = valor ? JSON.parse(valor) : [];
    return Array.isArray(lista)
      ? lista.filter((local) => local.userId === userId)
      : [];
  } catch (error) {
    console.warn("Erro ao ler locais favoritos", error);
    return [];
  }
}

/**
 * salvarLocaisFavoritos
 * Persiste a lista completa de favoritos no AsyncStorage.
 */
export async function salvarLocaisFavoritos(locais) {
  try {
    await AsyncStorage.setItem(FAVORITOS_KEY, JSON.stringify(locais));
    return locais;
  } catch (error) {
    console.warn("Erro ao salvar locais favoritos", error);
    return locais;
  }
}

/**
 * adicionarLocalFavorito
 * Adiciona um novo local à lista de favoritos e vincula ao usuário autenticado.
 */
export async function adicionarLocalFavorito(nome, latitude, longitude, userId) {
  if (!nome || latitude == null || longitude == null || !userId) {
    throw new Error("Nome, coordenadas e usuário são obrigatórios para salvar o local.");
  }

  const valorAtual = await AsyncStorage.getItem(FAVORITOS_KEY);
  const novosLocais = valorAtual ? JSON.parse(valorAtual) : [];
  const local = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: nome,
    latitude,
    longitude,
    userId,
  };

  novosLocais.unshift(local);
  await salvarLocaisFavoritos(novosLocais);
  return local;
}

/**
 * salvarFavoritoNoBanco
 * Tenta salvar o favorito no Supabase (tabela `favoritos`). Caso a tabela não exista
 * ou ocorra erro, grava localmente via AsyncStorage como fallback.
 * Valida duplicidade por nome para o mesmo usuário antes de inserir.
 */
export async function salvarFavoritoNoBanco(nome, latitude, longitude, userId) {
  if (!nome || latitude == null || longitude == null || !userId) {
    throw new Error("Nome, coordenadas e usuário são obrigatórios para salvar o local.");
  }

  // Tentativa de salvar no Supabase garantindo unicidade por nome para o usuário.
  try {
    // Verifica duplicidade no Supabase
    const { data: existentes, error: queryError } = await supabase
      .from("favoritos")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", nome);

    if (queryError && queryError.code === "42P01") {
      // tabela não existe (Postgres error code for undefined_table), cairá no fallback
      throw queryError;
    }

    if (existentes && existentes.length > 0) {
      // Já existe favorito com esse nome para o usuário
      const err = new Error("duplicado");
      err.code = "DUPLICADO";
      throw err;
    }

    // Insere no Supabase
    const { data, error: insertError } = await supabase.from("favoritos").insert([
      {
        user_id: userId,
        name: nome,
        latitude,
        longitude,
        created_at: new Date().toISOString(),
      },
    ]).select();

    if (insertError) {
      throw insertError;
    }

    // Retorna o registro inserido (assumindo que a tabela retorna o row)
    return data?.[0] ?? null;
  } catch (error) {
    // Se for duplicado controlado, repassa o erro de duplicidade
    if (error?.code === "DUPLICADO") {
      throw error;
    }

    // Qualquer outro erro - fallback para armazenamento local
    try {
      const local = await adicionarLocalFavorito(nome, latitude, longitude, userId);
      return local;
    } catch (e) {
      // repassa erro original se fallback também falhar
      throw error;
    }
  }
}

/**
 * removerLocalFavorito
 * Remove um local favorito apenas para o usuário autenticado.
 */
export async function removerLocalFavorito(id, userId) {
  if (!userId) {
    return [];
  }

  const valorAtual = await AsyncStorage.getItem(FAVORITOS_KEY);
  const lista = valorAtual ? JSON.parse(valorAtual) : [];
  const atualizados = Array.isArray(lista)
    ? lista.filter((local) => local.id !== id || local.userId !== userId)
    : [];

  await salvarLocaisFavoritos(atualizados);
  return atualizados.filter((local) => local.userId === userId);
}
