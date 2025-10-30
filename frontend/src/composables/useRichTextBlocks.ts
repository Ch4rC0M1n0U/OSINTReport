import { ref, watch } from 'vue';

export interface RichTextBlock {
  id: string;
  title: string;
  content: string;
}

export function useRichTextBlocks(
  initialBlocks: RichTextBlock[] = [],
  onUpdate?: () => void
) {
  const richTextBlocks = ref<RichTextBlock[]>(initialBlocks);

  /**
   * Ajoute un nouveau bloc de texte vide
   */
  function addRichTextBlock() {
    richTextBlocks.value.push({
      id: crypto.randomUUID(),
      title: '',
      content: '',
    });
    onUpdate?.();
  }

  /**
   * Supprime un bloc de texte par index
   */
  function deleteBlock(index: number) {
    richTextBlocks.value.splice(index, 1);
    onUpdate?.();
  }

  /**
   * Déplace un bloc vers le haut
   */
  function moveBlockUp(index: number) {
    if (index > 0) {
      const temp = richTextBlocks.value[index];
      richTextBlocks.value[index] = richTextBlocks.value[index - 1];
      richTextBlocks.value[index - 1] = temp;
      onUpdate?.();
    }
  }

  /**
   * Déplace un bloc vers le bas
   */
  function moveBlockDown(index: number) {
    if (index < richTextBlocks.value.length - 1) {
      const temp = richTextBlocks.value[index];
      richTextBlocks.value[index] = richTextBlocks.value[index + 1];
      richTextBlocks.value[index + 1] = temp;
      onUpdate?.();
    }
  }

  /**
   * Réinitialise les blocs avec une nouvelle liste
   */
  function setBlocks(blocks: RichTextBlock[]) {
    richTextBlocks.value = blocks;
  }

  return {
    richTextBlocks,
    addRichTextBlock,
    deleteBlock,
    moveBlockUp,
    moveBlockDown,
    setBlocks,
  };
}
