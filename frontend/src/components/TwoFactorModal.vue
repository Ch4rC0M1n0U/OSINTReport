<script setup lang="ts">
import { ref, watch } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  SecurityLockIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";

const props = defineProps<{
  show: boolean;
  tempToken: string;
}>();

const emit = defineEmits<{
  (e: "verify", code: string): void;
  (e: "cancel"): void;
}>();

const code = ref("");
const error = ref("");

watch(() => props.show, (newVal) => {
  if (newVal) {
    code.value = "";
    error.value = "";
  }
});

function handleSubmit() {
  if (code.value.length !== 6) {
    error.value = "Veuillez entrer un code à 6 chiffres";
    return;
  }

  error.value = "";
  emit("verify", code.value);
}

function handleCancel() {
  code.value = "";
  error.value = "";
  emit("cancel");
}

// Auto-submit quand le code est complet
watch(code, (newCode) => {
  if (newCode.length === 6) {
    // Petit délai pour une meilleure UX
    setTimeout(() => {
      if (code.value.length === 6) {
        handleSubmit();
      }
    }, 300);
  }
});
</script>

<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box max-w-md">
      <!-- En-tête -->
      <div class="flex items-center gap-3 mb-6">
        <div class="p-3 bg-success/10 rounded-full">
          <HugeiconsIcon :icon="SecurityLockIcon" :size="32" class="text-success" />
        </div>
        <div>
          <h3 class="font-bold text-lg">Authentification à deux facteurs</h3>
          <p class="text-sm text-base-content/60">Entrez le code de vérification</p>
        </div>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="alert alert-error mb-4">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="20" />
        <span>{{ error }}</span>
      </div>

      <!-- Instructions -->
      <div class="bg-base-200 p-4 rounded-lg mb-6">
        <p class="text-sm text-base-content/70">
          Ouvrez votre application d'authentification et entrez le code à 6 chiffres affiché.
        </p>
      </div>

      <!-- Champ de saisie -->
      <div class="form-control">
        <label class="label">
          <span class="label-text font-medium">Code de vérification</span>
        </label>
        <input
          v-model="code"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="6"
          class="input input-bordered input-lg text-center text-3xl tracking-[0.5em] font-mono"
          placeholder="000000"
          autofocus
          @keyup.enter="handleSubmit"
        />
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            Le code change toutes les 30 secondes
          </span>
        </label>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="handleCancel" class="btn btn-ghost gap-2">
          <HugeiconsIcon :icon="Cancel01Icon" :size="20" />
          Annuler
        </button>
        <button @click="handleSubmit" class="btn btn-success gap-2" :disabled="code.length !== 6">
          <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="20" />
          Vérifier
        </button>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="handleCancel"></div>
  </div>
</template>
