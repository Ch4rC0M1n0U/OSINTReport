<template>
  <div>
    <!-- Modal principale -->
    <div v-if="isOpen" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-3xl">
        <h3 class="text-lg font-bold mb-4">
          {{ isNew ? '➕ Nouvelle entité' : '✏️ Modifier l\'entité' }}
        </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Nom de l'entité -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Nom de l'entité *</span>
          </label>
          <input
            v-model="localEntity.label"
            type="text"
            placeholder="Ex: John Doe, ACME Corp..."
            class="input input-bordered"
            :class="{ 'input-error': errors.label }"
            required
          />
          <label v-if="errors.label" class="label">
            <span class="label-text-alt text-error">{{ errors.label }}</span>
          </label>
        </div>

        <!-- Type d'entité -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Type d'entité *</span>
          </label>
          <select
            v-model="entityType"
            class="select select-bordered"
            required
          >
            <option value="">-- Sélectionner un type --</option>
            <option value="person">👤 Personne physique</option>
            <option value="organization">🏢 Organisation</option>
            <option value="company">🏭 Entreprise</option>
            <option value="group">👥 Groupe</option>
            <option value="alias">🎭 Pseudonyme</option>
            <option value="other">❓ Autre</option>
          </select>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea
            v-model="localEntity.description"
            placeholder="Description détaillée de l'entité..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- Niveau de confiance -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Niveau de confiance</span>
          </label>
          <select v-model="localEntity.confidence" class="select select-bordered">
            <option value="confirmed">✅ Confirmé</option>
            <option value="probable">🟡 Probable</option>
            <option value="possible">🟠 Possible</option>
            <option value="unknown">❓ Inconnu</option>
          </select>
        </div>

        <!-- Aliases -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Alias / Pseudonymes</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(alias, index) in aliases"
              :key="index"
              class="join w-full"
            >
              <input
                :value="alias"
                @input="updateAlias(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Alias ou pseudonyme"
                class="input input-bordered input-sm join-item flex-1"
              />
              <button
                type="button"
                class="btn btn-sm btn-ghost join-item"
                @click="removeAlias(index)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-block"
              @click="addAlias"
            >
              + Ajouter un alias
            </button>
          </div>
        </div>

        <!-- Champs spécifiques : Personne physique -->
        <div v-if="entityType === 'person'" class="space-y-3 p-4 bg-base-200 rounded-lg">
          <h4 class="font-semibold text-sm flex items-center gap-2">
            <span>👤</span>
            <span>Informations personnelles</span>
          </h4>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text text-xs">Date de naissance</span>
              </label>
              <input
                v-model="personDetails.dateOfBirth"
                type="date"
                class="input input-bordered input-sm"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text text-xs">Numéro Registre National</span>
              </label>
              <input
                v-model="personDetails.nationalRegistryNumber"
                type="text"
                placeholder="XX.XX.XX-XXX.XX"
                class="input input-bordered input-sm font-mono"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Adresse physique</span>
            </label>
            <textarea
              v-model="personDetails.physicalAddress"
              placeholder="Rue, numéro, code postal, ville, pays"
              class="textarea textarea-bordered textarea-sm"
              rows="2"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Numéros de téléphone</span>
            </label>
            <div class="space-y-1">
              <div
                v-for="(phone, index) in personDetails.phoneNumbers || []"
                :key="index"
                class="join w-full"
              >
                <input
                  :value="phone"
                  @input="updatePersonPhone(index, ($event.target as HTMLInputElement).value)"
                  type="tel"
                  placeholder="+32 XXX XX XX XX"
                  class="input input-bordered input-sm join-item flex-1 font-mono"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-ghost join-item"
                  @click="removePersonPhone(index)"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                class="btn btn-xs btn-ghost btn-block"
                @click="addPersonPhone"
              >
                + Ajouter un numéro
              </button>
            </div>
          </div>
        </div>

        <!-- Champs spécifiques : Société/Organisation -->
        <div v-if="entityType === 'organization' || entityType === 'company'" class="space-y-3 p-4 bg-base-200 rounded-lg">
          <h4 class="font-semibold text-sm flex items-center gap-2">
            <span>🏢</span>
            <span>Informations société</span>
          </h4>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text text-xs">Numéro BCE</span>
              </label>
              <input
                v-model="companyDetails.bceNumber"
                type="text"
                placeholder="0XXX.XXX.XXX"
                class="input input-bordered input-sm font-mono"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text text-xs">Site web</span>
              </label>
              <input
                v-model="companyDetails.website"
                type="url"
                placeholder="https://example.com"
                class="input input-bordered input-sm"
              />
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Adresse du siège social</span>
            </label>
            <textarea
              v-model="companyDetails.headquartersAddress"
              placeholder="Rue, numéro, code postal, ville, pays"
              class="textarea textarea-bordered textarea-sm"
              rows="2"
            ></textarea>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Adresses d'exploitation</span>
            </label>
            <div class="space-y-1">
              <div
                v-for="(address, index) in companyDetails.operationalAddresses || []"
                :key="index"
                class="join w-full"
              >
                <input
                  :value="address"
                  @input="updateOperationalAddress(index, ($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="Adresse d'exploitation"
                  class="input input-bordered input-sm join-item flex-1"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-ghost join-item"
                  @click="removeOperationalAddress(index)"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                class="btn btn-xs btn-ghost btn-block"
                @click="addOperationalAddress"
              >
                + Ajouter une adresse
              </button>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-xs">Numéros de téléphone</span>
            </label>
            <div class="space-y-1">
              <div
                v-for="(phone, index) in companyDetails.phoneNumbers || []"
                :key="index"
                class="join w-full"
              >
                <input
                  :value="phone"
                  @input="updateCompanyPhone(index, ($event.target as HTMLInputElement).value)"
                  type="tel"
                  placeholder="+32 XXX XX XX XX"
                  class="input input-bordered input-sm join-item flex-1 font-mono"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-ghost join-item"
                  @click="removeCompanyPhone(index)"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                class="btn btn-xs btn-ghost btn-block"
                @click="addCompanyPhone"
              >
                + Ajouter un numéro
              </button>
            </div>
          </div>
        </div>

        <!-- Entité vérifiée -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="isVerified"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">✓ Entité vérifiée</span>
          </label>
        </div>

        <!-- Pièces jointes / Images -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">📷 Photos / Captures d'écran ({{ attachmentsCount }})</span>
            <span class="label-text-alt text-xs opacity-60">
              Logos, photos d'identité, documents...
            </span>
          </label>
          
          <!-- Liste des images actuelles -->
          <div v-if="attachmentsCount > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <div
              v-for="(attachmentUrl, idx) in localEntity.attachments"
              :key="idx"
              class="relative group"
            >
              <img
                :src="attachmentUrl"
                alt="Pièce jointe"
                class="w-full h-24 object-cover rounded border border-base-300"
                @error="handleImageError"
              />
              <button
                type="button"
                class="absolute top-1 right-1 btn btn-xs btn-circle btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                @click="removeAttachment(idx)"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
          
          <!-- Loader pendant upload -->
          <div v-if="isUploadingFile" class="flex items-center gap-2 mb-3 text-sm">
            <span class="loading loading-spinner loading-sm"></span>
            <span>Upload en cours...</span>
          </div>
          
          <!-- Boutons d'ajout -->
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline flex-1"
              @click="openScreenshotGallery"
            >
              <span>🖼️</span>
              <span>Choisir depuis la galerie</span>
            </button>
            <label class="btn btn-sm btn-outline cursor-pointer">
              <span>📤</span>
              <span>Upload</span>
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                @change="handleFileUpload"
              />
            </label>
          </div>
          
          <!-- Erreur d'upload -->
          <div v-if="uploadError" class="alert alert-error mt-2 text-sm">
            <span>⚠️</span>
            <span>{{ uploadError }}</span>
          </div>
          
          <!-- Info -->
          <label class="label">
            <span class="label-text-alt text-xs opacity-60">
              💡 Ces images apparaîtront dans les blocs de texte enrichi
            </span>
          </label>
        </div>

        <!-- Sources -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Sources ({{ localEntity.sources.length }})</span>
          </label>
          <SourcesListEditor v-model="localEntity.sources" />
        </div>

        <!-- Liens vers autres modules (croisements) -->
        <div class="divider text-sm opacity-60">🔗 Croisements</div>

        <div class="form-control">
          <label class="label">
            <span class="label-text text-xs">Identifiants liés (téléphones, emails, usernames)</span>
            <span class="label-text-alt text-xs opacity-60">
              {{ relatedIdentifiersCount }} identifiant{{ relatedIdentifiersCount > 1 ? 's' : '' }}
            </span>
          </label>
          
          <!-- Liste des identifiants actuels -->
          <div v-if="relatedIdentifiersArray.length > 0" class="flex flex-wrap gap-1 mb-2">
            <span
              v-for="(identifier, idx) in relatedIdentifiersArray"
              :key="idx"
              class="badge badge-sm gap-1"
              :class="getIdentifierBadgeClass(identifier)"
            >
              {{ getIdentifierIconFromValue(identifier) }} {{ identifier }}
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle p-0 h-4 w-4 min-h-0"
                @click="removeIdentifierByIndex(idx)"
              >
                ✕
              </button>
            </span>
          </div>
          
          <!-- Champ d'ajout -->
          <div class="join w-full">
            <input
              v-model="newIdentifierInput"
              type="text"
              placeholder="Ajouter un identifiant..."
              class="input input-sm join-item flex-1 font-mono px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
              @keyup.enter="addNewIdentifier"
            />
            <button
              type="button"
              class="btn btn-sm btn-primary join-item"
              :disabled="!newIdentifierInput.trim()"
              @click="addNewIdentifier"
            >
              + Ajouter
            </button>
          </div>
          
          <label class="label">
            <span class="label-text-alt text-xs opacity-60">
              💡 Les téléphones sont ajoutés automatiquement
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            @click="handleCancel"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isValid"
          >
            {{ isNew ? 'Créer' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="handleCancel"></div>
  </div>

  <!-- Modal Galerie de Screenshots -->
  <div v-if="showGalleryModal" class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg mb-4">
        📸 Galerie de captures d'écran
      </h3>

      <!-- Loader -->
      <div v-if="isLoadingGallery" class="flex justify-center items-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="ml-3">Chargement...</p>
      </div>

      <!-- Grille de screenshots -->
      <div
        v-else-if="availableScreenshots.length > 0"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto"
      >
        <div
          v-for="screenshot in availableScreenshots"
          :key="screenshot.filename"
          class="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
          @click="selectScreenshotFromGallery(screenshot)"
        >
          <img
            :src="screenshot.url"
            :alt="screenshot.originalName"
            class="w-full h-32 object-cover"
          />
          <div
            class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
          >
            <p class="text-white text-xs font-semibold px-2 text-center">
              {{ screenshot.originalName }}
            </p>
            <p class="text-white/70 text-xs">
              {{ formatSize(screenshot.size) }} • {{ screenshot.width }}x{{ screenshot.height }}
            </p>
            <button
              type="button"
              class="btn btn-xs btn-primary mt-2"
            >
              ✓ Sélectionner
            </button>
          </div>
        </div>
      </div>

      <!-- Aucun screenshot -->
      <div v-else class="text-center py-12">
        <p class="text-base-content/60">
          Aucune capture d'écran disponible.
        </p>
        <p class="text-sm text-base-content/40 mt-2">
          Utilisez le bouton "Upload" pour ajouter une capture.
        </p>
      </div>

      <!-- Erreur -->
      <div v-if="galleryError" class="alert alert-error mt-4">
        <span>⚠️</span>
        <span>{{ galleryError }}</span>
      </div>

      <!-- Boutons du modal -->
      <div class="modal-action">
        <button
          type="button"
          class="btn"
          @click="closeGalleryModal"
        >
          Fermer
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="closeGalleryModal"></div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import SourcesListEditor from './shared/SourcesListEditor.vue';

const props = defineProps<{
  isOpen: boolean;
  entity: Finding | null;
  existingLabels?: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', entity: Finding): void;
}>();

const isNew = computed(() => !props.entity);

const defaultEntity = (): Finding => ({
  label: '',
  description: '',
  confidence: 'probable' as any,
  sources: [],
  metadata: {
    entityType: undefined,
    aliases: [],
    isVerified: false,
  },
});

const localEntity = ref<Finding>(defaultEntity());
const errors = ref<Record<string, string>>({});
const newIdentifierInput = ref('');

// Computed properties pour les bindings v-model
const entityType = computed({
  get: () => localEntity.value.metadata?.entityType || '',
  set: (value) => {
    if (!localEntity.value.metadata) {
      localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
    }
    localEntity.value.metadata.entityType = value as any;
  },
});

const aliases = computed(() => localEntity.value.metadata?.aliases || []);

// Getters directs pour les détails (pas de setter, on modifie directement l'objet)
const personDetails = computed(() => {
  if (!localEntity.value.metadata) {
    localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
  }
  if (!localEntity.value.metadata.personDetails) {
    localEntity.value.metadata.personDetails = { 
      dateOfBirth: undefined, 
      nationalRegistryNumber: undefined, 
      physicalAddress: undefined, 
      phoneNumbers: [] 
    };
  }
  return localEntity.value.metadata.personDetails;
});

const companyDetails = computed(() => {
  if (!localEntity.value.metadata) {
    localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
  }
  if (!localEntity.value.metadata.companyDetails) {
    localEntity.value.metadata.companyDetails = { 
      bceNumber: undefined, 
      headquartersAddress: undefined, 
      operationalAddresses: [], 
      phoneNumbers: [],
      website: undefined
    };
  }
  return localEntity.value.metadata.companyDetails;
});

const isVerified = computed({
  get: () => localEntity.value.metadata?.isVerified || false,
  set: (value) => {
    if (!localEntity.value.metadata) {
      localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
    }
    if (localEntity.value.metadata) {
      localEntity.value.metadata.isVerified = value;
    }
  },
});

// Computed pour les identifiants liés (array plutôt que texte)
const relatedIdentifiersArray = computed(() => {
  return localEntity.value.metadata?.relatedIdentifiers || [];
});

const relatedIdentifiersCount = computed(() => relatedIdentifiersArray.value.length);

// Validation
const isValid = computed(() => {
  const hasLabel = localEntity.value.label.trim() !== '';
  const hasType = !!localEntity.value.metadata?.entityType;
  return hasLabel && hasType;
});

// Watchers pour auto-suggestion (après toutes les déclarations computed)
watch(
  () => props.entity,
  (newEntity) => {
    if (newEntity) {
      const cloned = JSON.parse(JSON.stringify(newEntity));
      // S'assurer que metadata existe toujours
      if (!cloned.metadata) {
        cloned.metadata = { entityType: undefined, aliases: [], isVerified: false };
      }
      localEntity.value = cloned;
    } else {
      localEntity.value = defaultEntity();
    }
    errors.value = {};
  },
  { immediate: true }
);

// Auto-suggestion : ajouter les téléphones aux identifiants liés
watch(
  () => personDetails.value.phoneNumbers,
  (newPhones) => {
    if (!newPhones || newPhones.length === 0) return;
    
    const relatedIds = localEntity.value.metadata?.relatedIdentifiers || [];
    
    // Pour chaque téléphone, vérifier s'il n'est pas déjà dans relatedIdentifiers
    newPhones.forEach(phone => {
      if (phone && phone.trim() && !relatedIds.includes(phone.trim())) {
        // Ajouter automatiquement (suggestion silencieuse)
        if (!localEntity.value.metadata) {
          localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
        }
        if (!localEntity.value.metadata.relatedIdentifiers) {
          localEntity.value.metadata.relatedIdentifiers = [];
        }
        localEntity.value.metadata.relatedIdentifiers.push(phone.trim());
      }
    });
  },
  { deep: true }
);

// Auto-suggestion : ajouter les emails aux identifiants liés
watch(
  () => localEntity.value.metadata?.personDetails?.physicalAddress,
  (newAddress) => {
    if (!newAddress) return;
    
    // Extraction des emails depuis l'adresse (si présents)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const emails = newAddress.match(emailRegex);
    
    if (emails && emails.length > 0) {
      const relatedIds = localEntity.value.metadata?.relatedIdentifiers || [];
      
      emails.forEach(email => {
        if (!relatedIds.includes(email)) {
          if (!localEntity.value.metadata!.relatedIdentifiers) {
            localEntity.value.metadata!.relatedIdentifiers = [];
          }
          localEntity.value.metadata!.relatedIdentifiers.push(email);
        }
      });
    }
  }
);

function validateUniqueness(): boolean {
  if (!props.existingLabels) return true;
  
  const isDuplicate = props.existingLabels.some(
    label => label.toLowerCase() === localEntity.value.label.toLowerCase().trim()
  );
  
  if (isDuplicate && isNew.value) {
    errors.value.label = 'Une entité avec ce nom existe déjà';
    return false;
  }
  
  return true;
}

function addAlias() {
  if (!localEntity.value.metadata) {
    localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
  }
  if (localEntity.value.metadata && !localEntity.value.metadata.aliases) {
    localEntity.value.metadata.aliases = [];
  }
  if (localEntity.value.metadata) {
    localEntity.value.metadata.aliases!.push('');
  }
}

function updateAlias(index: number, value: string) {
  if (localEntity.value.metadata?.aliases) {
    localEntity.value.metadata.aliases[index] = value;
  }
}

function removeAlias(index: number) {
  if (localEntity.value.metadata?.aliases) {
    localEntity.value.metadata.aliases.splice(index, 1);
  }
}

// Gestion des téléphones (personne)
function addPersonPhone() {
  const details = personDetails.value;
  if (!details.phoneNumbers) {
    details.phoneNumbers = [];
  }
  details.phoneNumbers.push('');
}

function updatePersonPhone(index: number, value: string) {
  const details = personDetails.value;
  if (details.phoneNumbers) {
    details.phoneNumbers[index] = value;
  }
}

function removePersonPhone(index: number) {
  const details = personDetails.value;
  if (details.phoneNumbers) {
    details.phoneNumbers.splice(index, 1);
  }
}

// Gestion des adresses d'exploitation (société)
function addOperationalAddress() {
  const details = companyDetails.value;
  if (!details.operationalAddresses) {
    details.operationalAddresses = [];
  }
  details.operationalAddresses.push('');
}

function updateOperationalAddress(index: number, value: string) {
  const details = companyDetails.value;
  if (details.operationalAddresses) {
    details.operationalAddresses[index] = value;
  }
}

function removeOperationalAddress(index: number) {
  const details = companyDetails.value;
  if (details.operationalAddresses) {
    details.operationalAddresses.splice(index, 1);
  }
}

// Gestion des téléphones (société)
function addCompanyPhone() {
  const details = companyDetails.value;
  if (!details.phoneNumbers) {
    details.phoneNumbers = [];
  }
  details.phoneNumbers.push('');
}

function updateCompanyPhone(index: number, value: string) {
  const details = companyDetails.value;
  if (details.phoneNumbers) {
    details.phoneNumbers[index] = value;
  }
}

function removeCompanyPhone(index: number) {
  const details = companyDetails.value;
  if (details.phoneNumbers) {
    details.phoneNumbers.splice(index, 1);
  }
}

// Gestion des identifiants liés (nouveau système avec badges)
function addNewIdentifier() {
  const value = newIdentifierInput.value.trim();
  if (!value) return;
  
  if (!localEntity.value.metadata) {
    localEntity.value.metadata = { entityType: undefined, aliases: [], isVerified: false };
  }
  if (!localEntity.value.metadata.relatedIdentifiers) {
    localEntity.value.metadata.relatedIdentifiers = [];
  }
  
  // Éviter les doublons
  if (!localEntity.value.metadata.relatedIdentifiers.includes(value)) {
    localEntity.value.metadata.relatedIdentifiers.push(value);
    newIdentifierInput.value = '';
  }
}

function removeIdentifierByIndex(index: number) {
  if (localEntity.value.metadata?.relatedIdentifiers) {
    localEntity.value.metadata.relatedIdentifiers.splice(index, 1);
  }
}

function getIdentifierIconFromValue(identifier: string): string {
  const lower = identifier.toLowerCase();
  
  if (lower.includes('@') && lower.includes('.')) {
    return '📧'; // Email
  }
  if (lower.match(/^\+?\d{8,15}$/)) {
    return '📞'; // Téléphone
  }
  if (lower.startsWith('@')) {
    return '👤'; // Username
  }
  
  return '🔖'; // Autre
}

function getIdentifierBadgeClass(identifier: string): string {
  const lower = identifier.toLowerCase();
  
  if (lower.includes('@') && lower.includes('.')) {
    return 'badge-info'; // Email = bleu
  }
  if (lower.match(/^\+?\d{8,15}$/)) {
    return 'badge-success'; // Téléphone = vert
  }
  if (lower.startsWith('@')) {
    return 'badge-primary'; // Username = primaire
  }
  
  return 'badge-outline'; // Autre = outline
}

// ==================== GESTION DES PIÈCES JOINTES / IMAGES ====================

import type { Screenshot } from '@/services/screenshot';

const uploadError = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploadingFile = ref(false);

// Galerie de sélection
const showGalleryModal = ref(false);
const isLoadingGallery = ref(false);
const availableScreenshots = ref<Screenshot[]>([]);
const galleryError = ref<string | null>(null);

const attachmentsCount = computed(() => {
  return localEntity.value.attachments?.length || 0;
});

/**
 * Upload d'un ou plusieurs fichiers depuis le bouton Upload
 */
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  
  if (!files || files.length === 0) return;
  
  uploadError.value = null;
  isUploadingFile.value = true;
  
  try {
    // Import dynamique du service
    const { screenshotService } = await import('@/services/screenshot');
    
    for (const file of Array.from(files)) {
      // Vérification taille (2 MB max)
      if (file.size > 2 * 1024 * 1024) {
        uploadError.value = `Le fichier "${file.name}" dépasse 2 MB`;
        continue;
      }
      
      // Upload
      const response = await screenshotService.upload(file, {
        caseId: undefined, // Pas de caseId pour les entités
      });
      
      // Ajouter l'URL signée aux attachments (pas le filename)
      if (!localEntity.value.attachments) {
        localEntity.value.attachments = [];
      }
      localEntity.value.attachments.push(response.url);
    }
  } catch (error: any) {
    uploadError.value = error.message || 'Erreur lors de l\'upload';
  } finally {
    isUploadingFile.value = false;
    // Reset l'input pour permettre un nouvel upload du même fichier
    if (input) {
      input.value = '';
    }
  }
}

/**
 * Supprimer une pièce jointe par son index
 */
function removeAttachment(index: number) {
  if (!localEntity.value.attachments) return;
  localEntity.value.attachments.splice(index, 1);
}

/**
 * Gestion d'erreur de chargement d'image
 */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  console.error('Erreur de chargement d\'image:', img.src);
  uploadError.value = 'Une image n\'a pas pu être chargée (URL expirée ?)';
}

/**
 * Ouvrir la galerie de screenshots
 */
async function openScreenshotGallery() {
  showGalleryModal.value = true;
  isLoadingGallery.value = true;
  galleryError.value = null;
  
  try {
    const { screenshotService } = await import('@/services/screenshot');
    
    // Charger tous les screenshots (sans caseId pour voir tous les screenshots)
    // Note: Il faudrait idéalement avoir un endpoint qui liste TOUS les screenshots
    // Pour l'instant, on va charger avec un caseId vide qui devrait retourner une erreur
    // ou tous les screenshots selon l'implémentation backend
    
    // Workaround: Essayer de charger sans caseId
    try {
      availableScreenshots.value = await screenshotService.list('');
    } catch (e) {
      // Si ça échoue, on pourrait afficher un message
      galleryError.value = 'Impossible de charger la galerie. Veuillez utiliser le bouton Upload.';
      availableScreenshots.value = [];
    }
  } catch (error: any) {
    galleryError.value = error.message || 'Erreur lors du chargement de la galerie';
  } finally {
    isLoadingGallery.value = false;
  }
}

/**
 * Fermer la modal galerie
 */
function closeGalleryModal() {
  showGalleryModal.value = false;
  availableScreenshots.value = [];
  galleryError.value = null;
}

/**
 * Sélectionner un screenshot depuis la galerie
 */
function selectScreenshotFromGallery(screenshot: Screenshot) {
  if (!localEntity.value.attachments) {
    localEntity.value.attachments = [];
  }
  
  // Vérifier que l'image n'est pas déjà ajoutée
  if (!localEntity.value.attachments.includes(screenshot.url)) {
    localEntity.value.attachments.push(screenshot.url);
  }
  
  closeGalleryModal();
}

/**
 * Formater la taille du fichier
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function handleSubmit() {
  errors.value = {};
  
  if (!validateUniqueness()) {
    return;
  }
  
  if (!isValid.value) {
    errors.value.label = 'Le nom est requis';
    return;
  }
  
  // Nettoyer les alias vides
  if (localEntity.value.metadata?.aliases) {
    localEntity.value.metadata.aliases = localEntity.value.metadata.aliases.filter(
      (a: string) => a.trim() !== ''
    );
  }
  
  emit('save', localEntity.value);
}

function handleCancel() {
  errors.value = {};
  emit('close');
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}
</style>
