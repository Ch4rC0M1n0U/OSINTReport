<template>
  <div class="wysiwyg-editor border-2 border-base-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 bg-base-100 w-full">
    <!-- Toolbar -->
    <div
      v-if="editor"
      class="flex flex-wrap gap-1.5 px-3 py-2.5 border-b-2 border-base-300 dark:border-gray-600 bg-gradient-to-r from-base-200 to-base-100 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-750"
    >
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="toolbar-btn"
        title="Gras (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="toolbar-btn"
        title="Italique (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        class="toolbar-btn"
        title="Barré"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleUnderline().run()"
        :class="{ 'is-active': editor.isActive('underline') }"
        class="toolbar-btn"
        title="Souligné (Ctrl+U)"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleCode().run()"
        :class="{ 'is-active': editor.isActive('code') }"
        class="toolbar-btn"
        title="Code inline"
      >
        &lt;/&gt;
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Alignement -->
      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('left').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
        class="toolbar-btn"
        title="Aligner à gauche"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('center').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
        class="toolbar-btn"
        title="Centrer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('right').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
        class="toolbar-btn"
        title="Aligner à droite"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('justify').run()"
        :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
        class="toolbar-btn"
        title="Justifier"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        class="toolbar-btn"
        title="Titre 1"
      >
        H1
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        class="toolbar-btn"
        title="Titre 2"
      >
        H2
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        class="toolbar-btn"
        title="Titre 3"
      >
        H3
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        class="toolbar-btn"
        title="Liste à puces"
      >
        ⦿
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        class="toolbar-btn"
        title="Liste numérotée"
      >
        1.
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        class="toolbar-btn"
        title="Citation"
      >
        "
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <!-- Tableaux -->
      <button
        type="button"
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        class="toolbar-btn"
        title="Insérer un tableau 3x3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().addColumnBefore().run()"
        class="toolbar-btn"
        title="Ajouter une colonne avant"
      >
        ⬅️➕
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().addColumnAfter().run()"
        class="toolbar-btn"
        title="Ajouter une colonne après"
      >
        ➕➡️
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().deleteColumn().run()"
        class="toolbar-btn"
        title="Supprimer la colonne"
      >
        ❌📊
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().addRowBefore().run()"
        class="toolbar-btn"
        title="Ajouter une ligne avant"
      >
        ⬆️➕
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().addRowAfter().run()"
        class="toolbar-btn"
        title="Ajouter une ligne après"
      >
        ⬇️➕
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().deleteRow().run()"
        class="toolbar-btn"
        title="Supprimer la ligne"
      >
        ❌📋
      </button>
      <button
        v-if="editor.isActive('table')"
        type="button"
        @click="editor.chain().focus().deleteTable().run()"
        class="toolbar-btn btn-error"
        title="Supprimer le tableau"
      >
        🗑️
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button
        type="button"
        @click="editor.chain().focus().setHorizontalRule().run()"
        class="toolbar-btn"
        title="Ligne horizontale"
      >
        ―
      </button>

      <div v-if="enableEntityInsertion" class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button
        v-if="enableEntityInsertion"
        type="button"
        @click="openEntityModal"
        class="toolbar-btn"
        title="Insérer une entité"
      >
        👤
      </button>

      <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>

      <button
        type="button"
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        class="toolbar-btn"
        title="Annuler (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        type="button"
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        class="toolbar-btn"
        title="Refaire (Ctrl+Shift+Z)"
      >
        ↷
      </button>
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
  findings?: Finding[]; // Données de plateformes disponibles
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
    // Convertir en HTML pour le stockage (TipTap gère mieux le HTML que le Markdown)
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

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Fonctions pour gérer le modal d'insertion d'entité
function openEntityModal() {
  isEntityModalOpen.value = true;
}

function closeEntityModal() {
  isEntityModalOpen.value = false;
}

function handleEntitySelect(entity: Entity | Finding, htmlContent?: string) {
  if (!editor.value) return;
  
  console.log('📝 WysiwygEditor.handleEntitySelect appelé');
  console.log('👤 Entity:', entity);
  console.log('📄 htmlContent:', htmlContent);
  console.log('📏 htmlContent length:', htmlContent?.length || 0);
  
  if (htmlContent) {
    // Insérer du contenu HTML structuré (tableau)
    console.log('✅ Insertion de HTML dans l\'éditeur...');
    
    // Supprimer le paragraphe vide si on est dedans
    const { $from } = editor.value.state.selection;
    const currentNode = $from.parent;
    
    if (currentNode.type.name === 'paragraph' && currentNode.childCount === 0) {
      // On est dans un paragraphe vide, le remplacer par le tableau
      editor.value
        .chain()
        .focus()
        .deleteNode('paragraph')
        .insertContent(htmlContent)
        .run();
    } else {
      // Insertion normale
      editor.value
        .chain()
        .focus()
        .insertContent(htmlContent)
        .run();
    }
    
    console.log('✅ HTML inséré avec succès');
  } else {
    // Insérer le label de l'entité à la position du curseur
    const label = 'label' in entity ? entity.label : '';
    console.log('✅ Insertion du label:', label);
    editor.value
      .chain()
      .focus()
      .insertContent(label)
      .run();
  }
  
  closeEntityModal();
}
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

:deep(.dark) .toolbar-btn {
  color: rgb(209 213 219);
  background: linear-gradient(135deg, rgb(55 65 81) 0%, rgb(45 55 71) 100%);
  border-color: rgb(75 85 99);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

:deep(.dark) .toolbar-btn:hover {
  background: linear-gradient(135deg, rgb(75 85 99) 0%, rgb(65 75 89) 100%);
  border-color: rgb(107 114 128);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toolbar-btn.is-active {
  background: linear-gradient(135deg, rgb(219 234 254) 0%, rgb(191 219 254) 100%);
  color: rgb(29 78 216);
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 2px 4px rgba(29, 78, 216, 0.2);
}

:deep(.dark) .toolbar-btn.is-active {
  background: linear-gradient(135deg, rgb(30 58 138) 0%, rgb(30 64 175) 100%);
  color: rgb(147 197 253);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), 0 2px 4px rgba(30, 58, 138, 0.3);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Styles pour le contenu de l'éditeur */
:deep(.ProseMirror) {
  outline: none;
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

/* Styles pour les tableaux */
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
</style>
