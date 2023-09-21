import { Box } from '@material-ui/core';
import dompurify from 'dompurify';
import NewWindow from 'react-new-window';

import { openLink, redirectToZoho } from '@/helpers/routing';
import { useArticleById } from '@/knowledge-base/api';

export const KBArticleDialog = ({ articleId, onClose }) => {
	const { data: article } = useArticleById({ articleId });

	if (!article) {
		return null;
	}

	const sanitizedHtml = dompurify.sanitize(article.answer, { ADD_TAGS: ['iframe'] });

	const goTo = (event) => {
		if (event.target.tagName.toLowerCase() === 'a') {
			event.preventDefault();
			if (event.target.href.startsWith('https://support.combocurve.com/portal')) {
				redirectToZoho(event.target.href);
			} else {
				openLink(event.target.href);
			}
		}
	};

	return (
		<NewWindow
			copyStyles
			center='screen'
			title={article.title}
			name={article.title}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
			// @ts-expect-error
			closeOnUnmount={false}
			onUnload={() => onClose()}
			features={{
				width: window.innerWidth * 0.75,
				height: window.innerHeight * 0.75,
				location: false,
				toolbar: false,
				menubar: false,
				status: false,
			}}
		>
			<Box m={2} onClick={goTo} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
		</NewWindow>
	);
};
