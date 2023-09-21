import dompurify from 'dompurify';
import { useMatch } from 'react-router-dom';

import { openLink, redirectToZoho } from '@/helpers/routing';
import { useArticleById } from '@/knowledge-base/api';
import { URLS } from '@/urls';

export function KBArticle() {
	const {
		params: { articleId },
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-explicit-any -- TODO eslint fix later
	} = useMatch<any, any>(`${URLS.kb(':articleId').root}/*`)!;
	const { data: article } = useArticleById({ articleId });

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

	if (!article) {
		return null;
	}

	const sanitizedHtml = dompurify.sanitize(article.answer, { ADD_TAGS: ['iframe'] });

	window.document.title = article.title;
	window.name = article.title;

	return (
		<div
			css={`
				padding: 1rem;
				width: 100vw;
				height: 100vh;
			`}
			className='light'
			onClick={goTo}
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
		/>
	);
}

export default KBArticle;
