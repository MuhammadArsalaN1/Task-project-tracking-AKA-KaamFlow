export const getPakistanDateISO = () => {
  const now = new Date();

  // Get time in PKT
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const map = {};
  parts.forEach(({ type, value }) => {
    map[type] = value;
  });

  // Construct ISO manually
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}.000Z`;
};