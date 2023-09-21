import { useNavigate } from 'react-router-dom';

import { useURLSearchParams } from '@/components/hooks/useQuery';
import { KBArticleDialog } from '@/knowledge-base/KBArticleDialog';
import { KnowledgeBaseDrawer } from '@/knowledge-base/KnowledgeBaseDrawer';

const KnowledgeBase = ({ kbDrawerOpen, setKBDrawerOpen }) => {
	const [query] = useURLSearchParams();
	const kbArticleId = query.get('kbArticleId');

	const navigate = useNavigate();

	const handleClose = () => {
		navigate('');
	};

	return (
		<>
			<KnowledgeBaseDrawer open={kbDrawerOpen} onClose={() => setKBDrawerOpen(false)} />

			{kbArticleId && <KBArticleDialog onClose={handleClose} articleId={kbArticleId} />}
		</>
	);
};

export default KnowledgeBase;
