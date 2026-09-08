import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { orderNumber } from "@/lib/order-templates";

export type OrderLike = Record<string, any>;

export const BUSINESS = {
  name: "Rosado Gems",
  tagline: "Fine gemstone jewellery",
  email: "hello@rosadogems.com",
  phone: "+91 00000 00000",
  site: "rosadogems.com",
  address: "Mumbai, Maharashtra, India",
};

const money = (n: unknown, cur: string) =>
  `${cur} ${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function items(order: OrderLike) {
  return Array.isArray(order.items) ? (order.items as OrderLike[]) : [];
}

function shipTo(order: OrderLike): string[] {
  const a = (order.shipping_address ?? {}) as OrderLike;
  return [
    String(order.contact_name ?? a.name ?? ""),
    [a.line1, a.line2].filter(Boolean).join(", "),
    [a.city, a.state, a.pincode].filter(Boolean).join(" "),
    String(a.country ?? ""),
    order.contact_phone ? `Ph: ${order.contact_phone}` : "",
    String(order.contact_email ?? ""),
  ].filter(Boolean);
}

function header(doc: jsPDF, title: string, order: OrderLike) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(BUSINESS.name, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text([BUSINESS.tagline, BUSINESS.address, `${BUSINESS.email} · ${BUSINESS.phone}`, BUSINESS.site], 14, 24);

  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title.toUpperCase(), 196, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(
    [
      `No: ${orderNumber(String(order.id))}`,
      `Date: ${new Date(order.created_at).toLocaleDateString()}`,
      `Status: ${String(order.status ?? "").replace(/_/g, " ")}`,
    ],
    196,
    24,
    { align: "right" },
  );
  doc.setDrawColor(220);
  doc.line(14, 44, 196, 44);
  doc.setTextColor(20);
}

function addresses(doc: jsPDF, order: OrderLike, y = 52) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Bill / Ship to", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(shipTo(order), 14, y + 5);

  doc.setFont("helvetica", "bold");
  doc.text("Payment", 120, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    [
      order.payment_method === "cod" ? "Cash on delivery" : "Prepaid / online",
      `Payment status: ${order.payment_status ?? "-"}`,
      order.courier_name ? `Courier: ${order.courier_name}` : "",
      order.awb_code ? `AWB: ${order.awb_code}` : "",
    ].filter(Boolean),
    120,
    y + 5,
  );
  return y + 34;
}

function footer(doc: jsPDF, note: string) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(note, 14, h - 12);
  doc.text(`${BUSINESS.name} · ${BUSINESS.site}`, 196, h - 12, { align: "right" });
}

function save(doc: jsPDF, order: OrderLike, kind: string) {
  doc.save(`${kind}-${orderNumber(String(order.id))}.pdf`);
}

export function buildInvoice(order: OrderLike) {
  const cur = String(order.currency ?? "INR");
  const doc = new jsPDF();
  header(doc, "Tax Invoice", order);
  const y = addresses(doc, order);

  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "SKU", "Qty", "Unit", "Amount"]],
    body: items(order).map((it, i) => [
      String(i + 1),
      [String(it.name ?? ""), it.variant ? String(it.variant) : ""].filter(Boolean).join("\n"),
      String(it.sku ?? "-"),
      String(it.qty ?? 1),
      money(it.price ?? (Number(it.line_total ?? 0) / Number(it.qty ?? 1)), cur),
      money(it.line_total, cur),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [232, 214, 200], textColor: 30 },
    columnStyles: { 0: { cellWidth: 10 }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });

  const tax = (order.tax_detail ?? {}) as OrderLike;
  const lines: Array<[string, string]> = [
    ["Subtotal", money(order.subtotal, cur)],
    ["Shipping", money(order.shipping, cur)],
  ];
  if (Number(order.cod_fee) > 0) lines.push(["COD fee", money(order.cod_fee, cur)]);
  if (Array.isArray(tax.components) && tax.components.length) {
    for (const c of tax.components as OrderLike[]) lines.push([String(c.label ?? "Tax"), money(c.amount, cur)]);
  } else if (Number(order.tax) > 0) {
    lines.push([String(tax.label ?? "Tax"), money(order.tax, cur)]);
  }
  lines.push(["Total", money(order.total, cur)]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterY = (doc as any).lastAutoTable.finalY + 6;
  autoTable(doc, {
    startY: afterY,
    body: lines,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    margin: { left: 120 },
    columnStyles: { 0: { cellWidth: 46 }, 1: { halign: "right", fontStyle: "bold" } },
  });

  footer(doc, "Thank you for shopping with us. This is a computer-generated invoice.");
  save(doc, order, "invoice");
}

export function buildPackingSlip(order: OrderLike) {
  const doc = new jsPDF();
  header(doc, "Packing Slip", order);
  const y = addresses(doc, order);
  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "SKU", "Qty", "Packed"]],
    body: items(order).map((it, i) => [
      String(i + 1),
      [String(it.name ?? ""), it.variant ? String(it.variant) : ""].filter(Boolean).join("\n"),
      String(it.sku ?? "-"),
      String(it.qty ?? 1),
      "",
    ]),
    styles: { fontSize: 9, cellPadding: 3, minCellHeight: 10 },
    headStyles: { fillColor: [232, 214, 200], textColor: 30 },
    columnStyles: { 0: { cellWidth: 10 }, 3: { halign: "right" }, 4: { cellWidth: 24 } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(order.notes ? `Notes: ${order.notes}` : "Notes: —", 14, afterY);
  footer(doc, "Packing slip — no prices shown to the recipient.");
  save(doc, order, "packing-slip");
}

export function buildShippingLabel(order: OrderLike) {
  const doc = new jsPDF({ format: [100, 150], unit: "mm" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(BUSINESS.name, 8, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(BUSINESS.address, 8, 17);
  doc.setDrawColor(0);
  doc.line(8, 21, 92, 21);

  doc.setFontSize(9);
  doc.text("DELIVER TO", 8, 29);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(shipTo(order), 8, 36, { maxWidth: 84 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.line(8, 96, 92, 96);
  doc.text(
    [
      `Order: ${orderNumber(String(order.id))}`,
      `Payment: ${order.payment_method === "cod" ? `COD ${order.currency ?? "INR"} ${Number(order.total).toLocaleString()}` : "PREPAID"}`,
      order.courier_name ? `Courier: ${order.courier_name}` : "",
      order.awb_code ? `AWB: ${order.awb_code}` : "",
      `Items: ${items(order).reduce((s, it) => s + Number(it.qty ?? 1), 0)}`,
    ].filter(Boolean),
    8,
    104,
  );
  doc.save(`label-${orderNumber(String(order.id))}.pdf`);
}

export function ordersToCsv(orders: OrderLike[]) {
  const head = [
    "order_no", "date", "customer", "email", "phone", "items", "subtotal", "shipping",
    "tax", "cod_fee", "total", "currency", "payment_method", "payment_status", "status", "courier", "awb",
  ];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = orders.map((o) => [
    orderNumber(String(o.id)), new Date(o.created_at).toISOString(), o.contact_name, o.contact_email,
    o.contact_phone, items(o).length, o.subtotal, o.shipping, o.tax, o.cod_fee, o.total, o.currency,
    o.payment_method, o.payment_status, o.status, o.courier_name, o.awb_code,
  ].map(esc).join(","));
  return [head.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
