import { models } from 'powerbi-client';

export const getReportWells = async (report, wellIds, setWellIds) => {
	if (!report) {
		return;
	}

	const pages = await report.getPages();

	// Retrieve the active page (page being viewed)
	const page = pages.filter((page) => page.isActive)[0];

	const visuals = await page.getVisuals();

	// Retrieve all visuals with the type "slicer".
	const slicers = visuals.filter((visual) => visual.type === 'slicer');

	slicers.forEach(async (slicer) => {
		// Get the slicer state.
		const state = await slicer.getSlicerState();

		if (state.targets?.[0]['column'] === 'well_id') {
			// Retrieve the target visual.
			const visual = visuals.filter(function (visual) {
				return visual.name === slicer.name;
			})[0];

			const currentWellIds = await visual.exportData(models.ExportDataType.Summarized);
			const spacesReplaced = currentWellIds.data.split('\r\n');
			spacesReplaced.shift();
			spacesReplaced.pop();

			if (wellIds.allWellIds.length > 0) {
				setWellIds({ currentWellIds: spacesReplaced, allWellIds: wellIds.allWellIds });
			} else {
				setWellIds({ currentWellIds: spacesReplaced, allWellIds: spacesReplaced });
			}
		}
	});
};

// Applies filter to wells slicer
const setSlicerState = async (slicer, visuals, filter, dataType) => {
	// Get the slicer state.
	const state = await slicer.getSlicerState();
	if (state.targets?.[0]['column'] === dataType) {
		// Retrieve the target visual.
		const visual = visuals.filter(function (visual) {
			return visual.name === slicer.name;
		})[0];

		// Set the slicer state which contains the slicer filters.
		await visual.setSlicerState({ filters: [filter] } as models.ISlicerState);
	}
};

//Gets the correct power bi table based on the report template name
const getDataTable = (reportTemplate) => {
	switch (reportTemplate) {
		case 'economics-combined':
			return 'econ_one_liner';
		case 'economics-reserves-group':
			return 'econ_reserves_groups';
		case 'ghg':
			return 'ghg_import';
		default:
			throw new Error(
				'Incorrect reportTemplate, expected one of (economics-combined,economics-reserves-group,ghg), got ' +
					String(reportTemplate)
			);
	}
};

// Uses slicerData as values to select in the slicer and dataType to find the slicer to be updated based on the
//type of data it handles
export const updateReportSlicer = async (report, reportTemplate, slicerData, dataType) => {
	//pbi table to filter
	const dataTable = getDataTable(reportTemplate);

	// Create the filter object. More information on this process => https://go.microsoft.com/fwlink/?linkid=2153364
	const filter = {
		$schema: 'http://powerbi.com/product/schema#basic',
		target: {
			table: dataTable,
			column: dataType,
		},
		operator: 'In',
		values: slicerData,
		filterType: models.FilterType.Basic,
		requireSingleSelection: false,
	};

	if (!report) {
		return;
	}

	// Retrieve the page collection and get the visuals for the active page.
	const pages = await report.getPages();

	// Retrieve the active page.
	const page = pages.filter((page) => page.isActive)[0];

	const visuals = await page.getVisuals();

	// Retrieve the target visual.
	const slicers = visuals.filter((visual) => visual.type === 'slicer');

	slicers.forEach(async (slicer) => {
		//checks if the slicer is the wellids slicer and if true then sets its value
		setSlicerState(slicer, visuals, filter, dataType);
	});
};

// Gets the page being viewed by the user
export const getActivePage = async (report) => {
	// Retrieve the page collection.
	const pages = await report?.getPages();

	// Retrieve the active page.
	const activePage = pages?.filter(function (page) {
		return page.isActive;
	})[0];

	return activePage?.displayName;
};

// Retrieves the bookmarks from the report
export const getBookmarks = async (report, setBookmarks) => {
	const reportBookmarks = await report?.bookmarksManager.getBookmarks();
	if (reportBookmarks) {
		setBookmarks(reportBookmarks);
	}
};

// Gets the bookmark that has the type of the clicked button (filters||wells) and the last tags that were applied
const getBookmarkWithTags = (bookmarkType, pageName, pageBookmarks, lastBookmarkTags) => {
	//get the bookmark that also contains the last applied tags
	const taggedBookmark = pageBookmarks.find((bookmark) => {
		const bookmarkName = bookmark.displayName.split(' - ');

		//the [1] tag of a bookmark is allways the type (filter or well)
		// if the bookmark doesnt have the desired type, then we dont want it
		if (bookmarkName[1] !== bookmarkType) {
			return false;
		}

		//get the tags of the bookmark
		let bookmarkTags = bookmarkName.slice(2, bookmarkName.length);

		//in case any tag is the default tag for that bookmark
		//(meaning that bookmark is allways applied at first when you get to the page)
		//then remove the rest of the tag and kep "Default" to recognize that case
		if (bookmarkTags.includes('Default')) {
			bookmarkTags = ['Default'];
		}

		//get the last bookmark tags applied in the page
		//if there isn't any tag applied, then the page is on it's default state
		const lastTags =
			lastBookmarkTags && lastBookmarkTags[pageName as string]
				? lastBookmarkTags[pageName as string]
				: bookmarkTags.length > 0
				? ['Default']
				: [];

		if (bookmarkTags.length !== lastTags.length) {
			return false;
		}

		for (let i = 0; i < lastTags?.length; i++) {
			if (!bookmarkTags.includes(lastTags[i])) {
				return false;
			}
		}

		return true;
	});
	return taggedBookmark;
};

export const applyBookmark = async (report, bookmarks, bookmarkType, lastBookmarkTags) => {
	const page = await getActivePage(report);

	//get page name without tags (Combo Comparison | Filters => Combo Comparison)
	const pageName = page?.split(' | ')[0];

	//get the bookmarks from the current page
	const pageBookmarks = bookmarks.filter((bookmark) => {
		let bookmarkName = bookmark.displayName.split(' - ')[0].split(' | ')[0];

		// if the bookmark is actually a group of bookmarks (bookmarks can be grouped)
		// then analyze the bookmarks in the group
		if (bookmark?.children) {
			return (
				bookmark?.children.filter((bmrk) => {
					bookmarkName = bmrk.displayName.split(' - ')[0].split(' | ')[0];
					return bookmarkName === pageName;
				}).length > 0
			);
		}

		return bookmarkName === pageName;
	});

	//get the bookmark that contains the last applied tags and the bookmarkType
	const taggedBookmark = getBookmarkWithTags(bookmarkType, pageName, pageBookmarks, lastBookmarkTags);

	// bookmarksManager.apply will apply the bookmark with the given name on the report.
	// This is the actual bookmark name not the display name.
	await report?.bookmarksManager.apply(taggedBookmark?.name);
};

export const applyNavigationBookmark = async (reportPage, report, bookmarks, bookmarkType, lastBookmarkTags) => {
	const page = reportPage;

	//get page name without tags (Combo Comparison | Filters => Combo Comparison)
	const pageName = page?.split(' | ')[0];

	//get the bookmarks from the current page
	const pageBookmarks = bookmarks.filter((bookmark) => {
		let bookmarkName = bookmark.displayName.split(' - ')[0].split(' | ')[0];

		// if the bookmark is actually a group of bookmarks (bookmarks can be grouped)
		// then analyze the bookmarks in the group
		if (bookmark?.children) {
			return (
				bookmark?.children.filter((bmrk) => {
					bookmarkName = bmrk.displayName.split(' - ')[0].split(' | ')[0];
					return bookmarkName === pageName;
				}).length > 0
			);
		}

		return bookmarkName === pageName;
	});

	//get the bookmark that contains the last applied tags and the bookmarkType
	const taggedBookmark = getBookmarkWithTags(bookmarkType, pageName, pageBookmarks, lastBookmarkTags);

	// bookmarksManager.apply will apply the bookmark with the given name on the report.
	// This is the actual bookmark name not the display name.
	await report?.bookmarksManager.apply(taggedBookmark?.name);
};

const getPageCode = async (report, pageName) => {
	// Retrieve the page collection and loop through to collect the
	// page name and display name of each page and display the value.
	const pages = await report.getPages();
	const pageCode = pages?.find((page) => {
		return page.displayName === pageName;
	}).name;
	return pageCode;
};

export const goToMainPage = async (report, bookmarks, lastBookmarkTags) => {
	const page = await getActivePage(report);

	//get page name without tags (Combo Comparison | Filters => Combo Comparison)
	const pageName = page?.split(' | ')[0];

	//get the bookmarks from the current page
	const pageBookmarks = bookmarks.filter((bookmark) => {
		let bookmarkName = bookmark.displayName.split(' - ')[0];

		// if the bookmark is actually a group of bookmarks (bookmarks can be grouped)
		// then analyze the bookmarks in the group
		if (bookmark?.children) {
			return (
				bookmark?.children.filter((bmrk) => {
					bookmarkName = bmrk.displayName.split(' - ')[0];
					return bookmarkName === pageName;
				}).length > 0
			);
		}
		return bookmarkName === pageName;
	});

	//get the bookmark that contains the last applied tags and the bookmarkType
	const taggedBookmark = getBookmarkWithTags('Settings', pageName, pageBookmarks, lastBookmarkTags);

	// bookmarksManager.apply will apply the bookmark with the given name on the report.
	// This is the actual bookmark name not the display name.
	if (taggedBookmark) {
		await report?.bookmarksManager.apply(taggedBookmark?.name);
	} else {
		const pageCode = await getPageCode(report, pageName);
		await report.setPage(pageCode);
	}
};

export const getAllPages = async (report) => {
	const reportPages = {};
	// Retrieve the page collection and loop through to collect the
	// page name and display name of each page and display the value.

	const pages = await report.getPages();
	pages.forEach(function (page) {
		if (page.visibility === 0) {
			reportPages[page.displayName] = page.name;
		}
	});
	return reportPages;
};

export const changePageTo = async (report, pageName) => {
	// setPage will change the selected view to the page you indicate.
	// This is the actual page name not the display name.
	await report.setPage(pageName);
};

// Searches for the slicer containing the different combos in the report and uses the first selectable
// item to set the slicer default initial value
export const autoSelectCombo = async (report, reportTemplate) => {
	if (!report) {
		return;
	}

	const pages = await report.getPages();

	const page = pages.filter((page) => page.isActive)[0];

	const visuals = await page.getVisuals();

	const slicers = visuals.filter((visual) => visual.type === 'slicer');

	// searches for the combos slicer (it uses field combo_name) and then sets it to the first value
	slicers.forEach(async (slicer) => {
		const state = await slicer.getSlicerState();

		if (state.targets?.[0]['column'] === 'combo_name') {
			// Retrieve the target visual.
			const visual = visuals.filter(function (visual) {
				return visual.name === slicer.name;
			})[0];

			const combos = await visual.exportData(models.ExportDataType.Summarized);
			const spacesReplaced = combos.data.split('\r\n');
			spacesReplaced.shift();
			spacesReplaced.pop();

			// Set the slicer to the first combo among the options
			await updateReportSlicer(report, reportTemplate, [spacesReplaced[0]], 'combo_name');
		}
	});
};

export const setReportWells = async (report, wells) => {
	// Create the filter object. More information on this process => https://go.microsoft.com/fwlink/?linkid=2153364
	const filter = {
		$schema: 'http://powerbi.com/product/schema#basic',
		target: {
			table: 'econ_one_liner',
			column: 'well_id',
		},
		operator: 'In',
		values: wells,
		filterType: models.FilterType.Basic,
		requireSingleSelection: false,
	};

	if (!report) {
		return;
	}

	// Retrieve the page collection and get the visuals for the active page.
	const pages = await report.getPages();

	// Retrieve the active page.
	const page = pages.filter((page) => page.isActive)[0];

	const visuals = await page.getVisuals();

	// Retrieve the target visual.
	const slicers = visuals.filter((visual) => visual.type === 'slicer');

	slicers.forEach(async (slicer) => {
		//checks if the slicer is the wellids slicer and if true then sets its value
		setSlicerState(slicer, visuals, filter, 'well_id');
	});
};
