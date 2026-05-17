import { WA_ICON } from '@/app/components/WaIcon'

const RESEARCH_WA = "https://wa.me/31682074482?text=Hi%2C%20I'd%20like%20to%20join%20the%20Fynoy%20Capital%20research%20group."
const ANALYST_WA  = "https://wa.me/31682074482?text=Hi%2C%20I'm%20interested%20in%20collaborating%20as%20a%20trader%20with%20Fynoy%20Capital."

const ResearchIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 4 4 5-6" />
  </svg>
)

const AnalystIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
)

interface CommunityCardItem {
  icon: React.ReactNode
  eyebrow: string
  title: string
  body: string
  href: string
  cta: string
}

const ITEMS: CommunityCardItem[] = [
  {
    icon: ResearchIcon,
    eyebrow: 'Research community',
    title: 'Follow the research',
    body: 'Read weekly stock analyses, attend pitches, and ask the team questions.',
    href: RESEARCH_WA,
    cta: 'Join via WhatsApp',
  },
  {
    icon: AnalystIcon,
    eyebrow: 'Become an analyst',
    title: 'Become an analyst',
    body: 'Write research reports, present stock pitches, and build experience inside a real investment team.',
    href: ANALYST_WA,
    cta: 'Apply via WhatsApp',
  },
]

export default function CommunityCard() {
  return (
    <section className="community-section" aria-label="Community">
      <div className="community-grid">
        {ITEMS.map((item) => (
          <div key={item.title} className="community-card">
            <div className="community-icon">{item.icon}</div>
            <div className="community-eyebrow">{item.eyebrow}</div>
            <h3 className="community-title">{item.title}</h3>
            <p className="community-body">{item.body}</p>
            <a
              className="community-cta"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {WA_ICON}<span>{item.cta}</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
