import { cn } from '@/lib/cn';

/** Ícone do assistente (o mesmo do app instalado). */
export default function Logo({ size = 32, glow = false, className }) {
  const image = (
    <img
      src="/icons/icon.svg"
      alt=""
      width={size}
      height={size}
      className={cn('relative shrink-0 rounded-[28%]', className)}
    />
  );
  if (!glow) return image;

  return (
    <span className="relative inline-grid place-items-center">
      <span className="absolute inset-0 rounded-[28%] bg-brand opacity-40 blur-xl" aria-hidden="true" />
      {image}
    </span>
  );
}
