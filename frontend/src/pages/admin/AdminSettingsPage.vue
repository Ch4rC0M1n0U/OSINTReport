<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { HugeiconsIcon } from '@hugeicons/vue';
import { 
  Calendar03Icon, 
  Loading02Icon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon,
  Settings02Icon,
  Notification02Icon,
  Time01Icon,
  Alert01Icon,
  LockIcon,
  Message01Icon
} from '@hugeicons/core-free-icons';
import { api } from '@/services/http';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Paramètres généraux
const generalSettings = ref({
  maintenanceEnabled: false,
  maintenanceMessage: '',
  maintenanceScheduledAt: null as string | null,
  lockUserCreation: false,
});

// Paramètres de notifications
const notificationSettings = ref({
  criticalAlertsEnabled: true,
});

const savingGeneral = ref(false);
const savingNotifications = ref(false);
const generalMessage = ref<{ type: 'success' | 'error', text: string } | null>(null);
const notificationMessage = ref<{ type: 'success' | 'error', text: string } | null>(null);

// État des tâches CRON
const cronStatus = ref<any>(null);
const loadingCronStatus = ref(false);
const regeneratingUrls = ref(false);
const regenerationSuccess = ref(false);
const regenerationError = ref<string | null>(null);

/**
 * Convertir une date ISO 8601 (UTC) en format datetime-local pour l'input HTML
 * Prend en compte le timezone de l'utilisateur
 */
function isoToDatetimeLocal(isoString: string | null): string | null {
  if (!isoString) return null;
  
  try {
    const date = new Date(isoString);
    // Obtenir le timezone de l'utilisateur (ou UTC par défaut)
    const userTimezone = authStore.user?.timezone || 'UTC';
    
    // Formatter la date selon le timezone de l'utilisateur
    // Format requis pour datetime-local: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Erreur conversion ISO vers datetime-local:', error);
    return null;
  }
}

/**
 * Convertir une date datetime-local (format HTML) en ISO 8601 (UTC)
 * Prend en compte le timezone de l'utilisateur
 */
function datetimeLocalToISO(datetimeLocal: string | null): string | null {
  if (!datetimeLocal) return null;
  
  try {
    // datetime-local retourne: "2025-10-26T22:00" (sans timezone)
    // On doit l'interpréter selon le timezone de l'utilisateur
    const userTimezone = authStore.user?.timezone || 'UTC';
    
    // Créer une date à partir de la chaîne locale
    const localDate = new Date(datetimeLocal);
    
    // Convertir en ISO 8601 (UTC)
    return localDate.toISOString();
  } catch (error) {
    console.error('Erreur conversion datetime-local vers ISO:', error);
    return null;
  }
}

// Charger les paramètres
async function loadSettings() {
  try {
    const response = await api.get('/settings');
    const settings = response.data;
    
    generalSettings.value = {
      maintenanceEnabled: settings.maintenanceEnabled || false,
      maintenanceMessage: settings.maintenanceMessage || '',
      maintenanceScheduledAt: isoToDatetimeLocal(settings.maintenanceScheduledAt),
      lockUserCreation: settings.lockUserCreation || false,
    };

    notificationSettings.value = {
      criticalAlertsEnabled: settings.criticalAlertsEnabled !== false,
    };
  } catch (error) {
    console.error('Erreur chargement paramètres:', error);
  }
}

// Sauvegarder les paramètres généraux
async function saveGeneralSettings() {
  savingGeneral.value = true;
  generalMessage.value = null;

  try {
    // Convertir la date datetime-local en ISO 8601 pour l'API
    const scheduledAtISO = datetimeLocalToISO(generalSettings.value.maintenanceScheduledAt);
    
    // Préparer les données en nettoyant les valeurs vides
    const payload = {
      maintenanceEnabled: generalSettings.value.maintenanceEnabled,
      maintenanceMessage: generalSettings.value.maintenanceMessage || null,
      maintenanceScheduledAt: scheduledAtISO,
      lockUserCreation: generalSettings.value.lockUserCreation,
    };

    console.log('Envoi des paramètres généraux:', payload);
    console.log('Date locale (input):', generalSettings.value.maintenanceScheduledAt);
    console.log('Date ISO (envoyée):', scheduledAtISO);

    await api.put('/settings', payload);
    generalMessage.value = {
      type: 'success',
      text: 'Paramètres généraux sauvegardés avec succès',
    };

    setTimeout(() => {
      generalMessage.value = null;
    }, 3000);
  } catch (error: any) {
    console.error('Erreur sauvegarde paramètres généraux:', error.response?.data);
    
    let errorText = 'Erreur lors de la sauvegarde';
    
    // Afficher les détails de validation si disponibles
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const errorMessages = error.response.data.errors.map((e: any) => 
        `${e.path?.join('.')}: ${e.message}`
      ).join(', ');
      errorText = `Validation échouée: ${errorMessages}`;
    } else if (error.response?.data?.message) {
      errorText = error.response.data.message;
    }
    
    generalMessage.value = {
      type: 'error',
      text: errorText,
    };
  } finally {
    savingGeneral.value = false;
  }
}

// Sauvegarder les paramètres de notification
async function saveNotificationSettings() {
  savingNotifications.value = true;
  notificationMessage.value = null;

  try {
    // Préparer les données en nettoyant les valeurs vides
    const payload = {
      criticalAlertsEnabled: notificationSettings.value.criticalAlertsEnabled,
    };

    console.log('Envoi des paramètres de notification:', payload);

    await api.put('/settings', payload);
    notificationMessage.value = {
      type: 'success',
      text: 'Paramètres de notification sauvegardés avec succès',
    };

    setTimeout(() => {
      notificationMessage.value = null;
    }, 3000);
  } catch (error: any) {
    console.error('Erreur sauvegarde notifications:', error.response?.data);
    
    let errorText = 'Erreur lors de la sauvegarde';
    
    // Afficher les détails de validation si disponibles
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const errorMessages = error.response.data.errors.map((e: any) => 
        `${e.path?.join('.')}: ${e.message}`
      ).join(', ');
      errorText = `Validation échouée: ${errorMessages}`;
    } else if (error.response?.data?.message) {
      errorText = error.response.data.message;
    }
    
    notificationMessage.value = {
      type: 'error',
      text: errorText,
    };
  } finally {
    savingNotifications.value = false;
  }
}

// Charger le status du CRON
async function loadCronStatus() {
  loadingCronStatus.value = true;
  try {
    const response = await api.get('/cron/screenshot-urls/status');
    cronStatus.value = response.data;
  } catch (error: any) {
    console.error('Erreur chargement status CRON:', error);
    cronStatus.value = null;
  } finally {
    loadingCronStatus.value = false;
  }
}

// Déclencher régénération manuelle
async function triggerManualRegeneration() {
  regeneratingUrls.value = true;
  regenerationSuccess.value = false;
  regenerationError.value = null;

  try {
    await api.post('/cron/screenshot-urls/regenerate');
    regenerationSuccess.value = true;
    
    // Rafraîchir le status après 2 secondes
    setTimeout(() => {
      loadCronStatus();
      regenerationSuccess.value = false;
    }, 2000);
  } catch (error: any) {
    console.error('Erreur régénération URLs:', error);
    regenerationError.value = error.response?.data?.message || 'Erreur lors de la régénération';
    
    setTimeout(() => {
      regenerationError.value = null;
    }, 5000);
  } finally {
    regeneratingUrls.value = false;
  }
}

onMounted(() => {
  loadSettings();
  loadCronStatus();
});
</script>

<template>
  <section class="space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="Settings02Icon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Réglages d'administration</h1>
          <p class="text-base-content/70 mt-1">
            Paramétrez les options globales de la plateforme OSINT et ajustez les politiques de sécurité
          </p>
        </div>
      </div>
    </header>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Paramètres généraux -->
      <div class="bg-base-200 border-l-4 border-accent">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Settings02Icon" :size="24" class="text-accent" />
            <h2 class="text-xl font-semibold">Paramètres généraux</h2>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Message de succès/erreur -->
          <div v-if="generalMessage" class="bg-base-100 border-l-4 p-4" :class="generalMessage.type === 'success' ? 'border-success' : 'border-error'">
            <div class="flex items-center gap-3">
              <HugeiconsIcon 
                :icon="generalMessage.type === 'success' ? CheckmarkCircle02Icon : AlertCircleIcon"
                :size="20"
                :class="generalMessage.type === 'success' ? 'text-success' : 'text-error'"
              />
              <span class="text-sm font-medium">{{ generalMessage.text }}</span>
            </div>
          </div>

          <div class="form-control bg-base-100 p-4 rounded-lg">
            <label class="label cursor-pointer justify-between gap-4">
              <div class="flex items-center gap-3">
                <HugeiconsIcon :icon="Alert01Icon" :size="20" class="text-warning" />
                <div>
                  <span class="label-text font-medium">Maintenance programmée</span>
                  <p class="text-xs text-base-content/60 mt-0.5">
                    Notifie les utilisateurs 24h avant la maintenance planifiée
                  </p>
                </div>
              </div>
              <input 
                type="checkbox" 
                class="toggle toggle-warning" 
                v-model="generalSettings.maintenanceEnabled"
              />
            </label>
          </div>

          <!-- Champ date/heure de maintenance -->
          <div v-if="generalSettings.maintenanceEnabled" class="form-control bg-base-100 p-4 rounded-lg">
            <label class="label">
              <span class="label-text font-medium flex items-center gap-2">
                <HugeiconsIcon :icon="Time01Icon" :size="18" />
                Date et heure de la maintenance
              </span>
            </label>
            <input 
              type="datetime-local" 
              class="input input-bordered w-full"
              v-model="generalSettings.maintenanceScheduledAt"
            />
          </div>

          <!-- Message personnalisé de maintenance -->
          <div v-if="generalSettings.maintenanceEnabled" class="form-control bg-base-100 p-4 rounded-lg">
            <label class="label">
              <span class="label-text font-medium flex items-center gap-2">
                <HugeiconsIcon :icon="Message01Icon" :size="18" />
                Message personnalisé
              </span>
            </label>
            <textarea 
              class="textarea textarea-bordered"
              placeholder="Message affiché aux utilisateurs pendant la maintenance"
              v-model="generalSettings.maintenanceMessage"
              rows="3"
            ></textarea>
          </div>

          <div class="form-control bg-base-100 p-4 rounded-lg">
            <label class="label cursor-pointer justify-between gap-4">
              <div class="flex items-center gap-3">
                <HugeiconsIcon :icon="LockIcon" :size="20" class="text-error" />
                <div>
                  <span class="label-text font-medium">Verrouiller la création de comptes</span>
                  <p class="text-xs text-base-content/60 mt-0.5">
                    Seuls les administrateurs peuvent inviter de nouveaux agents
                  </p>
                </div>
              </div>
              <input 
                type="checkbox" 
                class="toggle toggle-error"
                v-model="generalSettings.lockUserCreation"
              />
            </label>
          </div>
          
          <div class="flex justify-end pt-4 border-t border-base-300">
            <button 
              class="btn btn-accent gap-2"
              @click="saveGeneralSettings"
              :disabled="savingGeneral"
            >
              <span v-if="savingGeneral" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="CheckmarkCircle02Icon" :size="18" />
              {{ savingGeneral ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Notifications -->
      <div class="bg-base-200 border-l-4 border-info">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Notification02Icon" :size="24" class="text-info" />
            <h2 class="text-xl font-semibold">Notifications</h2>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Message de succès/erreur -->
          <div v-if="notificationMessage" class="bg-base-100 border-l-4 p-4" :class="notificationMessage.type === 'success' ? 'border-success' : 'border-error'">
            <div class="flex items-center gap-3">
              <HugeiconsIcon 
                :icon="notificationMessage.type === 'success' ? CheckmarkCircle02Icon : AlertCircleIcon"
                :size="20"
                :class="notificationMessage.type === 'success' ? 'text-success' : 'text-error'"
              />
              <span class="text-sm font-medium">{{ notificationMessage.text }}</span>
            </div>
          </div>

          <div class="form-control bg-base-100 p-4 rounded-lg">
            <label class="label cursor-pointer justify-between gap-4">
              <div class="flex items-center gap-3">
                <HugeiconsIcon :icon="AlertCircleIcon" :size="20" class="text-error" />
                <div>
                  <span class="label-text font-medium">Alertes critiques</span>
                  <p class="text-xs text-base-content/60 mt-0.5">
                    Envoie un courriel aux responsables lors d'un incident majeur
                  </p>
                </div>
              </div>
              <input 
                type="checkbox" 
                class="toggle toggle-info" 
                v-model="notificationSettings.criticalAlertsEnabled"
              />
            </label>
          </div>

          <div class="flex justify-end pt-4 border-t border-base-300">
            <button 
              class="btn btn-info gap-2"
              @click="saveNotificationSettings"
              :disabled="savingNotifications"
            >
              <span v-if="savingNotifications" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="CheckmarkCircle02Icon" :size="18" />
              {{ savingNotifications ? 'Mise à jour...' : 'Mettre à jour' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Tâches CRON -->
    <div class="bg-base-200 border-l-4 border-warning">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Calendar03Icon" :size="24" class="text-warning" />
            <div>
              <h2 class="text-xl font-semibold">Tâches automatiques (CRON)</h2>
              <p class="text-sm text-base-content/60 mt-1">
                Surveillance et gestion des tâches planifiées du système
              </p>
            </div>
          </div>
          <button 
            @click="loadCronStatus" 
            class="btn btn-ghost btn-sm gap-2"
            :disabled="loadingCronStatus"
          >
            <HugeiconsIcon 
              :icon="Loading02Icon" 
              :size="18"
              :class="{ 'animate-spin': loadingCronStatus }"
            />
            Actualiser
          </button>
        </div>
      </div>

      <div class="p-6">
        <!-- État de chargement -->
        <div v-if="loadingCronStatus" class="flex items-center justify-center py-12">
          <HugeiconsIcon :icon="Loading02Icon" :size="32" class="animate-spin text-warning" />
        </div>

        <!-- Contenu -->
        <div v-else-if="cronStatus" class="space-y-4">
          <!-- Tâche: Régénération des URLs de screenshots -->
          <div class="bg-base-100 p-6 rounded-lg space-y-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h3 class="font-semibold text-lg">{{ cronStatus.service }}</h3>
                  <span class="badge badge-success gap-1">
                    <HugeiconsIcon :icon="CheckmarkCircle02Icon" :size="14" />
                    {{ cronStatus.status }}
                  </span>
                </div>
                <p class="text-sm text-base-content/60 mt-2">
                  Régénère automatiquement les URLs signées des screenshots avant leur expiration
                </p>
              </div>
            </div>

            <!-- Détails de configuration -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
                <div class="p-2 rounded-lg bg-primary/10">
                  <HugeiconsIcon :icon="Calendar03Icon" :size="20" class="text-primary" />
                </div>
                <div>
                  <p class="font-medium text-xs text-base-content/60">Planification</p>
                  <p class="text-sm font-semibold mt-1">{{ cronStatus.schedule }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
                <div class="p-2 rounded-lg bg-warning/10">
                  <HugeiconsIcon :icon="AlertCircleIcon" :size="20" class="text-warning" />
                </div>
                <div>
                  <p class="font-medium text-xs text-base-content/60">Seuil de régénération</p>
                  <p class="text-sm font-semibold mt-1">{{ cronStatus.regenerationThreshold }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
                <div class="p-2 rounded-lg bg-success/10">
                  <HugeiconsIcon :icon="CheckmarkCircle02Icon" :size="20" class="text-success" />
                </div>
                <div>
                  <p class="font-medium text-xs text-base-content/60">Durée d'expiration</p>
                  <p class="text-sm font-semibold mt-1">{{ cronStatus.newExpirationDuration }}</p>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-base-200">
              <button 
                @click="triggerManualRegeneration"
                class="btn btn-warning gap-2"
                :disabled="regeneratingUrls"
              >
                <HugeiconsIcon 
                  :icon="Loading02Icon" 
                  v-if="regeneratingUrls"
                  :size="18"
                  class="animate-spin"
                />
                <span v-else>▶️</span>
                {{ regeneratingUrls ? 'Exécution en cours...' : 'Exécuter maintenant' }}
              </button>

              <!-- Message de succès -->
              <div 
                v-if="regenerationSuccess" 
                class="flex items-center gap-2 text-sm font-medium bg-success/10 text-success px-4 py-2 rounded-lg"
              >
                <HugeiconsIcon :icon="CheckmarkCircle02Icon" :size="18" />
                <span>Régénération lancée avec succès</span>
              </div>

              <!-- Message d'erreur -->
              <div 
                v-if="regenerationError" 
                class="flex items-center gap-2 text-sm font-medium bg-error/10 text-error px-4 py-2 rounded-lg"
              >
                <HugeiconsIcon :icon="AlertCircleIcon" :size="18" />
                <span>{{ regenerationError }}</span>
              </div>
            </div>
          </div>

          <!-- Info supplémentaire -->
          <div class="bg-base-100 border-l-4 border-info p-5">
            <div class="flex items-start gap-3">
              <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-info flex-shrink-0" />
              <div>
                <p class="font-semibold text-sm">À propos de la régénération automatique</p>
                <p class="text-xs text-base-content/70 mt-2">
                  Le CRON s'exécute automatiquement tous les jours à 03:00 pour prolonger la validité des URLs 
                  de screenshots qui expirent dans moins de 30 jours. Vous pouvez déclencher une exécution 
                  manuelle à tout moment via le bouton ci-dessus.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Erreur de chargement -->
        <div v-else class="bg-base-100 border-l-4 border-error p-6">
          <div class="flex items-start gap-3">
            <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-error flex-shrink-0" />
            <div>
              <p class="font-semibold">Impossible de charger le status des tâches CRON</p>
              <p class="text-xs text-base-content/70 mt-2">
                Veuillez vérifier que vous avez les permissions nécessaires (system:settings)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
