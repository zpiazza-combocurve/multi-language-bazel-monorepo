import { faArrowLeft, faBookmark, faExternalLink, faSearch } from '@fortawesome/pro-regular-svg-icons';
import {
	Chip,
	Divider,
	Drawer,
	IconButton,
	InputAdornment,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Typography,
} from '@material-ui/core';
import { differenceInCalendarDays, formatDistance } from 'date-fns';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useMutation } from 'react-query';

import { getTaggingProp } from '@/analytics/tagging';
import { FontAwesomeIcon, Placeholder } from '@/components';
import { Box, TextField } from '@/components/v2';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { useLoadingBar } from '@/helpers/alerts';
import { openLink, redirectToZoho } from '@/helpers/routing';
import { theme } from '@/helpers/styled';
import { useArticles, useGetRootCategoryTree, useSearchArticles } from '@/knowledge-base/api';
import useKnowledgeBaseAPI from '@/knowledge-base/useKnowledgeBaseAPI';
import useZoho from '@/knowledge-base/useZoho';

const SIDEBAR_WIDTH = 600;

const ITEM_NEW_IF_LESS_THAN_DAYS = 14;

const CREATE_TICKET_URL = 'https://combocurve.com/create-a-ticket';

const API_FORUM_URL = 'https://forum.api.combocurve.com';

const getCategoryName = (category) => {
	return category?.translations?.[0]?.name ?? category?.name ?? 'No Name';
};

const KBArticlesList = ({ articles, articleOnClick }) => {
	if (!articles) {
		return null;
	}

	return articles.map(({ id, title, summary, createdTime, modifiedTime }) => {
		const isNew = differenceInCalendarDays(new Date(), new Date(createdTime)) < ITEM_NEW_IF_LESS_THAN_DAYS;
		const lastUpdated = formatDistance(new Date(modifiedTime), new Date(), { addSuffix: true });

		return (
			<ListItem button key={id} onClick={() => articleOnClick(id)}>
				<ListItemIcon>
					<FontAwesomeIcon icon={faBookmark} />
				</ListItemIcon>
				<ListItemText
					primary={
						<Box display='flex' justifyContent='space-between' alignItems='center'>
							{title}
							{isNew && <Chip label='New' color='primary' size='small' />}
						</Box>
					}
					secondary={
						<>
							<Typography variant='caption'>Last Updated: {lastUpdated}</Typography>
							<Typography variant='body2'>{summary}</Typography>
						</>
					}
				/>
			</ListItem>
		);
	});
};

const KBSearchInput = ({ setSearchText }) => (
	<TextField
		placeholder='Search'
		fullWidth
		margin='dense'
		nativeOnChange
		onChange={(event) => setSearchText(event.target.value)}
		InputLabelProps={{
			shrink: true,
		}}
		InputProps={{
			endAdornment: (
				<InputAdornment position='end'>
					<IconButton edge='end' size='small'>
						<FontAwesomeIcon icon={faSearch} size='xs' />
					</IconButton>
				</InputAdornment>
			),
		}}
	/>
);

const KBSearchList = ({ articleOnClick, setSearchText, searchText }) => {
	const { data: articles, isFetching: isSearching } = useSearchArticles({ searchText });

	const getTopText = () => {
		if (isSearching) {
			return 'Searching ...';
		}

		if (articles !== undefined) {
			return `${articles.length} articles matching "${searchText}"`;
		}

		return 'Search';
	};

	return (
		<div css={{ width: SIDEBAR_WIDTH }}>
			<List
				subheader={
					<ListSubheader css={{ backgroundColor: theme.background }}>
						<Box>
							<IconButton
								edge='start'
								size='small'
								onClick={() => setSearchText()}
								css={{ marginRight: '8px' }}
							>
								<FontAwesomeIcon icon={faArrowLeft} />
							</IconButton>
							{getTopText()}
						</Box>
					</ListSubheader>
				}
			>
				<Placeholder loading={isSearching}>
					<KBArticlesList articles={articles} articleOnClick={articleOnClick} />
				</Placeholder>
			</List>
		</div>
	);
};

const KBList = ({ categoryTree, categoryOnClick, articleOnClick, setSearchText, openZoho }) => {
	const { releaseInfo } = useLDFeatureFlags();
	const { id: categoryTreeId } = categoryTree;

	const { data: articles, isFetching: isFetchingArticles } = useArticles({
		categoryId: categoryTreeId,
	});

	const level = Number(categoryTree.level);

	const { newArticles } = useKnowledgeBaseAPI();

	const newArticlesByCategory = _.groupBy(newArticles, 'categoryId');

	const getChildrenOfCategory = (category) => {
		if (!category.children.length) return [];
		let children = category.children;
		category.children.forEach((child) => {
			children = children.concat(getChildrenOfCategory(child));
		});
		return children;
	};

	const shouldShowNewArticleTag = (category) => {
		const allChildren = getChildrenOfCategory(category);
		// checks if category or nested child has new article
		return (
			allChildren.some((childCategory) => newArticlesByCategory?.[childCategory.id]?.length > 0) ||
			newArticlesByCategory?.[category.id]?.length > 0
		);
	};

	return (
		<div css={{ width: SIDEBAR_WIDTH }}>
			<List
				subheader={
					<ListSubheader css={{ backgroundColor: theme.background }}>
						<Box>
							{level > 1 && (
								<IconButton
									edge='start'
									size='small'
									css={{ marginRight: '8px' }}
									onClick={() => categoryOnClick(categoryTree.parentCategoryId)}
								>
									<FontAwesomeIcon icon={faArrowLeft} />
								</IconButton>
							)}
							{getCategoryName(categoryTree)}
						</Box>

						<KBSearchInput setSearchText={setSearchText} />
					</ListSubheader>
				}
			>
				{categoryTree.children.map((category) => (
					<ListItem button key={category.id} onClick={() => categoryOnClick(category.id)}>
						<ListItemText
							primary={
								<Box display='flex' justifyContent='space-between' alignItems='center'>
									{getCategoryName(category)}
									{shouldShowNewArticleTag(category) && (
										<Chip label='New Articles' color='primary' size='small' />
									)}
								</Box>
							}
						/>
					</ListItem>
				))}

				<Divider />

				{level === 1 && (
					<>
						<ListItem button onClick={() => openLink(releaseInfo.portalUrl)}>
							<ListItemIcon>
								<FontAwesomeIcon icon={faExternalLink} />
							</ListItemIcon>
							<ListItemText primary='Product Portal' />
						</ListItem>
						<ListItem button onClick={() => openZoho()} {...getTaggingProp('general', 'knowledgeBase')}>
							<ListItemIcon>
								<FontAwesomeIcon icon={faExternalLink} />
							</ListItemIcon>
							<ListItemText primary='Go to Knowledge Base' />
						</ListItem>
						<ListItem button onClick={() => openLink(CREATE_TICKET_URL)}>
							<ListItemIcon>
								<FontAwesomeIcon icon={faExternalLink} />
							</ListItemIcon>
							<ListItemText primary='Create Ticket' />
						</ListItem>
						<ListItem button onClick={() => openLink(API_FORUM_URL)}>
							<ListItemIcon>
								<FontAwesomeIcon icon={faExternalLink} />
							</ListItemIcon>
							<ListItemText primary='ComboCurve API Forum' />
						</ListItem>
					</>
				)}

				<Placeholder loading={isFetchingArticles} loadingText='Loading Articles'>
					<KBArticlesList articles={articles} articleOnClick={articleOnClick} />
				</Placeholder>
			</List>
		</div>
	);
};

const findCategoryId = (categoryTree, categoryId) => {
	if (!categoryTree) {
		return null;
	}

	if (categoryTree.id === categoryId) {
		return categoryTree;
	}

	return categoryTree.children.map((subCategoryTree) => findCategoryId(subCategoryTree, categoryId)).find(Boolean);
};

export const KnowledgeBaseDrawer = ({ open, onClose }) => {
	const { data: categoryTree } = useGetRootCategoryTree();
	const [subTree, selectSubTree] = useState();
	const [searchText, setSearchText] = useState();
	const { isLoading: loadingZoho, mutate: openZoho } = useMutation(redirectToZoho);

	const categoryOnClick = (categoryId) => {
		const subCategoryTree = findCategoryId(categoryTree, categoryId);
		selectSubTree(subCategoryTree);
	};

	useEffect(() => {
		selectSubTree(categoryTree);
	}, [categoryTree]);

	const internalOnClose = () => {
		selectSubTree(categoryTree);
		onClose();
	};

	useLoadingBar(loadingZoho);

	const { openArticle } = useZoho();

	return (
		<Drawer anchor='right' open={open} onClose={internalOnClose}>
			{!searchText ? (
				subTree && (
					<KBList
						categoryTree={subTree}
						categoryOnClick={categoryOnClick}
						articleOnClick={(articleId) => {
							openArticle({ articleId });
						}}
						setSearchText={setSearchText}
						openZoho={openZoho}
					/>
				)
			) : (
				<KBSearchList
					setSearchText={setSearchText}
					searchText={searchText}
					articleOnClick={(articleId) => {
						openArticle({ articleId });
					}}
				/>
			)}
		</Drawer>
	);
};
