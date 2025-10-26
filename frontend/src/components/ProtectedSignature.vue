<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

defineProps<{
  src: string;
  alt?: string;
  maxHeight?: string;
}>();

const isBlurred = ref(false);

// Empêcher les screenshots via keyboard shortcuts
function preventScreenshot(e: KeyboardEvent) {
  // Empêcher Impr écran / Print Screen
  if (e.key === "PrintScreen" || e.keyCode === 44) {
    e.preventDefault();
    showWarning();
    return false;
  }
  
  // Empêcher Ctrl+Shift+S (Firefox screenshot)
  if (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s")) {
    e.preventDefault();
    showWarning();
    return false;
  }
  
  // Empêcher Windows+Shift+S (Windows Snipping Tool)
  if (e.metaKey && e.shiftKey && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    showWarning();
    return false;
  }

  // Empêcher Cmd+Shift+3, Cmd+Shift+4 (macOS screenshots)
  if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) {
    e.preventDefault();
    showWarning();
    return false;
  }

  // Empêcher Alt+Print Screen (Windows - fenêtre active)
  if (e.altKey && (e.key === "PrintScreen" || e.keyCode === 44)) {
    e.preventDefault();
    showWarning();
    return false;
  }
}

// Détecter perte de focus (peut indiquer utilisation d'un outil externe)
function handleVisibilityChange() {
  if (document.hidden) {
    isBlurred.value = true;
    console.warn("⚠️ Attention : Tentative potentielle de capture détectée");
  } else {
    setTimeout(() => {
      isBlurred.value = false;
    }, 100);
  }
}

// Empêcher le copier-coller
function preventCopy(e: ClipboardEvent) {
  const target = e.target as HTMLElement;
  if (target.closest('.signature-protected-wrapper')) {
    e.preventDefault();
    showWarning();
  }
}

// Afficher un avertissement
function showWarning() {
  console.warn("🔒 Les captures d'écran de la signature sont désactivées pour des raisons de sécurité.");
}

// Désactiver les DevTools sur cet élément (rend plus difficile l'extraction)
function disableDevTools(e: KeyboardEvent) {
  // F12
  if (e.keyCode === 123) {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+Shift+I (Chrome DevTools)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+Shift+J (Chrome Console)
  if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
    e.preventDefault();
    return false;
  }
  
  // Ctrl+U (View Source)
  if (e.ctrlKey && e.keyCode === 85) {
    e.preventDefault();
    return false;
  }
}

onMounted(() => {
  document.addEventListener("keyup", preventScreenshot);
  document.addEventListener("keydown", preventScreenshot);
  document.addEventListener("keydown", disableDevTools);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("copy", preventCopy);
  document.addEventListener("cut", preventCopy);
  
  // Désactiver le menu contextuel sur toute la page quand le composant est monté
  window.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.signature-protected-wrapper')) {
      e.preventDefault();
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("keyup", preventScreenshot);
  document.removeEventListener("keydown", preventScreenshot);
  document.removeEventListener("keydown", disableDevTools);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  document.removeEventListener("copy", preventCopy);
  document.removeEventListener("cut", preventCopy);
});
</script>

<template>
  <div class="signature-protected-wrapper" :style="{ maxHeight: maxHeight || 'auto' }">
    <!-- Overlay de protection avec pattern répété -->
    <div class="signature-protected-overlay">
      <div class="watermark-grid">
        <div 
          v-for="i in 20" 
          :key="i" 
          class="watermark-item"
          :style="{ animationDelay: `${i * 0.1}s` }"
        >
          PROTÉGÉ
        </div>
      </div>
    </div>
    
    <!-- Image de la signature -->
    <img 
      :src="src" 
      :alt="alt || 'Signature'"
      class="signature-protected-image"
      draggable="false"
      @contextmenu.prevent
      @dragstart.prevent
      @selectstart.prevent
    />
    
    <!-- Pattern de protection diagonal répété -->
    <div class="diagonal-pattern"></div>
    
    <!-- Badge de sécurité -->
    <div class="security-badge">🔒</div>
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
  isolation: isolate; /* Crée un nouveau contexte de composition */
}

/* Overlay de protection avec watermarks répétés */
.signature-protected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: all;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.01); /* Très légèrement opaque */
}

/* Grille de watermarks */
.watermark-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 0;
  position: relative;
}

/* Chaque élément de watermark */
.watermark-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 900;
  color: rgba(220, 38, 38, 0.12); /* Rouge semi-transparent */
  text-transform: uppercase;
  letter-spacing: 0.3rem;
  transform: rotate(-25deg);
  white-space: nowrap;
  pointer-events: none;
  animation: pulse-watermark 3s ease-in-out infinite;
  text-shadow: 
    1px 1px 2px rgba(0, 0, 0, 0.05),
    -1px -1px 2px rgba(255, 255, 255, 0.1);
}

/* Animation de pulsation des watermarks */
@keyframes pulse-watermark {
  0%, 100% {
    opacity: 0.8;
    transform: rotate(-25deg) scale(1);
  }
  50% {
    opacity: 1;
    transform: rotate(-25deg) scale(1.05);
  }
}

/* Pattern diagonal répété */
.diagonal-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9;
  pointer-events: none;
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(220, 38, 38, 0.03) 20px,
      rgba(220, 38, 38, 0.03) 22px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 20px,
      rgba(220, 38, 38, 0.03) 20px,
      rgba(220, 38, 38, 0.03) 22px
    );
  animation: shift-pattern 20s linear infinite;
}

@keyframes shift-pattern {
  0% {
    background-position: 0 0, 0 0;
  }
  100% {
    background-position: 100px 100px, -100px -100px;
  }
}

/* Image de la signature */
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
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Badge de sécurité */
.security-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  z-index: 11;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
  }
}

/* Empêche la sélection */
.signature-protected-wrapper::selection,
.signature-protected-wrapper *::selection {
  background: transparent !important;
  color: inherit !important;
}

.signature-protected-wrapper::-moz-selection,
.signature-protected-wrapper *::-moz-selection {
  background: transparent !important;
  color: inherit !important;
}

/* Protection maximale contre toute interaction */
.signature-protected-wrapper {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Message de protection au survol */
.signature-protected-wrapper:hover::after {
  content: '🔒 Signature protégée contre les captures';
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(220, 38, 38, 0.95);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 12;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Protection contre l'inspection d'élément (rend plus difficile) */
.signature-protected-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 8;
  background: transparent;
  pointer-events: none;
}

/* Effet de blur très léger sur l'overlay pour rendre la capture floue */
.signature-protected-overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(0.3px);
  -webkit-backdrop-filter: blur(0.3px);
}
</style>
