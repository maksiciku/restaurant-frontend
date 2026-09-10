import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { openReceiptPrintWindow } from "../utils/openReceiptPrintWindow";

// ---------- helpers ----------
const todayStr = () => new Date().toISOString().slice(0, 10);

function isoStart(yyyyMmDd) {
  return `${yyyyMmDd}T00:00:00.000Z`;
}
function isoEnd(yyyyMmDd) {
  return `${yyyyMmDd}T23:59:59.999Z`;
}
function money(n) {
  return `£${Number(n || 0).toFixed(2)}`;
}
const safeLower = (v) => String(v || "").trim().toLowerCase();

function escCsv(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ---------- component ----------
export default function TransactionsPage() {
  const [rows, setRows] = useState([]);

  // UI filters
  const [filter, setFilter] = useState("all"); // all | cash | card | voided | refunded | completed
  const [q, setQ] = useState("");

  // date filters
  const [fromDate, setFromDate] = useState(todayStr());
  const [toDate, setToDate] = useState(todayStr());

  // totals from backend
  const [totals, setTotals] = useState({
    cash_total: 0,
    card_total: 0,
    grand_total: 0,
    voided_total: 0,
    refunded_total: 0,
  });

  // detail modal
  const [openId, setOpenId] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // approval modal
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState(null); // "void" | "refund" | "adjust" | null
  const [approvalTargetId, setApprovalTargetId] = useState(null);
  const [approvalPin, setApprovalPin] = useState("");
  const [approvalReason, setApprovalReason] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const approvalSubmitLockRef = useRef(false);
  const [approvalError, setApprovalError] = useState("");
const [detail, setDetail] = useState(null);
const [detailItems, setDetailItems] = useState([]);
const [detailPayments, setDetailPayments] = useState([]);
const [detailRefunds, setDetailRefunds] = useState([]);
const [detailError, setDetailError] = useState("");
const [approvalTargetInfo, setApprovalTargetInfo] = useState(null);

  // ---------- API load ----------
  const buildParams = () => {
    const fromISO = isoStart(fromDate);
    const toISO = isoEnd(toDate);

    const params = { from: fromISO, to: toISO };

    if (filter === "cash") params.method = "cash";
    if (filter === "card") params.method = "card";
    if (filter === "voided") params.status = "voided";
    if (filter === "refunded") params.status = "refunded";
    if (filter === "completed") params.status = "completed";

    if (q.trim()) params.q = q.trim();

    return { params, fromISO, toISO };
  };

  const load = async () => {
    const { params, fromISO, toISO } = buildParams();

    const res = await api.get("/orders/payment-settlements", { params });

const settlementRows = Array.isArray(res.data)
  ? res.data.map((settlement) => {
      const payments = Array.isArray(settlement.payments)
        ? settlement.payments
        : [];

      const paymentIds = Array.isArray(settlement.payment_ids)
        ? settlement.payment_ids
        : payments.map((payment) => payment.id).filter(Boolean);

      const paymentMethods = Array.from(
        new Set(
          payments
            .map((payment) =>
              String(payment?.method || "")
                .trim()
                .toLowerCase()
            )
            .filter(Boolean)
        )
      );

      return {
        ...settlement,

        // Settlement is now the authoritative transaction identity.
        id: settlement.settlement_id,

        settlement_id: settlement.settlement_id,

        displayIds: paymentIds,

        displayMethods: paymentMethods,

        displayAmount: Number(settlement.final_amount || 0),

        amount: Number(settlement.final_amount || 0),

        method:
          paymentMethods.length > 1
            ? "mixed"
            : paymentMethods[0] || settlement.method || "unknown",

        staff_name: settlement.staff_name || "Staff",

        // Temporary compatibility for the existing payment-detail routes.
        primaryPaymentId:
          paymentIds.length > 0
            ? paymentIds[paymentIds.length - 1]
            : null,

        isSettlementRow: true,
      };
    })
  : [];

setRows(settlementRows);

    try {
      const t = await api.get("/orders/payments/totals", {
        params: { from: fromISO, to: toISO },
      });

      setTotals({
        cash_total: Number(t.data?.cash_total || 0),
        card_total: Number(t.data?.card_total || 0),
        grand_total: Number(t.data?.grand_total || 0),
        voided_total: Number(t.data?.voided_total || 0),
        refunded_total: Number(t.data?.refunded_total || 0),
      });
    } catch (e) {
      console.warn("Totals failed:", e?.response?.data || e?.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, fromDate, toDate]);

  const filteredRows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;

    return rows.filter((r) => {
      const hay = [
  r.settlement_id,
  r.invoice_number,
  ...(Array.isArray(r.payment_ids) ? r.payment_ids : []),
  r.table_number,
  r.staff_name,
  r.terminal_ref,
  r.method,
  r.status,
  r.cashup_session_id,
  r.voucher_code,
]
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q]);

const displayRows = useMemo(() => {
  return [...filteredRows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}, [filteredRows]);
  // ---------- CSV export ----------
  const exportCsv = () => {
    const header = [
      "Transaction ID",
      "Time",
      "Table",
      "Staff",
      "Method",
      "Amount",
      "Status",
      "Terminal Ref",
      "Cashup Session",
    ];

    const lines = [
      header.join(","),
      ...filteredRows.map((r) => {
        const time = r.created_at
          ? new Date(r.created_at).toLocaleString("en-GB")
          : "";
        return [
          escCsv(r.id),
          escCsv(time),
          escCsv(r.table_number || ""),
          escCsv(r.staff_name || ""),
          escCsv(r.method || ""),
          escCsv(Number(r.amount || 0).toFixed(2)),
          escCsv(r.status || ""),
          escCsv(r.terminal_ref || ""),
          escCsv(r.cashup_session_id || ""),
        ].join(",");
      }),
    ];

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `maks-transactions_${fromDate}_to_${toDate}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  // ---------- detail modal ----------
const openDetail = async (settlementId) => {
  setOpenId(settlementId);
  setLoadingDetail(true);
  setDetail(null);
  setDetailItems([]);
  setDetailPayments([]);
  setDetailRefunds([]);
  setDetailError("");

  try {
    const res = await api.get(
      `/orders/payment-settlements/${encodeURIComponent(settlementId)}`
    );

    const settlement = res.data?.settlement ?? null;
    const items = res.data?.items ?? [];
    const payments = Array.isArray(res.data?.payments)
      ? res.data.payments
      : [];

    if (!settlement || !settlement.settlement_id) {
      throw new Error("Settlement detail returned empty data.");
    }

    const paymentIds = payments
      .map((payment) => Number(payment?.id || 0))
      .filter(
        (id) =>
          Number.isInteger(id) &&
          id > 0
      );

    /*
     * Settlement identity and payment identity are different.
     *
     * A settlement-level Refund/Void action is safe only when
     * this transaction has exactly one concrete payment row.
     * Mixed-tender settlements must fail closed until the UI
     * offers an explicit tender selector.
     */
    const primaryPaymentId =
      paymentIds.length === 1
        ? paymentIds[0]
        : null;

    setDetail({
      ...settlement,

      // Authoritative transaction/detail identity.
      id: settlement.settlement_id,

      // Authoritative reversible payment identity.
      primaryPaymentId,

      amount: Number(
        settlement.final_amount ??
          settlement.payment_total ??
          0
      ),
    });

    setDetailItems(
      Array.isArray(items) ? items : []
    );

    setDetailPayments(payments);
    setDetailRefunds(Array.isArray(res.data?.refunds) ? res.data.refunds : []);
  } catch (e) {
    console.error("settlement detail load failed", e);

    const msg =
      e?.response?.data?.error ||
      e?.response?.data?.detail ||
      e?.message ||
      "Failed to load transaction details";

    setDetailError(String(msg));
  } finally {
    setLoadingDetail(false);
  }
};

  const closeDetail = () => {
    setOpenId(null);
    setDetail(null);
setDetailItems([]);
setDetailPayments([]);
  setDetailRefunds([]);
setDetailError("");
  };

  const printTransactionReceipt = () => {
  if (!detail) {
    alert("Transaction details are still loading. Open the transaction first.");
    return;
  }

  const safeItems = Array.isArray(detailItems) ? detailItems : [];
  const safePayments = Array.isArray(detailPayments) ? detailPayments : [];

  const grossTotal = safeItems.reduce(
  (sum, item) => sum + Number(item.total_price || 0),
  0
);

const dealAdjustedTotal = safeItems.reduce(
  (sum, item) =>
    sum +
    Number(
      item.amount_paid ??
        item.remaining_price ??
        item.total_price ??
        0
    ),
  0
);

const finalAmount = Number(
  safePayments.length
    ? safePayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      )
    : detail.amount || 0
);
const pricingDiscountAmount = Math.max(
  0,
  grossTotal - dealAdjustedTotal
);
  openReceiptPrintWindow({
    tableNumber: detail.table_number || "N/A",
    itemIds: safeItems.map((i) => Number(i.id)).filter(Boolean),
    orderNumber: detail.invoice_number || detail.id,
    paymentMethod:
      safePayments.length > 1 ? "mixed" : detail.method || "card",
    payments: safePayments.length
  ? safePayments
  : [{ method: detail.method || "card", amount: finalAmount }],
    orderItems: safeItems,
    subtotalAmount: grossTotal,
pricingDiscountAmount,
dealAdjustedAmount: dealAdjustedTotal,

voucherDiscountAmount: Number(
  detail.voucher_discount_amount || 0
),
manualDiscountAmount: Number(
  detail.manual_discount_amount || 0
),
serviceChargeAmount: Number(
  detail.service_charge_amount || 0
),

totalAmount: finalAmount,

vatBreakdown:
  detail?.pricing_snapshot?.vat ||
  null,
      isTakeaway: String(detail.table_number || "")
      .toLowerCase()
      .includes("takeaway"),
    proforma: false,
  });
};

  // ---------- approval flow ----------
  const openApproval = (mode, row) => {
    const paymentId = Number(row?.primaryPaymentId || 0);

    setApprovalMode(mode);
    setApprovalTargetId(
      Number.isInteger(paymentId) && paymentId > 0
        ? paymentId
        : null
    );
    setApprovalTargetInfo(row);
    setApprovalPin("");
    setApprovalReason("");
    setApprovalAmount("");
    setApprovalError("");
    setApprovalOpen(true);
  };

  const closeApproval = () => {
    setApprovalOpen(false);
    setApprovalMode(null);
    setApprovalTargetId(null);
    setApprovalPin("");
    setApprovalReason("");
    setApprovalAmount("");
    setApprovalError("");
    setApprovalTargetInfo(null);
  };

  const submitApprovedAction = async () => {
    if (approvalSubmitLockRef.current) return;
    approvalSubmitLockRef.current = true;
    try {
      if (!approvalTargetId) {
        setApprovalError("Missing reversible payment id");
        return;
      }

      if (!/^\d{4}$/.test(String(approvalPin || "").trim())) {
        setApprovalError("Enter a valid 4-digit manager PIN");
        return;
      }

      const rawApprovalAmount =
        String(approvalAmount || "").trim();

      let requestedAmount = null;

      if (
        (approvalMode === "refund" || approvalMode === "adjust") &&
        rawApprovalAmount
      ) {
        const parsedAmount =
          Number(rawApprovalAmount);

        if (
          !Number.isFinite(parsedAmount) ||
          parsedAmount <= 0
        ) {
          setApprovalError(
            "Enter a valid refund amount greater than £0"
          );
          return;
        }

        requestedAmount =
          Math.round(
            (parsedAmount + Number.EPSILON) * 100
          ) / 100;
      }

      const approvalAction =
        approvalMode === "void"
          ? "pos.void_order"
          : approvalMode === "refund" || approvalMode === "adjust"
            ? "pos.refund"
            : "";

      if (!approvalAction) {
        setApprovalError("Unknown approval action");
        return;
      }

      setApprovalLoading(true);
      setApprovalError("");

      await api.post("/pos-auth/approve-action", {
        pin: approvalPin,
        action: approvalAction,
      });

      if (approvalMode === "void") {
        await api.post(`/orders/payments/${approvalTargetId}/void`, {
          reason: approvalReason,
        });
      }

      if (approvalMode === "refund" || approvalMode === "adjust") {
        const payload = {
          reason: approvalReason,
        };

        if (requestedAmount !== null) {
          payload.amount = requestedAmount;
        }

        await api.post(`/orders/payments/${approvalTargetId}/refund`, payload);
      }

      await load();

      const settlementId =
        approvalTargetInfo?.settlement_id ||
        approvalTargetInfo?.id;

      if (settlementId) {
        await openDetail(settlementId);
      }

      closeApproval();
    } catch (e) {
      setApprovalError(
        e?.response?.data?.error || e?.message || "Approval failed"
      );
    } finally {
      approvalSubmitLockRef.current = false;
      setApprovalLoading(false);
    }
  };

  const voidPayment = async (row) => {
  openApproval("void", row);
};

const refundPayment = async (row) => {
  openApproval("refund", row);
};

const adjustPayment = async (row) => {
  openApproval("adjust", row);
};

  const totalCompleted =
    Number(totals.grand_total || 0);

  const actionBtnStyle = (mode, id) => ({
    background:
      approvalOpen && approvalMode === mode && approvalTargetId === id
        ? "#f59e0b"
        : "#fff",
    color:
      approvalOpen && approvalMode === mode && approvalTargetId === id
        ? "#fff"
        : "#111",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 Transactions</h2>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#fff",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 700 }}>Net Takings</div>
        <div>
          Cash: <strong>{money(totals.cash_total)}</strong>
        </div>
        <div>
          Card: <strong>{money(totals.card_total)}</strong>
        </div>
        <div>
          Total: <strong>{money(totalCompleted)}</strong>
        </div>

        <div style={{ color: "#b91c1c" }}>
          Voided: <strong>{money(totals.voided_total)}</strong>
        </div>
        <div style={{ color: "#7c2d12" }}>
          Refunded: <strong>{money(totals.refunded_total)}</strong>
        </div>

        <button
          onClick={exportCsv}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Export CSV
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 15,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {["all", "cash", "card", "completed", "voided", "refunded"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: filter === f ? "#111" : "#fff",
              color: filter === f ? "#fff" : "#111",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {f.toUpperCase()}
          </button>
        ))}

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginLeft: 10,
          }}
        >
          <label style={{ fontSize: 12, opacity: 0.8 }}>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
          <label style={{ fontSize: 12, opacity: 0.8 }}>To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </div>

        <input
          type="search"
          name="transactions-search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search: table / staff / id / terminal..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            width: 320,
          }}
        />

        <button
          onClick={load}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Refresh
        </button>
      </div>

      <table
        style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ textAlign: "left" }}>
<th>Invoice / Payments</th>
            <th>Time</th>
            <th>Table</th>
            <th>Method</th>
            <th>Amount</th>
            <th>Gross</th>
<th>Discounts</th>
<th>Service</th>
            <th>Status</th>
            <th>Staff</th>
            <th>Terminal</th>
            <th>Cashup</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
{displayRows.map((r) => {
              const status = safeLower(r.status);
            const canAct =
  status === "completed" &&
  !r.isSettlementRow;

            return (
              <tr
                key={r.id}
               onClick={() => {
  if (r.settlement_id) {
    openDetail(r.settlement_id);
  }
}}
                title="Click to view details"
                style={{
                  cursor: "pointer",
                  opacity: status === "voided" ? 0.65 : 1,
                  background: status === "partially_refunded" ? "#fffbeb" : status === "refunded" ? "#fff1f2" : undefined,
                  color: status === "voided" ? "#b91c1c" : "inherit",
                  borderTop: "1px solid #eee",
                }}
              >
<td>
  <div style={{ fontWeight: 800 }}>
    {r.invoice_number
      ? `Invoice ${r.invoice_number}`
      : "Settlement"}
  </div>

  <div
    style={{
      marginTop: 3,
      fontFamily: "monospace",
      fontSize: 12,
      opacity: 0.65,
    }}
  >
    Payments:{" "}
    {r.displayIds?.length
      ? r.displayIds.join("/")
      : "None"}
  </div>
</td>
                <td>
                  {r.created_at
                    ? new Date(r.created_at).toLocaleString("en-GB")
                    : ""}
                </td>
                <td>{r.table_number}</td>
<td>
  {r.displayMethods?.length > 1 ? "mixed" : r.method}
</td>

{/* Final amount actually charged */}
<td style={{ fontWeight: 800 }}>
  {money(r.final_amount)}
</td>

{/* Original bill value before discounts */}
<td>
  {money(r.gross_amount)}
</td>

{/* All discount types combined */}
<td>
  {money(
    Number(r.pricing_discount_amount || 0) +
      Number(r.happy_hour_discount_amount || 0) +
      Number(r.voucher_discount_amount || 0) +
      Number(r.manual_discount_amount || 0)
  )}
</td>

{/* Service charge added to the bill */}
<td>
  {money(r.service_charge_amount)}
</td>

<td style={{ fontWeight: 700 }}>{String(r.status || "").replace(/_/g, " ").toUpperCase()}</td>
                <td>{r.staff_name || "-"}</td>
                <td>{r.terminal_ref || "-"}</td>
                <td>{r.cashup_session_id || "-"}</td>

                <td
                  style={{ textAlign: "right" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {canAct ? (
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <button
onClick={() => voidPayment(r)}
                        style={actionBtnStyle("void", r.id)}
                      >
                        {approvalOpen &&
                        approvalMode === "void" &&
                        approvalTargetId === r.id
                          ? "Awaiting Manager"
                          : "Void"}
                      </button>

                      <button
onClick={() => refundPayment(r)}

style={actionBtnStyle("refund", r.id)}
                      >
                        {approvalOpen &&
                        approvalMode === "refund" &&
                        approvalTargetId === r.id
                          ? "Awaiting Manager"
                          : "Refund"}
                      </button>

                      <button
onClick={() => adjustPayment(r)}
                        style={actionBtnStyle("adjust", r.id)}
                      >
                        {approvalOpen &&
                        approvalMode === "adjust" &&
                        approvalTargetId === r.id
                          ? "Awaiting Manager"
                          : "Adjust"}
                      </button>
          
                    </div>
                  ) : (
                    <span
  title={
    r.isSettlementRow
      ? "Settlement-level actions are being upgraded"
      : "No actions available"
  }
  style={{ opacity: 0.6 }}
>
  {r.isSettlementRow ? "Settlement locked" : "—"}
</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {displayRows.length === 0 && (
        <div style={{ marginTop: 18, opacity: 0.7 }}>
          No transactions match your filters.
        </div>
      )}

      {openId && (
        <div
          onClick={closeDetail}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "min(900px, 96vw)",
              borderRadius: 12,
              padding: 16,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, overflowWrap: "anywhere" }}>Transaction #{openId}</h3>
              <button onClick={closeDetail}>Close</button>
            </div>

            {loadingDetail && <div style={{ marginTop: 12 }}>Loading…</div>}

            {!loadingDetail && detailError && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "#fff1f2",
                  color: "#9f1239",
                }}
              >
                <strong>Failed to load details:</strong> {detailError}
              </div>
            )}

            {!loadingDetail && !detailError && detail && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  <div>
                    <strong>Time:</strong>{" "}
                    {detail.created_at
                      ? new Date(detail.created_at).toLocaleString("en-GB")
                      : ""}
                  </div>
                  <div>
                    <strong>Status:</strong> {String(detail.status || "").replace(/_/g, " ").toUpperCase()}
                  </div>
                  <div>
                    <strong>Table:</strong> {detail.table_number}
                  </div>
                  <div>
  <strong>Original Payment:</strong>{" "}
  {detailPayments.length
    ? detailPayments.map((p) => `${p.method} ${money(p.amount)}`).join(" / ")
    : `${detail.method} ${money(detail.amount)}`}
</div>
                  <div>
                    <strong>Staff:</strong> {detail.staff_name || "-"}
                  </div>
                  <div>
                    <strong>Terminal Ref:</strong> {detail.terminal_ref || "-"}
                  </div>
                  <div>
                    <div>
  <strong>Bill Total:</strong>{" "}
  {money(detailItems.reduce((s, x) => s + Number(x.total_price || 0), 0))}
</div>
</div>
                  <div>
                    <strong>Cashup Session:</strong>{" "}
                    {detail.cashup_session_id || "-"}
                  </div>
                </div>

                <hr style={{ margin: "14px 0" }} />
<section aria-label="Refund history" style={{ marginBottom: 16, padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: detailRefunds.length ? "#fffbeb" : "#f7fcfd" }}>
  <h4 style={{ margin: "0 0 12px" }}>Payment &amp; refund history</h4>
  {detail.net_payment_total != null ? (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 12 }}>
      <span>Original payment: <strong>{money(detail.original_payment_total)}</strong></span>
      <span>Refunded: <strong>{money(detail.refunded_total)}</strong></span>
      <span>Net retained: <strong>{money(detail.net_payment_total)}</strong></span>
    </div>
  ) : <p>Refund history is unavailable from this backend version.</p>}
  {detailRefunds.map((refund) => (
    <div key={refund.payment_uuid || refund.id} style={{ borderTop: "1px solid #e5e7eb", padding: "12px 0", overflowWrap: "anywhere" }}>
      <div><strong>{money(Math.abs(refund.amount))} refund · {refund.method}</strong>{safeLower(refund.status) === "voided" ? " — VOIDED (excluded from totals)" : ""}</div>
      <div>When: {refund.created_at ? new Date(refund.created_at).toLocaleString("en-GB") : "Not recorded"}</div>
      <div>Recorded staff: {refund.staff_name || (refund.staff_user_id ? `Staff ID ${refund.staff_user_id}` : "Not recorded")}</div>
      <div>Table / order: {refund.table_number || "Not recorded"}</div>
      <div>Reason: {refund.reason || "Not available in the recorded audit history"}</div>
      <div>Refund reference: {refund.payment_uuid || refund.id}</div>
      <div>Original payment reference: {refund.ref_payment_uuid || refund.ref_payment_id || "Not recorded"}</div>
      <div>Original terminal reference: {refund.original_terminal_ref || "Not recorded"}</div>
    </div>
  ))}
  {detail.net_payment_total != null && !detailRefunds.length && <div>No refunds recorded for this transaction.</div>}
  {detailRefunds.length > 0 && <p style={{ marginBottom: 0, fontSize: 13, color: "#6b7280" }}>Refund device/location and approving manager are not available in this refund record. The terminal reference belongs to the original payment.</p>}
</section>
{detail?.pricing_snapshot?.vat && (
  <>
    <div
      style={{
        marginBottom: 16,
        padding: 14,
        border: "1px solid #d7e8ee",
        borderRadius: 10,
        background: "#f7fcfd",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 16,
          marginBottom: 10,
          color: "#075985",
        }}
      >
        VAT Summary
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            Gross
          </div>

          <strong>
            {money(
              detail.pricing_snapshot.vat.taxable_gross || 0
            )}
          </strong>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            Net
          </div>

          <strong>
            {money(
              detail.pricing_snapshot.vat.net_amount || 0
            )}
          </strong>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.6,
              textTransform: "uppercase",
            }}
          >
            VAT
          </div>

          <strong>
            {money(
              detail.pricing_snapshot.vat.vat_amount || 0
            )}
          </strong>
        </div>
      </div>

      {Array.isArray(
        detail.pricing_snapshot.vat.buckets
      ) &&
        detail.pricing_snapshot.vat.buckets.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid #d7e8ee",
            }}
          >
            {detail.pricing_snapshot.vat.buckets.map(
              (bucket, index) => (
                <div
                  key={`${bucket.rate}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "3px 0",
                    fontSize: 13,
                  }}
                >
                  <span>
  VAT {Number(
    bucket.vat_rate ??
    bucket.rate ??
    0
  )}%
</span>

<strong>
  {money(
    bucket.vat ??
    bucket.vat_amount ??
    0
  )}
</strong>
                </div>
              )
            )}
          </div>
        )}
    </div>

    <hr style={{ margin: "14px 0" }} />
  </>
)}
                <h4 style={{ margin: 0 }}>Items paid</h4>
                <table
                  style={{
                    width: "100%",
                    marginTop: 10,
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        textAlign: "left",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((it) => (
                      <tr key={it.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td>{it.meal_name || it.item_name || "Item"}</td>
                        <td>{it.quantity}</td>
                        <td>{money(it.total_price)}</td>
                      </tr>
                    ))}
                    {!detailItems.length && (
                      <tr>
                        <td colSpan={3} style={{ padding: 10, color: "#666" }}>
                          No linked POS lines found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {(() => {
                  const detailStatus = safeLower(detail?.status);
                  const canAct = Boolean(detail?.primaryPaymentId) &&
                    ["completed", "partially_refunded"].includes(detailStatus);
                  return (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "flex-end",
                        marginTop: 14,
                      }}
                    >
                      {canAct ? (
  <>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        printTransactionReceipt();
      }}
      style={{
        border: "1px solid #111",
        background: "#111",
        color: "#fff",
        borderRadius: 8,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Print Bill
    </button>

    <button
      type="button"
onClick={() => voidPayment(detail)}
      disabled={safeLower(detail.status) !== "completed"}
      style={actionBtnStyle("void", detail.id)}
    >
      {approvalOpen &&
      approvalMode === "void" &&
      approvalTargetId === detail.id
        ? "Awaiting Manager"
        : "Void"}
    </button>

                          <button
onClick={() => refundPayment(detail)}
                            style={actionBtnStyle("refund", detail.id)}
                          >
                            {approvalOpen &&
                            approvalMode === "refund" &&
                            approvalTargetId === detail.id
                              ? "Awaiting Manager"
                              : "Refund"}
                          </button>

                          <button
onClick={() => adjustPayment(detail)}
                            style={actionBtnStyle("adjust", detail.id)}
                          >
                            {approvalOpen &&
                            approvalMode === "adjust" &&
                            approvalTargetId === detail.id
                              ? "Awaiting Manager"
                              : "Adjust"}
                          </button>
                        </>
                      ) : (
                        <div style={{ color: "#666" }}>
                          No actions available for this status.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {approvalOpen && (
        <div
          onClick={closeApproval}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "min(480px, 96vw)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {approvalMode === "void" && "Void Payment"}
              {approvalMode === "refund" && "Refund Payment"}
              {approvalMode === "adjust" && "Adjust Payment"}
            </h3>

            <p style={{ marginTop: 0, color: "#666" }}>
              Manager approval required for this action.
            </p>

{approvalTargetInfo && (
  <div
    style={{
      padding: 10,
      borderRadius: 10,
      background: "#eef7fb",
      border: "1px solid #cfe8f3",
      marginBottom: 12,
      fontWeight: 700,
    }}
  >
    <div>Transaction: {approvalTargetInfo.displayIds?.length > 1 ? approvalTargetInfo.displayIds.join("/") : approvalTargetInfo.id}</div>
    <div>Table: {approvalTargetInfo.table_number || "-"}</div>
    <div>Method: {approvalTargetInfo.displayMethods?.length > 1 ? "mixed" : approvalTargetInfo.method}</div>
    <div>Amount: {money(approvalTargetInfo.displayAmount ?? approvalTargetInfo.amount)}</div>
  </div>
)}

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Reason
                </label>
                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
                  placeholder="Enter reason"
                />
              </div>

              {(approvalMode === "refund" || approvalMode === "adjust") && (
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Amount (leave empty for full)
                  </label>
                  <input
                    type="number"
                    name="refund-amount"
                    autoComplete="off"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    value={approvalAmount}
                    onChange={(e) => setApprovalAmount(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                    placeholder="e.g. 12.50"
                  />
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Manager PIN
                </label>
                <input
                  type="password"
                  name="manager-approval-pin"
                  autoComplete="new-password"
                  inputMode="numeric"
                  maxLength={4}
                  value={approvalPin}
                  onChange={(e) =>
                    setApprovalPin(
                      e.target.value.replace(/\D/g, "").slice(0, 4)
                    )
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                  }}
                  placeholder="4-digit PIN"
                />
              </div>

              {approvalError ? (
                <div style={{ color: "#b91c1c", fontWeight: 600 }}>
                  {approvalError}
                </div>
              ) : null}

              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
              >
                <button onClick={closeApproval} disabled={approvalLoading}>
                  Cancel
                </button>
                <button
                  onClick={submitApprovedAction}
                  disabled={approvalLoading}
                >
                  {approvalLoading ? "Checking..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}