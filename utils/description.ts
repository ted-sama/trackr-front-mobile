import { Book } from '@/types/book';

/**
 * Sélectionne la description appropriée selon la langue
 * @param book - Le livre contenant les descriptions
 * @param isFrench - True si la langue système est française
 * @returns La description dans la langue appropriée, avec fallback sur l'anglais
 */
export function getLocalizedDescription(book: Book, isFrench: boolean): string | undefined {
  if (isFrench && book.descriptionFr) {
    return book.descriptionFr;
  }
  return book.description;
}