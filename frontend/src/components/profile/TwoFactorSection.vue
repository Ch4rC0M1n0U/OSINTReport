<script setup lang="ts">
import { ref, onMounted } from "vue";
import { twoFactorApi } from "@/services/api/twoFactor";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  SecurityLockIcon,
  QrCodeIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

const enabled = ref(false);
const loading = ref(false);
const setupMode = ref(false);
const qrCode = ref("");
const secret = ref("");
const verificationCode = ref("");
const disableCode = ref("");
const message = ref<{ type: "success" | "error"; text: string } | null>(null);

onMounted(async () => {
  await loadStatus();
});

async function loadStatus() {
  try {
    const status = await twoFactorApi.getStatus();
    enabled.value = status.enabled;
  } catch (error) {
    console.error("Erreur lors du chargement du statut 2FA", error);
  }
}

async function startSetup() {
  loading.value = true;
  message.value = null;

  try {
    const setup = await twoFactorApi.generateSecret();
    qrCode.value = setup.qrCode;
    secret.value = setup.secret;
    setupMode.value = true;
  } catch (error: any) {
    message.value = {
      type: "error",
      text: error.response?.data?.message || "Erreur lors de la génération du QR code",
    };
  } finally {
    loading.value = false;
  }
}

async function confirmSetup() {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    message.value = { type: "error", text: "Veuillez entrer un code à 6 chiffres" };
    return;
  }

  loading.value = true;
  message.value = null;

  try {
    await twoFactorApi.enable(secret.value, verificationCode.value);
    enabled.value = true;
    setupMode.value = false;
    verificationCode.value = "";
    message.value = {
      type: "success",
      text: "L'authentification à deux facteurs a été activée avec succès",
    };
  } catch (error: any) {
    message.value = {
      type: "error",
      text: error.response?.data?.message || "Code de vérification invalide",
    };
  } finally {
    loading.value = false;
  }
}

function cancelSetup() {
  setupMode.value = false;
  verificationCode.value = "";
  qrCode.value = "";
  secret.value = "";
  message.value = null;
}

async function disable2FA() {
  if (!disableCode.value || disableCode.value.length !== 6) {
    message.value = { type: "error", text: "Veuillez entrer un code à 6 chiffres" };
    return;
  }

  loading.value = true;
  message.value = null;

  try {
    await twoFactorApi.disable(disableCode.value);
    enabled.value = false;
    disableCode.value = "";
    message.value = {
      type: "success",
      text: "L'authentification à deux facteurs a été désactivée",
    };
  } catch (error: any) {
    message.value = {
      type: "error",
      text: error.response?.data?.message || "Code de vérification invalide",
    };
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="bg-base-200 border-l-4 border-success">
    <!-- En-tête -->
    <div class="p-6 border-b border-base-300">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="SecurityLockIcon" :size="24" class="text-success" />
        <div>
          <h2 class="text-xl font-semibold">Authentification à deux facteurs (2FA)</h2>
          <p class="text-sm text-base-content/60 mt-1">
            Renforcez la sécurité de votre compte avec un code de vérification supplémentaire
          </p>
        </div>
      </div>
    </div>

    <!-- Contenu -->
    <div class="p-6 space-y-6">
      <!-- Message -->
      <div v-if="message" class="alert" :class="message.type === 'success' ? 'alert-success' : 'alert-error'">
        <HugeiconsIcon :icon="message.type === 'success' ? CheckmarkCircle01Icon : AlertCircleIcon" :size="20" />
        <span>{{ message.text }}</span>
      </div>

      <!-- Statut actuel -->
      <div v-if="!setupMode" class="flex items-center justify-between p-4 bg-base-300/30 rounded-lg">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="SecurityLockIcon" :size="24" :class="enabled ? 'text-success' : 'text-base-content/40'" />
          <div>
            <p class="font-medium">Statut de la 2FA</p>
            <p class="text-sm text-base-content/60">
              {{ enabled ? "Activée" : "Désactivée" }}
            </p>
          </div>
        </div>
        <div class="badge" :class="enabled ? 'badge-success' : 'badge-ghost'">
          {{ enabled ? "✓ Activée" : "Désactivée" }}
        </div>
      </div>

      <!-- Configuration initiale -->
      <div v-if="!enabled && !setupMode">
        <div class="bg-info/10 border-l-4 border-info p-4 rounded mb-4">
          <div class="flex gap-3">
            <HugeiconsIcon :icon="AlertCircleIcon" :size="20" class="text-info flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium mb-1">Qu'est-ce que la 2FA ?</p>
              <p class="text-base-content/70">
                L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
                Vous aurez besoin de votre mot de passe ET d'un code généré par une application mobile pour vous connecter.
              </p>
            </div>
          </div>
        </div>

        <button @click="startSetup" class="btn btn-success gap-2" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <HugeiconsIcon v-else :icon="SecurityLockIcon" :size="20" />
          Activer la 2FA
        </button>
      </div>

      <!-- Mode configuration -->
      <div v-if="setupMode" class="space-y-6">
        <div class="steps steps-vertical lg:steps-horizontal w-full">
          <div class="step step-primary">Installer l'application</div>
          <div class="step step-primary">Scanner le QR code</div>
          <div class="step">Vérifier le code</div>
        </div>

        <!-- Étape 1 : Instructions -->
        <div class="bg-base-300/30 p-4 rounded-lg">
          <h3 class="font-semibold mb-3">1. Installez une application d'authentification</h3>
          <p class="text-sm text-base-content/70 mb-2">
            Téléchargez et installez une application d'authentification sur votre smartphone :
          </p>
          <ul class="text-sm text-base-content/70 space-y-1 ml-4">
            <li>• Google Authenticator (iOS / Android)</li>
            <li>• Microsoft Authenticator (iOS / Android)</li>
            <li>• Authy (iOS / Android)</li>
          </ul>
        </div>

        <!-- Étape 2 : QR Code -->
        <div class="bg-base-300/30 p-4 rounded-lg">
          <h3 class="font-semibold mb-3">2. Scannez ce QR code</h3>
          <div class="flex flex-col items-center gap-4">
            <div v-if="qrCode" class="bg-white p-4 rounded-lg">
              <img :src="qrCode" alt="QR Code 2FA" class="w-48 h-48" />
            </div>
            <div v-else class="flex items-center justify-center bg-white p-4 rounded-lg w-48 h-48">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div class="text-center">
              <p class="text-sm text-base-content/60 mb-2">Ou entrez manuellement ce code :</p>
              <code class="bg-base-300 px-3 py-2 rounded text-sm">{{ secret }}</code>
            </div>
          </div>
        </div>

        <!-- Étape 3 : Vérification -->
        <div class="bg-base-300/30 p-4 rounded-lg">
          <h3 class="font-semibold mb-3">3. Entrez le code de vérification</h3>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Code à 6 chiffres</span>
            </label>
            <input
              v-model="verificationCode"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              class="input input-bordered text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            <label class="label">
              <span class="label-text-alt text-base-content/60">
                Entrez le code affiché dans votre application
              </span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button @click="confirmSetup" class="btn btn-success gap-2" :disabled="loading || verificationCode.length !== 6">
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="20" />
            Activer la 2FA
          </button>
          <button @click="cancelSetup" class="btn btn-ghost gap-2" :disabled="loading">
            <HugeiconsIcon :icon="Cancel01Icon" :size="20" />
            Annuler
          </button>
        </div>
      </div>

      <!-- Désactivation -->
      <div v-if="enabled && !setupMode" class="space-y-4">
        <div class="bg-warning/10 border-l-4 border-warning p-4 rounded">
          <div class="flex gap-3">
            <HugeiconsIcon :icon="AlertCircleIcon" :size="20" class="text-warning flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium mb-1">Désactiver la 2FA</p>
              <p class="text-base-content/70">
                La désactivation de la 2FA réduira la sécurité de votre compte. Entrez un code de vérification pour confirmer.
              </p>
            </div>
          </div>
        </div>

        <div class="form-control max-w-xs">
          <label class="label">
            <span class="label-text">Code de vérification</span>
          </label>
          <input
            v-model="disableCode"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            class="input input-bordered text-center text-lg tracking-widest"
            placeholder="000000"
          />
        </div>

        <button @click="disable2FA" class="btn btn-error gap-2" :disabled="loading || disableCode.length !== 6">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          <HugeiconsIcon v-else :icon="Cancel01Icon" :size="20" />
          Désactiver la 2FA
        </button>
      </div>
    </div>
  </div>
</template>
