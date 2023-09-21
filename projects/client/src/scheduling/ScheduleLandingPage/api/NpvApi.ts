import { postApi } from '@/helpers/routing';

type ValidateProps = {
	wellIds: string[];
};

export class NpvApi {
	scheduleId: Inpt.ObjectId<'schedule'>;

	public constructor(scheduleId: Inpt.ObjectId<'schedule'>) {
		this.scheduleId = scheduleId;
	}

	public validate = ({ wellIds }: ValidateProps) => {
		return postApi(`/schedules/${this.scheduleId}/npv/validate`, {
			wellIds,
		});
	};
}
