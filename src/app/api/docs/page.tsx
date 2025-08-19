import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { theme } from '@/config/theme'

export default function ApiDocsPage() {
  return (
    <div style={{ background: theme.grayscale.background, minHeight: '100vh' }} className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: theme.grayscale.foreground }}>API Documentation</h1>
        <p className="mt-1" style={{ color: theme.grayscale.muted }}>
          RESTful API endpoints for accessing public albums and images via our backend server
        </p>
      </div>

      {/* Overview */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardHeader>
          <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Overview</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p style={{ color: theme.grayscale.muted }}>
            The ImageHost API provides programmatic access to public albums and images through a dedicated Express.js backend server hosted on Render. 
            All endpoints return JSON responses and support CORS for browser-based applications.
          </p>
          <div style={{ background: theme.accent.blue + '22', border: `1px solid ${theme.accent.blue}55`, borderRadius: 12, padding: 16 }}>
            <h3 className="font-medium mb-2" style={{ color: theme.accent.blue }}>Base URL</h3>
            <code style={{ color: theme.accent.blue, background: theme.grayscale.background, padding: '2px 8px', borderRadius: 6 }}>
              {process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.onrender.com'}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardHeader>
          <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Authentication</h2>
        </CardHeader>
        <CardContent>
          <p style={{ color: theme.grayscale.muted }}>
            Currently, the API provides read-only access to public albums and images without authentication. 
            Private albums are not able to be accessed with the API service.
          </p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: theme.grayscale.foreground }}>Endpoints</h2>

        {/* Get Specific Album */}
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <span style={{ background: theme.accent.green + '22', color: theme.accent.green, padding: '2px 8px', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>GET</span>
              <code className="text-lg font-mono" style={{ color: theme.grayscale.foreground }}>/api/albums/{'{albumId}'}</code>
            </div>
            <p style={{ color: theme.grayscale.muted }}>Retrieve a specific public album by ID</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div style={{ background: theme.accent.blue + '22', border: `1px solid ${theme.accent.blue}55`, borderRadius: 12, padding: 16 }}>
              <h4 className="font-medium mb-2" style={{ color: theme.accent.blue }}>Getting Album IDs</h4>
              <p className="text-sm" style={{ color: theme.accent.blue }}>
                In your dashboard, click the <code style={{ background: theme.accent.blue + '33', padding: '0 4px', borderRadius: 4 }}>{'<>'}</code> icon next to any album to copy its ID for API use.
                This works for both public and private albums, but the API only returns data for public ones.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Path Parameters</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.grayscale.border}` }}>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Parameter</th>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Type</th>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Description</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: theme.grayscale.muted }}>
                    <tr>
                      <td className="py-2"><code>albumId</code></td>
                      <td className="py-2">string</td>
                      <td className="py-2">UUID of the album (copy from dashboard)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Example Request</h4>
              <div style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, padding: 16, borderRadius: 8, overflow: 'auto' }}>
                <code>GET /api/albums/123e4567-e89b-12d3-a456-426614174000</code>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Example Response</h4>
              <div style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, padding: 16, borderRadius: 8, overflow: 'auto' }}>
                <pre style={{ fontSize: 14 }}>
{`{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "My Public Album",
  "description": "A collection of photos",
  "is_public": true,
  "created_at": "2024-01-15T10:30:00Z"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Album Images */}
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <span style={{ background: theme.accent.green + '22', color: theme.accent.green, padding: '2px 8px', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>GET</span>
              <code className="text-lg font-mono" style={{ color: theme.grayscale.foreground }}>/api/albums/{'{albumId}'}/images</code>
            </div>
            <p style={{ color: theme.grayscale.muted }}>Retrieve all images from a specific album</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Path Parameters</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.grayscale.border}` }}>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Parameter</th>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Type</th>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Description</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: theme.grayscale.muted }}>
                    <tr>
                      <td className="py-2"><code>albumId</code></td>
                      <td className="py-2">string</td>
                      <td className="py-2">UUID of the album</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Example Response</h4>
              <div style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, padding: 16, borderRadius: 8, overflow: 'auto' }}>
                <pre style={{ fontSize: 14 }}>
{`[
  {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "album_id": "123e4567-e89b-12d3-a456-426614174000",
    "filename": "1641234567890-abc123",
    "original_name": "sunset.jpg",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "public_url": "https://storage.url/images/filename.jpg",
    "created_at": "2024-01-15T10:35:00Z"
  }
]`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Single Image */}
        <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <span style={{ background: theme.accent.green + '22', color: theme.accent.green, padding: '2px 8px', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>GET</span>
              <code className="text-lg font-mono" style={{ color: theme.grayscale.foreground }}>/api/images/{'{imageId}'}</code>
            </div>
            <p style={{ color: theme.grayscale.muted }}>Retrieve a specific image by ID</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Path Parameters</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.grayscale.border}` }}>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Parameter</th>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Type</th>
                      <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Description</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: theme.grayscale.muted }}>
                    <tr>
                      <td className="py-2"><code>imageId</code></td>
                      <td className="py-2">string</td>
                      <td className="py-2">UUID of the image</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Example Response</h4>
              <div style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, padding: 16, borderRadius: 8, overflow: 'auto' }}>
                <pre style={{ fontSize: 14 }}>
{`{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "album_id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "1641234567890-abc123",
  "original_name": "sunset.jpg",
  "file_size": 2048576,
  "mime_type": "image/jpeg",
  "public_url": "https://storage.url/images/filename.jpg",
  "alt_text": "Beautiful sunset over mountains",
  "created_at": "2024-01-15T10:35:00Z"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Responses */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardHeader>
          <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Error Responses</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>HTTP Status Codes</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.grayscale.border}` }}>
                    <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Status Code</th>
                    <th className="text-left py-2 font-medium" style={{ color: theme.grayscale.foreground }}>Description</th>
                  </tr>
                </thead>
                <tbody style={{ color: theme.grayscale.muted }}>
                  <tr>
                    <td className="py-2"><code>200</code></td>
                    <td className="py-2">Success</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>400</code></td>
                    <td className="py-2">Bad Request - Missing or invalid parameters</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>403</code></td>
                    <td className="py-2">Forbidden - Album is private</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>404</code></td>
                    <td className="py-2">Not Found - Resource does not exist</td>
                  </tr>
                  <tr>
                    <td className="py-2"><code>500</code></td>
                    <td className="py-2">Internal Server Error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Error Response Format</h4>
            <div style={{ background: theme.grayscale.background, color: theme.grayscale.foreground, padding: 16, borderRadius: 8, overflow: 'auto' }}>
              <pre style={{ fontSize: 14 }}>
{`{
  "error": "Album not found"
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card variant="elevated" style={{ background: theme.grayscale.surface, border: `1px solid ${theme.grayscale.border}` }}>
        <CardHeader>
          <h2 className="text-xl font-semibold" style={{ color: theme.grayscale.foreground }}>Rate Limiting & CORS</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>CORS Support</h4>
              <p style={{ color: theme.grayscale.muted }}>
                The API supports Cross-Origin Resource Sharing (CORS) and can be accessed from browser-based applications.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ color: theme.grayscale.foreground }}>Rate Limiting</h4>
              <p style={{ color: theme.grayscale.muted }}>
                Currently no rate limiting is implemented, but this may be added in the future for fair usage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}