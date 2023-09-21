import NewWindow from 'react-new-window';

export const WithWindow = ({
	newWindow,
	handleOnClose,
	handleOnOpen,
	children,
	closeOnUnmount = true,
	title,
	name,
}: {
	newWindow?: boolean;
	handleOnOpen?: (window: Window) => void;
	handleOnClose?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	children: any;
	closeOnUnmount?: boolean;
	title: string;
	name: string;
}) => {
	if (newWindow) {
		return (
			<NewWindow
				copyStyles
				center='screen'
				title={title}
				name={name}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
				// @ts-expect-error
				closeOnUnmount={closeOnUnmount}
				onUnload={handleOnClose}
				onOpen={(window) => {
					window.document.body.className = document.body.className;
					handleOnOpen?.(window);
				}}
				features={{
					width: window.innerWidth * 0.75,
					height: window.innerHeight * 0.75,
					location: false,
					toolbar: false,
					menubar: false,
					status: false,
				}}
			>
				{children}
			</NewWindow>
		);
	}

	// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
	return <>{children}</>;
};
