const LOGO_MASK = `url(${import.meta.env.BASE_URL}assets/logo-mask.png)`;

interface Props {
  className?: string;
}

export default function AppLogo({ className = '' }: Props) {
  return (
    <span
      className={`app-logo-img ${className}`.trim()}
      role="img"
      aria-label="roomie"
      style={{ WebkitMaskImage: LOGO_MASK, maskImage: LOGO_MASK }}
    />
  );
}
