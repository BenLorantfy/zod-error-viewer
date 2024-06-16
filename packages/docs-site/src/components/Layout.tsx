import { Link } from "./Router";
import logo from "../assets/logo.png";
import "./Layout.css";

function Nav() {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/">
            <span
              style={{
                display: "inline-block",
                height: 0,
                position: "relative",
                top: "-14px",
              }}
            >
              <img
                alt=""
                src={logo}
                height="30px"
                width="71px"
                style={{ verticalAlign: "middle", marginRight: "8px" }}
              />
            </span>
            <span style={{ verticalAlign: "middle" }}>zod-error-viewer</span>
          </Link>
        </li>
        <li>
          <Link href="/docs">Docs</Link>
        </li>
        <li>
          <Link href="/playground">Playground</Link>
        </li>
      </ul>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="content">
      <Nav />
      <main>{children}</main>
    </div>
  );
}
