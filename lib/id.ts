function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function newId(prefix = ''): string {
  const t = Date.now().toString(36);
  return `${prefix}${prefix ? '_' : ''}${t}${rand()}`;
}
