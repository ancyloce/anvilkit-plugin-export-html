export type FetchAssetFn = (
	url: string,
) => Promise<{ bytes: Uint8Array; contentType: string }>;

export interface HtmlExportOptions extends Record<string, unknown> {
	readonly inlineStyles?: boolean;
	readonly inlineAssetThresholdBytes?: number;
	readonly title?: string;
	readonly fetchAsset?: FetchAssetFn;
}
