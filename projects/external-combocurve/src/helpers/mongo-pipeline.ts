import {
	ICount,
	IFilter,
	IGroup,
	ILimit,
	ILookup,
	IMatch,
	IPipelineSort,
	IProject,
	ISet,
	ISkip,
	ISort,
	IStep,
	Pipeline,
	Steps,
} from './mongo-queries';

interface IPipelineOptions {
	filters: IFilter;
	sort?: ISort;
	skip?: number;
	limit?: number;
	count?: boolean;
}

export interface CountResultPipeline {
	count: number;
}

export const getPipeline = (
	basePipeline: Pipeline,
	{ filters, sort, skip, limit, count }: IPipelineOptions,
	postSkipTakePipeline: Pipeline = [],
): Pipeline => {
	const pipelineMatch = filters ? [{ $match: filters }] : [];
	const pipelineSort = sort ? [{ $sort: sort }] : [];
	const pipelineSkip = skip !== undefined ? [{ $skip: skip }] : [];
	const pipelineLimit = limit ? [{ $limit: limit }] : [];
	const pipelineCount = count ? [{ $count: 'count' }] : [];

	return count
		? [...pipelineMatch, ...basePipeline, ...pipelineCount]
		: [
				...pipelineMatch,
				...pipelineSort,
				...basePipeline,
				...pipelineSkip,
				...pipelineLimit,
				...postSkipTakePipeline,
		  ];
};

const pipeDefaultOrder = [
	Steps.Match,
	Steps.Sort,
	Steps.Project,
	Steps.Skip,
	Steps.Limit,
	Steps.Lookup,
	Steps.Set,
	Steps.Group,
	Steps.Count,
];

const ignoreWhenCount = [Steps.Sort, Steps.Project, Steps.Skip, Steps.Limit];

export class PipelineBuilder {
	private $match: IMatch | null = null;
	private $project: IProject | null = null;
	private $lookup: ILookup | null = null;
	private $sort: IPipelineSort | null = null;
	private $skip: ISkip | null = null;
	private $limit: ILimit | null = null;
	private $count: ICount | null = null;
	private $group: IGroup | null = null;
	private $set: ISet | null = null;

	static new(): PipelineBuilder {
		return new PipelineBuilder();
	}

	setOptions({ filters, sort, skip, limit, count }: IPipelineOptions): PipelineBuilder {
		if (filters) {
			this.$match = { $match: filters };
		}

		if (sort) {
			this.$sort = { $sort: sort };
		}

		if (skip !== undefined) {
			this.$skip = { $skip: skip };
		}

		if (limit) {
			this.$limit = { $limit: limit };
		}

		if (count) {
			this.$count = { $count: 'count' };
		}

		return this;
	}

	setStep(name: Steps, value: IStep): PipelineBuilder {
		switch (name) {
			case Steps.Count:
				this.$count = value as ICount;
				break;
			case Steps.Match:
				this.$match = value as IMatch;
				break;
			case Steps.Project:
				this.$project = value as IProject;
				break;
			case Steps.Lookup:
				this.$lookup = value as ILookup;
				break;
			case Steps.Sort:
				this.$sort = value as IPipelineSort;
				break;
			case Steps.Skip:
				this.$skip = value as ISkip;
				break;
			case Steps.Limit:
				this.$limit = value as ILimit;
				break;
			case Steps.Group:
				this.$group = value as IGroup;
				break;
			case Steps.Set:
				this.$set = value as ISet;
				break;
		}

		return this;
	}

	getStep(name: Steps): IStep | null {
		switch (name) {
			case Steps.Count:
				return this.$count;
			case Steps.Match:
				return this.$match;
			case Steps.Project:
				return this.$project;
			case Steps.Lookup:
				return this.$lookup;
			case Steps.Sort:
				return this.$sort;
			case Steps.Skip:
				return this.$skip;
			case Steps.Limit:
				return this.$limit;
			case Steps.Group:
				return this.$group;
			case Steps.Set:
				return this.$set;
		}

		return null;
	}

	build(order: Steps[] = pipeDefaultOrder): Pipeline {
		const output = [];
		const isCount = this.getStep(Steps.Count) !== null;

		for (const step of order) {
			const value = this.getStep(step);
			if (isCount && ignoreWhenCount.includes(step)) {
				continue;
			}

			if (value !== null) {
				output.push(value);
			}
		}

		return output;
	}
}
