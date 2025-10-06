<template>
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
