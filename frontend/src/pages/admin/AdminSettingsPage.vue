<script setup lang="ts">
const featureFlags = [
  {
    label: "Activer l'audit avancé",
    description: "Journalise les actions sensibles dans le journal d'audit détaillé.",
    enabled: true,
  },
  {
    label: "Autoriser le relais d'alertes",
    description: "Diffuse automatiquement les alertes critiques aux équipes abonnées.",
    enabled: false,
  },
  {
    label: "Verrouillage temporaire",
    description: "Force la révocation des sessions inactives après 24h.",
    enabled: true,
  },
];
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-2">
      <h2 class="text-2xl font-semibold">Réglages d'administration</h2>
      <p class="text-sm text-base-content/70">
        Paramétrez les options globales de la plateforme OSINT et ajustez les politiques de sécurité.
      </p>
    </header>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="card bg-base-100 shadow">
        <div class="card-body space-y-4">
          <h3 class="card-title text-lg">Paramètres généraux</h3>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Maintenance programmée</span>
              <input type="checkbox" class="toggle toggle-primary" checked />
            </label>
            <span class="label-text-alt text-base-content/60">
              Notifie les utilisateurs 24h avant la maintenance planifiée.
            </span>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Verrouiller la création de comptes</span>
              <input type="checkbox" class="toggle toggle-primary" />
            </label>
            <span class="label-text-alt text-base-content/60">
              Seuls les administrateurs peuvent inviter de nouveaux agents.
            </span>
          </div>
          <button class="btn btn-primary btn-sm self-end">Enregistrer</button>
        </div>
      </div>

      <div class="card bg-base-100 shadow">
        <div class="card-body space-y-4">
          <h3 class="card-title text-lg">Notifications</h3>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Alertes critiques</span>
              <input type="checkbox" class="toggle toggle-secondary" checked />
            </label>
            <span class="label-text-alt text-base-content/60">
              Envoie un courriel aux responsables lors d'un incident majeur.
            </span>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-between gap-4">
              <span class="label-text">Notifications Slack</span>
              <input type="checkbox" class="toggle toggle-secondary" />
            </label>
            <span class="label-text-alt text-base-content/60">
              Nécessite une intégration Slack valide.
            </span>
          </div>
          <button class="btn btn-secondary btn-sm self-end">Mettre à jour</button>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 shadow">
      <div class="card-body space-y-4">
        <h3 class="card-title text-lg">Fonctionnalités bêta</h3>
        <p class="text-sm text-base-content/70">
          Activez temporairement des fonctionnalités en cours d'évaluation pour un sous-ensemble d'équipes.
        </p>
        <ul class="space-y-3">
          <li
            v-for="flag in featureFlags"
            :key="flag.label"
            class="flex flex-col gap-1 rounded border border-base-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p class="font-medium">{{ flag.label }}</p>
              <p class="text-sm text-base-content/60">{{ flag.description }}</p>
            </div>
            <label class="label cursor-pointer justify-end gap-3">
              <span class="label-text text-sm">{{ flag.enabled ? "Activé" : "Désactivé" }}</span>
              <input type="checkbox" class="toggle toggle-accent" :checked="flag.enabled" />
            </label>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
