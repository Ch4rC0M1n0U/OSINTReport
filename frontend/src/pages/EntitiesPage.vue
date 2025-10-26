<template>
  <section class="space-y-6">
    <!-- En-tête avec style cohérent -->
    <header class="bg-base-200 border-l-4 border-accent p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <HugeiconsIcon :icon="UserCircle02Icon" :size="32" class="text-accent" />
            <h2 class="text-3xl font-bold">Entités</h2>
          </div>
          <p class="text-sm text-base-content/60">
            Gérez et recherchez toutes les entités encodées dans vos rapports
          </p>
        </div>
        <button
          v-if="canWrite"
          @click="openCreateModal"
          class="btn btn-primary gap-2"
        >
          <HugeiconsIcon :icon="Add01Icon" :size="20" />
          Nouvelle entité
        </button>
      </div>
    </header>

    <!-- Barre de recherche et filtres -->
    <div class="bg-base-100 border-l-4 border-info shadow-sm p-6">
      <div class="flex flex-col gap-4">
        <!-- Recherche -->
        <div class="relative">
          <HugeiconsIcon :icon="Search01Icon" :size="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher une entité..."
            class="input input-bordered w-full pl-12"
            @input="handleSearch"
          />
        </div>

        <!-- Filtres par catégorie -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in categoryFilters"
            :key="filter.type"
            @click="selectedType = filter.type"
            :class="[
              'btn btn-sm gap-2 normal-case transition-all',
              selectedType === filter.type 
                ? 'btn-primary' 
                : 'btn-ghost hover:btn-outline'
            ]"
          >
            <HugeiconsIcon :icon="filter.icon" :size="18" />
            <span class="font-medium">{{ filter.label }}</span>
            <span v-if="filter.count !== undefined" 
                  class="badge badge-sm"
                  :class="selectedType === filter.type ? 'badge-neutral' : 'badge-ghost'"
            >
              {{ filter.count }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- État de chargement -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-base-100 border-l-4 border-base-300 h-40 animate-pulse shadow-sm"
      ></div>
    </div>

    <!-- État d'erreur -->
    <div v-else-if="error" class="alert alert-error">
      <HugeiconsIcon :icon="AlertCircleIcon" :size="24" />
      <div>
        <h3 class="font-bold">Erreur</h3>
        <div class="text-sm">{{ error }}</div>
      </div>
      <button class="btn btn-sm" @click="loadEntities">
        <HugeiconsIcon :icon="RefreshIcon" :size="16" />
        Réessayer
      </button>
    </div>

    <!-- Liste des entités -->
    <div v-else-if="entities.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="entity in entities"
        :key="entity.id"
        @click="viewEntity(entity)"
        class="bg-base-100 border-l-4 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md p-5"
        :class="{
          'border-primary': entity.type === 'PERSON',
          'border-secondary': entity.type === 'ORGANIZATION',
          'border-accent': entity.type === 'TELEPHONE',
          'border-info': entity.type === 'EMAIL',
          'border-success': entity.type === 'ACCOUNT',
          'border-warning': entity.type === 'ADDRESS',
          'border-neutral': entity.type === 'OTHER'
        }"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-lg bg-base-200">
              <HugeiconsIcon :icon="getEntityIcon(entity.type)" :size="20" :class="`text-${getEntityColor(entity.type)}`" />
            </div>
            <span class="badge badge-outline badge-sm">
              {{ getEntityTypeLabel(entity.type) }}
            </span>
          </div>
          <button
            v-if="canWrite"
            @click.stop="openDeleteModal(entity)"
            class="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
          >
            <HugeiconsIcon :icon="Delete02Icon" :size="16" />
          </button>
        </div>

        <h2 class="text-lg font-bold truncate mb-2">
          {{ entity.label }}
        </h2>

        <p v-if="entity.notes" class="text-sm text-base-content/70 line-clamp-2 mb-3">
          {{ entity.notes }}
        </p>

        <div class="flex items-center gap-3 text-xs text-base-content/60">
          <span v-if="entity._count?.modules" class="flex items-center gap-1">
            <HugeiconsIcon :icon="FileAttachmentIcon" :size="14" />
            {{ entity._count.modules }}
          </span>
          <span v-if="entity._count?.researchRecords" class="flex items-center gap-1">
            <HugeiconsIcon :icon="Search01Icon" :size="14" />
            {{ entity._count.researchRecords }}
          </span>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="bg-base-100 border-l-4 border-base-300 shadow-sm p-12">
      <div class="text-center">
        <HugeiconsIcon :icon="FolderOffIcon" :size="64" class="text-base-content/20 mx-auto mb-4" />
        <p class="text-lg font-semibold mb-2">Aucune entité trouvée</p>
        <p class="text-sm text-base-content/60">
          {{ searchQuery ? "Modifiez vos critères de recherche" : "Créez votre première entité pour commencer" }}
        </p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="total > limit" class="flex justify-center gap-2">
      <button
        @click="previousPage"
        :disabled="offset === 0"
        class="btn btn-sm"
      >
        <HugeiconsIcon :icon="ArrowLeft01Icon" :size="16" />
        Précédent
      </button>
      <div class="flex items-center gap-2 px-4">
        <span class="text-sm font-medium">Page {{ currentPage }} sur {{ totalPages }}</span>
      </div>
      <button
        @click="nextPage"
        :disabled="offset + limit >= total"
        class="btn btn-sm"
      >
        Suivant
        <HugeiconsIcon :icon="ArrowRight01Icon" :size="16" />
      </button>
    </div>

    <!-- Modal de détails -->
    <dialog ref="detailsModal" class="modal">
      <div class="modal-box">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 class="font-bold text-lg mb-4">Détails de l'entité</h3>
        
        <div v-if="selectedEntity" class="space-y-4">
          <div>
            <label class="label">
              <span class="label-text font-semibold">Type d'entité</span>
            </label>
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div class="w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <HugeiconsIcon :icon="getEntityIcon(selectedEntity.type)" :size="24" class="text-primary" />
                </div>
              </div>
              <span class="badge badge-primary badge-lg">
                {{ getEntityTypeLabel(selectedEntity.type) }}
              </span>
            </div>
          </div>

          <div class="divider my-2"></div>

          <div>
            <label class="label">
              <span class="label-text font-semibold">Identifiant</span>
            </label>
            <p class="text-xl font-bold">{{ selectedEntity.label }}</p>
          </div>

          <div v-if="selectedEntity.notes">
            <label class="label">
              <span class="label-text font-semibold">Notes</span>
            </label>
            <div class="p-3 bg-base-300 rounded-lg">
              <p class="opacity-90">{{ selectedEntity.notes }}</p>
            </div>
          </div>

          <div class="divider my-2"></div>

          <div class="grid grid-cols-2 gap-4">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-primary">
                <HugeiconsIcon :icon="FileAttachmentIcon" :size="32" />
              </div>
              <div class="stat-title">Modules liés</div>
              <div class="stat-value text-primary">
                {{ selectedEntity._count?.modules || 0 }}
              </div>
            </div>
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-secondary">
                <HugeiconsIcon :icon="Search01Icon" :size="32" />
              </div>
              <div class="stat-title">Recherches</div>
              <div class="stat-value text-secondary">
                {{ selectedEntity._count?.researchRecords || 0 }}
              </div>
            </div>
          </div>

          <div class="divider my-2"></div>

          <div class="grid grid-cols-2 gap-4 text-sm opacity-70">
            <div>
              <label class="label">
                <span class="label-text">Créée le</span>
              </label>
              <p class="font-mono">{{ formatDate(selectedEntity.createdAt) }}</p>
            </div>
            <div>
              <label class="label">
                <span class="label-text">Modifiée le</span>
              </label>
              <p class="font-mono">{{ formatDate(selectedEntity.updatedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- Modal de création -->
    <dialog ref="createModal" class="modal">
      <div class="modal-box max-w-2xl">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 class="font-bold text-2xl mb-2 flex items-center gap-2">
          <HugeiconsIcon :icon="PlusSignCircleIcon" :size="28" class="text-primary" />
          Nouvelle entité
        </h3>
        <p class="text-sm opacity-70 mb-6">Ajoutez une nouvelle entité à votre base de données OSINT</p>
        
        <div class="space-y-5">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Type d'entité</span>
              <span class="label-text-alt text-error">*</span>
            </label>
            <select
              v-model="newEntity.type"
              class="select select-bordered select-lg"
            >
              <option v-for="type in entityTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
            <label class="label">
              <span class="label-text-alt">Choisissez le type correspondant à l'entité</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Identifiant</span>
              <span class="label-text-alt text-error">*</span>
            </label>
            <input
              v-model="newEntity.label"
              type="text"
              placeholder="ex: Jean Dupont, Acme Corp, +33 6 12 34 56 78..."
              class="input input-bordered input-lg"
              required
            />
            <label class="label">
              <span class="label-text-alt">Le nom, numéro ou identifiant de l'entité</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Notes complémentaires</span>
              <span class="label-text-alt opacity-60">optionnel</span>
            </label>
            <textarea
              v-model="newEntity.notes"
              placeholder="Ajoutez des informations contextuelles, des remarques ou des détails supplémentaires..."
              class="textarea textarea-bordered textarea-lg h-24"
              rows="4"
            ></textarea>
          </div>

          <div class="modal-action gap-3">
            <form method="dialog">
              <button class="btn btn-lg">
                <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
                Annuler
              </button>
            </form>
            <button
              @click="createEntity"
              :disabled="!newEntity.label || !newEntity.type || creating"
              class="btn btn-primary btn-lg gap-2"
            >
              <span v-if="creating" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="Add01Icon" :size="16" />
              {{ creating ? 'Création en cours...' : 'Créer l\'entité' }}
            </button>
          </div>
        </div>
      </div>
    </dialog>

    <!-- Modal de suppression -->
    <dialog ref="deleteModal" class="modal">
      <div class="modal-box">
        <form method="dialog">
          <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-error/10 rounded-full mb-4">
            <HugeiconsIcon :icon="Alert01Icon" :size="40" class="text-error" />
          </div>
          <h3 class="font-bold text-2xl mb-2">Supprimer l'entité ?</h3>
        </div>
        
        <div class="bg-base-200 p-4 rounded-lg mb-4">
          <p class="text-center mb-2">
            Vous êtes sur le point de supprimer :
          </p>
          <p class="text-center text-xl font-bold">
            {{ entityToDelete?.label }}
          </p>
          <p class="text-center text-sm opacity-70 mt-2">
            Type : {{ getEntityTypeLabel(entityToDelete?.type || 'OTHER') }}
          </p>
        </div>
        
        <div class="alert alert-warning mb-6">
          <HugeiconsIcon :icon="InformationCircleIcon" :size="20" />
          <span class="text-sm">
            Cette action est <strong>irréversible</strong>. L'entité sera définitivement supprimée de votre base de données.
          </span>
        </div>

        <div class="modal-action gap-3">
          <form method="dialog" class="flex-1">
            <button class="btn btn-lg w-full">
              <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
              Annuler
            </button>
          </form>
          <button
            @click="deleteEntity"
            :disabled="deleting"
            class="btn btn-error btn-lg flex-1 gap-2"
          >
            <span v-if="deleting" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="Delete02Icon" :size="16" />
            {{ deleting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { entitiesApi, type Entity, type EntityType } from "@/services/api/entities";
import { useAuthStore } from "@/stores/auth";

// Import HugeIcons
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Add01Icon,
  Search01Icon,
  GridViewIcon,
  User02Icon,
  Building03Icon,
  Call02Icon,
  Mail01Icon,
  UserCircle02Icon,
  Location01Icon,
  Tag01Icon,
  AlertCircleIcon,
  RefreshIcon,
  Delete02Icon,
  FileAttachmentIcon,
  FolderOffIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlusSignCircleIcon,
  Cancel01Icon,
  Alert01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

const authStore = useAuthStore();

const canWrite = computed(() => authStore.hasPermission("reports:write"));

// État
const entities = ref<Entity[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedType = ref<EntityType | "ALL">("ALL");
const total = ref(0);
const limit = ref(12);
const offset = ref(0);

// Modals
const detailsModal = ref<HTMLDialogElement>();
const createModal = ref<HTMLDialogElement>();
const deleteModal = ref<HTMLDialogElement>();
const selectedEntity = ref<Entity | null>(null);
const entityToDelete = ref<Entity | null>(null);

// Création
const newEntity = ref({
  label: "",
  type: "PERSON" as EntityType,
  notes: "",
});
const creating = ref(false);

// Suppression
const deleting = ref(false);

// Pagination
const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1);
const totalPages = computed(() => Math.ceil(total.value / limit.value));

// Configuration des types
const entityTypes = [
  { value: "PERSON", label: "Personnes", icon: User02Icon, color: "primary" },
  { value: "ORGANIZATION", label: "Organisations", icon: Building03Icon, color: "secondary" },
  { value: "TELEPHONE", label: "Téléphones", icon: Call02Icon, color: "accent" },
  { value: "EMAIL", label: "Adresses e-mail", icon: Mail01Icon, color: "info" },
  { value: "ACCOUNT", label: "Comptes", icon: UserCircle02Icon, color: "success" },
  { value: "ADDRESS", label: "Adresses", icon: Location01Icon, color: "warning" },
  { value: "OTHER", label: "Autres", icon: Tag01Icon, color: "neutral" },
];

const categoryFilters = computed(() => {
  const allFilter = {
    type: "ALL" as const,
    label: "Toutes",
    icon: GridViewIcon,
    count: total.value,
  };

  const typeFilters = entityTypes.map((type) => ({
    type: type.value as EntityType,
    label: type.label,
    icon: type.icon,
    count: undefined, // Pourrait être calculé depuis les stats
  }));

  return [allFilter, ...typeFilters];
});

// Fonctions utilitaires
const getEntityIcon = (type: EntityType) => {
  return entityTypes.find((t) => t.value === type)?.icon || Tag01Icon;
};

const getEntityTypeLabel = (type: EntityType) => {
  return entityTypes.find((t) => t.value === type)?.label || type;
};

const getEntityColor = (type: EntityType) => {
  return entityTypes.find((t) => t.value === type)?.color || "neutral";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Chargement des entités
const loadEntities = async () => {
  try {
    loading.value = true;
    error.value = null;
    const params: any = {
      limit: limit.value,
      offset: offset.value,
    };

    if (selectedType.value !== "ALL") {
      params.type = selectedType.value;
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim();
    }

    console.log("[EntitiesPage] Chargement des entités avec params:", params);
    const response = await entitiesApi.list(params);
    console.log("[EntitiesPage] Réponse API:", response);
    entities.value = response.items;
    total.value = response.total;
  } catch (err: any) {
    console.error("[EntitiesPage] Erreur lors du chargement des entités:", err);
    error.value = err?.response?.data?.message || err?.message || "Erreur lors du chargement des entités";
    // En cas d'erreur, on vide la liste
    entities.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// Recherche avec debounce
let searchTimeout: NodeJS.Timeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    offset.value = 0; // Reset pagination
    loadEntities();
  }, 300);
};

// Navigation
const viewEntity = (entity: Entity) => {
  selectedEntity.value = entity;
  detailsModal.value?.showModal();
};

const openCreateModal = () => {
  newEntity.value = {
    label: "",
    type: "PERSON",
    notes: "",
  };
  createModal.value?.showModal();
};

const openDeleteModal = (entity: Entity) => {
  entityToDelete.value = entity;
  deleteModal.value?.showModal();
};

// Actions
const createEntity = async () => {
  if (!newEntity.value.label || !newEntity.value.type) return;

  try {
    creating.value = true;
    await entitiesApi.create({
      label: newEntity.value.label,
      type: newEntity.value.type,
      notes: newEntity.value.notes || undefined,
    });
    createModal.value?.close();
    loadEntities();
  } catch (error) {
    console.error("Erreur lors de la création:", error);
  } finally {
    creating.value = false;
  }
};

const deleteEntity = async () => {
  if (!entityToDelete.value) return;

  try {
    deleting.value = true;
    await entitiesApi.delete(entityToDelete.value.id);
    deleteModal.value?.close();
    loadEntities();
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
  } finally {
    deleting.value = false;
  }
};

// Pagination
const previousPage = () => {
  if (offset.value > 0) {
    offset.value = Math.max(0, offset.value - limit.value);
    loadEntities();
  }
};

const nextPage = () => {
  if (offset.value + limit.value < total.value) {
    offset.value += limit.value;
    loadEntities();
  }
};

// Watchers
watch(selectedType, () => {
  offset.value = 0;
  loadEntities();
});

// Init
onMounted(() => {
  loadEntities();
});
</script>
