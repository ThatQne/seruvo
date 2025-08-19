import Link from 'next/link'
import { theme } from '@/config/theme'

// Global not-found page used when a route calls notFound() or a segment is missing.
export default function NotFound() {
	return (
		<main
			style={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: theme.grayscale.background,
				padding: '2rem'
			}}
		>
			<div
				style={{
					maxWidth: 560,
					width: '100%',
					textAlign: 'center',
					background: theme.grayscale.surface,
					border: `1px solid ${theme.grayscale.border}`,
					borderRadius: 24,
					padding: '3rem 2.25rem',
					boxShadow: '0 4px 24px -4px rgba(0,0,0,0.25)'
				}}
			>
				<div style={{ fontSize: 80, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1, background: `linear-gradient(90deg, ${theme.accent.blue}, ${theme.accent.purple})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>404</div>
				<h1 style={{ marginTop: 24, fontSize: 28, fontWeight: 600, color: theme.grayscale.foreground }}>Page Not Found</h1>
				<p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: theme.grayscale.muted }}>
					The page you&apos;re trying to access doesn&apos;t exist or may have been moved.
					{" "}If you followed a link, it might be outdated.
				</p>
				<div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
					<Link
						href="/dashboard"
						style={{
							padding: '0.75rem 1.25rem',
							borderRadius: 12,
							fontWeight: 600,
							fontSize: 15,
							background: theme.accent.blue,
							color: theme.grayscale.background,
							textDecoration: 'none',
							border: `1px solid ${theme.accent.blue}`,
							transition: 'background .2s, border-color .2s'
						}}
					>
						Go to Dashboard
					</Link>
					<Link
						href="/"
						style={{
							padding: '0.75rem 1.25rem',
							borderRadius: 12,
							fontWeight: 600,
							fontSize: 15,
							background: theme.grayscale.surface,
							color: theme.grayscale.foreground,
							textDecoration: 'none',
							border: `1px solid ${theme.grayscale.border}`,
							transition: 'background .2s, border-color .2s'
						}}
					>
						Home
					</Link>
				</div>
				<p style={{ marginTop: 40, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: theme.grayscale.muted }}>
					/dashboard/not-found
				</p>
			</div>
		</main>
	)
}

