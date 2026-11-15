/** Tests for AnnouncementManagerOverlay's load states. */

import {act,} from 'react'
import {createRoot, type Root,} from 'react-dom/client'
import {afterEach, describe, expect, it, vi,} from 'vitest'

vi.mock('webextension-polyfill', () => ({
	default: {
		runtime: {sendMessage: vi.fn().mockResolvedValue({},), getURL: vi.fn((path: string,) => path),},
		storage: {local: {get: vi.fn().mockResolvedValue({},),},},
	},
}),)
vi.mock('../publish', () => ({getAnnouncements: vi.fn(), removeAnnouncement: vi.fn(),}),)
vi.mock('./AnnouncementBuilderPopup', () => ({openAnnouncementBuilder: vi.fn(),}),)
vi.mock('../../../shared/controls/ReactAlert', () => ({reactAlert: vi.fn(),}),)
vi.mock('../../../store/feedback', () => ({negativeTextFeedback: vi.fn(), positiveTextFeedback: vi.fn(),}),)
vi.mock('../../../shared/window/Backdrop', () => ({
	Backdrop: ({children,}: {children: React.ReactNode},) => <div>{children}</div>,
}),)
vi.mock('../../../shared/window/Window', () => ({
	Window: ({children, toolbar,}: {children: React.ReactNode; toolbar?: React.ReactNode},) => (
		<div>
			{toolbar}
			{children}
		</div>
	),
}),)

import {getAnnouncements,} from '../publish'
import {AnnouncementManagerOverlay,} from './AnnouncementManagerOverlay'
;(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

const roots: Root[] = []

afterEach(() => {
	for (const root of roots.splice(0,)) {
		act(() => root.unmount())
	}
	document.body.innerHTML = ''
	vi.clearAllMocks()
},)

async function renderOverlay () {
	const host = document.createElement('div',)
	document.body.appendChild(host,)
	const root = createRoot(host,)
	roots.push(root,)
	await act(async () => root.render(<AnnouncementManagerOverlay onClose={vi.fn()} />,))
	return host
}

describe('AnnouncementManagerOverlay', () => {
	it('shows a reported failure', async () => {
		vi.mocked(getAnnouncements,).mockResolvedValue({ok: false, reason: 'The wiki page is unreadable.',},)
		const host = await renderOverlay()
		expect(host.textContent,).toContain('The wiki page is unreadable.',)
	})

	it('shows an error instead of loading forever when the read throws', async () => {
		vi.mocked(getAnnouncements,).mockRejectedValue(new Error('network down',),)
		const host = await renderOverlay()
		expect(host.textContent,).not.toContain('Loading...',)
		expect(host.textContent,).toContain('network down',)
	})
})
