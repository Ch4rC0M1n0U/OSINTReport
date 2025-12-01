<template>
  <div>
    <!-- Modal principale -->
    <div v-if="isOpen" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold mb-4">
          {{ isNew ? '➕ Nouveau profil' : '✏️ Modifier le profil' }}
        </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Plateforme -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Type de source *</span>
          </label>
          <select
            v-model="platform"
            class="select select-bordered"
            required
          >
            <option value="">-- Sélectionner un type --</option>
            <optgroup label="📱 Réseaux sociaux">
              <option value="facebook">📘 Facebook</option>
              <option value="instagram">📷 Instagram</option>
              <option value="twitter">🐦 X (Twitter)</option>
              <option value="linkedin">💼 LinkedIn</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="snapchat">👻 Snapchat</option>
              <option value="telegram">✈️ Telegram</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="youtube">📹 YouTube</option>
              <option value="reddit">🤖 Reddit</option>
              <option value="discord">🎮 Discord</option>
            </optgroup>
            <optgroup label="📞 Téléphonie">
              <option value="hlr">📶 HLR Lookup</option>
              <option value="callerid">📇 CallerID</option>
            </optgroup>
            <optgroup label="⚠️ Sécurité">
              <option value="breach">🔓 Breach / Fuite de données</option>
            </optgroup>
            <optgroup label="🔍 Autre">
              <option value="other">❓ Autre</option>
            </optgroup>
          </select>
        </div>

        <!-- Nom du profil / Identifiant -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ getLabelPlaceholder() }} *</span>
          </label>
          <input
            v-model="localProfile.label"
            type="text"
            :placeholder="getLabelInputPlaceholder()"
            class="input input-bordered"
            :class="{ 'input-error': errors.label }"
            required
          />
          <label v-if="errors.label" class="label">
            <span class="label-text-alt text-error">{{ errors.label }}</span>
          </label>
        </div>

        <!-- Description / Bio -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ platform === 'hlr' ? 'Notes' : 'Description / Bio' }}</span>
          </label>
          <textarea
            v-model="localProfile.description"
            :placeholder="getDescriptionPlaceholder()"
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- ========== SECTION HLR ========== -->
        <div v-if="platform === 'hlr'" class="card bg-base-200 p-4 space-y-4">
          <h4 class="font-semibold flex items-center gap-2">
            <span>📶</span>
            <span>Informations HLR</span>
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Statut de la ligne -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Statut de la ligne *</span>
              </label>
              <select v-model="hlrLiveStatus" class="select select-bordered select-sm">
                <option value="live">🟢 Active (LIVE)</option>
                <option value="dead">🔴 Inactive (DEAD)</option>
                <option value="unknown">⚪ Inconnu</option>
              </select>
            </div>

            <!-- Type de ligne -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Type de ligne</span>
              </label>
              <select v-model="hlrLineType" class="select select-bordered select-sm">
                <option value="MOBILE">📱 Mobile</option>
                <option value="LANDLINE">☎️ Fixe</option>
                <option value="VOIP">🌐 VoIP</option>
                <option value="UNKNOWN">❓ Inconnu</option>
              </select>
            </div>

            <!-- Opérateur -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Opérateur</span>
              </label>
              <input
                v-model="hlrOperator"
                type="text"
                placeholder="Ex: Orange, SFR, T-Mobile..."
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Pays -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Pays</span>
              </label>
              <input
                v-model="hlrCountry"
                type="text"
                placeholder="Ex: France, États-Unis..."
                class="input input-bordered input-sm"
              />
            </div>

            <!-- MCC/MNC -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">MCC/MNC</span>
              </label>
              <input
                v-model="hlrMccMnc"
                type="text"
                placeholder="Ex: 208010"
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Date de vérification -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Date de vérification</span>
              </label>
              <input
                v-model="hlrVerificationDate"
                type="datetime-local"
                class="input input-bordered input-sm"
              />
            </div>
          </div>

          <!-- Portabilité -->
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="hlrIsPorted" type="checkbox" class="checkbox checkbox-sm" />
              <span class="label-text">Numéro porté</span>
            </label>
          </div>

          <div v-if="hlrIsPorted" class="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Opérateur d'origine</span>
              </label>
              <input
                v-model="hlrOriginalOperator"
                type="text"
                placeholder="Opérateur avant portage"
                class="input input-bordered input-sm"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Date de portabilité</span>
              </label>
              <input
                v-model="hlrPortedDate"
                type="date"
                class="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>

        <!-- ========== SECTION CALLERID ========== -->
        <div v-if="platform === 'callerid'" class="card bg-base-200 p-4 space-y-4">
          <h4 class="font-semibold flex items-center gap-2">
            <span>📇</span>
            <span>Informations CallerID</span>
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Source CallerID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Source</span>
              </label>
              <select v-model="callerIdSource" class="select select-bordered select-sm">
                <option value="Eyecon">👁️ Eyecon</option>
                <option value="CallApp">📞 CallApp</option>
                <option value="TrueCaller">🔵 TrueCaller</option>
                <option value="Sync.me">🔄 Sync.me</option>
                <option value="Hiya">📱 Hiya</option>
                <option value="GetContact">📒 GetContact</option>
                <option value="other">❓ Autre</option>
              </select>
            </div>

            <!-- Nom identifié -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom identifié</span>
              </label>
              <input
                v-model="callerIdName"
                type="text"
                placeholder="Nom affiché par le CallerID"
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Pays -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Pays</span>
              </label>
              <input
                v-model="callerIdCountry"
                type="text"
                placeholder="Pays associé au numéro"
                class="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>

        <!-- ========== SECTION BREACH ========== -->
        <div v-if="platform === 'breach'" class="card bg-error/10 border border-error/30 p-4 space-y-4">
          <h4 class="font-semibold flex items-center gap-2 text-error">
            <span>🔓</span>
            <span>Données de fuite</span>
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Source de la fuite -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Source de la fuite</span>
              </label>
              <input
                v-model="breachSource"
                type="text"
                placeholder="Ex: LinkedIn Leak 2021, Adobe..."
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Mot de passe exposé -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Mot de passe exposé</span>
              </label>
              <input
                v-model="breachPassword"
                type="text"
                placeholder="Si disponible"
                class="input input-bordered input-sm font-mono"
              />
            </div>

            <!-- Hash -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Hash du mot de passe</span>
              </label>
              <input
                v-model="breachHash"
                type="text"
                placeholder="MD5, SHA1, bcrypt..."
                class="input input-bordered input-sm font-mono"
              />
            </div>

            <!-- Domaines associés -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Domaines associés</span>
              </label>
              <input
                v-model="breachDomains"
                type="text"
                placeholder="sohu.com, 126.com..."
                class="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>

        <!-- ========== SECTION SNAPCHAT ========== -->
        <div v-if="platform === 'snapchat'" class="card bg-warning/10 border border-warning/30 p-4 space-y-4">
          <h4 class="font-semibold flex items-center gap-2">
            <span>👻</span>
            <span>Informations Snapchat</span>
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Snap ID (UUID) -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Snap ID (UUID)</span>
              </label>
              <input
                v-model="snapchatId"
                type="text"
                placeholder="e9933284-b001-44af-aa25-3f99d5c2bd37"
                class="input input-bordered input-sm font-mono"
              />
            </div>

            <!-- Username -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Username</span>
              </label>
              <input
                v-model="snapchatUsername"
                type="text"
                placeholder="@username"
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Display Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom d'affichage</span>
              </label>
              <input
                v-model="snapchatDisplayName"
                type="text"
                placeholder="Nom affiché sur le profil"
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Tier -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Tier (niveau)</span>
              </label>
              <input
                v-model.number="snapchatTier"
                type="number"
                min="0"
                placeholder="1, 2, 3..."
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Bitmoji Avatar ID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Bitmoji Avatar ID</span>
              </label>
              <input
                v-model="snapchatBitmojiAvatarId"
                type="text"
                placeholder="104304386352_1-s5"
                class="input input-bordered input-sm font-mono"
              />
            </div>

            <!-- Bitmoji Selfie ID -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Bitmoji Selfie ID</span>
              </label>
              <input
                v-model="snapchatBitmojiSelfieId"
                type="text"
                placeholder="10226021"
                class="input input-bordered input-sm font-mono"
              />
            </div>
          </div>
        </div>

        <!-- ========== SECTION WHATSAPP ========== -->
        <div v-if="platform === 'whatsapp'" class="card bg-success/10 border border-success/30 p-4 space-y-4">
          <h4 class="font-semibold flex items-center gap-2 justify-between">
            <div class="flex items-center gap-2">
              <span>💬</span>
              <span>Informations WhatsApp</span>
            </div>
            <!-- Lien de vérification -->
            <a 
              v-if="whatsappVerificationLink"
              :href="whatsappVerificationLink"
              target="_blank"
              class="btn btn-xs btn-ghost gap-1 text-success hover:bg-success/20"
              title="Vérifier le numéro sur WhatsApp Web (aucun message ne sera envoyé)"
            >
              🔍 Vérifier sur WhatsApp
            </a>
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Numéro existe -->
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="whatsappNumberExists" type="checkbox" class="checkbox checkbox-sm checkbox-success" />
                <span class="label-text">Numéro WhatsApp existant</span>
              </label>
              <span class="text-xs text-base-content/60 ml-7">Un numéro existant n'est pas nécessairement actif</span>
            </div>

            <!-- Date de mise à jour du statut -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Statut mis à jour le</span>
              </label>
              <input
                v-model="whatsappStatusSetAt"
                type="datetime-local"
                class="input input-bordered input-sm"
              />
            </div>
          </div>

          <!-- Statut texte -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Statut WhatsApp</span>
            </label>
            <textarea
              v-model="whatsappStatus"
              placeholder="Le statut affiché sur le profil WhatsApp..."
              class="textarea textarea-bordered textarea-sm"
              rows="2"
            ></textarea>
          </div>
        </div>

        <!-- ========== SECTION RÉSEAUX SOCIAUX ========== -->
        <div v-if="isSocialNetwork" class="space-y-4">
          <!-- Statut du compte -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Statut du compte</span>
            </label>
            <select v-model="accountStatus" class="select select-bordered select-sm">
              <option value="active">✅ Actif</option>
              <option value="inactive">⭕ Inactif</option>
              <option value="suspended">⛔ Suspendu</option>
              <option value="deleted">🗑️ Supprimé</option>
              <option value="private">🔒 Privé</option>
              <option value="unknown">❓ Inconnu</option>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Dernière activité -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Dernière activité</span>
              </label>
              <input
                v-model="lastActive"
                type="datetime-local"
                class="input input-bordered input-sm"
              />
            </div>

            <!-- Nombre d'abonnés -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nombre d'abonnés</span>
              </label>
              <input
                v-model.number="followers"
                type="number"
                min="0"
                placeholder="Ex: 1250"
                class="input input-bordered input-sm"
              />
            </div>
          </div>

          <!-- URL du profil -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">URL du profil</span>
            </label>
            <input
              v-model="profileUrl"
              type="url"
              placeholder="https://..."
              class="input input-bordered input-sm"
            />
          </div>
        </div>

        <!-- ========== SECTION COMMUNE ========== -->
        
        <!-- Photos / Captures d'écran -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">📷 Photos / Captures d'écran ({{ attachmentsCount }})</span>
            <span class="label-text-alt text-xs opacity-60">
              Photos de profil, screenshots...
            </span>
          </label>
          
          <!-- Liste des images actuelles -->
          <div v-if="attachmentsCount > 0" class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            <div
              v-for="(attachmentUrl, idx) in localProfile.attachments"
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
          
          <!-- Message d'erreur upload -->
          <div v-if="uploadError" class="alert alert-error alert-sm mb-3">
            <span>{{ uploadError }}</span>
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
        </div>
        
        <!-- Capture d'écran (DEPRECATED - remplacé par Photos ci-dessus, conservé pour compatibilité) -->
        <div v-if="false && platform !== 'breach'" class="form-control">
          <label class="label">
            <span class="label-text">Capture d'écran</span>
          </label>
          <ScreenshotPicker
            v-model="screenshot"
            label="Capture"
            :case-id="reportId || 'UNKNOWN'"
          />
        </div>

        <!-- Niveau de confiance -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Niveau de confiance</span>
          </label>
          <select v-model="localProfile.confidence" class="select select-bordered select-sm">
            <option value="confirmed">✅ Confirmé</option>
            <option value="probable">🟡 Probable</option>
            <option value="possible">🟠 Possible</option>
            <option value="unknown">❓ Inconnu</option>
          </select>
        </div>

        <!-- Entités liées -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Entités liées</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(entity, index) in relatedEntities"
              :key="index"
              class="join w-full"
            >
              <input
                :value="entity"
                @input="updateRelatedEntity(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Nom de l'entité..."
                class="input input-bordered input-sm join-item flex-1"
              />
              <button
                type="button"
                class="btn btn-sm btn-ghost join-item"
                @click="removeRelatedEntity(index)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-block"
              @click="addRelatedEntity"
            >
              + Ajouter une entité
            </button>
          </div>
        </div>

        <!-- Sources -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Sources ({{ localProfile.sources.length }})</span>
          </label>
          <SourcesListEditor v-model="localProfile.sources" />
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
        <h3 class="font-bold text-lg mb-4">📸 Galerie de captures</h3>
        
        <!-- Loader -->
        <div v-if="isLoadingGallery" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
        
        <!-- Erreur -->
        <div v-else-if="galleryError" class="alert alert-error">
          <span>{{ galleryError }}</span>
        </div>
        
        <!-- Liste des screenshots -->
        <div v-else-if="availableScreenshots.length > 0" class="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          <div
            v-for="screenshot in availableScreenshots"
            :key="screenshot.filename"
            class="cursor-pointer hover:opacity-75 transition-opacity"
            @click="selectScreenshotFromGallery(screenshot)"
          >
            <img
              :src="screenshot.url"
              :alt="screenshot.filename"
              class="w-full h-32 object-cover rounded border border-base-300"
            />
            <p class="text-xs text-center mt-1 truncate">{{ screenshot.filename }}</p>
          </div>
        </div>
        
        <!-- Aucune capture -->
        <div v-else class="text-center py-8 text-base-content/60">
          Aucune capture disponible
        </div>
        
        <div class="modal-action">
          <button type="button" class="btn" @click="closeGalleryModal">Fermer</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeGalleryModal"></div>
    </div>
  </div>
</template><script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import SourcesListEditor from './shared/SourcesListEditor.vue';
import ScreenshotPicker from '../shared/ScreenshotPicker.vue';

const props = defineProps<{
  isOpen: boolean;
  profile: Finding | null;
  existingProfiles?: string[];
  reportId?: string; // UID du rapport pour isolation des screenshots
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', profile: Finding): void;
}>();

const isNew = computed(() => !props.profile);

const defaultProfile = (): Finding => ({
  label: '',
  description: '',
  confidence: 'probable' as any,
  sources: [],
  relatedEntities: [],
  metadata: {
    platform: '',
    accountStatus: 'unknown',
    lastActive: '',
    followers: 0,
    profileUrl: '',
    screenshot: '',
  },
});

const localProfile = ref<Finding>(defaultProfile());
const errors = ref<Record<string, string>>({});

// Synchroniser avec props
watch(
  () => props.profile,
  (newProfile) => {
    if (newProfile) {
      const cloned = JSON.parse(JSON.stringify(newProfile));
      if (!cloned.metadata) {
        cloned.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '', screenshot: '' };
      }
      if (!cloned.relatedEntities) {
        cloned.relatedEntities = [];
      }
      localProfile.value = cloned;
    } else {
      localProfile.value = defaultProfile();
    }
    errors.value = {};
  },
  { immediate: true }
);

// Computed properties pour les bindings
const platform = computed({
  get: () => localProfile.value.metadata?.platform || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.platform = value;
  },
});

const accountStatus = computed({
  get: () => localProfile.value.metadata?.accountStatus || 'unknown',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.accountStatus = value;
  },
});

const lastActive = computed({
  get: () => localProfile.value.metadata?.lastActive || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.lastActive = value;
  },
});

const followers = computed({
  get: () => localProfile.value.metadata?.followers || 0,
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.followers = value;
  },
});

const profileUrl = computed({
  get: () => localProfile.value.metadata?.profileUrl || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '', screenshot: '' };
    }
    localProfile.value.metadata.profileUrl = value;
  },
});

const screenshot = computed({
  get: () => localProfile.value.metadata?.screenshot || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '', screenshot: '' };
    }
    localProfile.value.metadata.screenshot = value;
  },
});

// ============================================================================
// Computed pour HLR
// ============================================================================

const hlrLiveStatus = computed({
  get: () => localProfile.value.metadata?.liveStatus || 'unknown',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.liveStatus = value;
    // Synchroniser avec accountStatus
    localProfile.value.metadata!.accountStatus = value === 'live' ? 'active' : value === 'dead' ? 'inactive' : 'unknown';
  },
});

const hlrLineType = computed({
  get: () => localProfile.value.metadata?.lineType || 'MOBILE',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.lineType = value;
  },
});

const hlrOperator = computed({
  get: () => localProfile.value.metadata?.operator || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.operator = value;
  },
});

const hlrCountry = computed({
  get: () => localProfile.value.metadata?.operatorCountry || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.operatorCountry = value;
  },
});

const hlrMccMnc = computed({
  get: () => localProfile.value.metadata?.mccMnc || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.mccMnc = value;
  },
});

const hlrVerificationDate = computed({
  get: () => {
    const date = localProfile.value.metadata?.verificationDate;
    if (!date) return '';
    // Convertir en format datetime-local
    try {
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  },
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.verificationDate = value;
  },
});

const hlrIsPorted = computed({
  get: () => localProfile.value.metadata?.isPorted || false,
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.isPorted = value;
  },
});

const hlrOriginalOperator = computed({
  get: () => localProfile.value.metadata?.originalOperator || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.originalOperator = value;
  },
});

const hlrPortedDate = computed({
  get: () => localProfile.value.metadata?.portedDate || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.portedDate = value;
  },
});

// ============================================================================
// Computed pour CallerID
// ============================================================================

const callerIdSource = computed({
  get: () => localProfile.value.metadata?.callerSource || 'Eyecon',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.callerSource = value;
  },
});

const callerIdName = computed({
  get: () => localProfile.value.metadata?.callerName || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.callerName = value;
  },
});

const callerIdCountry = computed({
  get: () => localProfile.value.metadata?.callerCountry || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.callerCountry = value;
  },
});

// ============================================================================
// Computed pour Breach
// ============================================================================

const breachSource = computed({
  get: () => localProfile.value.metadata?.breachSource || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.breachSource = value;
  },
});

const breachPassword = computed({
  get: () => {
    const passwords = localProfile.value.metadata?.exposedPasswords;
    return Array.isArray(passwords) ? passwords[0] || '' : passwords || '';
  },
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.exposedPasswords = value ? [value] : [];
  },
});

const breachHash = computed({
  get: () => localProfile.value.metadata?.breachHash || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.breachHash = value;
  },
});

const breachDomains = computed({
  get: () => {
    const domains = localProfile.value.metadata?.breachDomains;
    return Array.isArray(domains) ? domains.join(', ') : domains || '';
  },
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.breachDomains = value ? value.split(',').map(d => d.trim()).filter(d => d) : [];
  },
});

// ============================================================================
// Computed pour Snapchat
// ============================================================================

const snapchatId = computed({
  get: () => localProfile.value.metadata?.snapchatId || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.snapchatId = value;
  },
});

const snapchatUsername = computed({
  get: () => localProfile.value.metadata?.snapchatUsername || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.snapchatUsername = value;
  },
});

const snapchatDisplayName = computed({
  get: () => localProfile.value.metadata?.snapchatDisplayName || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.snapchatDisplayName = value;
  },
});

const snapchatTier = computed({
  get: () => localProfile.value.metadata?.snapchatTier || 0,
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.snapchatTier = value;
  },
});

const snapchatBitmojiAvatarId = computed({
  get: () => localProfile.value.metadata?.bitmojiAvatarId || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.bitmojiAvatarId = value;
  },
});

const snapchatBitmojiSelfieId = computed({
  get: () => localProfile.value.metadata?.bitmojiSelfieId || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.bitmojiSelfieId = value;
  },
});

// ============================================================================
// Computed pour WhatsApp
// ============================================================================

const whatsappNumberExists = computed({
  get: () => localProfile.value.metadata?.whatsappNumberExists !== false,
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.whatsappNumberExists = value;
  },
});

const whatsappStatus = computed({
  get: () => localProfile.value.metadata?.whatsappStatus || '',
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.whatsappStatus = value;
  },
});

const whatsappStatusSetAt = computed({
  get: () => {
    const date = localProfile.value.metadata?.whatsappStatusSetAt;
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  },
  set: (value) => {
    ensureMetadata();
    localProfile.value.metadata!.whatsappStatusSetAt = value;
  },
});

// Lien de vérification WhatsApp - permet de vérifier si un numéro existe sans envoyer de message
const whatsappVerificationLink = computed(() => {
  // Chercher le numéro de téléphone dans les métadonnées ou le label
  const phone = localProfile.value.metadata?.phone 
    || localProfile.value.metadata?.phoneNumber
    || localProfile.value.label?.replace(/\D/g, ''); // Extraire les chiffres du label
  
  if (phone && phone.length >= 8) {
    // Nettoyer le numéro (garder uniquement les chiffres)
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text&type=phone_number&app_absent=0`;
  }
  return null;
});

// ============================================================================
// Helpers
// ============================================================================

function ensureMetadata() {
  if (!localProfile.value.metadata) {
    localProfile.value.metadata = { 
      platform: '', 
      accountStatus: 'unknown', 
      lastActive: '', 
      followers: 0, 
      profileUrl: '', 
      screenshot: '' 
    };
  }
}

// Détermine si c'est un réseau social (pour afficher les champs spécifiques)
const isSocialNetwork = computed(() => {
  const socialPlatforms = [
    'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 
    'snapchat', 'telegram', 'whatsapp', 'youtube', 'reddit', 
    'discord', 'other'
  ];
  return socialPlatforms.includes(platform.value);
});

// Labels dynamiques selon la plateforme
function getLabelPlaceholder(): string {
  switch (platform.value) {
    case 'hlr': return 'Numéro de téléphone *';
    case 'callerid': return 'Numéro de téléphone *';
    case 'breach': return 'Email ou identifiant compromis *';
    default: return 'Nom du profil / Username *';
  }
}

function getLabelInputPlaceholder(): string {
  switch (platform.value) {
    case 'hlr': return '+33612345678';
    case 'callerid': return '+33612345678';
    case 'breach': return 'user@example.com';
    default: return '@username ou Nom du profil';
  }
}

function getDescriptionPlaceholder(): string {
  switch (platform.value) {
    case 'hlr': return 'Notes sur le résultat HLR...';
    case 'callerid': return 'Informations sur le CallerID...';
    case 'breach': return 'Contexte de la fuite de données...';
    default: return 'Bio du profil, description, informations relevées...';
  }
}

const relatedEntities = computed(() => localProfile.value.relatedEntities || []);

// Validation
const isValid = computed(() => {
  return (
    localProfile.value.label.trim() !== '' &&
    localProfile.value.metadata?.platform !== ''
  );
});

function validateUniqueness(): boolean {
  if (!props.existingProfiles) return true;
  
  const isDuplicate = props.existingProfiles.some(
    profile => profile.toLowerCase() === localProfile.value.label.toLowerCase().trim()
  );
  
  if (isDuplicate && isNew.value) {
    errors.value.label = 'Ce profil existe déjà dans la liste';
    return false;
  }
  
  return true;
}

function addRelatedEntity() {
  if (!localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities = [];
  }
  localProfile.value.relatedEntities.push('');
}

function updateRelatedEntity(index: number, value: string) {
  if (localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities[index] = value;
  }
}

function removeRelatedEntity(index: number) {
  if (localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities.splice(index, 1);
  }
}

// ============================================================================
// Gestion des attachments (photos / captures)
// ============================================================================

const fileInput = ref<HTMLInputElement | null>(null);
const isUploadingFile = ref(false);
const uploadError = ref<string | null>(null);
const showGalleryModal = ref(false);
const isLoadingGallery = ref(false);
const availableScreenshots = ref<any[]>([]);
const galleryError = ref<string | null>(null);

const attachmentsCount = computed(() => {
  return localProfile.value.attachments?.length || 0;
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
        caseId: props.reportId || undefined,
      });
      
      // Ajouter l'URL signée aux attachments
      if (!localProfile.value.attachments) {
        localProfile.value.attachments = [];
      }
      localProfile.value.attachments.push(response.url);
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
  if (!localProfile.value.attachments) return;
  localProfile.value.attachments.splice(index, 1);
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
    
    // Charger les screenshots du rapport
    if (props.reportId) {
      availableScreenshots.value = await screenshotService.list(props.reportId);
    } else {
      galleryError.value = 'Aucun rapport associé pour charger la galerie';
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
function selectScreenshotFromGallery(screenshot: any) {
  if (!localProfile.value.attachments) {
    localProfile.value.attachments = [];
  }
  
  // Vérifier que l'image n'est pas déjà ajoutée
  if (!localProfile.value.attachments.includes(screenshot.url)) {
    localProfile.value.attachments.push(screenshot.url);
  }
  
  closeGalleryModal();
}

function handleSubmit() {
  errors.value = {};
  
  if (!validateUniqueness()) {
    return;
  }
  
  if (!isValid.value) {
    errors.value.label = 'Le nom du profil et la plateforme sont requis';
    return;
  }
  
  // Nettoyer les entités vides
  if (localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities = localProfile.value.relatedEntities.filter(
      (e: string) => e.trim() !== ''
    );
  }
  
  emit('save', localProfile.value);
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
