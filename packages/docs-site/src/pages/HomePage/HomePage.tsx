import { ZodErrorViewer } from "zod-error-viewer";
import logo from "../../assets/logo.png";
import { z } from "zod";
import { ButtonLink } from "../../components/ButtonLink";

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
      <p style={{ fontSize: "large" }}>
        Quickly understand even the meanest zod errors 💡
      </p>
      <div style={{ width: "1200px", maxWidth: "100%" }}>
        <ZodErrorViewer data={data} error={error} />
      </div>
      <ButtonLink href="/docs" label="Documentation" />
    </div>
  );
}
