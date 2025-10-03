<script setup lang="ts">
import { ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useCorrelationsStore } from "@/stores/correlations";
import type { CorrelationType } from "@/services/api/correlations";

interface Props {
  reportId: string;
  value: string;
  type: CorrelationType;
  disabled?: boolean;
}

const props = defineProps<Props>();

const correlationsStore = useCorrelationsStore();
const showAlert = ref(false);

const debouncedCheck = useDebounceFn(async () => {
  if (!props.value || props.value.length < 3) {
    showAlert.value = false;
    correlationsStore.clearRealtimeCheck();
    return;
  }

  try {
    const result = await correlationsStore.checkRealtime(
      props.reportId,
      props.value,
      props.type
    );

    if (result && result.found && result.totalMatches > 0) {
      showAlert.value = true;
    } else {
      showAlert.value = false;
    }
  } catch (error) {
    console.error("Erreur vérification corrélation:", error);
  }
}, 500);

watch(
  () => props.value,
  () => {
    if (!props.disabled) {
      debouncedCheck();
    }
  }
);

function getTypeLabel(type: CorrelationType) {
  const labels: Record<CorrelationType, string> = {
    PHONE: "Téléphone",
    EMAIL: "Email",
    NAME: "Nom",
    ADDRESS: "Adresse",
    ACCOUNT: "Compte",
  };
  return labels[type];
}
</script>

<template>
  <div
    v-if="showAlert && correlationsStore.realtimeCheckResult"
    class="alert alert-warning shadow-lg"
  >
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <div class="flex-1">
        <h3 class="font-bold">⚠️ Corrélation détectée</h3>
        <div class="text-sm">
          Ce {{ getTypeLabel(type).toLowerCase() }} apparaît dans
          <strong>{{ correlationsStore.realtimeCheckResult.totalMatches }}</strong>
          autre(s) rapport(s) :
        </div>
        <ul class="mt-2 space-y-1 text-sm">
          <li
            v-for="(match, index) in correlationsStore.realtimeCheckResult.matches.slice(
              0,
              3
            )"
            :key="index"
            class="ml-4"
          >
            📄 <strong>{{ match.reportTitle }}</strong>
            <span v-if="match.caseNumber" class="opacity-70">
              ({{ match.caseNumber }})
            </span>
            - {{ match.moduleType }}
          </li>
          <li
            v-if="correlationsStore.realtimeCheckResult.totalMatches > 3"
            class="ml-4 opacity-70"
          >
            ... et {{ correlationsStore.realtimeCheckResult.totalMatches - 3 }} autre(s)
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
