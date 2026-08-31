import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BY_DOWNLOADING, CONTACT, modelReadme, TOOL_NAME, TOOL_VERSION } from "./legal.ts";
import { printSheet } from "./case-params.ts";

describe("hobby legal pack", () => {
  it("README names the tool, no-sale, no warranty, and Pi trademark", () => {
    const text = modelReadme({ model: "pi_zero_case_2_00x_snap_hdmi-fat_usb-fat_lug", generated: "2026-08-28" });
    assert.match(text, new RegExp(TOOL_NAME));
    assert.match(text, /personal, non-commercial/i);
    assert.match(text, /Do not sell/);
    assert.match(text, /NO WARRANTY/);
    assert.match(text, /Raspberry Pi is a trademark/);
    assert.match(text, /unofficial hobby design/i);
    assert.ok(text.includes(TOOL_VERSION));
    assert.equal(text.includes("@"), false);
  });

  it("PRINT.txt carries the same limits", () => {
    const sheet = printSheet({
      scale: 2,
      fastener: "snap",
      fit: "standard",
      hdmi: "fat",
      usb: "fat",
      keyring: "on",
    });
    assert.match(sheet, /Do not sell/);
    assert.match(sheet, /NO WARRANTY/);
    assert.match(sheet, /children, food, medical/);
    assert.match(sheet, /Raspberry Pi is a trademark/);
    assert.match(sheet, /First article/);
    assert.match(sheet, /Nobody has printed/);
  });

  it("does not invent a contact email", () => {
    assert.match(CONTACT, /Grok Build listing/);
    assert.equal(CONTACT.includes("@"), false);
  });

  it("download line names terms, safety, and hobby files", () => {
    assert.match(BY_DOWNLOADING, /By downloading you agree/);
    assert.match(BY_DOWNLOADING, /Terms of Use/);
    assert.match(BY_DOWNLOADING, /Safety Disclaimer/);
    assert.match(BY_DOWNLOADING, /Hobby files/);
  });
});
