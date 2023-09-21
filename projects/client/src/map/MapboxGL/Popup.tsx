import mapboxgl from 'mapbox-gl';
import { Component } from 'react';
import ReactDOM from 'react-dom';

import { MapboxGLContext } from './context';

export type PopupProps = Pick<mapboxgl.PopupOptions, 'offset' | 'closeButton'> & {
	lnglat?: mapboxgl.LngLatLike;
	className?: string;
};

class Popup extends Component<PopupProps> {
	componentDidMount() {
		if (!this.map) {
			return;
		}

		const { offset, lnglat, closeButton, className } = this.props;

		this.popup = new mapboxgl.Popup({ offset, closeButton });

		if (lnglat) {
			this.popup.setLngLat(lnglat);
		}

		this.popup.addTo(this.map);

		this.container.className = className ?? '';

		this.popup.setDOMContent(this.container);
	}

	componentDidUpdate(prevProps: this['props']) {
		if (!this.popup) {
			return;
		}

		const { offset, lnglat, className } = this.props;

		if (prevProps.className !== className) {
			this.container.className = className ?? '';
		}

		if (prevProps.offset !== offset) {
			this.popup.setOffset?.(offset); // TODO for some reason it doesn't have this property, check this
		}
		if (prevProps.lnglat !== lnglat && lnglat) {
			this.popup.setLngLat(lnglat);
		}
	}

	componentWillUnmount() {
		if (!this.popup || !this.map) {
			return;
		}

		this.popup.remove();
	}

	container = document.createElement('div');

	map: mapboxgl.Map | undefined;

	popup: mapboxgl.Popup | undefined;

	render() {
		const { children } = this.props;
		return (
			<>
				<MapboxGLContext.Consumer>
					{({ map }) => {
						this.map = map;
						return null;
					}}
				</MapboxGLContext.Consumer>
				{ReactDOM.createPortal(children, this.container)}
			</>
		);
	}
}

export default Popup;
