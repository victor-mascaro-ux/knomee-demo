/* The API store, reached from the burger menu: the catalog of what a firm can
   pull out of knomee into its own CRM, and each product's endpoints with a
   sample request and response. The open product rides in the route
   (#/api-store/<product>), so App owns it. */

import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from '../components/icons'
import {
  API_BASE,
  API_DOCS,
  apiFacetGroups,
  apiProducts,
  curlFor,
} from '../data/apiStore'
import './apiStore.css'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/* Copy confirms inside the button rather than in a toast. */
function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  const t = useRef<number>()
  useEffect(() => () => window.clearTimeout(t.current), [])
  return (
    <button
      type="button"
      className="api-copy"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {})
        setDone(true)
        window.clearTimeout(t.current)
        t.current = window.setTimeout(() => setDone(false), 1800)
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

function AccessTag({ subscribed }: { subscribed: boolean }) {
  return subscribed ? (
    <span className="api-tag is-subscribed">Subscribed</span>
  ) : (
    <span className="api-tag">Available</span>
  )
}

export default function ApiStoreScreen({
  productId,
  onOpen,
  onExit,
}: {
  productId: string | null
  onOpen: (id: string | null) => void
  onExit: () => void
}) {
  const [q, setQ] = useState('')
  const [facets, setFacets] = useState<Record<string, boolean>>({})
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({})
  const [requested, setRequested] = useState<Record<string, boolean>>({})

  const current = apiProducts.find((p) => p.id === productId) ?? null
  useEffect(() => setOpenPaths({}), [productId])

  const query = q.trim().toLowerCase()
  const picked = Object.keys(facets).filter((k) => facets[k])
  const pickedProducts = new Set(picked.map((k) => k.split('::')[0]))
  const filtered = apiProducts.filter((p) => {
    if (pickedProducts.size && !pickedProducts.has(p.id)) return false
    if (!query) return true
    const hay = [p.name, p.fields, p.blurb, ...p.endpoints.map((e) => `${e.path} ${e.note}`)]
      .join(' ')
      .toLowerCase()
    return hay.includes(query)
  })
  const isFiltered = !!query || picked.length > 0
  const endpointCount = filtered.reduce((n, p) => n + p.endpoints.length, 0)
  const clear = () => {
    setQ('')
    setFacets({})
  }

  return (
    <div className="api-store">
      {!current && (
        <button className="settings-back" type="button" onClick={onExit}>
          ‹ Back to Dashboard
        </button>
      )}
      <div className="api-head">
        <h1 className="page-title">API Store</h1>
        <div className="api-head-meta">
          <span>v1 · us-east-2</span>
          <a className="btn btn-outline" href={API_DOCS} target="_blank" rel="noopener noreferrer">
            OpenAPI Reference
          </a>
        </div>
      </div>

      <div className="api-body">
        <aside className="api-rail">
          {current ? (
            <>
              <div className="api-rail-title">Products</div>
              <div className="api-nav">
                {apiProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`api-nav-item${p.id === current.id ? ' is-on' : ''}`}
                    onClick={() => onOpen(p.id)}
                  >
                    <span>{p.name}</span>
                    <span className="api-nav-count">{p.endpoints.length}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="search-box api-search">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Filter catalog"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              {apiFacetGroups.map((g) => (
                <div key={g.title} className="api-facets">
                  <div className="api-rail-title">{g.title}</div>
                  {g.items.map((label) => {
                    const key = `${g.product}::${label}`
                    return (
                      <label key={key} className="api-check">
                        <input
                          type="checkbox"
                          checked={!!facets[key]}
                          onChange={() => setFacets((f) => ({ ...f, [key]: !f[key] }))}
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </aside>

        <div className="api-main">
          {current ? (
            <>
              <button className="settings-back" type="button" onClick={() => onOpen(null)}>
                ‹ All Products
              </button>
              <div className="api-detail-head">
                <div className="api-detail-copy">
                  <div className="api-detail-title">
                    <h2>{current.name}</h2>
                    <AccessTag subscribed={current.subscribed} />
                  </div>
                  <div className="api-fields">{current.fields}</div>
                  <p className="api-blurb">{current.blurb}</p>
                </div>
                {!current.subscribed && (
                  <button
                    type="button"
                    className={`btn ${requested[current.id] ? 'btn-outline' : 'btn-primary'}`}
                    disabled={requested[current.id]}
                    onClick={() => setRequested((r) => ({ ...r, [current.id]: true }))}
                  >
                    {requested[current.id] ? 'Access Requested' : 'Request Access'}
                  </button>
                )}
              </div>

              <div className="api-endpoints-meta">
                <span className="api-count">{plural(current.endpoints.length, 'endpoint')} · read only</span>
                <span>Base URL {API_BASE}</span>
              </div>

              <div className="api-endpoints">
                {current.endpoints.map((e) => {
                  const open = !!openPaths[e.path]
                  const request = curlFor(e.path)
                  const response = JSON.stringify(e.sample, null, 2)
                  return (
                    <div key={e.path} className="api-endpoint">
                      <button
                        type="button"
                        className="api-endpoint-row"
                        aria-expanded={open}
                        onClick={() => setOpenPaths((o) => ({ ...o, [e.path]: !o[e.path] }))}
                      >
                        <span className="api-method">GET</span>
                        <span className="api-path">{e.path}</span>
                        <span className="api-note">{e.note}</span>
                        <span className="api-toggle">{open ? 'Hide' : 'Sample'}</span>
                      </button>
                      {open && (
                        <div className="api-sample">
                          <div>
                            <div className="api-sample-head">
                              <span>Request</span>
                              <CopyButton text={request} />
                            </div>
                            <pre className="api-code is-wrap">{request}</pre>
                          </div>
                          <div>
                            <div className="api-sample-head">
                              <span>Response · 200</span>
                              <CopyButton text={response} />
                            </div>
                            <pre className="api-code">{response}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="api-results">
                <span className="api-count">
                  {isFiltered
                    ? `${filtered.length} of ${apiProducts.length} products · ${plural(endpointCount, 'endpoint')}`
                    : `${apiProducts.length} products · ${plural(endpointCount, 'endpoint')}`}
                </span>
                {isFiltered && (
                  <button type="button" className="api-link" onClick={clear}>
                    Clear Filters
                  </button>
                )}
              </div>

              {filtered.length === 0 ? (
                <div className="api-empty">
                  <div className="api-detail-title">
                    <h2>No products match</h2>
                  </div>
                  <p>Widen the filters or clear them to see the full catalog.</p>
                  <button type="button" className="btn btn-primary" onClick={clear}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="api-grid">
                  {filtered.map((p) => (
                    <div key={p.id} className="api-card">
                      <div className="api-card-top">
                        <div>
                          <div className="api-card-name">{p.name}</div>
                          <div className="api-fields">{p.fields}</div>
                        </div>
                        <AccessTag subscribed={p.subscribed} />
                      </div>
                      <p className="api-blurb">{p.blurb}</p>
                      <div className="api-preview">
                        {p.endpoints.slice(0, 3).map((e) => (
                          <div key={e.path}>{e.path}</div>
                        ))}
                      </div>
                      <div className="api-card-foot">
                        <span>{plural(p.endpoints.length, 'endpoint')}</span>
                        <button type="button" className="btn btn-outline" onClick={() => onOpen(p.id)}>
                          API List
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
