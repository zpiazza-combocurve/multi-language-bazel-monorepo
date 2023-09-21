import produce from 'immer';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { ICommand } from './shared';

interface CommandsStore {
	entries: Map<symbol, ICommand[]>;
	addCommands(key: symbol, value: ICommand[]): void;
	removeCommands(key: symbol): void;
}

export const useCommandsStore = create<CommandsStore>((set, get) => ({
	entries: new Map(),
	addCommands: (key, value) => {
		set(
			produce(get(), (draft) => {
				draft.entries.set(key, value);
			})
		);
	},
	removeCommands: (key) => {
		set(
			produce(get(), (draft) => {
				draft.entries.delete(key);
			})
		);
	},
}));

export function useGlobalCommands(commands: ICommand[]) {
	const [key] = useState(() => Symbol('commands key'));
	// TODO memoize the commands in some way
	useEffect(() => {
		useCommandsStore.getState().addCommands(key, commands);
	}, [key, commands]);

	useEffect(() => {
		return () => {
			useCommandsStore.getState().removeCommands(key);
		};
	}, [key]);
}
