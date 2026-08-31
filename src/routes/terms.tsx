import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalFooter } from "@/components/legal-footer";
import { CONTACT, LEGAL_UPDATED, TOOL_NAME } from "@/lib/legal";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <main className="legal-page">
      <p>
        <Link to="/">← {TOOL_NAME}</Link>
      </p>
      <h1>Terms of Use</h1>
      <p className="mono">Last updated: {LEGAL_UPDATED}</p>
      <p>This page is not legal advice.</p>

      <h2>1. Agreement</h2>
      <p>
        By using {TOOL_NAME} or downloading a file, you agree to these Terms and the Safety Disclaimer. If you
        do not agree, do not use the tool.
      </p>

      <h2>2. What this tool is</h2>
      <p>
        {TOOL_NAME} is a free hobby service. It uses parametric scripts (and may use AI-assisted geometry) to
        make STL files you can print yourself.
      </p>
      <p>The tool does not sell physical parts, inspect your print, or certify models for any standard.</p>
      <p>
        Generated geometry can be wrong. A Raspberry Pi Zero board is 65 mm × 30 mm (RP-008365). Measure yours
        before you rely on fit.
      </p>

      <h2>3. Age</h2>
      <p>
        You must be at least 13, or the digital-consent age where you live, whichever is higher. If you are
        under 18, a parent or guardian must agree to these Terms.
      </p>

      <h2>4. License to you</h2>
      <p>
        We grant you a free, revocable, non-exclusive license to download models and print them for personal,
        non-commercial hobby use. You may remix a file for yourself.
      </p>
      <p>You may not sell, license, or commercially exploit the digital files, sell 3D prints, or remove this notice.</p>
      <p>
        Raspberry Pi, Raspberry Pi Zero, and related names are trademarks of Raspberry Pi Ltd. A case file is an
        unofficial hobby design. It is not an official Raspberry Pi product.
      </p>

      <h2>5. Your prompts</h2>
      <p>
        You keep rights in text you type that you already own. Do not request designs you do not have the right
        to use.
      </p>

      <h2>6. Acceptable use</h2>
      <p>Lawful personal hobby projects only. Do not request functional weapons, or claim files are certified or official.</p>

      <h2>7. Intellectual property</h2>
      <p>
        If you believe a file infringes your rights, report it via the Grok Build listing for this tool with
        enough detail to find the file. Repeat abuse can lead to a ban.
      </p>
      <p>{CONTACT}</p>

      <h2>8. No warranty</h2>
      <p>
        THE TOOL AND ALL FILES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM ALL WARRANTIES, INCLUDING
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that models
        will print, fit, be safe, or be error-free.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT LAW ALLOWS, {TOOL_NAME} AND ITS OPERATORS ARE NOT LIABLE FOR FAILED PRINTS,
        DAMAGED PRINTERS, PROPERTY DAMAGE, OR INJURY FROM A PRINTED OBJECT. Because the tool is free, total
        liability for any claim will not exceed USD $0 except where that cap cannot be applied.
      </p>

      <h2>10. Your responsibility</h2>
      <p>
        You check dimensions, choose print settings, inspect parts, and decide whether a printed object is
        appropriate.
      </p>

      <h2>11. Changes</h2>
      <p>We may change these Terms or stop offering the tool. Continued use after a change means you accept the new Terms.</p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by applicable law. If a venue is required, courts where the operator resides
        have jurisdiction, except where consumer law gives you a mandatory local forum. No specific state is
        named because this listing does not publish one.
      </p>

      <LegalFooter />
    </main>
  );
}
