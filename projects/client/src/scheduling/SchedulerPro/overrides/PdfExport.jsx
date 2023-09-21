import { AjaxHelper, PdfExport, Toast } from '@bryntum/schedulerpro';

import { sanitizeFile } from '@/helpers/fileHelper';
import { uploadFile } from '@/helpers/routing';

const parseToLightTheme = (html) => {
	const darkTheme = 'gantt_themes/gantt.classic-dark.css';
	const lightTheme = 'gantt_themes/gantt.classic-light.css';

	return html.replaceAll(darkTheme, lightTheme);
};

const preProcessPages = (html) => {
	if (typeof html === 'string') {
		html = parseToLightTheme(html);
	} else
		html = html.map((html) => {
			return { html: parseToLightTheme(html.html) };
		});

	return html;
};

export default class PdfExportOverride {
	static get target() {
		return {
			class: PdfExport,
			product: 'schedulerpro',
		};
	}

	async showExportDialog() {
		if (this.client.isExporting)
			Toast.show({
				html: 'Current export in progress, please wait before starting another export',
				rootElement: this.rootElement,
			});
		else {
			const dialog = this.exportDialog.show();
			document.querySelector('[data-ref=alignRowsField] input').style.opacity = 1;
			document.querySelector('[data-ref=repeatHeaderField] input').style.opacity = 1;
			return dialog;
		}
	}

	showLoadingToast() {
		return Toast.show({
			timeout: 0,
			showProgress: false,
			rootElement: this.rootElement,
			html: `
        <span class="b-mask-icon b-icon b-icon-spinner"></span>
        <span>${
			// eslint-disable-next-line new-cap -- TODO eslint fix later
			this.L('L{Waiting for response from server}')
		}</span>
      `,
		});
	}

	receiveExportContent(pages, config) {
		return new Promise((resolve, reject) => {
			const { projectId } = this.fetchOptions.queryParams;
			const exportConfig = {
				html: preProcessPages(pages),
				orientation: config.orientation,
				format: config.paperFormat,
				fileFormat: config.fileFormat,
				fileName: config.fileName,
				clientURL: config.clientURL,
				sendAsBinary: config.sendAsBinary,
			};

			const file = new File([JSON.stringify(exportConfig)], `gantt-export/payload/${config.fileName}.json`);
			const sanitizedFile = sanitizeFile(file);

			uploadFile(sanitizedFile, undefined, projectId)
				.then((fileData) => {
					Toast.hideAll();

					AjaxHelper.fetch(config.exportServer, {
						method: 'POST',
						credentials: 'omit',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(fileData),
						...this.fetchOptions,
					})
						.then(resolve)
						.catch(reject);
				})
				.catch(reject);
		});
	}

	async processExportContent() {
		// We moved this responsibility to the notification system
	}
}
