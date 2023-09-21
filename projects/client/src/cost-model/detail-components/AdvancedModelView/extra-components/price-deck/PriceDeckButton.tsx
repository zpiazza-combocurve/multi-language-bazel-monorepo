import { formatISO } from 'date-fns';
import { useMutation } from 'react-query';

import { ApplyCMEProps, Button } from '@/cost-model/detail-components/EconModelsList';
import { SelectCMEDialog } from '@/cost-model/detail-components/SelectCME';
import { useDoggo } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { getApi } from '@/helpers/routing';

import { ApplyPriceDecksButtonProps } from './types';

export enum PriceDeckType {
	price = 'price',
	differentials = 'differentials',
}

export function ApplyPriceDecksButton(props: ApplyPriceDecksButtonProps) {
	const { applyCME: modelApplyCME, priceDeckType } = props;
	const [cmeDialog, confirmCME] = useDialog(SelectCMEDialog, { type: priceDeckType });

	const { isLoading: applyingCME, mutateAsync: applyCME } = useMutation(async ({ products, date }: ApplyCMEProps) => {
		const productCodes = products.map(({ code }) => code);
		const result = await getApi('/price-imports/last-trading', { productCodes, date: formatISO(date) }, false);
		modelApplyCME(
			result.products.map(({ code, settlements }) => ({
				...products.find((cme) => code === cme.code),
				settlements,
				code,
			}))
		);
	});
	const message =
		priceDeckType === PriceDeckType.differentials ? 'Applying Differentials Price Decks' : 'Applying Price Decks';

	const handleApplyCME = async () => {
		const codes = await confirmCME();
		if (codes) {
			applyCME(codes);
		}
	};

	useDoggo(applyingCME, message);

	return (
		<>
			{cmeDialog}
			<Button onClick={handleApplyCME}>Price Decks</Button>
		</>
	);
}
