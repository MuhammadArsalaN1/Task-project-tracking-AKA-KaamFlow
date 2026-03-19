import Card from "./ui/Card";

export default function PaymentOverview({ tasks }) {

  let totalPaid = 0;
  let totalRevenue = 0;

  const paymentsTimeline = {};

  tasks.forEach((t) => {
    const total = t.finalPrice ?? t.price ?? 0;
    totalRevenue += total;

    (t.payments || []).forEach((p) => {
      totalPaid += p.amount;

      const date = p.date?.toDate?.().toLocaleDateString();
      if (!paymentsTimeline[date]) {
        paymentsTimeline[date] = 0;
      }
      paymentsTimeline[date] += p.amount;
    });
  });

  const remaining = totalRevenue - totalPaid;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>💰 Payment Overview</h3>

      <div style={{ display: "flex", gap: 16 }}>
        <Card><h4>Total Paid</h4><h2>PKR {totalPaid}</h2></Card>
        <Card><h4>Total Remaining</h4><h2>PKR {remaining}</h2></Card>
      </div>
    </div>
  );
}