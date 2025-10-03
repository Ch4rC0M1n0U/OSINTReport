import { defineStore } from "pinia";
import { ref } from "vue";
import {
  entitiesApi,
  type Entity,
  type EntityType,
  type EntitySearchResult,
  type CreateEntityData,
} from "@/services/api/entities";

export const useEntitiesStore = defineStore("entities", () => {
  const items = ref<Entity[]>([]);
  const total = ref(0);
  const limit = ref(20);
  const offset = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Cache pour l'autocomplétion
  const searchCache = ref<Map<string, EntitySearchResult[]>>(new Map());

  async function fetchEntities(options?: {
    type?: EntityType;
    search?: string;
    silent?: boolean;
  }) {
    if (!options?.silent) {
      loading.value = true;
      error.value = null;
    }

    try {
      const response = await entitiesApi.list({
        limit: limit.value,
        offset: offset.value,
        type: options?.type,
        search: options?.search,
      });

      items.value = response.items;
      total.value = response.total;
    } catch (err) {
      error.value = "Impossible de charger les entités";
      throw err;
    } finally {
      if (!options?.silent) {
        loading.value = false;
      }
    }
  }

  async function search(query: string, type?: EntityType, limit = 10) {
    const cacheKey = `${query}-${type || "all"}-${limit}`;

    // Vérifier le cache
    if (searchCache.value.has(cacheKey)) {
      return searchCache.value.get(cacheKey)!;
    }

    try {
      const results = await entitiesApi.search(query, type, limit);
      searchCache.value.set(cacheKey, results);
      return results;
    } catch (err) {
      error.value = "Erreur lors de la recherche";
      throw err;
    }
  }

  async function getById(id: string) {
    try {
      return await entitiesApi.getById(id);
    } catch (err) {
      error.value = "Impossible de charger l'entité";
      throw err;
    }
  }

  async function create(data: CreateEntityData) {
    try {
      const entity = await entitiesApi.create(data);
      // Invalider le cache de recherche
      searchCache.value.clear();
      return entity;
    } catch (err) {
      error.value = "Erreur lors de la création de l'entité";
      throw err;
    }
  }

  async function update(id: string, data: Partial<CreateEntityData>) {
    try {
      const entity = await entitiesApi.update(id, data);
      // Invalider le cache
      searchCache.value.clear();
      return entity;
    } catch (err) {
      error.value = "Erreur lors de la modification de l'entité";
      throw err;
    }
  }

  async function deleteEntity(id: string) {
    try {
      await entitiesApi.delete(id);
      // Retirer du cache et de la liste
      items.value = items.value.filter((e) => e.id !== id);
      searchCache.value.clear();
    } catch (err) {
      error.value = "Erreur lors de la suppression de l'entité";
      throw err;
    }
  }

  function clearCache() {
    searchCache.value.clear();
  }

  function reset() {
    items.value = [];
    total.value = 0;
    offset.value = 0;
    error.value = null;
    searchCache.value.clear();
  }

  return {
    items,
    total,
    limit,
    offset,
    loading,
    error,
    fetchEntities,
    search,
    getById,
    create,
    update,
    deleteEntity,
    clearCache,
    reset,
  };
});
