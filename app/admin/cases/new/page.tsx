import Link from 'next/link'
import { IconArrowLeft, IconBriefcase } from '@/app/dashboard/components/Icons'
import CaseForm from '../_components/CaseForm'

export default function NewCasePage() {
  return (
    <>
      <div className="dash-page-head">
        <div className="dash-page-title-block">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ink-dim)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            <IconBriefcase width={12} height={12} />
            Cases
          </div>
          <h1 className="dash-page-title">
            New <em>Case</em>
          </h1>
          <div className="dash-page-sub">
            Complete all sections to record a new investment case.
          </div>
        </div>
        <div className="dash-page-actions">
          <Link href="/admin/cases" className="dash-btn btn-ghost">
            <IconArrowLeft width={14} height={14} />
            Back to Cases
          </Link>
        </div>
      </div>

      <CaseForm mode="new" />
    </>
  )
}
