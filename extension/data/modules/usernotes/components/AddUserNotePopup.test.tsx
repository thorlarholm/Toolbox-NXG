/** Tests for AddUserNotePopup. */

import {act,} from 'react'
import {createRoot, type Root,} from 'react-dom/client'
import {afterEach, describe, expect, it, vi,} from 'vitest'

let settingValues = vi.hoisted(() => ({
	closePopupAfterNoteSave: true,
	// Personal usernote save-requirement settings, at their shipped defaults.
	requireNoteType: false,
	requireNoteText: true,
	requireNoteLink: false,
}))

vi.mock('../../../util/ui/reactMount', () => ({
	classes: (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean,).join(' ',),
	mountPopup: vi.fn(),
}),)
vi.mock('../../../util/ui/hooks', async (importOriginal,) => ({
	...(await importOriginal<typeof import('../../../util/ui/hooks')>()),
	useSetting: (_moduleName: string, settingName: keyof typeof settingValues, defaultValue: unknown,) =>
		settingValues[settingName] ?? defaultValue,
}),)
vi.mock(
	'../../../store',
	() => ({default: {dispatch: vi.fn(), getState: vi.fn(() => ({settings: {values: {},},})), subscribe: vi.fn(),},}),
)
vi.mock('../../../store/feedback', () => ({
	negativeTextFeedback: vi.fn(),
	positiveTextFeedback: vi.fn(),
}),)
vi.mock('../../../util/infra/logging', () => ({default: () => ({error: vi.fn(),}),}),)
;(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true

import type {ExistingNote, UserNoteColor,} from '../../../util/wiki/schemas/usernotes/schema'
import {AddUserNotePopup,} from './AddUserNotePopup'

const roots: Root[] = []

const colors: UserNoteColor[] = [
	{key: 'spam', text: 'Spam', color: 'red',},
	{key: 'ban', text: 'Ban', color: 'darkred',},
]

function renderPopup (props: Partial<React.ComponentProps<typeof AddUserNotePopup>> = {},) {
	const host = document.createElement('div',)
	document.body.appendChild(host,)
	const root = createRoot(host,)
	roots.push(root,)

	const defaultProps: React.ComponentProps<typeof AddUserNotePopup> = {
		subreddit: 'testsub',
		user: 'alice',
		disableLink: false,
		initialPosition: {top: 0, left: 0,},
		colors,
		initialNotes: [],
		findColor: (key,) => colors.find((color,) => color.key === key) ?? {key: 'none', text: '', color: '',},
		onSave: vi.fn(),
		onEditNote: vi.fn(),
		onRemoveNote: vi.fn(),
		onClose: vi.fn(),
	}

	act(() => {
		root.render(<AddUserNotePopup {...defaultProps} {...props} />,)
	},)

	return host
}

function setNoteInputValue (host: HTMLElement, value: string,) {
	const input = host.querySelector<HTMLInputElement>('input[placeholder="Add a note..."]',)!
	act(() => {
		const valueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input,), 'value',)?.set
		valueSetter?.call(input, value,)
		input.dispatchEvent(new InputEvent('input', {bubbles: true, data: value,},),)
	},)
}

function clickByText (host: HTMLElement, text: string,) {
	const button = Array.from(host.querySelectorAll('button',),).find((button,) => button.textContent === text)
	expect(button,).toBeDefined()
	act(() => {
		button!.dispatchEvent(new MouseEvent('click', {bubbles: true,},),)
	},)
}

async function clickByTextAsync (host: HTMLElement, text: string,) {
	const button = Array.from(host.querySelectorAll('button',),).find((button,) => button.textContent === text)
	expect(button,).toBeDefined()
	await act(async () => {
		button!.dispatchEvent(new MouseEvent('click', {bubbles: true,},),)
		await Promise.resolve()
	},)
}

afterEach(() => {
	for (const root of roots.splice(0,)) {
		act(() => root.unmount())
	}
	document.body.innerHTML = ''
	settingValues = {
		closePopupAfterNoteSave: true,
		requireNoteType: false,
		requireNoteText: true,
		requireNoteLink: false,
	}
	vi.clearAllMocks()
},)

/** Finds the Toolbox-note Save button (its label varies by subreddit). */
function getSaveButton (host: HTMLElement,) {
	return Array.from(host.querySelectorAll('button',),)
		.find((button,) => button.textContent === 'Save for /r/testsub') as HTMLButtonElement
}

describe('AddUserNotePopup', () => {
	it('closes by default after saving a Toolbox note', async () => {
		const onSave = vi.fn().mockResolvedValue(
			{
				id: 1234567890000,
				type: 'spam',
				note: 'new note',
				mod: 'mod1',
				time: 1234567890123,
				link: '',
			} satisfies ExistingNote,
		)
		const onClose = vi.fn()
		const host = renderPopup({onSave, onClose,},)

		setNoteInputValue(host, 'new note',)
		await clickByTextAsync(host, 'Save for /r/testsub',)

		await vi.waitFor(() => expect(onSave,).toHaveBeenCalled())
		expect(onClose,).toHaveBeenCalledOnce()
		expect(host.querySelector('button[aria-label="Edit note"]',),).toBeNull()
	})

	it('offers the include-removal-message-link toggle when a message link is available', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({onSave, messageLink: 'https://www.reddit.com/mail/perma/abc',},)

		const label = Array.from(host.querySelectorAll('label',),)
			.find((label,) => label.textContent === 'Include removal message link')
		expect(label,).toBeDefined()
		const checkbox = label!.querySelector<HTMLInputElement>('input[type="checkbox"]',)!
		expect(checkbox.checked,).toBe(true,)

		setNoteInputValue(host, 'new note',)
		await clickByTextAsync(host, 'Save for /r/testsub',)

		await vi.waitFor(() =>
			expect(onSave,).toHaveBeenCalledWith(expect.objectContaining({includeMessageLink: true,},),)
		)
	})

	it('reports includeMessageLink false when the toggle is unchecked', async () => {
		const onSave = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({onSave, messageLink: 'https://www.reddit.com/mail/perma/abc',},)

		const label = Array.from(host.querySelectorAll('label',),)
			.find((label,) => label.textContent === 'Include removal message link')
		const checkbox = label!.querySelector<HTMLInputElement>('input[type="checkbox"]',)!
		act(() => {
			checkbox.click()
		},)

		setNoteInputValue(host, 'new note',)
		await clickByTextAsync(host, 'Save for /r/testsub',)

		await vi.waitFor(() =>
			expect(onSave,).toHaveBeenCalledWith(expect.objectContaining({includeMessageLink: false,},),)
		)
	})

	it('hides the include-removal-message-link toggle when no message link is available', () => {
		const host = renderPopup()

		expect(host.textContent,).not.toContain('Include removal message link',)
	})

	it('renders a removal message link on notes that have one', () => {
		const host = renderPopup({
			initialNotes: [{
				id: 0,
				type: '',
				note: 'removed thing',
				mod: 'mod1',
				time: 1234567890123,
				messageLink: 'https://www.reddit.com/mail/perma/abc',
			},],
		},)

		const anchor = host.querySelector<HTMLAnchorElement>('a[aria-label="View removal message"]',)
		expect(anchor?.getAttribute('href',),).toBe('https://www.reddit.com/mail/perma/abc',)
	})

	it('keeps the popup open after saving and prepends an editable note', async () => {
		settingValues = {...settingValues, closePopupAfterNoteSave: false,}
		const savedNote: ExistingNote = {
			id: 1234567890000,
			type: 'spam',
			note: 'new note',
			mod: 'mod1',
			time: 1234567890123,
			link: '',
		}
		const onSave = vi.fn().mockResolvedValue(savedNote,)
		const onClose = vi.fn()
		const host = renderPopup({onSave, onClose,},)

		clickByText(host, 'Spam',)
		setNoteInputValue(host, 'new note',)
		await clickByTextAsync(host, 'Save for /r/testsub',)

		await vi.waitFor(() =>
			expect(onSave,).toHaveBeenCalledWith({
				note: 'new note',
				type: 'spam',
				includeLink: true,
				includeMessageLink: false,
				triggerBan: false,
				banMessage: '',
			},)
		)
		await vi.waitFor(() => expect(host.textContent,).toContain('new note',))

		expect(onClose,).not.toHaveBeenCalled()
		expect(host.querySelector('button[aria-label="Edit note"]',),).not.toBeNull()
	})

	it('prefills and saves edits for notes created in the current session', async () => {
		settingValues = {...settingValues, closePopupAfterNoteSave: false,}
		const savedNote: ExistingNote = {
			id: 1234567890000,
			type: 'spam',
			note: 'typo',
			mod: 'mod1',
			time: 1234567890123,
			link: '',
		}
		const onSave = vi.fn().mockResolvedValue(savedNote,)
		const onEditNote = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({onSave, onEditNote,},)

		setNoteInputValue(host, 'typo',)
		await clickByTextAsync(host, 'Save for /r/testsub',)
		await vi.waitFor(() => expect(host.querySelector('button[aria-label="Edit note"]',),).not.toBeNull())

		act(() => {
			host.querySelector('button[aria-label="Edit note"]',)!.dispatchEvent(
				new MouseEvent('click', {bubbles: true,},),
			)
		},)
		expect(host.querySelector<HTMLInputElement>('input[placeholder="Add a note..."]',)?.value,).toBe(
			'typo',
		)

		clickByText(host, 'Ban',)
		setNoteInputValue(host, 'corrected',)
		await clickByTextAsync(host, 'Save Edit',)

		await vi.waitFor(() =>
			expect(onEditNote,).toHaveBeenCalledWith(1234567890000, {
				note: 'corrected',
				type: 'ban',
			},)
		)
		await vi.waitFor(() => expect(host.textContent,).toContain('corrected',))
	})

	it('does not expose edit actions for initial notes', () => {
		const host = renderPopup({
			initialNotes: [{
				id: 1234567890000,
				type: 'spam',
				note: 'existing note',
				mod: 'mod1',
				time: 1234567890123,
				link: '',
			},],
		},)

		expect(host.textContent,).toContain('existing note',)
		expect(host.querySelector('button[aria-label="Edit note"]',),).toBeNull()
	})

	it('replaces initial notes with refreshed Toolbox notes after opening', async () => {
		const onRefreshNotes = vi.fn().mockResolvedValue([
			{
				id: 1234567890000,
				type: 'spam',
				note: 'fresh note',
				mod: 'mod1',
				time: 1234567890123,
				link: '',
			} satisfies ExistingNote,
		],)
		const host = renderPopup({onRefreshNotes,},)

		expect(host.textContent,).toContain('No Toolbox notes for this user.',)
		await vi.waitFor(() => expect(onRefreshNotes,).toHaveBeenCalledOnce())
		await vi.waitFor(() => expect(host.textContent,).toContain('fresh note',))
	})

	it('hides archived notes by default with a reveal toggle', () => {
		const host = renderPopup({
			archivingAvailable: true,
			initialNotes: [
				{id: 0, type: '', note: 'active note', mod: 'mod1', time: 1000,},
				{
					id: 1,
					type: '',
					note: 'hidden archived entry',
					mod: 'mod1',
					time: 2000,
					archived: {by: 'mod2', at: 3000,},
				},
			],
		},)

		expect(host.textContent,).toContain('active note',)
		expect(host.textContent,).not.toContain('hidden archived entry',)

		clickByText(host, 'Show archived notes (1)',)

		expect(host.textContent,).toContain('hidden archived entry',)
		expect(host.textContent,).toContain('archived by /u/mod2',)
	})

	it('renders the 6.x sentinel attribution for legacy-deleted archives', () => {
		const host = renderPopup({
			archivingAvailable: true,
			initialNotes: [
				{id: 0, type: '', note: 'note', mod: 'mod1', time: 1000, archived: {by: '[6.x]', at: 2000,},},
			],
		},)

		clickByText(host, 'Show archived notes (1)',)
		expect(host.textContent,).toContain('archived via 6.x delete',)
	})

	it('archives a note via the archive action and marks it locally', async () => {
		const onArchiveNote = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({
			archivingAvailable: true,
			currentUser: 'me',
			onArchiveNote,
			initialNotes: [{id: 5, type: '', note: 'to archive', mod: 'mod1', time: 1000,},],
		},)

		const archiveButton = host.querySelector<HTMLButtonElement>('button[title="archive note"]',)!
		await act(async () => {
			archiveButton.dispatchEvent(new MouseEvent('click', {bubbles: true,},),)
			await Promise.resolve()
		},)

		expect(onArchiveNote,).toHaveBeenCalledWith(5,)
		// The note is hidden now (archived) and the toggle reflects it.
		expect(host.textContent,).not.toContain('to archive',)
		expect(host.textContent,).toContain('Show archived notes (1)',)
	})

	it('deleting a note removes it from the list outright', async () => {
		const onRemoveNote = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({
			archivingAvailable: true,
			currentUser: 'me',
			onRemoveNote,
			initialNotes: [{id: 7, type: '', note: 'will be removed', mod: 'mod1', time: 1000,},],
		},)

		const deleteButton = host.querySelector<HTMLButtonElement>('button[title="delete note"]',)!
		await act(async () => {
			deleteButton.dispatchEvent(new MouseEvent('click', {bubbles: true,},),)
			await Promise.resolve()
		},)

		expect(onRemoveNote,).toHaveBeenCalledWith(7,)
		// Real deletion: the note is gone, with no archived/deleted toggle.
		expect(host.textContent,).not.toContain('will be removed',)
		expect(host.textContent,).not.toContain('Show archived notes',)
	})

	it('offers no archive actions when archiving is unavailable', () => {
		const host = renderPopup({
			initialNotes: [{id: 0, type: '', note: 'legacy note', mod: 'mod1', time: 1000,},],
		},)

		expect(host.querySelector('button[title="archive note"]',),).toBeNull()
		expect(host.querySelector('button[title="delete note"]',),).not.toBeNull()
	})

	it('disables save until the note has text', () => {
		const onSave = vi.fn()
		const host = renderPopup({onSave,},)

		const saveButton = Array.from(host.querySelectorAll('button',),)
			.find((button,) => button.textContent === 'Save for /r/testsub') as HTMLButtonElement
		// Text is required by default, so an empty note can't be saved.
		expect(saveButton.disabled,).toBe(true,)
		clickByText(host, 'Save for /r/testsub',)
		expect(onSave,).not.toHaveBeenCalled()

		// Entering text satisfies the requirement and enables the button.
		setNoteInputValue(host, 'a real note',)
		expect(saveButton.disabled,).toBe(false,)
	})

	it('keeps save disabled until a type is picked when the subreddit requires one', () => {
		const host = renderPopup({subRequire: {type: true, text: false, link: false, mode: 'force',},},)

		// Text alone no longer satisfies the requirements: a type is still missing.
		setNoteInputValue(host, 'a real note',)
		const saveButton = getSaveButton(host,)
		expect(saveButton.disabled,).toBe(true,)

		// Selecting a type satisfies the subreddit's requirement.
		clickByText(host, 'Spam',)
		expect(saveButton.disabled,).toBe(false,)
	})

	it('keeps save disabled while the link is unchecked when the subreddit requires one', () => {
		const host = renderPopup({subRequire: {type: false, text: false, link: true, mode: 'force',},},)

		setNoteInputValue(host, 'a real note',)
		const saveButton = getSaveButton(host,)
		// "Include link" defaults on, so the link requirement starts satisfied.
		expect(saveButton.disabled,).toBe(false,)

		const linkCheckbox = Array.from(host.querySelectorAll('label',),)
			.find((label,) => label.textContent === 'Include link')!
			.querySelector<HTMLInputElement>('input[type="checkbox"]',)!
		act(() => {
			linkCheckbox.click()
		},)
		expect(saveButton.disabled,).toBe(true,)

		act(() => {
			linkCheckbox.click()
		},)
		expect(saveButton.disabled,).toBe(false,)
	})

	it('allows a type-only note with no text when text is not required', () => {
		// Moderator has turned off their personal "require note text" setting.
		settingValues.requireNoteText = false
		const host = renderPopup()

		const saveButton = getSaveButton(host,)
		// Nothing entered at all: still nothing to save.
		expect(saveButton.disabled,).toBe(true,)

		// A type with no text is now a valid, saveable note.
		clickByText(host, 'Spam',)
		expect(saveButton.disabled,).toBe(false,)
	})

	it('awaits a pending resolveTargetIsMod check before triggering an auto-ban on save', async () => {
		let resolveMod!: (isMod: boolean,) => void
		const resolveTargetIsMod = vi.fn(() =>
			new Promise<boolean>((resolve,) => {
				resolveMod = resolve
			},)
		)
		const onSave = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({
			colors: [{key: 'autoban', text: 'Auto Ban', color: 'red', banDuration: 7,},],
			resolveTargetIsMod,
			onSave,
		},)

		clickByText(host, 'Auto Ban',)
		setNoteInputValue(host, 'mod note',)
		await clickByTextAsync(host, 'Save for /r/testsub',)

		// Save waits for the mod check rather than assuming non-mod.
		expect(onSave,).not.toHaveBeenCalled()

		await act(async () => {
			resolveMod(true,)
			await Promise.resolve()
		},)

		expect(onSave,).toHaveBeenCalledWith(expect.objectContaining({triggerBan: false,},),)
	})

	it('preserves user-edited ban message when resolveThingContext resolves after mount', async () => {
		let resolveCtx!: (
			ctx: {messageLink?: string; banTokenInfo: Record<string, string>; defaultBanMessage: string},
		) => void
		const resolveThingContext = vi.fn(() =>
			new Promise<
				{messageLink?: string; banTokenInfo: Record<string, string>; defaultBanMessage: string}
			>((resolve,) => {
				resolveCtx = resolve
			},)
		)
		const host = renderPopup({
			colors: [{key: 'autoban', text: 'Auto Ban', color: 'red', banDuration: 7,},],
			defaultBanMessage: 'initial default',
			resolveThingContext,
		},)

		clickByText(host, 'Auto Ban',)
		const textarea = host.querySelector<HTMLTextAreaElement>('textarea[placeholder="ban note to user"]',)!
		expect(textarea.value,).toBe('initial default',)

		act(() => {
			const valueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(textarea,), 'value',)?.set
			valueSetter?.call(textarea, 'custom mod message',)
			textarea.dispatchEvent(new InputEvent('input', {bubbles: true, data: 'custom mod message',},),)
		},)
		expect(textarea.value,).toBe('custom mod message',)

		await act(async () => {
			resolveCtx({
				messageLink: 'https://www.reddit.com/message/messages/abc',
				banTokenInfo: {author: 'alice', subreddit: 'testsub', title: 'Post title',},
				defaultBanMessage: 'resolved default with Post title',
			},)
			await Promise.resolve()
		},)

		expect(textarea.value,).toBe('custom mod message',)
		expect(host.textContent,).toContain('Include removal message link',)
	})

	it('awaits a pending resolveThingContext before saving message link and auto-ban message', async () => {
		let resolveCtx!: (
			ctx: {messageLink?: string; banTokenInfo: Record<string, string>; defaultBanMessage: string},
		) => void
		const resolveThingContext = vi.fn(() =>
			new Promise<
				{messageLink?: string; banTokenInfo: Record<string, string>; defaultBanMessage: string}
			>((resolve,) => {
				resolveCtx = resolve
			},)
		)
		const onSave = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({
			colors: [{key: 'autoban', text: 'Auto Ban', color: 'red', banDuration: 7,},],
			defaultBanMessage: 'Violation on {title}',
			resolveThingContext,
			onSave,
		},)

		clickByText(host, 'Auto Ban',)
		setNoteInputValue(host, 'fast save',)
		// Unresolved-token warning stays suppressed while resolveThingContext is in flight.
		expect(host.querySelector('[role="status"]',),).toBeNull()

		await clickByTextAsync(host, 'Save for /r/testsub',)
		expect(onSave,).not.toHaveBeenCalled()

		await act(async () => {
			resolveCtx({
				messageLink: 'https://www.reddit.com/mail/perma/msg123',
				banTokenInfo: {author: 'alice', subreddit: 'testsub', title: 'Bad Post',},
				defaultBanMessage: 'Violation on Bad Post',
			},)
			await Promise.resolve()
		},)

		expect(onSave,).toHaveBeenCalledWith(expect.objectContaining({
			includeMessageLink: true,
			triggerBan: true,
			banMessage: 'Violation on Bad Post',
		},),)
	})

	it('does not block non-ban save on pending resolveThingContext when mayHaveMessageLink is false', async () => {
		const resolveThingContext = vi.fn(() => new Promise<undefined>(() => {},))
		const onSave = vi.fn().mockResolvedValue(undefined,)
		const host = renderPopup({
			colors: [{key: 'spam', text: 'Spam', color: 'red',},],
			messageLink: undefined,
			mayHaveMessageLink: false,
			resolveThingContext,
			onSave,
		},)

		clickByText(host, 'Spam',)
		setNoteInputValue(host, 'quick note',)
		await clickByTextAsync(host, 'Save for /r/testsub',)

		expect(onSave,).toHaveBeenCalledWith(expect.objectContaining({
			note: 'quick note',
			includeMessageLink: false,
			triggerBan: false,
		},),)
	})

	it('re-resolves a ban macro picked before resolveThingContext finishes', async () => {
		let resolveCtx!: (
			ctx: {messageLink?: string; banTokenInfo: Record<string, string>; defaultBanMessage: string},
		) => void
		const resolveThingContext = vi.fn(() =>
			new Promise<
				{messageLink?: string; banTokenInfo: Record<string, string>; defaultBanMessage: string}
			>((resolve,) => {
				resolveCtx = resolve
			},)
		)
		const host = renderPopup({
			colors: [{key: 'autoban', text: 'Auto Ban', color: 'red', banDuration: 7,},],
			savedBanMacros: [
				{id: 'm1', title: 'Rule 1', note: 'r1', message: 'Removed "{title}"', permanent: false, days: 7,},
			],
			defaultBanMessage: 'initial default',
			resolveThingContext,
		},)

		clickByText(host, 'Auto Ban',)
		const select = host.querySelector<HTMLSelectElement>('select[aria-label="Apply ban macro"]',)
		expect(select,).not.toBeNull()
		act(() => {
			select!.value = '0'
			select!.dispatchEvent(new Event('change', {bubbles: true,},),)
		},)
		const textarea = host.querySelector<HTMLTextAreaElement>('textarea[placeholder="ban note to user"]',)!
		expect(textarea.value,).toBe('Removed "{title}"',)

		await act(async () => {
			resolveCtx({
				banTokenInfo: {author: 'alice', subreddit: 'testsub', title: 'Offending Post',},
				defaultBanMessage: 'resolved default',
			},)
			await Promise.resolve()
		},)

		expect(textarea.value,).toBe('Removed "Offending Post"',)
	})

	it('ignores undefined returned by onRefreshNotes and handles async resolver failures safely', async () => {
		const onRefreshNotes = vi.fn().mockResolvedValue(undefined,)
		const resolveTargetIsMod = vi.fn().mockRejectedValue(new Error('network',),)
		const resolveThingContext = vi.fn().mockRejectedValue(new Error('network',),)
		const host = renderPopup({
			colors: [{key: 'autoban', text: 'Auto Ban', color: 'red', banDuration: 7,},],
			initialNotes: [
				{id: 1, type: 'spam', note: 'kept note', mod: 'mod1', time: 1_700_000_000,},
			],
			defaultBanMessage: 'Ban for {title}',
			onRefreshNotes,
			resolveTargetIsMod,
			resolveThingContext,
		},)

		await act(async () => {
			await Promise.resolve()
			await Promise.resolve()
		},)

		expect(host.textContent,).toContain('kept note',)
		clickByText(host, 'Auto Ban',)
		// Once resolveThingContext settles (even on failure), unresolved token warning appears.
		expect(host.textContent,).toContain('{title}',)
	})
})
