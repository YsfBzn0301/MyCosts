import { dateFormat } from './locale';

export function formatDate(date: Date): string {
  return dateFormat().format(date);
}
