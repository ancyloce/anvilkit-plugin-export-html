import type { PageIR } from '@anvilkit/core/types';
import { describe, expect, it } from 'vitest';

import { makeEmitContext, renderImage } from '../emit-html.js';
import { htmlFormat } from '../format-definition.js';
import { blogListFixture } from './__fixtures__/blog-list.fixture.js';

describe('html export warnings', () => {
	it('emits MISSING_ALT when renderImage receives a blank alt', () => {
		const ctx = makeEmitContext();
		renderImage('https://example.com/logo.png', '', ctx, ' class="ak-test-image"');
		expect(ctx.warnings.some((w) => w.code === 'MISSING_ALT')).toBe(true);
	});

	it('emits ASSET_FETCH_FAILED when asset fetching rejects', async () => {
		const result = await htmlFormat.run(blogListFixture, {
			fetchAsset: async () => {
				throw new Error('boom');
			},
		});
		expect(result.warnings.some((w) => w.code === 'ASSET_FETCH_FAILED')).toBe(true);
	});

	it('emits UNKNOWN_COMPONENT_EMITTER for unsupported nodes', async () => {
		const ir: PageIR = {
			version: '1',
			root: {
				id: 'root',
				type: '__root__',
				props: {},
				children: [{ id: 'unknown-1', type: 'NotARealComponent', props: {} }],
			},
			assets: [],
			metadata: {},
		};
		const result = await htmlFormat.run(ir, {});
		expect(result.warnings.some((w) => w.code === 'UNKNOWN_COMPONENT_EMITTER')).toBe(true);
	});
});
