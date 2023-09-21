import { postApi } from '@/helpers/routing';

type GetProps = {
	wellIds: string[];
	sort?: {
		direction: 'asc' | 'desc';
		field: string;
	};
	filters?: { [key: string]: string };
	headers?: string[];
	notProducing?: boolean;
};

type UpdateProps = {
	column: string;
	value: string | null;
	wellIds: Inpt.ObjectId<'wells'>[];
	type?: 'model' | 'lookup' | 'tcLookup';
};

type UpdateManyProps = {
	column: string;
	values: { well: Inpt.ObjectId<'wells'>; value: number | string }[];
};

type RemoveProps = {
	column: string;
	wellIds: Inpt.ObjectId<'wells'>[];
};

export class AssignmentsApi {
	scheduleId: Inpt.ObjectId<'schedule'>;

	public constructor(scheduleId: Inpt.ObjectId<'schedule'>) {
		this.scheduleId = scheduleId;
	}

	public get = ({
		wellIds,
		sort = {
			field: 'priority',
			direction: 'asc',
		},
		headers = [],
	}: GetProps) => {
		return postApi(`/schedules/${this.scheduleId}/assignments`, {
			ids: wellIds,
			sort,
			headers,
		});
	};

	public getIds = ({
		wellIds,
		sort = {
			field: 'priority',
			direction: 'asc',
		},
		notProducing = false,
	}: GetProps) => {
		return postApi(`/schedules/${this.scheduleId}/assignmentsIds`, {
			ids: wellIds,
			sort,
			notProducing,
		});
	};

	public update({ column, value, wellIds, type }: UpdateProps) {
		return postApi(`/schedules/${this.scheduleId}/assignments/update`, {
			wellIds,
			column,
			value,
			type,
		});
	}

	public updateMany({ column, values }: UpdateManyProps) {
		return postApi(`/schedules/${this.scheduleId}/assignments/updateMany`, {
			column,
			values,
		});
	}

	public remove({ column, wellIds }: RemoveProps) {
		return postApi(`/schedules/${this.scheduleId}/assignments/remove`, {
			column,
			wellIds,
		});
	}
}
