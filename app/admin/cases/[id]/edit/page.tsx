import Link from 'next/link'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { IconArrowLeft, IconEdit } from '@/app/dashboard/components/Icons'
import CaseForm, { type CaseFormInitial } from '../../_components/CaseForm'

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getServiceClient()

  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  const initial = caseData as unknown as CaseFormInitial

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
            <IconEdit width={12} height={12} />
            Editing case
          </div>
          <h1 className="dash-page-title">
            <em>{initial.company_name || initial.ticker || 'Untitled'}</em>
          </h1>
          <div className="dash-page-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--serif)',
                color: 'var(--gold)',
                fontSize: 11,
                padding: '2px 8px',
                border: '1px solid var(--gold-line)',
                background: 'rgba(201,169,110,0.06)',
                borderRadius: 2,
                letterSpacing: '0.06em',
              }}
            >
              {initial.trading_id}
            </span>
            <span>Update fields and save.</span>
          </div>
        </div>
        <div className="dash-page-actions">
          <Link href={`/admin/cases/${id}`} className="dash-btn btn-ghost">
            <IconArrowLeft width={14} height={14} />
            Back to Case
          </Link>
        </div>
      </div>

      <CaseForm mode="edit" initial={initial} />
    </>
  )
}
