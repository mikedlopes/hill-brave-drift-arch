import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalFooter } from "@/components/legal-footer";
import { LEGAL_UPDATED, TOOL_NAME } from "@/lib/legal";

export const Route = createFileRoute("/safety")({ component: SafetyPage });

function SafetyPage() {
  return (
    <main className="legal-page">
      <p>
        <Link to="/">← {TOOL_NAME}</Link>
      </p>
      <h1>Safety disclaimer</h1>
      <p className="mono">Last updated: {LEGAL_UPDATED}</p>
      <p>
        Files from {TOOL_NAME} are digital hobby models, not finished consumer products. A warning on this page
        does not make a risky design safe.
      </p>

      <h2>Generated models can be wrong</h2>
      <p>
        Parametric and AI-assisted models may have holes that do not match real hardware, walls that are too
        thin, missing clearances, or sharp edges. Treat every download as a first draft. Measure twice.
      </p>

      <h2>How printed plastic fails</h2>
      <p>
        FDM parts are weaker along layer lines. They can snap instead of bend. Strength changes with material,
        temperature, infill, wall count, and print orientation. A part that worked once can crack later.
      </p>

      <h2>Do not use these prints for</h2>
      <ul>
        <li>products intended for children 12 and under</li>
        <li>food contact or drinkware</li>
        <li>medical, implant, or protective equipment</li>
        <li>mains-voltage electrical enclosures</li>
        <li>vehicle, aircraft, or drone safety parts</li>
        <li>climbing, lifting, or life-safety gear</li>
        <li>pressure, gas, or load-bearing structural parts</li>
        <li>functional weapons or weapon parts</li>
      </ul>

      <h2>Inspect and retire</h2>
      <p>
        Check for cracks, separated layers, and loose clips before each use. Discard damaged parts. Keep
        fragments away from children and pets.
      </p>

      <h2>Raspberry Pi Zero</h2>
      <p>Unofficial cases:</p>
      <ul>
        <li>are not official Raspberry Pi accessories</li>
        <li>must be checked against your board, header, and cables</li>
        <li>should leave ports usable and should not trap heat with zero ventilation on a powered board</li>
        <li>must not pinch the CSI camera flex or strain USB / HDMI cables</li>
        <li>GPIO on this cut is a cover. No HATs. Unpopulated header only</li>
      </ul>
      <p>
        Raspberry Pi is a trademark of Raspberry Pi Ltd. Follow your printer maker’s safety guidance. PETG is
        often a better case material than PLA if the board will run warm.
      </p>

      <LegalFooter />
    </main>
  );
}
