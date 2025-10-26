<template>
  <section class="space-y-6">
    <!-- En-tête avec style cohérent -->
    <header class="bg-base-200 border-l-4 border-accent p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <HugeiconsIcon :icon="UserCircle02Icon" :size="32" class="text-accent" />
            <h2 class="text-3xl font-bold">Gestion des données OSINT</h2>
          </div>
          <p class="text-sm text-base-content/60">
            Gérez et recherchez tous les éléments encodés dans vos rapports
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

    <!-- Navigation par onglets -->
    <div class="bg-base-200 border-l-4 border-primary p-4">
      <div role="tablist" class="tabs tabs-boxed bg-base-300/50">
        <button
          role="tab"
          @click="currentView = 'entities'"
          :class="['tab gap-2', currentView === 'entities' && 'tab-active']"
        >
          <HugeiconsIcon :icon="UserCircle02Icon" :size="18" />
          <span class="hidden sm:inline">Entités</span>
          <span class="badge badge-sm badge-ghost">{{ total }}</span>
        </button>
        <button
          role="tab"
          @click="currentView = 'extracted'"
          :class="['tab gap-2', currentView === 'extracted' && 'tab-active']"
        >
          <HugeiconsIcon :icon="Database01Icon" :size="18" />
          <span class="hidden sm:inline">Données extraites</span>
        </button>
      </div>
    </div>

    <!-- Vue Entités (par défaut) -->
    <div v-show="currentView === 'entities'">
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
        <p class="text-sm text-base-content/60 mb-6">
          {{ searchQuery ? "Modifiez vos critères de recherche" : "Créez votre première entité pour commencer" }}
        </p>
        <button
          v-if="canWrite && !searchQuery"
          @click="openCreateModal"
          class="btn btn-primary btn-lg gap-2"
        >
          <HugeiconsIcon :icon="Add01Icon" :size="20" />
          Créer une entité
        </button>
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

    <!-- Modal Détails Donnée Extraite -->
    <Teleport to="body">
      <dialog ref="extractedDetailsModal" class="modal">
        <div class="modal-box max-w-3xl">
          <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          
          <h3 class="font-bold text-2xl mb-4 flex items-center gap-2">
            <HugeiconsIcon :icon="getTypeIcon(selectedExtractedItem?.type || '')" :size="28" />
            Détails de la donnée
          </h3>

          <div v-if="selectedExtractedItem" class="space-y-6">
          <!-- Type et Valeur -->
          <div class="bg-base-200 border-l-4 p-4" :class="getTypeBorderClass(selectedExtractedItem.type)">
            <div class="flex items-center gap-2 mb-2">
              <span :class="getTypeBadgeClass(selectedExtractedItem.type)" class="badge gap-1">
                <HugeiconsIcon :icon="getTypeIcon(selectedExtractedItem.type)" :size="14" />
                {{ getTypeLabel(selectedExtractedItem.type) }}
              </span>
              <span class="badge badge-accent">
                {{ selectedExtractedItem.count }} rapport(s)
              </span>
            </div>
            <p class="font-bold text-xl break-all">{{ selectedExtractedItem.value }}</p>
          </div>

          <!-- Liste complète des rapports -->
          <div>
            <h4 class="font-semibold mb-3 flex items-center gap-2">
              <HugeiconsIcon :icon="FileAttachmentIcon" :size="20" />
              Rapports contenant cette donnée
            </h4>
            
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <router-link
                v-for="report in selectedExtractedItem.reports"
                :key="report.id"
                :to="`/reports/${report.id}`"
                class="bg-base-100 border-l-4 border-primary p-4 hover:bg-base-200 transition-colors flex items-center justify-between group"
              >
                <div class="flex items-center gap-3">
                  <HugeiconsIcon :icon="FileAttachmentIcon" :size="20" class="text-primary" />
                  <div>
                    <p class="font-semibold group-hover:text-primary transition-colors">
                      {{ report.title || report.caseNumber || 'Sans titre' }}
                    </p>
                    <p class="text-xs text-base-content/60">
                      {{ report.caseNumber || `ID: ${report.id.substring(0, 8)}...` }}
                    </p>
                  </div>
                </div>
                <HugeiconsIcon :icon="ArrowRight01Icon" :size="20" class="text-base-content/40 group-hover:text-primary transition-colors" />
              </router-link>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="searchInReports(selectedExtractedItem.value)"
              class="btn btn-primary flex-1 gap-2"
            >
              <HugeiconsIcon :icon="Search01Icon" :size="18" />
              Rechercher dans tous les rapports
            </button>
            <form method="dialog" class="flex-1">
              <button class="btn btn-ghost w-full">Fermer</button>
            </form>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
    </Teleport>
    </div>

    <!-- Vue Données extraites -->
    <div v-show="currentView === 'extracted'" class="space-y-6">
      <!-- Info -->
      <div class="bg-base-200 border-l-4 border-info p-6">
        <div class="flex items-start gap-4">
          <HugeiconsIcon :icon="InformationCircleIcon" :size="24" class="text-info shrink-0 mt-1" />
          <div>
            <h3 class="font-semibold text-lg mb-2">Données indexées par MeiliSearch</h3>
            <p class="text-sm text-base-content/70">
              Ces données sont automatiquement extraites de vos rapports et indexées pour la recherche et la détection de corrélations.
            </p>
          </div>
        </div>
      </div>

      <!-- Stats globales -->
      <div v-if="loadingExtracted" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="bg-base-200 border-l-4 border-base-300 p-5 animate-pulse">
          <div class="h-4 bg-base-300 rounded mb-2 w-20"></div>
          <div class="h-8 bg-base-300 rounded mb-1 w-12"></div>
          <div class="h-3 bg-base-300 rounded w-16"></div>
        </div>
      </div>
      
      <div v-else-if="extractedData" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <button
          @click="extractedFilter = 'phones'"
          class="bg-base-200 border-l-4 border-primary p-5 text-left hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div class="text-sm text-base-content/70 mb-1">Téléphones</div>
          <div class="text-2xl font-bold text-primary">{{ extractedData.stats.totalPhones }}</div>
          <div class="text-xs text-base-content/60 mt-1">indexés</div>
        </button>
        <button
          @click="extractedFilter = 'emails'"
          class="bg-base-200 border-l-4 border-accent p-5 text-left hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div class="text-sm text-base-content/70 mb-1">Emails</div>
          <div class="text-2xl font-bold text-accent">{{ extractedData.stats.totalEmails }}</div>
          <div class="text-xs text-base-content/60 mt-1">indexés</div>
        </button>
        <button
          @click="extractedFilter = 'companies'"
          class="bg-base-200 border-l-4 border-secondary p-5 text-left hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div class="text-sm text-base-content/70 mb-1">Entreprises</div>
          <div class="text-2xl font-bold text-secondary">{{ extractedData.stats.totalCompanies }}</div>
          <div class="text-xs text-base-content/60 mt-1">indexées</div>
        </button>
        <button
          @click="extractedFilter = 'platforms'"
          class="bg-base-200 border-l-4 border-info p-5 text-left hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div class="text-sm text-base-content/70 mb-1">Plateformes</div>
          <div class="text-2xl font-bold text-info">{{ extractedData.stats.totalPlatforms }}</div>
          <div class="text-xs text-base-content/60 mt-1">indexées</div>
        </button>
        <button
          @click="extractedFilter = 'aliases'"
          class="bg-base-200 border-l-4 border-success p-5 text-left hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div class="text-sm text-base-content/70 mb-1">Pseudos</div>
          <div class="text-2xl font-bold text-success">{{ extractedData.stats.totalAliases }}</div>
          <div class="text-xs text-base-content/60 mt-1">indexés</div>
        </button>
        <button
          @click="extractedFilter = 'addresses'"
          class="bg-base-200 border-l-4 border-warning p-5 text-left hover:bg-base-300 transition-colors cursor-pointer"
        >
          <div class="text-sm text-base-content/70 mb-1">Adresses</div>
          <div class="text-2xl font-bold text-warning">{{ extractedData.stats.totalAddresses }}</div>
          <div class="text-xs text-base-content/60 mt-1">indexées</div>
        </button>
      </div>
      
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="bg-base-200 border-l-4 border-primary p-5">
          <div class="text-sm text-base-content/70 mb-1">Téléphones</div>
          <div class="text-2xl font-bold text-primary">-</div>
          <div class="text-xs text-base-content/60 mt-1">indexés</div>
        </div>
        <div class="bg-base-200 border-l-4 border-accent p-5">
          <div class="text-sm text-base-content/70 mb-1">Emails</div>
          <div class="text-2xl font-bold text-accent">-</div>
          <div class="text-xs text-base-content/60 mt-1">indexés</div>
        </div>
        <div class="bg-base-200 border-l-4 border-secondary p-5">
          <div class="text-sm text-base-content/70 mb-1">Entreprises</div>
          <div class="text-2xl font-bold text-secondary">-</div>
          <div class="text-xs text-base-content/60 mt-1">indexées</div>
        </div>
        <div class="bg-base-200 border-l-4 border-info p-5">
          <div class="text-sm text-base-content/70 mb-1">Plateformes</div>
          <div class="text-2xl font-bold text-info">-</div>
          <div class="text-xs text-base-content/60 mt-1">indexées</div>
        </div>
        <div class="bg-base-200 border-l-4 border-success p-5">
          <div class="text-sm text-base-content/70 mb-1">Pseudos</div>
          <div class="text-2xl font-bold text-success">-</div>
          <div class="text-xs text-base-content/60 mt-1">indexés</div>
        </div>
        <div class="bg-base-200 border-l-4 border-warning p-5">
          <div class="text-sm text-base-content/70 mb-1">Adresses</div>
          <div class="text-2xl font-bold text-warning">-</div>
          <div class="text-xs text-base-content/60 mt-1">indexées</div>
        </div>
      </div>

      <!-- Message explicatif -->
      <div class="bg-base-200 border-l-4 border-accent p-6">
        <div class="flex items-start gap-4">
          <HugeiconsIcon :icon="Database01Icon" :size="24" class="text-accent shrink-0 mt-1" />
          <div class="space-y-3">
            <h3 class="font-semibold text-lg">Indexation automatique améliorée</h3>
            <p class="text-sm text-base-content/70">
              Depuis la dernière mise à jour, l'indexation capture maintenant **tous** les sous-éléments de vos rapports :
            </p>
            <ul class="text-sm text-base-content/70 space-y-2 list-disc list-inside">
              <li><strong>Noms d'entreprises</strong> : raison sociale, nom commercial (module entity_overview, companyDetails)</li>
              <li><strong>Plateformes</strong> : Facebook, Instagram, LinkedIn, etc. (module platform_analysis)</li>
              <li><strong>Pseudos/Usernames</strong> : handles, aliases, comptes utilisateurs (metadata.aliases)</li>
              <li><strong>Identifiants</strong> : téléphones, emails extraits des personDetails et companyDetails</li>
              <li><strong>Adresses</strong> : siège social, adresses opérationnelles, adresses personnelles</li>
              <li><strong>URLs</strong> : sites web, profils de plateformes</li>
            </ul>
            <div class="bg-primary/10 border-l-4 border-primary p-4 mt-4">
              <p class="text-sm font-medium">
                💡 <strong>Pour afficher les statistiques réelles</strong> : Allez dans <strong>Administration > Gestion de la recherche</strong> et cliquez sur "Actualiser les statistiques"
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Barre de recherche -->
      <div class="bg-base-100 border-l-4 border-accent p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="flex-1">
            <div class="relative">
              <HugeiconsIcon :icon="Search01Icon" :size="20" class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                v-model="extractedSearch"
                placeholder="Rechercher dans les données extraites..."
                class="input input-bordered w-full pl-10"
              />
              <button
                v-if="extractedSearch"
                @click="extractedSearch = ''"
                class="btn btn-ghost btn-sm btn-circle absolute right-2 top-1/2 -translate-y-1/2"
              >
                <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
              </button>
            </div>
          </div>
          <button
            @click="loadExtractedData()"
            class="btn btn-accent gap-2"
            :disabled="loadingExtracted"
          >
            <HugeiconsIcon :icon="RefreshIcon" :size="18" :class="{ 'animate-spin': loadingExtracted }" />
            Actualiser
          </button>
        </div>
      </div>

      <!-- Liste des données extraites -->
      <div class="bg-base-200 border-l-4 border-info p-6">
        <div v-if="loadingExtracted" class="space-y-3">
          <div v-for="i in 5" :key="i" class="bg-base-100 p-4 rounded animate-pulse">
            <div class="h-4 bg-base-300 rounded w-1/4 mb-2"></div>
            <div class="h-6 bg-base-300 rounded w-3/4"></div>
          </div>
        </div>

        <div v-else-if="errorExtracted" class="text-center py-12">
          <HugeiconsIcon :icon="AlertCircleIcon" :size="48" class="text-error mx-auto mb-4" />
          <p class="text-error font-semibold mb-2">Erreur lors du chargement des données</p>
          <p class="text-sm text-base-content/60 mb-4">{{ errorExtracted }}</p>
          <button @click="loadExtractedData()" class="btn btn-error btn-sm gap-2">
            <HugeiconsIcon :icon="RefreshIcon" :size="16" />
            Réessayer
          </button>
        </div>

        <div v-else-if="!extractedData || filteredExtractedData.length === 0" class="text-center py-12">
          <HugeiconsIcon :icon="Database01Icon" :size="64" class="text-base-content/20 mx-auto mb-4" />
          <p class="text-lg font-semibold mb-2">Aucune donnée extraite</p>
          <p class="text-sm text-base-content/60 mb-6">
            {{ extractedSearch || extractedFilter !== 'all' 
              ? 'Aucune donnée ne correspond à vos critères de recherche.' 
              : 'Les données seront extraites automatiquement des rapports que vous créez.'
            }}
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <router-link to="/reports/create" class="btn btn-primary gap-2">
              <HugeiconsIcon :icon="Add01Icon" :size="18" />
              Créer un rapport
            </router-link>
            <button
              v-if="extractedSearch || extractedFilter !== 'all'"
              @click="extractedSearch = ''; extractedFilter = 'all'"
              class="btn btn-ghost gap-2"
            >
              <HugeiconsIcon :icon="Cancel01Icon" :size="18" />
              Effacer les filtres
            </button>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <p class="text-sm text-base-content/60">
              {{ filteredExtractedData.length }} résultat(s)
              <span v-if="extractedFilter !== 'all'" class="font-semibold">
                (filtre: {{ getFilterLabel(extractedFilter) }})
              </span>
            </p>
            <button
              v-if="extractedFilter !== 'all'"
              @click="extractedFilter = 'all'"
              class="btn btn-ghost btn-xs gap-1"
            >
              <HugeiconsIcon :icon="Cancel01Icon" :size="14" />
              Voir tout
            </button>
          </div>

          <!-- Grille de cartes -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="item in filteredExtractedData"
              :key="`${item.type}-${item.value}`"
              class="bg-base-100 border-l-4 p-4 hover:shadow-lg transition-shadow cursor-pointer"
              :class="getTypeBorderClass(item.type)"
              @click="viewExtractedItem(item)"
            >
              <!-- Header avec type et icône -->
              <div class="flex items-center justify-between mb-3">
                <span :class="getTypeBadgeClass(item.type)" class="badge gap-1">
                  <HugeiconsIcon :icon="getTypeIcon(item.type)" :size="14" />
                  {{ getTypeLabel(item.type) }}
                </span>
                <span class="badge badge-accent badge-sm">
                  {{ item.count }} rapport(s)
                </span>
              </div>

              <!-- Valeur principale -->
              <div class="mb-3">
                <p class="font-bold text-lg break-all">{{ item.value }}</p>
              </div>

              <!-- Liste des rapports (3 premiers) -->
              <div class="space-y-1 mb-3">
                <p class="text-xs text-base-content/60 font-semibold mb-1">Rapports sources :</p>
                <div class="flex flex-wrap gap-1">
                  <router-link
                    v-for="report in item.reports.slice(0, 3)"
                    :key="report.id"
                    :to="`/reports/${report.id}`"
                    class="badge badge-ghost badge-xs hover:badge-primary"
                    @click.stop
                    :title="`${report.title} (${report.caseNumber || report.id.substring(0, 8)}...)`"
                  >
                    {{ report.title || report.caseNumber || report.id.substring(0, 8) + '...' }}
                  </router-link>
                  <span v-if="item.count > 3" class="badge badge-ghost badge-xs">
                    +{{ item.count - 3 }} autre(s)
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  @click.stop="viewExtractedItem(item)"
                  class="btn btn-sm btn-ghost gap-1 flex-1"
                >
                  <HugeiconsIcon :icon="FileAttachmentIcon" :size="14" />
                  Voir détails
                </button>
                <button
                  @click.stop="searchInReports(item.value)"
                  class="btn btn-sm btn-primary gap-1"
                >
                  <HugeiconsIcon :icon="Search01Icon" :size="14" />
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          <!-- Info si plus de résultats -->
          <div v-if="filteredExtractedData.length >= 100" class="bg-warning/10 border-l-4 border-warning p-4">
            <p class="text-sm">
              <strong>ℹ️ Limite atteinte</strong> : Seuls les 100 premiers résultats sont affichés.
              Utilisez les filtres ou la recherche pour affiner les résultats.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { entitiesApi, type Entity, type EntityType } from "@/services/api/entities";
import { searchService, type ExtractedData } from "@/services/api/search";
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
  Database01Icon,
  Settings02Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

const authStore = useAuthStore();
const router = useRouter();

const canWrite = computed(() => authStore.hasPermission("reports:write"));

// Vue actuelle (entities ou extracted)
const currentView = ref<'entities' | 'extracted'>('entities');

// État - Entités
const entities = ref<Entity[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref("");
const selectedType = ref<EntityType | "ALL">("ALL");
const total = ref(0);
const limit = ref(12);
const offset = ref(0);

// État - Données extraites
const extractedData = ref<ExtractedData | null>(null);
const loadingExtracted = ref(false);
const errorExtracted = ref<string | null>(null);
const extractedFilter = ref<'all' | 'phones' | 'emails' | 'names' | 'addresses' | 'urls' | 'accounts' | 'platforms' | 'companies' | 'aliases'>('all');
const extractedSearch = ref('');
const selectedExtractedItem = ref<{ 
  type: string; 
  value: string; 
  reports: Array<{ id: string; title: string; caseNumber: string | null }>; 
  count: number 
} | null>(null);
const extractedDetailsModal = ref<HTMLDialogElement>();

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

watch(currentView, async (newView) => {
  if (newView === 'extracted' && !extractedData.value) {
    await loadExtractedData();
  }
});

// Charger les données extraites
const loadExtractedData = async () => {
  try {
    loadingExtracted.value = true;
    errorExtracted.value = null;
    const data = await searchService.getExtractedData();
    extractedData.value = data;
  } catch (err: any) {
    console.error("[EntitiesPage] Erreur chargement données extraites:", err);
    errorExtracted.value = err?.response?.data?.message || "Erreur lors du chargement des données";
  } finally {
    loadingExtracted.value = false;
  }
};

// Données filtrées pour affichage
const filteredExtractedData = computed(() => {
  if (!extractedData.value) return [];
  
  let items: Array<{ 
    value: string; 
    reports: Array<{ id: string; title: string; caseNumber: string | null }>; 
    count: number; 
    type: string 
  }> = [];
  
  if (extractedFilter.value === 'all') {
    items = [
      ...extractedData.value.companies.map(item => ({ ...item, type: 'Entreprise' })),
      ...extractedData.value.platforms.map(item => ({ ...item, type: 'Plateforme' })),
      ...extractedData.value.aliases.map(item => ({ ...item, type: 'Pseudo' })),
      ...extractedData.value.names.map(item => ({ ...item, type: 'Nom' })),
      ...extractedData.value.phones.map(item => ({ ...item, type: 'Téléphone' })),
      ...extractedData.value.emails.map(item => ({ ...item, type: 'Email' })),
      ...extractedData.value.addresses.map(item => ({ ...item, type: 'Adresse' })),
      ...extractedData.value.urls.map(item => ({ ...item, type: 'URL' })),
      ...extractedData.value.accounts.map(item => ({ ...item, type: 'Compte' })),
    ];
  } else {
    const typeMap: Record<string, string> = {
      companies: 'Entreprise',
      platforms: 'Plateforme',
      aliases: 'Pseudo',
      names: 'Nom',
      phones: 'Téléphone',
      emails: 'Email',
      addresses: 'Adresse',
      urls: 'URL',
      accounts: 'Compte',
    };
    const filterKey = extractedFilter.value as keyof ExtractedData;
    if (filterKey !== 'stats' && extractedData.value[filterKey]) {
      items = (extractedData.value[filterKey] as any[]).map(item => ({
        ...item,
        type: typeMap[extractedFilter.value] || extractedFilter.value,
      }));
    }
  }
  
  // Filtrer par recherche
  if (extractedSearch.value.trim()) {
    const search = extractedSearch.value.toLowerCase();
    items = items.filter(item => 
      item.value.toLowerCase().includes(search) ||
      item.reports.some(r => 
        r.title?.toLowerCase().includes(search) ||
        r.caseNumber?.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search)
      )
    );
  }
  
  return items.slice(0, 100); // Limiter à 100 pour les performances
});

// Helper functions pour le tableau
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'Entreprise': 'Entreprise',
    'Plateforme': 'Plateforme',
    'Pseudo': 'Pseudo',
    'Nom': 'Nom',
    'Téléphone': 'Téléphone',
    'Email': 'Email',
    'Adresse': 'Adresse',
    'URL': 'URL',
    'Compte': 'Compte',
  };
  return labels[type] || type;
};

const getTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    'Entreprise': Building03Icon,
    'Plateforme': GridViewIcon,
    'Pseudo': UserCircle02Icon,
    'Nom': User02Icon,
    'Téléphone': Call02Icon,
    'Email': Mail01Icon,
    'Adresse': Location01Icon,
    'URL': Link01Icon,
    'Compte': UserCircle02Icon,
  };
  return icons[type] || Tag01Icon;
};

const getTypeBadgeClass = (type: string): string => {
  const classes: Record<string, string> = {
    'Entreprise': 'badge-primary',
    'Plateforme': 'badge-secondary',
    'Pseudo': 'badge-accent',
    'Nom': 'badge-info',
    'Téléphone': 'badge-success',
    'Email': 'badge-warning',
    'Adresse': 'badge-error',
    'URL': 'badge-neutral',
    'Compte': 'badge-ghost',
  };
  return classes[type] || 'badge-ghost';
};

const getTypeBorderClass = (type: string): string => {
  const classes: Record<string, string> = {
    'Entreprise': 'border-primary',
    'Plateforme': 'border-secondary',
    'Pseudo': 'border-accent',
    'Nom': 'border-info',
    'Téléphone': 'border-success',
    'Email': 'border-warning',
    'Adresse': 'border-error',
    'URL': 'border-neutral',
    'Compte': 'border-ghost',
  };
  return classes[type] || 'border-ghost';
};

const getFilterLabel = (filter: string): string => {
  const labels: Record<string, string> = {
    'companies': 'Entreprises',
    'platforms': 'Plateformes',
    'aliases': 'Pseudos',
    'names': 'Noms',
    'phones': 'Téléphones',
    'emails': 'Emails',
    'addresses': 'Adresses',
    'urls': 'URLs',
    'accounts': 'Comptes',
  };
  return labels[filter] || filter;
};

const viewExtractedItem = (item: { 
  type: string; 
  value: string; 
  reports: Array<{ id: string; title: string; caseNumber: string | null }>; 
  count: number 
}) => {
  console.log('[viewExtractedItem] Opening modal with item:', item);
  try {
    selectedExtractedItem.value = item;
    console.log('[viewExtractedItem] selectedExtractedItem set:', selectedExtractedItem.value);
    console.log('[viewExtractedItem] Modal element:', extractedDetailsModal.value);
    
    nextTick(() => {
      if (extractedDetailsModal.value) {
        console.log('[viewExtractedItem] Calling showModal()');
        // Fermer d'abord si déjà ouvert
        if (extractedDetailsModal.value.open) {
          extractedDetailsModal.value.close();
        }
        // Ouvrir le modal
        extractedDetailsModal.value.showModal();
        console.log('[viewExtractedItem] Modal should be open now');
      } else {
        console.error('[viewExtractedItem] Modal ref is null!');
      }
    });
  } catch (error) {
    console.error('[viewExtractedItem] Error:', error);
  }
};

const searchInReports = (value: string) => {
  // Navigation vers la page de recherche avec le terme pré-rempli
  router.push({ name: 'search', query: { q: value } });
};

// Init
onMounted(() => {
  loadEntities();
});
</script>
