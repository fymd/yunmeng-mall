/**
 * Order helpers
 */

export function generateOrderNo(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const date =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `YM${date}${rand}`;
}
