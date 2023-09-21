import { Report, models } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { useCallback, useEffect, useState } from 'react';

import { Divider } from '@/components/v2';

import { themeDark } from '../Themes/pbi-theme-dark';
import { themeDarkGhg } from '../Themes/pbi-theme-dark-ghg';
import { NavigationBar } from './NavigationBar';
import { ReportMap } from './ReportMap';
import { ItemMenu, ReportSideBar } from './ReportSideBar';
import {
	applyBookmark,
	applyNavigationBookmark,
	autoSelectCombo,
	changePageTo,
	getActivePage,
	getAllPages,
	getBookmarks,
	getReportWells,
	goToMainPage,
	updateReportSlicer,
} from './pbiHandler';

const REPORT_BG_COLOR = '#242427';

export const THEMES = {
	default: themeDark,
	ghg: themeDarkGhg,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const defaultConfigFromReport = (reportConfig, reportTheme: any) => ({
	type: 'report', // Supported types: report, dashboard, tile, visual and qna
	id: reportConfig.reportId,
	embedUrl: reportConfig.embedUrl,
	accessToken: reportConfig.embedToken.token,
	tokenType: models.TokenType.Embed,
	settings: {
		panes: {
			filters: {
				expanded: false,
				visible: false,
			},
		},
		background: models.BackgroundType.Default,
		navContentPaneEnabled: false,
	},
	theme: {
		themeJson: reportTheme,
	},
});

export function ReportView({
	config: reportConfig,
	reportTemplate,
	reportTheme = THEMES.default,
	pbiEmbedConfig = defaultConfigFromReport(reportConfig, reportTheme),
}: {
	config;
	reportTemplate?;
	reportTheme?;
	pbiEmbedConfig?;
}) {
	const [report, setReport] = useState<Report | null>(null);
	const [openedMenu, setOpenedMenu] = useState<ItemMenu>(ItemMenu.None);
	const [wellIds, setWellIds] = useState<{ currentWellIds: string[]; allWellIds: string[] }>({
		currentWellIds: [],
		allWellIds: [],
	});
	const [bookmarks, setBookmarks] = useState<models.IReportBookmark[]>([]);
	const [lastBookmarkTags, setLastBookmarkTags] = useState<{ [key: string]: string[] } | never>();
	const [reportPages, setReportPages] = useState<{ [key: string]: string }>({ home: 'home' });

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const handlePrint = useCallback(() => report!.print(), [report]);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const handleFullscreen = useCallback(() => report!.fullscreen(), [report]);

	const onMenuClick = (menu: ItemMenu) => {
		const menuActions = {
			[ItemMenu.WellList]: () => {
				if (openedMenu === ItemMenu.WellList) {
					goToMainPage(report, bookmarks, lastBookmarkTags);
					setOpenedMenu(ItemMenu.None);
				} else {
					applyBookmark(report, bookmarks, 'Wells', lastBookmarkTags);
					setOpenedMenu(ItemMenu.WellList);
				}
			},
			[ItemMenu.Filter]: () => {
				if (openedMenu === ItemMenu.Filter) {
					goToMainPage(report, bookmarks, lastBookmarkTags);
					setOpenedMenu(ItemMenu.None);
				} else {
					applyBookmark(report, bookmarks, 'Filters', lastBookmarkTags);
					setOpenedMenu(ItemMenu.Filter);
				}
			},
			[ItemMenu.Map]: () => {
				if (openedMenu === ItemMenu.Map) {
					setOpenedMenu(ItemMenu.None);
				} else {
					setOpenedMenu(ItemMenu.Map);
				}
			},
			[ItemMenu.Print]: handlePrint,
			[ItemMenu.Fullscreen]: handleFullscreen,
		};

		return menuActions[menu]();
	};

	const onNavigationClick = (pageName: string) => {
		const navigationActions = {
			[ItemMenu.WellList]: () => {
				applyNavigationBookmark(pageName, report, bookmarks, 'Wells', lastBookmarkTags);
			},
			[ItemMenu.Filter]: () => {
				applyNavigationBookmark(pageName, report, bookmarks, 'Filters', lastBookmarkTags);
			},
			[ItemMenu.None]: () => {
				changePageTo(report, reportPages[pageName]);
			},
		};
		const menuType = openedMenu;
		return navigationActions[menuType]();
	};

	const updateReportPages = async () => {
		const getAllReportPages = async () => {
			const allReportPages = await getAllPages(report);
			return allReportPages;
		};
		const allReportPages = await getAllReportPages();
		setReportPages(allReportPages);
	};

	useEffect(() => {
		if (report) {
			if (Object.keys(reportPages).length <= 1) {
				updateReportPages();
			}

			report.off('pageChanged');
			report.on('pageChanged', async () => {
				const pageName = await getActivePage(report);
				await getReportWells(report, wellIds, setWellIds);

				if (bookmarks.length === 0) {
					await getBookmarks(report, setBookmarks);
					await autoSelectCombo(report, reportTemplate);
				}

				const isFilterSelected = openedMenu === ItemMenu.Filter;
				const isWellListSelected = openedMenu === ItemMenu.WellList;
				const isFilterPage = pageName.split(' | ').length === 1;

				//if the page was changed but the filters panel is on then show it
				if (isFilterSelected && isFilterPage) {
					applyBookmark(report, bookmarks, 'Filters', lastBookmarkTags);
				} else if (isWellListSelected && isFilterPage) {
					applyBookmark(report, bookmarks, 'Wells', lastBookmarkTags);
				}
			});

			report.off('dataSelected');
			//clicking a point of a visual or selecting values in a slicer.
			report.on('dataSelected', async (event: CustomEvent) => {
				const data = event.detail;
				if (data.visual.type === 'slicer') {
					await getReportWells(report, wellIds, setWellIds);
				}
			});

			report.off('bookmarkApplied');
			report.on('bookmarkApplied', async (event: CustomEvent) => {
				// get the applied bookmark's name
				const appliedBookmarksName = bookmarks.filter((bookmark) => {
					return bookmark.name === event.detail.bookmarkName;
				});

				// get the tags of the applied bookmark
				let appliedBookmarkTags = appliedBookmarksName[0].displayName.split(' - ');

				if (appliedBookmarkTags.length !== 0) {
					appliedBookmarkTags = appliedBookmarkTags.slice(2, appliedBookmarkTags.length);

					if (appliedBookmarkTags.includes('Default')) {
						appliedBookmarkTags = ['Default'];
					}

					const page = await getActivePage(report);
					const pageName = page?.split(' | ')[0];

					if (lastBookmarkTags) {
						const newTags = { ...lastBookmarkTags, [pageName as string]: appliedBookmarkTags };
						setLastBookmarkTags(newTags);
					} else {
						const bookmarkTags = { pageName: [''] };
						setLastBookmarkTags(bookmarkTags);
					}
				}
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [report, bookmarks, openedMenu, lastBookmarkTags]);

	return (
		<div
			css={`
				display: flex;
				flex-direction: row;
				height: 100%;
				margin-left: 56px;
				background-color: ${REPORT_BG_COLOR};
			`}
		>
			{reportConfig && (
				<>
					<ReportSideBar activeMenu={openedMenu} onMenuClick={onMenuClick} />
					{openedMenu === ItemMenu.Map && (
						<div
							css={`
								width: 40%;
								padding: 16px;
							`}
						>
							<ReportMap
								wells={wellIds.currentWellIds}
								updateReportWells={(wells, reset) => {
									const newWells = reset
										? updateReportSlicer(report, reportTemplate, wellIds.allWellIds, 'well_id')
										: updateReportSlicer(report, reportTemplate, wells, 'well_id');
									return newWells;
								}}
							/>
						</div>
					)}

					<Divider orientation='vertical' flexItem />

					<div
						css={`
							width: 100%;
							height: 100%;
							flex-grow: 1;
							overflow: hidden;
							flex-direction: column;
						`}
					>
						<div
							css={`
								height: calc(100% - 50px);
								width: 100%;
								.report-style {
									height: 100%;
									width: 100%;
									iframe {
										background-color: ${REPORT_BG_COLOR};
										border: 0;
									}
								}
							`}
						>
							<PowerBIEmbed
								embedConfig={pbiEmbedConfig}
								cssClassName='report-style'
								getEmbeddedComponent={(embeddedReport) => {
									setReport(embeddedReport as Report);
								}}
							/>
						</div>
						<NavigationBar reportPages={reportPages} onPageClick={onNavigationClick} />
					</div>
				</>
			)}
		</div>
	);
}
