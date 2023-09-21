import classNames from 'classnames';

import './doggo.scss';

function getClass({
	large,
	medium,
	small,
	overlay,
}: {
	large?: boolean;
	medium?: boolean;
	small?: boolean;
	overlay?: boolean;
}) {
	if (small) {
		return 'small';
	}
	if (medium) {
		return 'medium';
	}
	if (large) {
		return 'large';
	}
	if (overlay) {
		return 'large';
	}
	// keep the above order
	return 'large';
}

/**
 * Doggo credit goes to David Khoursid
 *
 * @see [source](https://codepen.io/davidkpiano/full/BGxgLa/)
 */
export default function Doggo(props: {
	/** Can be text or jsx to display some text under the doggo */
	underDog?: string | React.ReactNode;
	/** Small doggo, just his head 60 x 60 */
	small?: boolean;
	/** Medium doggo 160 x 160 */
	medium?: boolean;
	/** Large doggo 300 x 300 */
	large?: boolean;
	/** Large doggo overlay that will prevent any page interactions as long as this component is on the dom */
	overlay?: boolean;
}) {
	const { overlay, underDog } = props;
	return (
		<div id='dog-kennel' className={classNames(overlay && 'overlay')}>
			<div id='dog' className={classNames(getClass(props))}>
				<div className='torso'>
					<div className='fur'>
						<div className='spot' />
					</div>
					<div className='neck'>
						<div className='fur' />
						<div className='head'>
							<div className='fur'>
								<div className='snout' />
							</div>
							<div className='ears'>
								<div className='ear'>
									<div className='fur' />
								</div>
								<div className='ear'>
									<div className='fur' />
								</div>
							</div>
							<div className='eye' />
						</div>
						<div className='collar' />
					</div>
					<div className='legs'>
						<div className='leg'>
							<div className='fur' />
							<div className='leg-inner'>
								<div className='fur' />
							</div>
						</div>
						<div className='leg'>
							<div className='fur' />
							<div className='leg-inner'>
								<div className='fur' />
							</div>
						</div>
						<div className='leg'>
							<div className='fur' />
							<div className='leg-inner'>
								<div className='fur' />
							</div>
						</div>
						<div className='leg'>
							<div className='fur' />
							<div className='leg-inner'>
								<div className='fur' />
							</div>
						</div>
					</div>
					<div className='tail'>
						<div className='tail'>
							<div className='tail'>
								<div className='tail -end'>
									<div className='tail'>
										<div className='tail'>
											<div className='tail'>
												<div className='tail' />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div id='under-dog' className={classNames(overlay ? 'overlay-text' : 'md-text')}>
				{underDog || false}
			</div>
		</div>
	);
}
