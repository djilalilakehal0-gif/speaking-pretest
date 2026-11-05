/** The three window buttons of a macOS-style title bar. */
export function WindowDots({ size = '1.4cqw', dim = false }: { size?: string; dim?: boolean }) {
  const colors = ['#ff5f57', '#febc2e', '#28c840']
  return (
    <>
      {colors.map((c) => (
        <i key={c} className="rounded-full" style={{ width: size, height: size, background: c, opacity: dim ? 0.8 : 1 }} />
      ))}
    </>
  )
}
