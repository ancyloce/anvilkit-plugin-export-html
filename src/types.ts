export interface HtmlExportOptions extends Record<string, unknown> {
	readonly inlineStyles?: boolean;
	readonly inlineAssetThresholdBytes?: number;
	readonly title?: string;
}
