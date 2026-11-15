/** Tests for ProposalTargetPreview's rendering of the target's body. */

import {act,} from 'react'
import {createRoot, type Root,} from 'react-dom/client'
import {afterEach, describe, expect, it, vi,} from 'vitest'

vi.mock('webextension-polyfill', () => ({
	default: {
		runtime: {sendMessage: vi.fn().mockResolvedValue({},), getURL: vi.fn((path: string,) => path),},
		storage: {local: {get: vi.fn().mockResolvedValue({},),},},
	},
}),)

import {ProposalTargetPreview, type TargetState,} from './ProposalTargetPreview'
;(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

const roots: Root[] = []

afterEach(() => {
	for (const root of roots.splice(0,)) {
		act(() => root.unmount())
	}
	document.body.innerHTML = ''
},)

function renderLoaded (rawBody: string,) {
	const host = document.createElement('div',)
	document.body.appendChild(host,)
	const root = createRoot(host,)
	roots.push(root,)
	const info = {kind: 'comment', author: 'someone', raw_body: rawBody, userReports: [], modReports: [],}
	const state = {phase: 'loaded', info, retry: () => {},} as unknown as TargetState
	act(() => root.render(<ProposalTargetPreview state={state} />,))
	return host
}

describe('ProposalTargetPreview', () => {
	it('renders the target\'s markdown', () => {
		const host = renderLoaded('Some **bold** words',)
		expect(host.querySelector('strong',)?.textContent,).toBe('bold',)
	})

	it('shows form markup in a post as text rather than live controls', () => {
		// Any Reddit user writes this body; the removal-reason whitelist (inputs, selects) must not apply.
		const host = renderLoaded('<input value="type your password"> <select><option>a</option></select>',)
		expect(host.querySelector('input, select, textarea',),).toBeNull()
		expect(host.textContent,).toContain('<input value="type your password">',)
	})
})
