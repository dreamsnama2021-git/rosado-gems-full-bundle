import logoAsset from "@/assets/logo.asset.json";
import { Link } from "@tanstack/react-router";

export function Logo({ className = "h-16" }: { className?: string }) {
  return (
    <Link to="/" className="inline-flex items-center">
      <img src={logoAsset.url} alt="Rosado Gems" className={className + " w-auto"} />
    </Link>
  );
}
