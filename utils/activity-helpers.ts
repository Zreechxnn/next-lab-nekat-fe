export const calculateDuration = (start: string, end: string) => {
  if (!end || new Date(end).getFullYear() === 1 || start === end) return "Berjalan...";
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}j ${mins}m`;
};

export const formatDateTime = (iso: string) => {
  if (!iso || iso.startsWith("0001")) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
};