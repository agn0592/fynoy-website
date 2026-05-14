import Link from 'next/link'

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '10px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <div style={{ color: '#f59e0b', fontSize: '32px', marginBottom: '16px' }}>🚧</div>
        <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
          Coming Soon
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px' }}>
          Case editing functionality is under development.
        </p>
        <Link
          href={`/admin/cases/${id}`}
          style={{
            background: '#3b82f6',
            color: '#fff',
            textDecoration: 'none',
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Back to Case
        </Link>
      </div>
    </div>
  )
}
