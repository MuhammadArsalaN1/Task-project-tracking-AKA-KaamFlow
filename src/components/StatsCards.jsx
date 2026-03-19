import Card from "./ui/Card";

export default function StatsCards({ tasks }) {

  const getPrice = (t) =>
    t.finalPrice ?? t.counter_price ?? t.price ?? 0;

  let totalProjects = tasks.length;
  let totalRevenue = 0;
  let totalPaid = 0;
  let overdue = 0;
  const employees = new Set();

  const now = new Date();

  tasks.forEach((t) => {
    const price = getPrice(t);
    totalRevenue += price;

    employees.add(t.assignedTo);

    // payments
    const paid = t.payments?.reduce((s, p) => s + p.amount, 0) || 0;
    totalPaid += paid;

    // overdue
    if (t.deadline && new Date(t.deadline) < now && t.status !== "completed") {
      overdue++;
    }
  });

  const remaining = totalRevenue - totalPaid;

  return (
    <div style={grid}>
      <Card><h4>Total Projects</h4><h2>{totalProjects}</h2></Card>
      <Card><h4>Total Revenue</h4><h2>PKR {totalRevenue}</h2></Card>
      <Card><h4>Paid</h4><h2>PKR {totalPaid}</h2></Card>
      <Card><h4>Remaining</h4><h2>PKR {remaining}</h2></Card>
      <Card><h4>Overdue</h4><h2>{overdue}</h2></Card>
      <Card><h4>Active Employees</h4><h2>{employees.size}</h2></Card>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
  marginTop: "20px"
};