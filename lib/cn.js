/** Junta classes CSS, ignorando valores vazios: cn('a', cond && 'b') -> 'a b' */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
