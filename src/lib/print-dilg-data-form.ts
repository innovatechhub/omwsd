function blankRows(count: number) {
  return Array.from(
    { length: count },
    () => `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td class="category-cell"></td>
        <td class="category-cell"></td>
        <td class="category-cell"></td>
        <td class="category-cell"></td>
        <td class="category-cell"></td>
        <td class="category-cell"></td>
        <td></td>
      </tr>
    `,
  ).join("");
}

export function printDilgDataForm(): void {
  const today = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AICS Data Form</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef2f7;
      color: #1f2933;
      font-family: Arial, Helvetica, sans-serif;
    }
    @page {
      size: A4 landscape;
      margin: 9mm;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .sheet { box-shadow: none; margin: 0; width: 100%; min-height: auto; }
    }
    .no-print {
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 14px;
    }
    .print-btn {
      border: 0;
      border-radius: 8px;
      background: #1f2a6d;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 700;
      padding: 9px 22px;
    }
    .sheet {
      width: min(1122px, calc(100vw - 24px));
      min-height: 793px;
      margin: 0 auto 18px;
      background: #fff;
      padding: 22px 24px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
    }
    .title-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: 16px;
      margin-bottom: 12px;
    }
    .office {
      font-size: 11px;
      line-height: 1.35;
      text-transform: uppercase;
    }
    .title-block {
      min-width: 300px;
      text-align: center;
    }
    .title {
      color: #555862;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .generated {
      color: #6b7280;
      font-size: 10px;
      margin-top: 4px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th,
    td {
      border: 1px solid #454545;
      height: 24px;
      padding: 3px 4px;
      vertical-align: middle;
    }
    th {
      background: #f7f7f2;
      color: #333742;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.05;
      text-transform: uppercase;
      white-space: normal;
      word-break: normal;
    }
    td {
      font-size: 11px;
    }
    .date-col { width: 8%; }
    .name-col { width: 22%; }
    .address-col { width: 24%; }
    .category-col { width: 6%; }
    .signature-col { width: 10%; }
    .male { background: #40a9d8; color: #183141; }
    .female { background: #e95e72; color: #3a121a; }
    .solo { background: #f3d549; color: #3f3510; }
    .fourps { background: #617d4d; color: #17210f; }
    .senior { background: #e85d6a; color: #3a121a; }
    .pwd { background: #5f6371; color: #111827; }
    .category-cell { background: rgba(255, 255, 255, 0.18); }
    .footer-note {
      color: #6b7280;
      font-size: 10px;
      margin-top: 8px;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <main class="sheet">
    <div class="title-row">
      <div class="office">
        Republic of the Philippines<br />
        Province of Antique<br />
        Municipality of Pandan<br />
        Office of the Municipal Social Welfare and Development
      </div>
      <div class="title-block">
        <div class="title">AICS Data Form</div>
        <div class="generated">Generated ${today}</div>
      </div>
      <div></div>
    </div>
    <table aria-label="DILG data form">
      <thead>
        <tr>
          <th class="date-col">Date</th>
          <th class="name-col">Name</th>
          <th class="address-col">Address</th>
          <th class="category-col male">Male</th>
          <th class="category-col female">Female</th>
          <th class="category-col solo">Solo<br />Parent</th>
          <th class="category-col fourps">4Ps</th>
          <th class="category-col senior">Senior</th>
          <th class="category-col pwd">PWD</th>
          <th class="signature-col">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${blankRows(24)}
      </tbody>
    </table>
    <div class="footer-note">Printed from OMSWD Portal</div>
  </main>
</body>
</html>`;

  const win = window.open("", "_blank", "width=1180,height=820");
  if (!win) return;

  win.opener = null;
  win.document.write(html);
  win.document.close();
  win.focus();
}
