import { ZodErrorViewer } from "zod-error-viewer";
import logo from "../assets/logo.png";
import { z } from "zod";
import "./HomePage.css";

export function HomePage() {
  const data = {
    name: "Han Solo",
    age: "35",
    shotFirst: false,
    sideKicks: ["Lando", "Obi-wan"],
  };
  const error = z
    .object({
      name: z.string(),
      age: z.number(),
      shotFirst: z.literal(true),
      sideKicks: z.array(z.union([z.literal("Chewbacca"), z.literal("Lando")])),
    })
    .safeParse(data).error!;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "64px",
      }}
    >
      <img src={logo} style={{ width: "150px", maxWidth: "100%" }} />
      <h1>ZodErrorViewer</h1>
      <p>Quickly understand even the meanest zod errors 💡</p>
      <ZodErrorViewer data={data} error={error} />
      <a className="buttonLink" href="/docs">
        Documentation
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          fill="currentColor"
          viewBox="0 -960 960 960"
        >
          <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" />
        </svg>
      </a>
    </div>
  );
}
