<template>
  <div class="location-map">
    <!-- Coordonnées GPS -->
    <div class="bg-base-200 rounded-lg p-4 mb-4">
      <h4 class="font-semibold mb-2 flex items-center gap-2">
        <span>📍</span>
        <span>Localisation GPS</span>
      </h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="text-base-content/60">Latitude:</span>
          <span class="ml-2 font-mono">{{ latitude.toFixed(6) }}°</span>
        </div>
        <div>
          <span class="text-base-content/60">Longitude:</span>
          <span class="ml-2 font-mono">{{ longitude.toFixed(6) }}°</span>
        </div>
        <div v-if="altitude !== undefined" class="col-span-2">
          <span class="text-base-content/60">Altitude:</span>
          <span class="ml-2 font-mono">{{ altitude.toFixed(1) }}m</span>
        </div>
      </div>
      <div class="mt-3 flex gap-2">
        <a
          :href="googleMapsUrl"
          target="_blank"
          class="btn btn-xs btn-outline gap-1"
          title="Ouvrir dans Google Maps"
        >
          <span>🌍</span>
          <span>Google Maps</span>
        </a>
        <a
          :href="openStreetMapUrl"
          target="_blank"
          class="btn btn-xs btn-outline gap-1"
          title="Ouvrir dans OpenStreetMap"
        >
          <span>🗺️</span>
          <span>OpenStreetMap</span>
        </a>
        <button
          type="button"
          class="btn btn-xs btn-outline gap-1"
          @click="copyCoordinates"
          title="Copier les coordonnées"
        >
          <span>📋</span>
          <span>Copier</span>
        </button>
      </div>
    </div>

    <!-- Carte OpenStreetMap embarquée (iframe) -->
    <div class="relative rounded-lg overflow-hidden border border-base-300" style="height: 400px;">
      <iframe
        :src="embedMapUrl"
        width="100%"
        height="100%"
        frameborder="0"
        scrolling="no"
        marginheight="0"
        marginwidth="0"
        style="border: 0;"
        loading="lazy"
        allowfullscreen
      ></iframe>
      
      <!-- Overlay pour éviter les interactions accidentelles -->
      <div
        v-if="!interactive"
        class="absolute inset-0 cursor-pointer"
        @click="openInNewTab"
        title="Cliquer pour ouvrir dans OpenStreetMap"
      ></div>
    </div>

    <!-- Note de confidentialité -->
    <div class="alert alert-warning mt-4 text-xs">
      <span>⚠️</span>
      <span>
        Les métadonnées GPS peuvent révéler des informations sensibles sur les lieux de capture.
        Ces données sont incluses dans le rapport pour analyse OSINT uniquement.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  latitude: number;
  longitude: number;
  altitude?: number;
  interactive?: boolean; // Permet l'interaction avec la carte (zoom, déplacement)
}>();

// URL Google Maps
const googleMapsUrl = computed(() => {
  return `https://www.google.com/maps?q=${props.latitude},${props.longitude}`;
});

// URL OpenStreetMap
const openStreetMapUrl = computed(() => {
  return `https://www.openstreetmap.org/?mlat=${props.latitude}&mlon=${props.longitude}&zoom=15`;
});

// URL pour iframe embarquée (uMap ou OpenStreetMap embed)
const embedMapUrl = computed(() => {
  // OpenStreetMap exportable - Affiche un marqueur sur la carte
  const zoom = 15;
  const markerLat = props.latitude;
  const markerLon = props.longitude;
  
  // Utilisation de l'export iframe d'OpenStreetMap
  return `https://www.openstreetmap.org/export/embed.html?bbox=${markerLon - 0.01},${markerLat - 0.01},${markerLon + 0.01},${markerLat + 0.01}&layer=mapnik&marker=${markerLat},${markerLon}`;
});

function openInNewTab() {
  window.open(openStreetMapUrl.value, '_blank');
}

function copyCoordinates() {
  const coords = `${props.latitude}, ${props.longitude}`;
  navigator.clipboard.writeText(coords).then(() => {
    alert('Coordonnées copiées dans le presse-papier');
  }).catch(err => {
    console.error('Erreur copie:', err);
  });
}
</script>

<style scoped>
.location-map {
  width: 100%;
}
</style>
