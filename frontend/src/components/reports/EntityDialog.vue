<script setup lang="ts">
import { ref } from "vue";
import type { EntityType } from "@/services/api/entities";
import { useEntitiesStore } from "@/stores/entities";

interface Props {
  show: boolean;
  initialData?: {
    label: string;
    type: EntityType;
    notes?: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  saved: [entity: { id: string; label: string; type: EntityType }];
}>();

const entitiesStore = useEntitiesStore();

const form = ref({
  label: props.initialData?.label || "",
  type: (props.initialData?.type || "PERSON") as EntityType,
  notes: props.initialData?.notes || "",
});

const saving = ref(false);
const error = ref<string | null>(null);

const entityTypes: Array<{ value: EntityType; label: string; icon: string }> = [
  { value: "PERSON", label: "Personne", icon: "👤" },
  { value: "ORGANIZATION", label: "Organisation", icon: "🏢" },
  { value: "TELEPHONE", label: "Téléphone", icon: "📞" },
  { value: "EMAIL", label: "Email", icon: "📧" },
  { value: "ACCOUNT", label: "Compte", icon: "🔑" },
  { value: "ADDRESS", label: "Adresse", icon: "📍" },
  { value: "OTHER", label: "Autre", icon: "📄" },
];

async function handleSave() {
  if (!form.value.label.trim()) {
    error.value = "Le libellé est obligatoire";
    return;
  }

  saving.value = true;
  error.value = null;

  try {
    const entity = await entitiesStore.create({
      label: form.value.label.trim(),
      type: form.value.type,
      notes: form.value.notes.trim() || undefined,
    });

    emit("saved", entity);
    handleClose();
  } catch (err) {
    error.value = "Erreur lors de la création de l'entité";
    console.error(err);
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  form.value = {
    label: "",
    type: "PERSON",
    notes: "",
  };
  error.value = null;
  emit("close");
}
</script>

<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-2xl">
      <h3 class="text-lg font-bold mb-4">➕ Créer une entité</h3>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">
              Libellé <span class="text-error">*</span>
            </span>
          </label>
          <input
            v-model="form.label"
            type="text"
            placeholder="Ex: Jean Dupont, +32475123456, info@example.com"
            class="input input-bordered"
            required
            :disabled="saving"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">
              Type <span class="text-error">*</span>
            </span>
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label
              v-for="type in entityTypes"
              :key="type.value"
              class="label cursor-pointer border rounded-lg p-3 hover:bg-base-200 transition"
              :class="{
                'border-primary bg-primary/10': form.type === type.value,
                'border-base-300': form.type !== type.value,
              }"
            >
              <input
                v-model="form.type"
                type="radio"
                :value="type.value"
                class="radio radio-primary radio-sm"
                :disabled="saving"
              />
              <span class="label-text flex items-center gap-2 flex-1">
                <span>{{ type.icon }}</span>
                <span class="text-sm">{{ type.label }}</span>
              </span>
            </label>
          </div>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Notes (optionnel)</span>
          </label>
          <textarea
            v-model="form.notes"
            class="textarea textarea-bordered"
            placeholder="Informations complémentaires..."
            rows="3"
            :disabled="saving"
          ></textarea>
        </div>

        <div v-if="error" class="alert alert-error">
          <span>{{ error }}</span>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn"
            :disabled="saving"
            @click="handleClose"
          >
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner"></span>
            {{ saving ? "Création..." : "Créer l'entité" }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="handleClose"></div>
  </div>
</template>
