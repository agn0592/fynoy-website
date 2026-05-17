'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import Link from 'next/link'
import ChartBlock from './ChartBlock'

interface Props {
  text: string
  agent: 'atlas' | 'sage'
}

// Walks the streamed text, pulls out <chart-spec>{...}</chart-spec> blocks,
// returns the remaining markdown plus the parsed specs.
function splitChartSpecs(text: string): { markdown: string; charts: Record<string, unknown>[] } {
  const re = /<chart-spec>([\s\S]*?)<\/chart-spec>/g
  const charts: Record<string, unknown>[] = []
  const markdown = text.replace(re, (_, json) => {
    try {
      const parsed = JSON.parse(json)
      if (parsed && typeof parsed === 'object') charts.push(parsed as Record<string, unknown>)
    } catch {
      // ignore unparseable spec while streaming — model may still be writing it
    }
    return ''  // strip the spec from the rendered markdown
  })
  return { markdown, charts }
}

// Resolve fynoy:// entity URIs to the appropriate route per agent.
function resolveFynoyUri(uri: string, agent: 'atlas' | 'sage'): { href: string; chip: boolean } | null {
  const m = /^fynoy:\/\/(case|position)\/(.+)$/.exec(uri)
  if (!m) return null
  const [, kind, id] = m
  if (kind === 'case') {
    return { href: agent === 'atlas' ? `/admin/cases/${id}` : `/dashboard/holdings?focus=${id}`, chip: true }
  }
  return { href: agent === 'atlas' ? `/admin/cases?symbol=${id}` : `/dashboard/holdings?symbol=${id}`, chip: true }
}

export default function MarkdownView({ text, agent }: Props) {
  const { markdown, charts } = splitChartSpecs(text)

  const components: Components = {
    a({ href, children, ...rest }) {
      if (typeof href === 'string' && href.startsWith('fynoy://')) {
        const resolved = resolveFynoyUri(href, agent)
        if (resolved) {
          return <Link href={resolved.href} className="agent-entity-chip">{children}</Link>
        }
      }
      return <a href={href} target="_blank" rel="noreferrer" {...rest}>{children}</a>
    },
    code({ children, className, ...rest }) {
      // Inline code keeps a subtle style; fenced blocks get the codeblock styling.
      const isInline = !className?.startsWith('language-')
      if (isInline) return <code className="agent-inline-code" {...rest}>{children}</code>
      return <code className={className} {...rest}>{children}</code>
    },
  }

  return (
    <div className="agent-md">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
      {charts.map((spec, i) => <ChartBlock key={i} spec={spec} />)}
    </div>
  )
}
