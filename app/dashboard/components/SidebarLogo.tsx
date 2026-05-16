export default function SidebarLogo() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fynoy Capital"
    >
      {/* bars — opacity steps like the original */}
      <rect x="1"  y="22" width="6" height="11" rx="0.5" fill="currentColor" opacity="0.45" />
      <rect x="9"  y="16" width="6" height="17" rx="0.5" fill="currentColor" opacity="0.62" />
      <rect x="17" y="9"  width="6" height="24" rx="0.5" fill="currentColor" opacity="0.80" />
      <rect x="25" y="2"  width="6" height="31" rx="0.5" fill="currentColor" />

      {/* diagonal trend line */}
      <line x1="2" y1="30" x2="30" y2="3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />

      {/* arrow head at top-right */}
      <path d="M24 3 L30 3 L30 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
