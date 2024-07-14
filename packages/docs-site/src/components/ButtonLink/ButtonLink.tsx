import { Link } from "../Router";
import "./ButtonLink.css";

export function ButtonLink({ label, href }: { label: string; href: string }) {
  return (
    <Link className="ButtonLink" href={href}>
      {label}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="currentColor"
        viewBox="0 -960 960 960"
      >
        <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
      </svg>
    </Link>
  );
}
