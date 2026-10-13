import type { AdminApplicationRecord } from "@/types/admin";

function formatBirthDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

function computeAge(birthDate: string | null): string {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return String(age);
}

function escapeHtml(value: string | null | undefined): string {
  return (value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function cell(value: string | null | undefined, colspan = 1): string {
  return `<td colspan="${colspan}">${escapeHtml(value)}</td>`;
}

function labeledField(label: string, value: string | null | undefined, colspan = 1): string {
  const v = escapeHtml(value);
  return `<td colspan="${colspan}" style="border:1px solid #000;padding:3px 5px;font-size:10px;">
    <span style="font-size:8px;color:#555;">${label}</span><br/><strong>${v}</strong>
  </td>`;
}

function familyCompositionRows(application: AdminApplicationRecord): string {
  const rows = application.familyComposition.slice(0, 7);
  const blankRows = Math.max(7 - rows.length, 0);

  return [
    ...rows.map((member) => `
      <tr>
        <td style="height:20px;">${escapeHtml(member.name)}</td>
        ${cell(member.educationalAttainment)}
        ${cell(member.age)}
        ${cell(member.relationship)}
        ${cell(member.occupation)}
        ${cell(member.monthlyIncome)}
      </tr>`),
    ...Array.from({ length: blankRows }, () => `
      <tr>
        <td style="border:1px solid #000;padding:3px 5px;height:20px;"></td>
        <td style="border:1px solid #000;padding:3px 5px;"></td>
        <td style="border:1px solid #000;padding:3px 5px;"></td>
        <td style="border:1px solid #000;padding:3px 5px;"></td>
        <td style="border:1px solid #000;padding:3px 5px;"></td>
        <td style="border:1px solid #000;padding:3px 5px;"></td>
      </tr>`),
  ].join("");
}

export function buildIntakeSheetHtml(application: AdminApplicationRecord): string {
  const age = computeAge(application.birthDate);
  const dob = formatBirthDate(application.birthDate);
  const income = application.monthlyIncome != null
    ? `₱ ${application.monthlyIncome.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
    : "";
  const address = [application.addressLine, application.barangay, application.municipality]
    .filter(Boolean).join(", ");

  // Use saved name components; display names cannot reliably distinguish
  // compound given names, middle names, surnames, or suffixes.
  const columns = `<colgroup>${"<col/>".repeat(12)}</colgroup>`;
  const reference = escapeHtml(application.reference);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>OMSWD General Intake Sheet – ${reference}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; background: #fff; }
    @page { size: A4; margin: 15mm 12mm; }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    .page { width: 100%; max-width: 740px; margin: 0 auto; padding: 8px; }
    .header { text-align: center; margin-bottom: 8px; }
    .header table { width: 100%; border-collapse: collapse; }
    .section-title { font-weight: bold; font-size: 11px; background: #eee; padding: 3px 5px; border: 1px solid #000; margin-top: 6px; }
    table.form-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.form-table td { border: 1px solid #000; padding: 3px 5px; font-size: 10px; vertical-align: top; overflow-wrap: anywhere; }
    .name-labels td { padding: 1px 5px !important; font-size: 8px !important; text-align: center; }
    tr { break-inside: avoid; }
    .section-title { break-after: avoid; }
    .blank { min-height: 16px; display: block; }
    .signatures { margin-top: 24px; display: flex; justify-content: space-between; }
    .sig-block { width: 46%; }
    .sig-line { border-top: 1px solid #000; margin-top: 30px; text-align: center; font-size: 9px; padding-top: 3px; }
    .print-btn { display: block; margin: 10px auto; padding: 8px 24px; background: #1d4ed8; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .ref-badge { font-size: 9px; color: #555; margin-top: 2px; }
  </style>
</head>
<body>
  <div class="page">
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

    <div class="header">
      <table>
        <tr>
          <td style="width:80px;text-align:center;border:none;">
            <div style="width:60px;height:60px;border:1px solid #ccc;margin:auto;display:flex;align-items:center;justify-content:center;font-size:8px;color:#aaa;">SEAL</div>
          </td>
          <td style="text-align:center;border:none;">
            <div>Republic of the Philippines</div>
            <div>Province of Antique</div>
            <div>Municipality of Pandan</div>
            <div style="font-weight:bold;font-size:12px;margin-top:3px;">OFFICE OF THE MUNICIPAL SOCIAL WELFARE AND DEVELOPMENT</div>
            <div style="font-style:italic;font-size:11px;"><em>GENERAL INTAKE SHEET</em></div>
          </td>
          <td style="width:80px;text-align:center;border:none;">
            <div style="width:60px;height:60px;border:1px solid #ccc;margin:auto;display:flex;align-items:center;justify-content:center;font-size:8px;color:#aaa;">LOGO</div>
          </td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;">
        <tr>
          <td style="border:none;font-size:10px;">Date: ___________________</td>
          <td style="border:none;text-align:right;font-size:10px;">Ref #: <strong>${reference}</strong></td>
        </tr>
      </table>
    </div>

    <div class="section-title">Client's Identifying Information</div>
    <table class="form-table">
      ${columns}
      <tr>
        <td colspan="12" style="padding:2px 5px;font-size:8px;font-weight:bold;">Client's Name: ${escapeHtml(application.resident)}</td>
      </tr>
      <tr>
        ${cell(application.lastName, 4)}
        ${cell(application.firstName, 4)}
        ${cell(application.middleName, 3)}
        ${cell(application.suffix, 1)}
      </tr>
      <tr class="name-labels">
        ${cell("Last Name", 4)}
        ${cell("First Name", 4)}
        ${cell("Middle Name", 3)}
        ${cell("Extension Name", 1)}
      </tr>
      <tr>
        ${labeledField("Age", age, 2)}
        ${labeledField("Sex", application.sex ?? "", 2)}
        ${labeledField("Date of Birth", dob, 5)}
        ${labeledField("Civil Status", application.civilStatus ?? "", 3)}
      </tr>
      <tr>
        ${labeledField("Contact Number", application.contactNumber, 6)}
        ${labeledField("Relationship to the Beneficiaries", application.relationshipToBeneficiary ?? "", 6)}
      </tr>
      <tr>
        ${labeledField("Educational Attainment", application.educationalAttainment ?? "", 6)}
        ${labeledField("Est. Monthly Salary", income, 6)}
      </tr>
      <tr>
        ${labeledField("Address", address, 9)}
        ${labeledField("Occupation", application.occupation ?? "", 3)}
      </tr>
    </table>

    <div class="section-title">Beneficiary's Identifying Information</div>
    <table class="form-table">
      ${columns}
      <tr>
        <td colspan="12" style="padding:2px 5px;font-size:8px;font-weight:bold;">Name:</td>
      </tr>
      <tr>
        ${cell("", 4)}
        ${cell("", 4)}
        ${cell("", 3)}
        ${cell("", 1)}
      </tr>
      <tr class="name-labels">
        ${cell("Last Name", 4)}
        ${cell("First Name", 4)}
        ${cell("Middle Name", 3)}
        ${cell("Extension Name", 1)}
      </tr>
      <tr>
        ${labeledField("Age", "", 2)}
        ${labeledField("Sex", "", 2)}
        ${labeledField("Date of Birth", "", 5)}
        ${labeledField("Civil Status", "", 3)}
      </tr>
      <tr>
        ${labeledField("Contact Number", "", 6)}
        ${labeledField("Educational Attainment", "", 6)}
      </tr>
      <tr>
        ${labeledField("Address", "", 9)}
        ${labeledField("Est. Monthly Salary", "", 3)}
      </tr>
      <tr>
        ${labeledField("Occupation", "", 12)}
      </tr>
    </table>

    <div class="section-title">Family Composition</div>
    <table class="form-table">
      <tr>
        <th style="border:1px solid #000;padding:3px 5px;font-size:10px;width:28%;text-align:left;">Name</th>
        <th style="border:1px solid #000;padding:3px 5px;font-size:10px;width:24%;text-align:left;">Educational Attainment</th>
        <th style="border:1px solid #000;padding:3px 5px;font-size:10px;width:8%;text-align:left;">Age</th>
        <th style="border:1px solid #000;padding:3px 5px;font-size:10px;width:16%;text-align:left;">Relationship</th>
        <th style="border:1px solid #000;padding:3px 5px;font-size:10px;width:14%;text-align:left;">Occupation</th>
        <th style="border:1px solid #000;padding:3px 5px;font-size:10px;width:10%;text-align:left;">Est. Monthly Salary</th>
      </tr>
      ${familyCompositionRows(application)}
    </table>

    <div style="margin-top:12px;display:flex;gap:12px;">
      <div style="flex:1;border:1px solid #000;padding:6px 8px;font-size:9px;">
        I hereby certify that the information given above are true and correct. I further understand that any misinterpretation that may have made will subject me to criminal and civil liabilities provided for by existing laws.
      </div>
      <div style="flex:1;border:1px solid #000;padding:6px 8px;font-size:9px;">
        Pursuant to the Data Privacy Act of 2012 (Republic Act 10173), I hereby give my consent to the Office of the Municipal Social Welfare and Development (OMSWD) to process my personal information for my availment of financial assistance. I understand that the processing shall be limited to the purpose specified. I understand that I can only avail of the financial assistance as provided under the OMSWD guidelines and I will comply with these requirements.
      </div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Signature over Printed Name</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Date</div>
      </div>
    </div>

    <div style="margin-top:10px;font-size:8px;color:#888;text-align:center;">
      Generated by OMSWD Portal &nbsp;·&nbsp; Ref: ${reference} &nbsp;·&nbsp; ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>
</body>
</html>`;
}

export function printIntakeSheet(application: AdminApplicationRecord): void {
  const html = buildIntakeSheetHtml(application);
  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;
  win.opener = null;
  win.document.write(html);
  win.document.close();
}
