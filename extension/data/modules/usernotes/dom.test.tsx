/** Tests for Usernotes DOM popup-open latency, store hydration, and save wiring. */

import {act,} from 'react'
import {createRoot, type Root,} from 'react-dom/client'
import {afterEach, beforeEach, describe, expect, it, vi,} from 'vitest'

const getCurrentUser = vi.hoisted(() => vi.fn(async () => 'activemod'))
const isModSub = vi.hoisted(() => vi.fn(async () => true))
const getModeratorListResult = vi.hoisted(() =>
	vi.fn(async () => ({targetIsMod: false, currentUserPermissions: ['all',],}))
)
const getApiThingInfo = vi.hoisted(() => vi.fn())
const lacksWikiAccess = vi.hoisted(() => vi.fn(async () => false))
const resolveWikiLayout = vi.hoisted(() =>
	vi.fn(async () => ({subreddit: 'testsub', state: 'nxg', compatibilityWrites: true,}))
)
const getConfig = vi.hoisted(() => vi.fn(async () => undefined))
const proposeOrBan = vi.hoisted(() => vi.fn(async () => {},))
const getUserNotes = vi.hoisted(() => vi.fn())
const getSubredditColors = vi.hoisted(() => vi.fn())
const updateUserNotes = vi.hoisted(() => vi.fn())
const showAddUserNotePopup = vi.hoisted(() => vi.fn())
const logError = vi.hoisted(() => vi.fn())
const logWarn = vi.hoisted(() => vi.fn())

let capturedLocationRenderer:
	| ((args: {context: Record<string, unknown>; target: Element},) => React.ReactNode)
	| undefined

vi.mock('webextension-polyfill', () => ({
	default: {runtime: {sendMessage: vi.fn(), getURL: (p: string,) => p,},},
}),)
vi.mock('../../api/resources/me', () => ({getCurrentUser,}),)
vi.mock('../../api/resources/modSubs', () => ({isModSub,}),)
vi.mock('../../api/resources/relationships', () => ({getModeratorListResult,}),)
vi.mock('../../api/resources/users', () => ({aboutUser: vi.fn(), getUserActivity: vi.fn(),}),)
vi.mock('../../api/resources/wiki', () => ({readFromWiki: vi.fn(),}),)
vi.mock('../../api/transport/http', () => ({getRatelimit: vi.fn(),}),)
vi.mock('../../dom/uiLocations', () => ({
	renderAtLocation: vi.fn(
		(_loc: string, _opts: unknown, renderer: typeof capturedLocationRenderer,) => {
			capturedLocationRenderer = renderer
			return vi.fn()
		},
	),
}),)
vi.mock('../../shared/controls/ReactAlert', () => ({reactAlert: vi.fn(async () => false),}),)
vi.mock('../../store/contextMenu', () => ({addContextItem: vi.fn(), removeContextItem: vi.fn(),}),)
vi.mock('../../store/feedback', () => ({
	negativeTextFeedback: vi.fn(),
	neutralTextFeedback: vi.fn(),
	positiveTextFeedback: vi.fn(),
}),)
vi.mock('../../store/index', () => ({
	default: {dispatch: vi.fn(), getState: vi.fn(() => ({settings: {values: {},},})), subscribe: vi.fn(),},
}),)
vi.mock('../../store/spinnerSlice', () => ({startSpinner: vi.fn(), stopSpinner: vi.fn(),}),)
vi.mock('../../util/infra/logging', () => ({
	default: () => ({error: logError, warn: logWarn, info: vi.fn(), debug: vi.fn(),}),
}),)
vi.mock('../../util/reddit/thingInfo', () => ({getApiThingInfo,}),)
vi.mock('../../util/ui/drawPosition', () => ({drawPosition: () => ({topPosition: 10, left: 20,}),}),)
vi.mock('../../util/ui/navigation', () => ({navigateToSubredditPage: vi.fn(), reloadPage: vi.fn(),}),)
vi.mock('../../util/wiki/schemas/usernotes/sharded', () => ({getSessionStorageInfo: vi.fn(),}),)
vi.mock('../../util/wiki/wikiAccess', () => ({lacksWikiAccess,}),)
vi.mock('../../util/wiki/wikiPaths', () => ({resolveWikiLayout,}),)
vi.mock('../config/moduleapi', () => ({getConfig,}),)
vi.mock('../shared/proposals/gateway', () => ({proposeOrBan,}),)
vi.mock('../shared/usernotes/moduleapi', async (importOriginal,) => {
	const actual = await importOriginal<typeof import('../shared/usernotes/moduleapi')>()
	return {
		...actual,
		getSubredditColors,
		getUserNotes,
		updateUserNotes,
	}
},)
vi.mock('./components/AddUserNotePopup', () => ({showAddUserNotePopup,}),)
vi.mock('./components/UserNotesManagerOverlay', () => ({showUserNotesManagerOverlay: vi.fn(),}),)
vi.mock('./components/UsernoteTag', () => ({
	UsernoteTag: ({defaultText, onNoteTagClick,}: {defaultText: string; onNoteTagClick: () => void},) => (
		<button type="button" onClick={onNoteTagClick}>{defaultText}</button>
	),
}),)
;(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

import type {UserNotesData,} from '../../util/wiki/schemas/usernotes/schema'
import {clearMessageLinks, rememberMessageLink,} from '../shared/usernotes/messageLinkCache'
import {getSubredditNotes, publishSubredditNotes,} from '../shared/usernotes/store'
import {createNotesDisplay,} from './dom'

const roots: Root[] = []

function makeNotesData (noteText = 'existing note',): UserNotesData {
	return {
		ver: 6,
		types: [{key: 'spam', text: 'Spam', color: 'red',},],
		users: {
			alice: {
				name: 'alice',
				notes: [{index: 0, note: noteText, time: 1_700_000_000, mod: 'mod1', type: 'spam', link: '',},],
				nextIndex: 1,
			},
		},
	}
}

function defaultSettings () {
	return {
		maxChars: 20,
		showDate: false,
		showOnModPages: true,
		unManagerLink: true,
		closePopupAfterNoteSave: true,
		requireNoteType: false,
		requireNoteText: true,
		requireNoteLink: false,
	}
}

async function mountNoteTag (context: Record<string, unknown>,) {
	const host = document.createElement('div',)
	const target = document.createElement('span',)
	document.body.appendChild(host,)
	const root = createRoot(host,)
	roots.push(root,)

	const element = capturedLocationRenderer!({context, target,},)
	await act(async () => {
		root.render(element as React.ReactElement,)
		await Promise.resolve()
		await Promise.resolve()
	},)

	return host
}

beforeEach(() => {
	capturedLocationRenderer = undefined
	clearMessageLinks()
	// Reset store entry for the test subreddit between tests.
	publishSubredditNotes('testsub', undefined as never,)
	getCurrentUser.mockResolvedValue('activemod',)
	isModSub.mockResolvedValue(true,)
	lacksWikiAccess.mockResolvedValue(false,)
	getModeratorListResult.mockResolvedValue({targetIsMod: false, currentUserPermissions: ['all',],},)
	resolveWikiLayout.mockResolvedValue({subreddit: 'testsub', state: 'nxg', compatibilityWrites: true,},)
	getConfig.mockResolvedValue(undefined,)
	getSubredditColors.mockResolvedValue([{key: 'spam', text: 'Spam', color: 'red',},],)
	getUserNotes.mockResolvedValue(makeNotesData(),)
	updateUserNotes.mockImplementation(async (_sub: string, transform: (n: UserNotesData,) => string | undefined,) => {
		const data = makeNotesData()
		transform(data,)
		return data
	},)
},)

afterEach(() => {
	for (const root of roots.splice(0,)) {
		act(() => root.unmount())
	}
	document.body.innerHTML = ''
	vi.clearAllMocks()
},)

describe('createNotesDisplay (AddUserNotePopup wiring)', () => {
	it('mounts AddUserNotePopup immediately without waiting for thing or mod lookups', async () => {
		publishSubredditNotes('testsub', {
			notes: makeNotesData('cached note',),
			colors: [{key: 'spam', text: 'Spam', color: 'red',},],
		},)
		let resolveThing!: (val: unknown,) => void
		let resolveMod!: (val: {targetIsMod: boolean; currentUserPermissions: string[]},) => void
		getApiThingInfo.mockImplementation(() =>
			new Promise((r,) => {
				resolveThing = r
			},)
		)
		getModeratorListResult.mockImplementation(() =>
			new Promise((r,) => {
				resolveMod = r
			},)
		)

		const display = createNotesDisplay(defaultSettings(),)
		const host = await mountNoteTag({author: 'alice', subreddit: 'testsub', thingId: 't3_abc',},)
		const button = host.querySelector('button',)
		expect(button,).not.toBeNull()

		await act(async () => {
			button!.click()
			await Promise.resolve()
			await Promise.resolve()
		},)

		expect(showAddUserNotePopup,).toHaveBeenCalledOnce()
		expect(getSubredditColors,).not.toHaveBeenCalled()
		const popupProps = showAddUserNotePopup.mock.calls[0]![0] as {
			initialNotes: Array<{note: string}>
			mayHaveMessageLink: boolean
			resolveTargetIsMod: () => Promise<boolean>
			resolveThingContext: () => Promise<{messageLink?: string} | undefined>
		}
		expect(popupProps.initialNotes.map((n,) => n.note),).toEqual(['cached note',],)
		expect(popupProps.mayHaveMessageLink,).toBe(false,)

		// Finish pending async lookups cleanly.
		resolveMod({targetIsMod: true, currentUserPermissions: [],},)
		resolveThing({permalink: 'https://www.reddit.com/r/testsub/comments/abc/-/', title: 'Title',},)
		await expect(popupProps.resolveTargetIsMod(),).resolves.toBe(true,)
		await expect(popupProps.resolveThingContext(),).resolves.toMatchObject({
			banTokenInfo: expect.objectContaining({title: 'Title',},),
		},)
		await display.cleanup()
	})

	it('warm store: uses cache-respecting onRefreshNotes that skips re-publish when unchanged and updates when newer', async () => {
		const cachedNotes = makeNotesData('initial note',)
		const colors = [{key: 'spam', text: 'Spam', color: 'red',},]
		publishSubredditNotes('testsub', {notes: cachedNotes, colors,},)

		const display = createNotesDisplay(defaultSettings(),)
		await display.openNotesPopup('testsub', 'alice', '', true, {top: 0, left: 0,},)

		const popupProps = showAddUserNotePopup.mock.calls[0]![0] as {
			onRefreshNotes?: () => Promise<unknown>
		}
		expect(popupProps.onRefreshNotes,).toBeDefined()

		// Same reference returned from cache -> undefined (no redundant re-render).
		getUserNotes.mockResolvedValueOnce(cachedNotes,)
		await expect(popupProps.onRefreshNotes!(),).resolves.toBeUndefined()
		expect(getUserNotes,).toHaveBeenCalledWith('testsub',)

		// Newer dataset from noteCache/wiki -> updates store and returns new notes.
		const fresherNotes = makeNotesData('note from other tab',)
		getUserNotes.mockResolvedValueOnce(fresherNotes,)
		const refreshed = await popupProps.onRefreshNotes!()
		expect(refreshed,).toEqual([expect.objectContaining({note: 'note from other tab',},),],)
		expect(getSubredditNotes('testsub',)?.notes,).toBe(fresherNotes,)
		await display.cleanup()
	})

	it('cold store: hydrates notes and colors in one getUserNotes call, or falls back cleanly on no_page', async () => {
		const display = createNotesDisplay(defaultSettings(),)
		const coldNotes = makeNotesData('hydrated note',)
		getUserNotes.mockResolvedValueOnce(coldNotes,)

		await display.openNotesPopup('testsub', 'alice', '', true, {top: 0, left: 0,},)

		expect(getUserNotes,).toHaveBeenCalledTimes(1,)
		expect(getSubredditColors,).not.toHaveBeenCalled()
		const firstProps = showAddUserNotePopup.mock.calls[0]![0] as {
			initialNotes: Array<{note: string}>
			onRefreshNotes?: unknown
		}
		expect(firstProps.initialNotes.map((n,) => n.note),).toEqual(['hydrated note',],)
		expect(firstProps.onRefreshNotes,).toBeUndefined()

		// Reset store to cold and simulate a noteless subreddit.
		publishSubredditNotes('testsub', undefined as never,)
		showAddUserNotePopup.mockClear()
		getUserNotes.mockRejectedValueOnce(new Error('no_page',),)
		getSubredditColors.mockResolvedValueOnce([{key: 'default', text: 'Default', color: 'blue',},],)

		await display.openNotesPopup('testsub', 'alice', '', true, {top: 0, left: 0,},)

		const secondProps = showAddUserNotePopup.mock.calls[0]![0] as {
			initialNotes: unknown[]
			onRefreshNotes?: unknown
			colors: Array<{key: string}>
		}
		expect(secondProps.initialNotes,).toEqual([],)
		expect(secondProps.onRefreshNotes,).toBeUndefined()
		expect(secondProps.colors[0]?.key,).toBe('default',)
		expect(logError,).not.toHaveBeenCalled()
		await display.cleanup()
	})

	it('onSave awaits thingPromise for normalized permalink and removal message link, falling back if thing fetch fails', async () => {
		publishSubredditNotes('testsub', {
			notes: makeNotesData(),
			colors: [{key: 'autoban', text: 'Auto Ban', color: 'red', banDuration: 7,},],
		},)
		const normalizedUrl = 'https://www.reddit.com/r/testsub/comments/abc/-/xyz/'
		rememberMessageLink([normalizedUrl,], 'https://www.reddit.com/mail/perma/m1',)
		getApiThingInfo.mockResolvedValueOnce({permalink: normalizedUrl, title: 'Post Title',},)

		const display = createNotesDisplay(defaultSettings(),)
		const host = await mountNoteTag({
			author: 'alice',
			subreddit: 'testsub',
			thingId: 't1_xyz',
			permalink: '/r/testsub/comments/abc/slug/xyz/',
		},)
		await act(async () => {
			host.querySelector('button',)!.click()
			await Promise.resolve()
			await Promise.resolve()
		},)

		const popupProps = showAddUserNotePopup.mock.calls[0]![0] as {
			mayHaveMessageLink: boolean
			onSave: (data: {
				note: string
				type: string | undefined
				includeLink: boolean
				includeMessageLink: boolean
				triggerBan: boolean
				banMessage: string
			},) => Promise<{link?: string; messageLink?: string} | undefined>
		}
		expect(popupProps.mayHaveMessageLink,).toBe(true,)
		// Even with includeLink=false and triggerBan=false, includeMessageLink=true resolves thingPromise.
		const saved = await popupProps.onSave({
			note: 'warn',
			type: 'autoban',
			includeLink: false,
			includeMessageLink: true,
			triggerBan: false,
			banMessage: '',
		},)
		expect(saved?.messageLink,).toBe('https://www.reddit.com/mail/perma/m1',)

		// When getApiThingInfo rejects, fallback preserves context.permalink.
		showAddUserNotePopup.mockClear()
		getApiThingInfo.mockRejectedValueOnce(new Error('api error',),)
		await act(async () => {
			host.querySelector('button',)!.click()
			await Promise.resolve()
			await Promise.resolve()
		},)
		const fallbackProps = showAddUserNotePopup.mock.calls[0]![0] as typeof popupProps
		const fallbackSaved = await fallbackProps.onSave({
			note: 'fallback note',
			type: 'autoban',
			includeLink: true,
			includeMessageLink: false,
			triggerBan: false,
			banMessage: '',
		},)
		expect(fallbackSaved?.link,).toBe('/r/testsub/comments/abc/slug/xyz/',)
		expect(logWarn,).toHaveBeenCalled()
		await display.cleanup()
	})
})
