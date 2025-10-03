<template>
  <div class="form-control w-full">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="!required" class="label-text-alt opacity-60">Optionnel</span>
    </label>

    <!-- Sélecteur avec recherche -->
    <div class="relative">
      <div
        class="input input-bordered flex flex-wrap gap-2 min-h-[3rem] max-h-32 overflow-y-auto cursor-pointer hover:border-primary transition-colors"
        :class="{ 'input-error': error, 'border-primary': isOpen }"
        @click="toggleDropdown"
      >
        <!-- Badges des articles sélectionnés -->
        <template v-if="selectedArticles.length > 0">
          <div
            v-for="code in selectedArticles"
            :key="code"
            class="badge badge-primary gap-2 py-3"
          >
            <span class="font-mono text-xs">{{ code }}</span>
            <button
              type="button"
              class="hover:text-error transition-colors"
              @click.stop="removeArticle(code)"
            >
              ✕
            </button>
          </div>
        </template>
        <span v-else class="opacity-50 py-2">
          {{ placeholder }}
        </span>
      </div>

      <!-- Dropdown menu -->
      <div
        v-show="isOpen"
        class="absolute z-50 mt-2 w-full bg-base-100 rounded-lg shadow-2xl border border-base-300 max-h-96 overflow-y-auto"
      >
        <!-- Recherche -->
        <div class="sticky top-0 bg-base-100 p-3 border-b border-base-300">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un article..."
            class="input input-sm input-bordered w-full"
            @click.stop
          />
        </div>

        <!-- Filtres par catégorie -->
        <div class="p-3 border-b border-base-300 flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-xs"
            :class="selectedCategory === null ? 'btn-primary' : 'btn-ghost'"
            @click="selectedCategory = null"
          >
            Tous ({{ filteredArticles.length }})
          </button>
          <button
            v-for="cat in categories"
            :key="cat.value"
            type="button"
            class="btn btn-xs"
            :class="selectedCategory === cat.value ? `btn-${cat.color}` : 'btn-ghost'"
            @click="selectedCategory = cat.value"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Liste des articles -->
        <div class="divide-y divide-base-200">
          <div
            v-for="article in filteredArticles"
            :key="article.code"
            class="p-3 hover:bg-base-200 cursor-pointer transition-colors"
            :class="{ 'bg-primary/10': isSelected(article.code) }"
            @click="toggleArticle(article.code)"
          >
            <div class="flex items-start gap-3">
              <!-- Checkbox -->
              <input
                type="checkbox"
                :checked="isSelected(article.code)"
                class="checkbox checkbox-primary checkbox-sm mt-1"
                @click.stop="toggleArticle(article.code)"
              />

              <div class="flex-1 min-w-0">
                <!-- Code et titre -->
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-mono text-sm font-bold">{{ article.code }}</span>
                  <span class="badge badge-sm" :class="`badge-${getCategoryColor(article.category)}`">
                    {{ article.category }}
                  </span>
                </div>

                <!-- Titre -->
                <div class="font-medium text-sm mb-1">{{ article.title }}</div>

                <!-- Description -->
                <div class="text-xs opacity-70 leading-relaxed">{{ article.description }}</div>
              </div>
            </div>
          </div>

          <!-- Aucun résultat -->
          <div v-if="filteredArticles.length === 0" class="p-6 text-center opacity-60">
            <div class="text-4xl mb-2">🔍</div>
            <div>Aucun article trouvé</div>
          </div>
        </div>

        <!-- Footer avec actions -->
        <div class="sticky bottom-0 bg-base-100 p-3 border-t border-base-300 flex justify-between items-center">
          <div class="text-sm opacity-70">
            {{ selectedArticles.length }} article(s) sélectionné(s)
          </div>
          <div class="flex gap-2">
            <button
              v-if="selectedArticles.length > 0"
              type="button"
              class="btn btn-sm btn-ghost"
              @click.stop="clearSelection"
            >
              Tout effacer
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              @click.stop="closeDropdown"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <label v-if="error" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </label>

    <!-- Aide -->
    <label v-if="hint && !error" class="label">
      <span class="label-text-alt opacity-60">{{ hint }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { LEGAL_ARTICLES, LEGAL_CATEGORIES, parseLegalBasis, serializeLegalBasis } from "@/data/legal-basis";

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    required?: boolean;
  }>(),
  {
    modelValue: null,
    label: "Base légale",
    placeholder: "Sélectionnez un ou plusieurs articles du CIC...",
    hint: "Articles du Code d'Instruction Criminelle belge",
    required: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

// État
const isOpen = ref(false);
const searchQuery = ref("");
const selectedCategory = ref<string | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// Articles sélectionnés (codes uniquement)
const selectedArticles = ref<string[]>([]);

// Initialiser depuis le modelValue
onMounted(() => {
  if (props.modelValue) {
    selectedArticles.value = parseLegalBasis(props.modelValue);
  }
});

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    selectedArticles.value = parseLegalBasis(newValue);
  }
);

// Émettre les changements
watch(
  selectedArticles,
  (newArticles) => {
    const serialized = newArticles.length > 0 ? serializeLegalBasis(newArticles) : null;
    emit("update:modelValue", serialized);
  },
  { deep: true }
);

// Catégories
const categories = LEGAL_CATEGORIES;

// Articles filtrés
const filteredArticles = computed(() => {
  let articles = LEGAL_ARTICLES;

  // Filtre par catégorie
  if (selectedCategory.value) {
    articles = articles.filter((a) => a.category === selectedCategory.value);
  }

  // Filtre par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    articles = articles.filter(
      (a) =>
        a.code.toLowerCase().includes(query) ||
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query)
    );
  }

  return articles;
});

// Fonctions
function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
}

function closeDropdown() {
  isOpen.value = false;
  searchQuery.value = "";
  selectedCategory.value = null;
}

function isSelected(code: string): boolean {
  return selectedArticles.value.includes(code);
}

function toggleArticle(code: string) {
  const index = selectedArticles.value.indexOf(code);
  if (index > -1) {
    selectedArticles.value.splice(index, 1);
  } else {
    selectedArticles.value.push(code);
  }
}

function removeArticle(code: string) {
  const index = selectedArticles.value.indexOf(code);
  if (index > -1) {
    selectedArticles.value.splice(index, 1);
  }
}

function clearSelection() {
  selectedArticles.value = [];
}

function getCategoryColor(category: string): string {
  return categories.find((c) => c.value === category)?.color || "neutral";
}

// Fermer le dropdown au clic extérieur
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest(".form-control")) {
    closeDropdown();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* Animations */
.badge {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Scrollbar personnalisée */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: hsl(var(--b2));
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>
