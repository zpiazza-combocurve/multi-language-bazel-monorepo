import { util } from 'jointjs/src/core.mjs';

export const Inertia = function(onInertiaMove, opt) {

    this.options = util.assign({
        friction: 0.92,
    }, opt);

    this._isDragging = false;

    this._dragLastX = 0;
    this._dragLastY = 0;

    this._dragDeltaX = 0;
    this._dragDeltaY = 0;

    this._dragLastDeltaX = 0;
    this._dragLastDeltaY = 0;

    this._velocityX = 0;
    this._velocityY = 0;

    this._requestAnimationFrameId = -1;

    this.onInertiaMove = onInertiaMove;
}

Inertia.prototype.approxZero = function(number) {
    return Math.abs(number) < 0.5;
}

Inertia.prototype.updateVelocity = function() {

    const { _velocityX, _velocityY, _isDragging, options, onInertiaMove } = this;

    if (!_isDragging && this.approxZero(_velocityX) && this.approxZero(_velocityY)) return;

    this._requestAnimationFrameId = util.nextFrame(this.updateVelocity.bind(this));

    if (_isDragging) {
        this._dragLastDeltaX = this._dragDeltaX;
        this._dragLastDeltaY = this._dragDeltaY;

        this._dragDeltaX = this._dragLastX;
        this._dragDeltaY = this._dragLastY;

        this._velocityX = (this._dragDeltaX - this._dragLastDeltaX);
        this._velocityY = (this._dragDeltaY - this._dragLastDeltaY);
    } else {
        const deltaX = _velocityX;
        const deltaY = _velocityY;

        const { friction } = options;
        this._velocityX *= friction;
        this._velocityY *= friction;

        this._dragLastX += deltaX;
        this._dragLastY += deltaY;

        if (typeof onInertiaMove === 'function') {
            onInertiaMove(deltaX, deltaY);
        }
    }
}

Inertia.prototype.handleDragStart = function(event) {

    this._isDragging = true;

    this._dragLastX = event.clientX;
    this._dragLastY = event.clientY;

    this._velocityX = 0;
    this._velocityY = 0;

    util.cancelFrame(this._requestAnimationFrameId);

    this.updateVelocity();
}

Inertia.prototype.handleDragMove = function(event) {
    this._dragLastX = event.clientX;
    this._dragLastY = event.clientY;
}

Inertia.prototype.handleDragEnd = function(_event) {
    this._isDragging = false;
}
