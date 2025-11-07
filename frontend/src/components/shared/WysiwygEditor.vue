<template>
  <div class="wysiwyg-editor border-2 border-base-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-base-100 w-full">
    <!-- Toolbar -->
    <div
      v-if="editor"
      class="flex flex-wrap gap-1.5 px-3 py-2.5 border-b-2 border-base-300 dark:border-gray-600 bg-gradient-to-r from-base-200 to-base-100 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-750"
    >
      <!-- Formatage de base -->
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" class="toolbar-btn" title="Gras (Ctrl+B)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"/></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" class="toolbar-btn" title="Italique (Ctrl+I)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 4h6M8 20h6m1-16L9 20"/></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" class="toolbar-btn" title="Barré">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M9 5c0 1.5 1.343 3 3 3s3-1.5 3-3M9 19c0-1.5 1.343-3 3-3s3 1.5 3 3"/></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleUnderline().run()" :class="{ 'is-active': editor.isActive('underline') }" class="toolbar-btn" title="Souligné (Ctrl+U)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 0012 0V3M4 21h16"/></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }" class="toolbar-btn" title="Code inline">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Titres -->
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }" class="toolbar-btn" title="Titre 1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><text x="3" y="18" font-size="16" font-weight="bold" stroke="none" fill="currentColor">H1</text></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" class="toolbar-btn" title="Titre 2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><text x="2" y="18" font-size="14" font-weight="bold" stroke="none" fill="currentColor">H2</text></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }" class="toolbar-btn" title="Titre 3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><text x="2" y="18" font-size="13" font-weight="bold" stroke="none" fill="currentColor">H3</text></svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Alignement -->
      <button type="button" @click="editor.chain().focus().setTextAlign('left').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }" class="toolbar-btn" title="Aligner à gauche">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
      </button>
      <button type="button" @click="editor.chain().focus().setTextAlign('center').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }" class="toolbar-btn" title="Centrer">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16" /></svg>
      </button>
      <button type="button" @click="editor.chain().focus().setTextAlign('right').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }" class="toolbar-btn" title="Aligner à droite">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" /></svg>
      </button>
      <button type="button" @click="editor.chain().focus().setTextAlign('justify').run()" :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }" class="toolbar-btn" title="Justifier">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Listes et citation -->
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ 'is-active': editor.isActive('bulletList') }" class="toolbar-btn" title="Liste à puces">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12"/></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ 'is-active': editor.isActive('orderedList') }" class="toolbar-btn" title="Liste numérotée">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h1v4H3V4zm0 6h1v1H3v-1zm0 3h1v1H3v-1zm4-7h13M7 12h13M7 18h13"/></svg>
      </button>
      <button type="button" @click="editor.chain().focus().toggleBlockquote().run()" :class="{ 'is-active': editor.isActive('blockquote') }" class="toolbar-btn" title="Citation">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Tableau -->
      <button type="button" @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" class="toolbar-btn" title="Insérer un tableau 3x3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h18v18H3V3zm0 6h18M3 15h18M9 3v18m6-18v18"/></svg>
      </button>

      <!-- Ligne horizontale -->
      <button type="button" @click="editor.chain().focus().setHorizontalRule().run()" class="toolbar-btn" title="Ligne horizontale">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/></svg>
      </button>

      <!-- Entité -->
      <template v-if="enableEntityInsertion">
        <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
        <button type="button" @click="openEntityModal" class="toolbar-btn" title="Insérer une entité">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </button>
      </template>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Annuler/Refaire -->
      <button type="button" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" class="toolbar-btn" title="Annuler (Ctrl+Z)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
      </button>
      <button type="button" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" class="toolbar-btn" title="Refaire (Ctrl+Shift+Z)">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
      </button>
    </div>

    <!-- Menu contextuel -->
    <div
      v-if="contextMenu.show"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      class="context-menu fixed z-50 bg-base-100 border-2 border-base-300 rounded-lg shadow-2xl py-1 min-w-[220px]"
      @click="contextMenu.show = false"
    >
      <!-- Options de tableau -->
      <template v-if="editor?.isActive('table')">
        <div class="px-3 py-1.5 text-xs font-semibold text-base-content/60 uppercase border-b border-base-200">
          Tableau
        </div>
        <button @click="editor.chain().focus().addColumnBefore().run()" class="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m-8-8h16" /></svg>
          Insérer une colonne avant
        </button>
        <button @click="editor.chain().focus().addColumnAfter().run()" class="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m-8-8h16" /></svg>
          Insérer une colonne après
        </button>
        <button @click="editor.chain().focus().deleteColumn().run()" class="context-menu-item text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          Supprimer la colonne
        </button>
        
        <div class="border-t border-base-200 my-1"></div>
        
        <button @click="editor.chain().focus().addRowBefore().run()" class="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m-8-8h16" /></svg>
          Insérer une ligne avant
        </button>
        <button @click="editor.chain().focus().addRowAfter().run()" class="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m-8-8h16" /></svg>
          Insérer une ligne après
        </button>
        <button @click="editor.chain().focus().deleteRow().run()" class="context-menu-item text-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          Supprimer la ligne
        </button>
        
        <div class="border-t border-base-200 my-1"></div>
        
        <button @click="editor.chain().focus().deleteTable().run()" class="context-menu-item text-error font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Supprimer le tableau
        </button>
      </template>

      <!-- Options de texte générales -->
      <template v-else>
        <button @click="editor?.chain().focus().toggleBold().run()" class="context-menu-item" :class="{ 'is-active': editor?.isActive('bold') }">
          <strong>B</strong>
          Gras
        </button>
        <button @click="editor?.chain().focus().toggleItalic().run()" class="context-menu-item" :class="{ 'is-active': editor?.isActive('italic') }">
          <em>I</em>
          Italique
        </button>
        <button @click="editor?.chain().focus().toggleUnderline().run()" class="context-menu-item" :class="{ 'is-active': editor?.isActive('underline') }">
          <u>U</u>
          Souligné
        </button>
        
        <div class="border-t border-base-200 my-1"></div>
        
        <button @click="editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()" class="context-menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Insérer un tableau
        </button>
      </template>
    </div>

    <!-- Modal de sélection d'entité -->
    <EntityInsertModal
      :is-open="isEntityModalOpen"
      :report-id="reportId"
      :findings="findings"
      @close="closeEntityModal"
      @select="handleEntitySelect"
    />

    <!-- Editor content -->
    <editor-content
      :editor="editor"
      class="prose dark:prose-invert max-w-none p-5 min-h-[180px] focus:outline-none bg-base-100 dark:bg-gray-700 dark:text-white transition-colors duration-150"
      @contextmenu.prevent="handleContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import EntityInsertModal from "./EntityInsertModal.vue";
import type { Entity } from "../../services/api/entities";
import type { Finding } from "../../services/api/reports";

interface Props {
  modelValue: string;
  placeholder?: string;
  enableEntityInsertion?: boolean;
  reportId?: string;
  findings?: Finding[];
}

interface Emits {
  (e: "update:modelValue", value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Commencez à écrire...",
  enableEntityInsertion: false,
});

const emit = defineEmits<Emits>();

// État du modal d'insertion d'entité
const isEntityModalOpen = ref(false);

// État du menu contextuel
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
});

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse border border-base-300',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  content: props.modelValue,
  editorProps: {
    attributes: {
      class: "prose-editor",
    },
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    emit("update:modelValue", html);
  },
});

// Mettre à jour l'éditeur quand modelValue change de l'extérieur
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value) {
      const currentHtml = editor.value.getHTML();
      if (newValue !== currentHtml) {
        editor.value.commands.setContent(newValue);
      }
    }
  }
);

// Fonctions pour gérer le modal d'insertion d'entité
function openEntityModal() {
  isEntityModalOpen.value = true;
}

function closeEntityModal() {
  isEntityModalOpen.value = false;
}

function handleEntitySelect(entity: Entity | Finding, htmlContent?: string) {
  if (!editor.value) return;
  
  if (htmlContent) {
    const { $from } = editor.value.state.selection;
    const currentNode = $from.parent;
    
    if (currentNode.type.name === 'paragraph' && currentNode.childCount === 0) {
      editor.value
        .chain()
        .focus()
        .deleteNode('paragraph')
        .insertContent(htmlContent)
        .run();
    } else {
      editor.value
        .chain()
        .focus()
        .insertContent(htmlContent)
        .run();
    }
  } else {
    const label = 'label' in entity ? entity.label : '';
    editor.value
      .chain()
      .focus()
      .insertContent(label)
      .run();
  }
  
  closeEntityModal();
}

// Gestion du menu contextuel
function handleContextMenu(event: MouseEvent) {
  event.preventDefault();
  
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
  };
}

// Fermer le menu contextuel quand on clique ailleurs
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.context-menu')) {
    contextMenu.value.show = false;
  }
}

// Ajouter l'écouteur d'événements au montage
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside);
}

onBeforeUnmount(() => {
  editor.value?.destroy();
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.toolbar-btn {
  padding: 0.375rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55 65 81);
  background: linear-gradient(135deg, white 0%, rgb(249 250 251) 100%);
  border: 1.5px solid rgb(209 213 219);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-btn:hover {
  background: linear-gradient(135deg, rgb(249 250 251) 0%, rgb(243 244 246) 100%);
  border-color: rgb(156 163 175);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.toolbar-btn.is-active {
  background: linear-gradient(135deg, rgb(219 234 254) 0%, rgb(191 219 254) 100%);
  color: rgb(29 78 216);
  border-color: rgb(96 165 250);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  font-weight: 600;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn-danger {
  background: linear-gradient(135deg, rgb(254 226 226) 0%, rgb(252 165 165) 100%);
  color: rgb(153 27 27);
  border-color: rgb(252 165 165);
}

.toolbar-btn-danger:hover {
  background: linear-gradient(135deg, rgb(252 165 165) 0%, rgb(239 68 68) 100%);
  color: white;
  border-color: rgb(220 38 38);
}

:deep(.dark) .toolbar-btn {
  color: rgb(229 231 235);
  background: linear-gradient(135deg, rgb(55 65 81) 0%, rgb(75 85 99) 100%);
  border-color: rgb(75 85 99);
}

:deep(.dark) .toolbar-btn:hover {
  background: linear-gradient(135deg, rgb(75 85 99) 0%, rgb(107 114 128) 100%);
  border-color: rgb(107 114 128);
}

:deep(.dark) .toolbar-btn.is-active {
  background: linear-gradient(135deg, rgb(30 58 138) 0%, rgb(29 78 216) 100%);
  color: rgb(147 197 253);
  border-color: rgb(59 130 246);
}

:deep(.ProseMirror) {
  min-height: 180px;
  line-height: 1.7;
  color: rgb(31 41 55);
}

:deep(.dark .ProseMirror) {
  color: rgb(229 231 235);
}

:deep(.ProseMirror:focus) {
  outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: rgb(156 163 175);
  pointer-events: none;
  height: 0;
  font-style: italic;
}

:deep(.dark .ProseMirror p.is-editor-empty:first-child::before) {
  color: rgb(107 114 128);
}

:deep(.ProseMirror h1) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror h2) {
  font-size: 1.25rem;
  font-weight: bold;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror h3) {
  font-size: 1.125rem;
  font-weight: bold;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}

:deep(.ProseMirror u) {
  text-decoration: underline;
}

:deep(.ProseMirror code) {
  background-color: rgb(243 244 246);
  color: rgb(220 38 38);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875em;
}

:deep(.dark .ProseMirror code) {
  background-color: rgb(55 65 81);
  color: rgb(252 165 165);
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
  list-style-position: inside;
  margin: 0.5rem 0;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
  list-style-position: inside;
  margin: 0.5rem 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid rgb(209 213 219);
  padding-left: 1rem;
  font-style: italic;
  margin: 0.5rem 0;
}

:deep(.dark) :deep(.ProseMirror blockquote) {
  border-left-color: rgb(75 85 99);
}

:deep(.ProseMirror hr) {
  margin: 1rem 0;
  border-color: rgb(209 213 219);
}

:deep(.dark) :deep(.ProseMirror hr) {
  border-color: rgb(75 85 99);
}

:deep(.ProseMirror table) {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 1rem 0;
  overflow: hidden;
  border: 1px solid rgb(209 213 219);
}

:deep(.dark) :deep(.ProseMirror table) {
  border-color: rgb(75 85 99);
}

:deep(.ProseMirror td),
:deep(.ProseMirror th) {
  min-width: 1em;
  border: 1px solid rgb(209 213 219);
  padding: 8px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

:deep(.dark) :deep(.ProseMirror td),
:deep(.dark) :deep(.ProseMirror th) {
  border-color: rgb(75 85 99);
}

:deep(.ProseMirror th) {
  font-weight: 600;
  text-align: left;
  background-color: rgb(249 250 251);
}

:deep(.dark) :deep(.ProseMirror th) {
  background-color: rgb(55 65 81);
}

:deep(.ProseMirror .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(200, 200, 255, 0.4);
  pointer-events: none;
}

:deep(.ProseMirror .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: rgb(59 130 246);
  pointer-events: none;
}

:deep(.ProseMirror.resize-cursor) {
  cursor: ew-resize;
  cursor: col-resize;
}

/* Menu contextuel */
.context-menu {
  min-width: 220px;
  max-width: 280px;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: rgb(31 41 55);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.context-menu-item:hover {
  background: rgb(243 244 246);
}

.context-menu-item.is-active {
  background: rgb(219 234 254);
  color: rgb(29 78 216);
  font-weight: 500;
}

.context-menu-item.text-error {
  color: rgb(220 38 38);
}

.context-menu-item.text-error:hover {
  background: rgb(254 226 226);
}

:deep(.dark) .context-menu-item {
  color: rgb(229 231 235);
}

:deep(.dark) .context-menu-item:hover {
  background: rgb(55 65 81);
}

:deep(.dark) .context-menu-item.is-active {
  background: rgb(30 58 138);
  color: rgb(147 197 253);
}

:deep(.dark) .context-menu-item.text-error {
  color: rgb(252 165 165);
}

:deep(.dark) .context-menu-item.text-error:hover {
  background: rgb(127 29 29);
}
</style>
