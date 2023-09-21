export const workerToPromise =
	<T>(worker: Worker) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	(message: any) =>
		new Promise<T>((resolve, reject) => {
			worker.onmessage = ({ data }) => resolve(data);
			worker.onerror = reject;
			worker.postMessage(message);
		});
