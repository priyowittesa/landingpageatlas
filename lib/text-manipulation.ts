function getInitials(text: string) {
  return (
    text
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "U"
  );
}

export { getInitials };
