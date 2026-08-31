import { Link } from "@tanstack/react-router";
import { LICENSE_LINE, TOOL_NAME } from "@/lib/legal";

export function LegalFooter() {
  return (
    <footer className="legal-foot">
      <p>
        {TOOL_NAME} — free hobby 3D models. {LICENSE_LINE}.
      </p>
      <p>
        <Link to="/terms">Terms</Link>
        {" · "}
        <Link to="/safety">Safety</Link>
        {" · "}
        Not affiliated with Raspberry Pi Ltd. Takedown: Grok Build listing (no email).
      </p>
    </footer>
  );
}