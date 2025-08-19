'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Code, Play, Copy, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { theme } from '@/config/theme'

export default function APIExplorerPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/albums/{albumId}')
  const [customUrl, setCustomUrl] = useState('/api/albums/{albumId}')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const endpoints = [
    { path: '/api/albums/{albumId}', method: 'GET', description: 'Get specific album by ID' },
    { path: '/api/albums/{albumId}/images', method: 'GET', description: 'Get album images' },
    { path: '/api/images/{imageId}', method: 'GET', description: 'Get single image' }
  ]

  const executeRequest = async () => {
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch(customUrl)
      const data = await res.json()
      setResponse(JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(JSON.stringify({
        error: 'Failed to fetch data',
        message: 'Make sure the URL is correct and the resource exists',
        url: customUrl
      }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const copyResponse = () => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.grayscale.background }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Code className="h-8 w-8" style={{ color: theme.accent.blue }} />
                <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>API Explorer</h1>
              </div>
              <p className="text-lg max-w-3xl" style={{ color: theme.grayscale.muted }}>
                Test ImageHost API endpoints directly in your browser. Perfect for exploring 
                the API before integrating it into your applications.
              </p>
            </div>
            <Link href="/api/docs">
              <Button
                variant="outline"
                className="flex items-center space-x-2"
                style={{
                  background: theme.grayscale.surface,
                  color: theme.accent.blue,
                  border: `1px solid ${theme.accent.blue}`,
                  fontWeight: 600,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = theme.accent.blue;
                  e.currentTarget.style.color = theme.grayscale.background;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = theme.grayscale.surface;
                  e.currentTarget.style.color = theme.accent.blue;
                }}
              >
                <ExternalLink className="h-4 w-4" style={{ color: 'inherit' }} />
                <span>View Docs</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Request Panel */}
          <div className="space-y-6">
            <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
              <CardHeader>
                <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Request</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.grayscale.muted }}>
                      Endpoint
                    </label>
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => {
                        setSelectedEndpoint(e.target.value)
                        setCustomUrl(e.target.value)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.grayscale.border}`,
                        borderRadius: 8,
                        background: theme.grayscale.background,
                        color: theme.grayscale.foreground,
                        fontSize: 16,
                        outline: 'none',
                        marginBottom: 0,
                      }}
                    >
                      {endpoints.map((endpoint) => (
                        <option key={endpoint.path} value={endpoint.path} style={{ color: theme.grayscale.foreground, background: theme.grayscale.background }}>
                          {endpoint.method} {endpoint.path} - {endpoint.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.grayscale.muted }}>
                      URL (Editable)
                    </label>
                    <input
                      type="text"
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}${customUrl}`}
                      onChange={(e) => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
                        const newUrl = e.target.value.replace(origin, '')
                        setCustomUrl(newUrl)
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.grayscale.border}`,
                        borderRadius: 8,
                        background: theme.grayscale.background,
                        color: theme.grayscale.foreground,
                        fontFamily: 'monospace',
                        fontSize: 15,
                        outline: 'none',
                      }}
                      placeholder="Enter API endpoint URL"
                    />
                    <p className="text-xs mt-1" style={{ color: theme.grayscale.muted }}>
                      Replace {'{albumId}'} and {'{imageId}'} with actual IDs
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.grayscale.muted }}>
                      Method
                    </label>
                    <div style={{
                      background: theme.accent.green + '22',
                      color: theme.accent.green,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 15,
                      fontWeight: 600,
                      display: 'inline-block',
                    }}>
                      GET
                    </div>
                  </div>

                  <Button 
                    onClick={executeRequest} 
                    loading={loading}
                    className="w-full flex items-center justify-center space-x-2"
                    style={{
                      background: theme.accent.blue,
                      color: theme.grayscale.background,
                      border: `1px solid ${theme.accent.blue}`,
                      fontWeight: 600,
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = theme.accent.purple;
                      e.currentTarget.style.borderColor = theme.accent.purple;
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = theme.accent.blue;
                      e.currentTarget.style.borderColor = theme.accent.blue;
                    }}
                  >
                    <Play className="h-4 w-4" />
                    <span>Execute Request</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* cURL Example */}
            <Card style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
              <CardHeader>
                <h3 className="text-lg font-semibold" style={{ color: theme.grayscale.foreground }}>cURL Example</h3>
              </CardHeader>
              <CardContent>
                <div style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, borderRadius: 8, padding: 16, overflowX: 'auto' }}>
                  <code className="text-sm">
                    curl -X GET "{typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}{customUrl}"
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Response Panel */}
          <div>
            <Card className="h-full" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Response</h2>
                  {response && (
                    <button
                      onClick={copyResponse}
                      style={{
                        padding: 8,
                        color: theme.accent.blue,
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        transition: 'color 0.2s',
                        cursor: 'pointer',
                      }}
                      title="Copy response"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" style={{ color: theme.accent.green }} />
                      ) : (
                        <Copy className="h-4 w-4" style={{ color: theme.accent.blue }} />
                      )}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {response ? (
                  <pre style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, borderRadius: 8, padding: 16, overflow: 'auto', fontSize: 14, height: 384 }}>
                    <code>{response}</code>
                  </pre>
                ) : (
                  <div style={{ background: theme.grayscale.subtle, borderRadius: 12, padding: 32, textAlign: 'center', height: 384, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>
                      <Code className="h-12 w-12" style={{ color: theme.grayscale.muted, margin: '0 auto 16px' }} />
                      <p style={{ color: theme.grayscale.muted }}>
                        Select an endpoint and click &quot;Execute Request&quot; to see the response
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="mt-8" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Quick Tips</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{ padding: 16, background: theme.accent.blue + '22', borderRadius: 12 }}>
                <h3 className="font-medium mb-2" style={{ color: theme.accent.blue }}>Get Album IDs</h3>
                <p className="text-sm" style={{ color: theme.accent.blue }}>
                  In your dashboard, click the <code style={{ background: theme.accent.blue + '33', padding: '0 4px', borderRadius: 4 }}>&lt;&gt;</code> icon next to any album to copy its ID for API testing.
                </p>
              </div>
              <div style={{ padding: 16, background: theme.accent.green + '22', borderRadius: 12 }}>
                <h3 className="font-medium mb-2" style={{ color: theme.accent.green }}>Public Only</h3>
                <p className="text-sm" style={{ color: theme.accent.green }}>
                  The API only returns data for public albums and images. Private content is protected.
                </p>
              </div>
              <div style={{ padding: 16, background: theme.accent.purple + '22', borderRadius: 12 }}>
                <h3 className="font-medium mb-2" style={{ color: theme.accent.purple }}>No Auth Required</h3>
                <p className="text-sm" style={{ color: theme.accent.purple }}>
                  These read-only endpoints don't require authentication. Perfect for public integrations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
