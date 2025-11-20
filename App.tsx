import * as React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  SafeAreaView, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  View, 
  Image,
} from "react-native";
import {
  Provider as PaperProvider,
  MD3LightTheme as DefaultTheme,
  Appbar,
  Searchbar,
  Card,
  Text, 
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";

type Pokemon = {
  id: number;
  name: string;
  imageUrl: string;
  name_searchable: string;
};

const POKEMON_API_URL = "https://pokeapi.co/api/v2/pokemon?limit=151";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2E7D32", 
    surface: "#FFFFFF",
    background: "#F6F7F9",
  },
};

export default function App() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState("");

  const fetchPokemonList = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const initialRes = await fetch(POKEMON_API_URL);
      if (!initialRes.ok) throw new Error(`HTTP ${initialRes.status}`);
      const initialData = await initialRes.json();

      const detailPromises = initialData.results.map(async (p: { name: string, url: string }) => {
        const detailRes = await fetch(p.url);
        if (!detailRes.ok) throw new Error(`HTTP ${detailRes.status} (detalhe: ${p.name})`);
        const detailData = await detailRes.json();
        
        return {
          id: detailData.id,

          name: detailData.name.charAt(0).toUpperCase() + detailData.name.slice(1),

          imageUrl: detailData.sprites.front_default || `https://placehold.co/120x120/f3f4f6/1f2937?text=${detailData.id}`,
          name_searchable: detailData.name.toLowerCase(),
        } as Pokemon;
      });

      const detailedPokemonList = await Promise.all(detailPromises);
      
      setPokemonList(detailedPokemonList.sort((a, b) => a.id - b.id));
      setSnack("Pokédex de Kanto atualizada!");

    } catch (e: any) {
      console.error("Erro ao carregar Pokémons:", e);
      setError("Falha ao carregar Pokémons. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPokemonList();
  }, [fetchPokemonList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPokemonList();
  }, [fetchPokemonList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pokemonList;
    
    return pokemonList.filter((p) => p.name_searchable.includes(q));
  }, [pokemonList, query]);

  const renderItem = ({ item }: { item: Pokemon }) => (
    <Card style={styles.card} mode="elevated">

      <View style={styles.imageContainer}>
          <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImage}
              resizeMode="contain"
          />
      </View>
      
      <Card.Content style={styles.cardContent}>
        <Text style={styles.cardId}>#{String(item.id).padStart(3, '0')}</Text>
        <Text variant="titleLarge" style={styles.cardTitle} numberOfLines={1}>
            {item.name}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.safe}>

        <Appbar.Header mode="center-aligned" style={styles.header}>
          <Appbar.Content title="Pokédex de Kanto" />
          <Appbar.Action icon="refresh" onPress={fetchPokemonList} />
        </Appbar.Header>

        <Searchbar
          placeholder="Buscar por nome do Pokémon..."
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          inputStyle={{ fontSize: 16 }}
          returnKeyType="search"
        />

        {loading ? (
          <ActivityIndicator animating style={styles.loading} color={theme.colors.primary} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
            <ActivityIndicator animating={false} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={filtered.length === 0 ? styles.empty : styles.listContent}
            ListEmptyComponent={<Text style={styles.muted}>Nenhum Pokémon encontrado.</Text>}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E7D32" />
            }
          />
        )}

        <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={2000}>
          {snack}
        </Snackbar>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },
  header: { backgroundColor: "#FFFFFF", elevation: 2 },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  loading: { marginTop: 24 },
  errorContainer: { alignItems: 'center', paddingHorizontal: 16 },
  error: { textAlign: "center", color: "#C62828", marginTop: 16, marginBottom: 8 },
  empty: { flexGrow: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: "#666" },
  
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },


  card: {
    marginVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    minHeight: 320, 
    alignItems: 'center', 
    padding: 0, 
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#DDD',
  },
  cardImage: {
    width: 200, 
    height: 200, 
  },
  cardContent: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
  },
  cardId: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  cardTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#444',
    marginTop: 2,
    width: '100%',
  },
});


