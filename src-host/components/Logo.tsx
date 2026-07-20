// The roomie wordmark, rendered as a CSS mask so it takes on the active theme
// color (--primary) and follows the theme picker. BASE_URL keeps the asset path
// correct in dev ('/') and on GitHub Pages ('/mvproomie/').
const MASK = `url(${import.meta.env.BASE_URL}assets/logo-mask.png)`;

export default function Logo() {
  return (
    <div className="logo">
      <span
        className="logo-img"
        role="img"
        aria-label="roomie"
        style={{ WebkitMaskImage: MASK, maskImage: MASK }}
      />
    </div>
  );
}
