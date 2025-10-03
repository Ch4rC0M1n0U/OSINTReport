<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useEntitiesStore } from "@/stores/entities";
import type { EntityType, EntitySearchResult } from "@/services/api/entities";

interface Props {
  modelValue?: string;
  type?: EntityType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  allowCreate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Rechercher une entité...",
  allowCreate: true,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | undefined];
  "entity-selected": [entity: EntitySearchResult];
  "create-new": [];
}>();

const entitiesStore = useEntitiesStore();

const searchQuery = ref("");
const searchResults = ref<EntitySearchResult[]>([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const selectedEntity = ref<EntitySearchResult | null>(null);

const inputRef = ref<HTMLInputElement>();

// Recherche debounced
const debouncedSearch = useDebounceFn(async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const results = await entitiesStore.search(searchQuery.value, props.type, 10);
    searchResults.value = results;
    showDropdown.value = true;
  } catch (error) {
    console.error("Erreur de recherche:", error);
  } finally {
    isSearching.value = false;
  }
}, 300);

watch(searchQuery, () => {
  debouncedSearch();
});

function selectEntity(entity: EntitySearchResult) {
  selectedEntity.value = entity;
  searchQuery.value = entity.label;
  showDropdown.value = false;
  emit("update:modelValue", entity.id);
  emit("entity-selected", entity);
}

function clearSelection() {
  selectedEntity.value = null;
  searchQuery.value = "";
  searchResults.value = [];
  emit("update:modelValue", undefined);
}

function handleFocus() {
  if (searchResults.value.length > 0) {
    showDropdown.value = true;
  }
}

function handleBlur() {
  // Délai pour permettre le clic sur un résultat
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function createNew() {
  emit("create-new");
  showDropdown.value = false;
}

const hasResults = computed(() => searchResults.value.length > 0);
const noResults = computed(
  () => !isSearching.value && searchQuery.value.length >= 2 && !hasResults.value
);

// Initialisation si modelValue fourni
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue && !selectedEntity.value) {
      try {
        const entity = await entitiesStore.getById(newValue);
        selectedEntity.value = {
          id: entity.id,
          label: entity.label,
          type: entity.type,
        };
        searchQuery.value = entity.label;
      } catch (error) {
        console.error("Erreur chargement entité:", error);
      }
    }
  },
  { immediate: true }
);

function getEntityIcon(type: EntityType) {
  const icons: Record<EntityType, string> = {
    PERSON: "👤",
    ORGANIZATION: "🏢",
    TELEPHONE: "📞",
    EMAIL: "📧",
    ACCOUNT: "🔑",
    ADDRESS: "📍",
    OTHER: "📄",
  };
  return icons[type] || "📄";
}
</script>

<template>
  <div class="form-control">
    <label v-if="label" class="label">
      <span class="label-text">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
      </span>
    </label>

    <div class="relative">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="placeholder"
            :disabled="disabled"
            :required="required"
            class="input input-bordered w-full"
            :class="{ 'pr-20': selectedEntity }"
            @focus="handleFocus"
            @blur="handleBlur"
          />

          <div
            v-if="selectedEntity"
            class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1"
          >
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              @click="clearSelection"
            >
              ✕
            </button>
          </div>

          <div
            v-if="isSearching"
            class="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <span class="loading loading-spinner loading-sm"></span>
          </div>

          <!-- Dropdown de résultats -->
          <div
            v-if="showDropdown && (hasResults || noResults)"
            class="absolute z-50 mt-1 w-full bg-base-100 shadow-xl rounded-box border border-base-300 max-h-60 overflow-y-auto"
          >
            <ul class="menu p-2">
              <li v-for="entity in searchResults" :key="entity.id">
                <a @click="selectEntity(entity)">
                  <span>{{ getEntityIcon(entity.type) }}</span>
                  <div class="flex-1">
                    <div class="font-medium">{{ entity.label }}</div>
                    <div class="text-xs opacity-60">{{ entity.type }}</div>
                  </div>
                </a>
              </li>

              <li v-if="noResults && allowCreate">
                <a @click="createNew" class="text-primary">
                  <span>➕</span>
                  <span>Créer "{{ searchQuery }}"</span>
                </a>
              </li>

              <li v-else-if="noResults">
                <div class="text-center py-2 text-sm opacity-60">
                  Aucune entité trouvée
                </div>
              </li>
            </ul>
          </div>
        </div>

        <button
          v-if="allowCreate"
          type="button"
          class="btn btn-outline"
          :disabled="disabled"
          @click="createNew"
        >
          + Créer
        </button>
      </div>
    </div>
  </div>
</template>
