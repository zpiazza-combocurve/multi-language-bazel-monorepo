import * as joint from '@clientio/rappid';

export class HaloService<ExternalHandlers> {
	getHaloHandles: (externalHandlers: ExternalHandlers, cellView: joint.dia.CellView) => joint.ui.Halo.Handle[];
	externalHandlers: ExternalHandlers;
	selection: joint.ui.Selection;
	clipboard: joint.ui.Clipboard;
	keyboard: joint.ui.Keyboard;
	constructor(getHaloHandles, externalHandlers, clipboard, selection, keyboard) {
		this.getHaloHandles = getHaloHandles;
		this.externalHandlers = externalHandlers;
		this.selection = selection;
		this.clipboard = clipboard;
		this.keyboard = keyboard;
	}
	create(cellView: joint.dia.CellView) {
		new joint.ui.Halo({
			cellView,
			handles: this.getHaloHandles(this.externalHandlers, cellView),
			useModelGeometry: true,
			type: 'toolbar',
		}).render();
	}
}
