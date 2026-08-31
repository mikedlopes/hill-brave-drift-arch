/** Hobby-file legal pack. Not legal advice. Placeholders filled; no invented email. */

export const TOOL_NAME = "Pi Zero Case Builder";
export const LEGAL_UPDATED = "28 August 2026";
export const TOOL_VERSION = "v2";
export const LICENSE_LINE =
  "Personal hobby use · No selling files or prints · No warranty · Unofficial design";
export const CONTACT =
  "Takedown and contact: use the Grok Build listing for this tool. No email is published.";
/** Browsewrap line under Print pair. README in the zip is the file-level notice. */
export const BY_DOWNLOADING =
  "By downloading you agree to the Terms of Use and Safety Disclaimer. Hobby files, not certified products.";

export function modelReadme(opts: { model: string; generated?: string }) {
  const when = opts.generated ?? new Date().toISOString().slice(0, 10);
  return `${TOOL_NAME} — hobby 3D model
License: personal, non-commercial use only. Remix for yourself is OK.
Do not sell this file or sell prints of it.

NO WARRANTY. This geometry is untested and may be AI-assisted.
Verify every dimension on the real object before you rely on fit.
Inspect the print. Discard it if it cracks.

NOT for children, food, medical, mains electricity, vehicles,
climbing, or any safety-critical use.
3D-printed parts can snap along layer lines.

Raspberry Pi is a trademark of Raspberry Pi Ltd.
This is an unofficial hobby design.

By using this file you agree to the site Terms of Use and Safety Disclaimer.
Generated: ${when}   Tool version: ${TOOL_VERSION}   Model: ${opts.model}
`;
}
