<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import { 
  Cancel01Icon, 
  Delete02Icon 
} from "@hugeicons/core-free-icons";

const props = defineProps<{
  width?: number;
  height?: number;
}>();

const emit = defineEmits<{
  save: [dataUrl: string];
  cancel: [];
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const hasDrawn = ref(false);

let ctx: CanvasRenderingContext2D | null = null;

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }
});

function getCanvasCoordinates(e: MouseEvent | TouchEvent) {
  if (!canvas.value) return { x: 0, y: 0 };
  
  const rect = canvas.value.getBoundingClientRect();
  const scaleX = canvas.value.width / rect.width;
  const scaleY = canvas.value.height / rect.height;
  
  let clientX = 0;
  let clientY = 0;
  
  if (e instanceof MouseEvent) {
    clientX = e.clientX;
    clientY = e.clientY;
  } else if (e instanceof TouchEvent && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function startDrawing(e: MouseEvent | TouchEvent) {
  if (!canvas.value || !ctx) return;
  
  isDrawing.value = true;
  const coords = getCanvasCoordinates(e);
  lastX.value = coords.x;
  lastY.value = coords.y;
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !canvas.value || !ctx) return;
  
  e.preventDefault();
  
  const coords = getCanvasCoordinates(e);
  
  ctx.beginPath();
  ctx.moveTo(lastX.value, lastY.value);
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
  
  lastX.value = coords.x;
  lastY.value = coords.y;
  
  hasDrawn.value = true;
}

function stopDrawing() {
  isDrawing.value = false;
}

function clearCanvas() {
  if (!canvas.value || !ctx) return;
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  hasDrawn.value = false;
}

function saveSignature() {
  if (!canvas.value || !hasDrawn.value) {
    return;
  }
  
  // Convert canvas to data URL (PNG with transparent background)
  const dataUrl = canvas.value.toDataURL("image/png");
  emit("save", dataUrl);
}

function cancelSignature() {
  clearCanvas();
  emit("cancel");
}

onUnmounted(() => {
  ctx = null;
});
</script>

<template>
  <div class="signature-pad-container">
    <div class="border-2 border-dashed border-base-300 rounded-lg p-4 bg-base-100">
      <canvas
        ref="canvas"
        :width="width || 600"
        :height="height || 200"
        class="border border-base-300 rounded bg-white cursor-crosshair w-full touch-none"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
      ></canvas>
      
      <div class="flex justify-between items-center mt-4 gap-2">
        <button 
          type="button"
          @click="clearCanvas"
          class="btn btn-outline btn-sm"
          :disabled="!hasDrawn"
        >
          <HugeiconsIcon :icon="Delete02Icon" class="w-4 h-4" />
          Effacer
        </button>
        
        <div class="flex gap-2">
          <button 
            type="button"
            @click="cancelSignature"
            class="btn btn-ghost btn-sm"
          >
            <HugeiconsIcon :icon="Cancel01Icon" class="w-4 h-4" />
            Annuler
          </button>
          <button 
            type="button"
            @click="saveSignature"
            class="btn btn-primary btn-sm"
            :disabled="!hasDrawn"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signature-pad-container {
  width: 100%;
}
</style>
