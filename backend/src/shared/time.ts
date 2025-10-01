const durationPattern = /^(\d+)([smhd])$/i;

export function durationToMs(value: string): number {
  const match = value.match(durationPattern);
  if (!match) {
    throw new Error(`Durée invalide : ${value}`);
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const unitMap: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const multiplier = unitMap[unit];
  if (!multiplier) {
    throw new Error(`Unité de durée invalide : ${unit}`);
  }

  return amount * multiplier;
}
