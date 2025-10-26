<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

defineProps<{
  src: string;
  alt?: string;
  maxHeight?: string;
}>();

// Empêcher les screenshots via keyboard shortcuts
function preventScreenshot(e: KeyboardEvent) {
  // Empêcher Impr écran / Print Screen
  if (e.key === "PrintScreen" || e.keyCode === 44) {
    e.preventDefault();
    alert("Les captures d'écran de la signature sont désactivées pour des raisons de sécurité.");
  }
  
  // Empêcher Ctrl+Shift+S (Firefox screenshot)
  if (e.ctrlKey && e.shiftKey && e.key === "S") {
    e.preventDefault();
    alert("Les captures d'écran de la signature sont désactivées pour des raisons de sécurité.");
  }
  
  // Empêcher Windows+Shift+S (Windows Snipping Tool)
  if (e.metaKey && e.shiftKey && e.key === "s") {
    e.preventDefault();
    alert("Les captures d'écran de la signature sont désactivées pour des raisons de sécurité.");
  }
}

onMounted(() => {
  document.addEventListener("keyup", preventScreenshot);
});

onUnmounted(() => {
  document.removeEventListener("keyup", preventScreenshot);
});
</script>

<template>
  <div class="signature-protected-wrapper" :style="{ maxHeight: maxHeight || 'auto' }">
    <div class="signature-protected-overlay"></div>
    <img 
      :src="src" 
      :alt="alt || 'Signature'"
      class="signature-protected-image"
      draggable="false"
      @contextmenu.prevent
      @dragstart.prevent
      @selectstart.prevent
    />
    <div class="signature-watermark">PROTÉGÉ</div>
  </div>
</template>

<style scoped>
.signature-protected-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 12px;
  overflow: hidden;
}

/* Overlay transparent pour bloquer les interactions */
.signature-protected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 2;
  pointer-events: all;
  cursor: not-allowed;
}

.signature-protected-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: inherit;
  object-fit: contain;
  pointer-events: none !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  -webkit-user-drag: none !important;
  -khtml-user-drag: none !important;
  -moz-user-drag: none !important;
  -o-user-drag: none !important;
  position: relative;
  z-index: 1;
}

/* Filigrane de protection */
.signature-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 2rem;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.03);
  pointer-events: none;
  z-index: 3;
  letter-spacing: 0.5rem;
  white-space: nowrap;
}

/* Empêche la sélection de texte */
.signature-protected-wrapper::selection {
  background: transparent;
}

.signature-protected-wrapper::-moz-selection {
  background: transparent;
}

/* Protection supplémentaire contre le copier-coller */
.signature-protected-wrapper {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Avertissement au survol */
.signature-protected-wrapper:hover::after {
  content: '🔒 Signature protégée';
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  z-index: 4;
  pointer-events: none;
}
</style>
