import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/print-intake-sheet.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { buildIntakeSheetHtml } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

const application = {
  reference: "OMSWD-TEST-001", resident: "Aran Dale P Ogatis Jr.",
  firstName: "Aran Dale", middleName: "P", lastName: "Ogatis", suffix: "Jr.",
  birthDate: "2000-01-01", monthlyIncome: 5000, addressLine: "Purok 1",
  barangay: "Badiangan", municipality: "Pandan", familyComposition: [],
};

test("places saved compound names and suffix in their respective intake fields", () => {
  const html = buildIntakeSheetHtml(application);
  assert.match(html, /<td colspan="4">Ogatis<\/td>\s*<td colspan="4">Aran Dale<\/td>\s*<td colspan="3">P<\/td>\s*<td colspan="1">Jr\.<\/td>/);
  assert.match(html, /₱ 5,000\.00/);
});

test("keeps full name visible without guessing missing name components", () => {
  const html = buildIntakeSheetHtml({ ...application, firstName: null, middleName: null, lastName: null, suffix: null });
  assert.match(html, /Client's Name: Aran Dale P Ogatis Jr\./);
  assert.doesNotMatch(html, /<td colspan="4">Aran Dale P Ogatis Jr\.<\/td>/);
});

test("all identifying-information rows occupy the same twelve-column grid", () => {
  const html = buildIntakeSheetHtml(application);
  const tables = [...html.matchAll(/<table class="form-table">([\s\S]*?)<\/table>/g)];
  for (const table of tables.slice(0, 2)) {
    for (const [row] of table[1].matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)) {
      const span = [...row.matchAll(/<td\b[^>]*>/g)].reduce((sum, [cell]) => sum + Number(cell.match(/colspan="(\d+)"/)?.[1] ?? 1), 0);
      assert.equal(span, 12, row);
    }
  }
});

test("treats names, addresses, references and family values as text in the printable document", () => {
  const payload = '<script>window.injected=true</script>&"';
  const html = buildIntakeSheetHtml({
    ...application, reference: payload, resident: payload, lastName: payload,
    addressLine: payload, familyComposition: [{ name: payload, educationalAttainment: payload, age: payload, relationship: payload, occupation: payload, monthlyIncome: payload }],
  });
  assert.ok(!html.includes(payload));
  assert.match(html, /&lt;script&gt;window.injected=true&lt;\/script&gt;&amp;&quot;/);
});
