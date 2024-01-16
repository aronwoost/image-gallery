const eventToPointer = (nativePointer) => ({
  nativePointer,
  pageX: nativePointer.pageX,
  pageY: nativePointer.pageY,
  clientX: nativePointer.clientX,
  clientY: nativePointer.clientY,
  id: nativePointer.pointerId || -1,
});

const getDistance = (a, b) => {
  if (!b) return 0;
  return Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);
};

const getMidpoint = (a, b) => {
  if (!b) return a;
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
  };
};

// I'd rather use DOMMatrix/DOMPoint here, but the browser support isn't good enough.
// Given that, better to use something everything supports.
let cachedSvg;

const getSVG = () => {
  if (cachedSvg) {
    return cachedSvg;
  }
  cachedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return cachedSvg;
};

const createMatrix = () => getSVG().createSVGMatrix();

const MIN_SCALE = 0.1;
const Y_DISTANCE_THRESHOLD = 30;
const Y_DISTANCE_TO_CLOSE = 100;

class PinchZoom {
  constructor(element) {
    this.element = element;

    this.currentPointers = [];
    this.isMultiplePointer = false;
    this.doubleTapTimeout = null;

    this.naturalWidth = element.querySelector('img')?.naturalWidth;
    this.naturalHeight = element.querySelector('img')?.naturalHeight;

    const viewportBounds = this.element.getBoundingClientRect();

    // This is essentially the formular behind object-fit: contain. We need to
    // have the exact values for the calculations later.
    const ratio = this.naturalWidth / this.naturalHeight;
    this.imageWidth = Math.round(viewportBounds.height * ratio);
    this.imageHeight = viewportBounds.height;
    if (this.imageWidth > viewportBounds.width) {
      this.imageWidth = viewportBounds.width;
      this.imageHeight = Math.round(viewportBounds.width / ratio);
    }

    // Current transform.
    this._transform = createMatrix();

    this.onPointerStart = this.onPointerStart.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerCancel = this.onPointerCancel.bind(this);

    this.element.addEventListener('pointerdown', this.onPointerStart);

    // eslint-disable-next-line
    this.transformElement = this.element.children[0];
  }

  onPointerStart(event) {
    // We only want to track 2 pointers at most
    if (this.currentPointers.length === 2) return;

    const pointer = eventToPointer(event);

    event.preventDefault();

    this.currentPointers.push(pointer);

    if (this.currentPointers.length > 1) {
      this.isMultiplePointer = true;
    }

    this.element.setPointerCapture(event.pointerId);
    this.element.addEventListener('pointermove', this.onPointerMove);
    // We have to listen for "pointerleave" instead of "pointerup" event. Reason
    // is Mobile Safari. In Mobile Safari there is no pointerup fired when the
    // user release it's fingers above the browser chrome (address bar and
    // navigation bar at the bottom). Maybe this is fixed in iOS14.
    this.element.addEventListener('pointerleave', this.onPointerUp);
    this.element.addEventListener('pointercancel', this.onPointerCancel);

    this.element.dispatchEvent(new Event('pinchingStarted', { bubbles: true }));
  }

  onPointerMove(event) {
    // create copy
    const previousPointers = [...this.currentPointers];

    const pointer = eventToPointer(event);

    const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
    // Not a pointer we're interested in?
    if (index === -1) return false;

    this.currentPointers[index] = pointer;

    const onlyAllowVerticalScroll =
      this.scale <= 1 && this.currentPointers.length === 1;

    return this._onPointerMove(
      previousPointers,
      this.currentPointers,
      onlyAllowVerticalScroll
    );
  }

  onPointerUp(event) {
    const pointer = eventToPointer(event);

    const index = this.currentPointers.findIndex((p) => p.id === pointer.id);
    // Not a pointer we're interested in?
    if (index === -1) return;

    this.currentPointers.splice(index, 1);

    const wasDoubleTap = !!this.doubleTapTimeout;

    // return if there are still pointers to be released
    if (this.currentPointers.length !== 0) {
      return;
    }

    const viewportBounds = this.element.getBoundingClientRect();

    const yDistance = Math.abs(this.y);
    const closePercentage =
      (yDistance - Y_DISTANCE_THRESHOLD) / Y_DISTANCE_TO_CLOSE;

    if (wasDoubleTap) {
      // zoom in or out depending on current zoom
      const zoomIn = this.scale < 1.1;
      this.setTransform({
        x: zoomIn ? -(viewportBounds.width / 2) : 0,
        y: zoomIn ? -(viewportBounds.height / 2) : 0,
        scale: zoomIn ? 2 : 1,
        animate: true,
      });
    } else if (this.scale === 1 && closePercentage >= 1) {
      // close gallery of image was dragged up/down over a threshold
      this.element.dispatchEvent(new Event('close', { bubbles: true }));
    } else if (this.scale < 0.5) {
      // close gallery of image was scaled very small
      this.element.dispatchEvent(new Event('close', { bubbles: true }));
    } else if (this.scale < 1.1) {
      // reset scale/position
      this.setTransform({ x: 0, y: 0, scale: 1, animate: true });
    } else {
      // The image is scaled up. Let's see if we need to snap the image to the
      // edges or center it.
      const transformBounds = this.transformElement.getBoundingClientRect();

      const currentImageWidth = this.imageWidth * this.scale;
      const currentImageHeight = this.imageHeight * this.scale;

      // Calculate offsets of the image taking into account that we do
      // object-fit: contain
      const imageXOffset = (transformBounds.width - currentImageWidth) / 2;
      const imageYOffset = (transformBounds.height - currentImageHeight) / 2;

      const topLeft = {
        x: transformBounds.left + imageXOffset,
        y: transformBounds.top + imageYOffset,
      };

      const bottomRight = {
        x: transformBounds.width + transformBounds.left - imageXOffset,
        y: transformBounds.height + transformBounds.top - imageYOffset,
      };

      let newX = this.x;
      let newY = this.y;

      if (currentImageWidth < viewportBounds.width) {
        // image was not scaled horizontally beyond viewport width, so we just
        // center it
        newX = -((transformBounds.width - viewportBounds.width) / 2);
      } else if (topLeft.x > 0) {
        // move to left edge
        newX -= topLeft.x;
      } else if (bottomRight.x < viewportBounds.width) {
        // move to right edge
        newX += viewportBounds.width - bottomRight.x;
      }

      if (currentImageHeight < viewportBounds.height) {
        // image was not scaled vertically beyond viewport height, so we just
        // center it
        newY = -((transformBounds.height - viewportBounds.height) / 2);
      } else if (topLeft.y > 0) {
        // move to upper edge
        newY -= topLeft.y;
      } else if (bottomRight.y < viewportBounds.height) {
        // move to bottom edge
        newY += viewportBounds.height - bottomRight.y;
      }

      this.setTransform({ x: newX, y: newY, animate: true });
    }

    if (this.scale > 1) {
      // don't allow image swiping
      this.element.style.touchAction = 'none';
    } else {
      // allow image swiping
      this.element.style.touchAction = 'pan-x';
    }

    if (!this.isMultiplePointer && !this.doubleTapTimeout) {
      this.doubleTapTimeout = setTimeout(() => {
        this.doubleTapTimeout = null;
      }, 300);
    }

    this.isMultiplePointer = false;

    this.element.releasePointerCapture(event.pointerId);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerleave', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerCancel);

    this.element.dispatchEvent(new Event('pinchingEnded', { bubbles: true }));
  }

  onPointerCancel() {
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerleave', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerCancel);

    this.element.dispatchEvent(new Event('pinchingEnded', { bubbles: true }));

    this.currentPointers = [];

    this.setTransform({ x: 0, y: 0, scale: 1 });
  }

  get x() {
    return this._transform.e;
  }

  get y() {
    return this._transform.f;
  }

  get scale() {
    return this._transform.a;
  }

  setTransform({
    x = this.x,
    y = this.y,
    scale = this.scale,
    animate = false,
  }) {
    // Avoid scaling to zero
    if (scale < MIN_SCALE) return;

    // Return if there's no change
    if (scale === this.scale && x === this.x && y === this.y) return;

    this._transform.e = x;
    this._transform.f = y;
    this._transform.d = scale;
    this._transform.a = scale;

    if (animate) {
      this.transformElement.style.setProperty('transition-duration', '0.2s');
    } else {
      this.transformElement.style.setProperty('transition-duration', '0s');
    }

    this.transformElement.style.setProperty(
      'transform',
      // translateZ(1000px) is needed to avoid a mobile safari rendering glitch
      `translate(${this.x}px, ${this.y}px) scale(${this.scale}) translateZ(1000px)`
    );

    if (scale === 1) {
      const event = new Event('changeOpacity', { bubbles: true });

      const yDistance = Math.abs(y);
      const closePercentage =
        (yDistance - Y_DISTANCE_THRESHOLD) / Y_DISTANCE_TO_CLOSE;
      event.opacity = Math.min(Math.max(1 - closePercentage * 0.5, 0.5), 1);
      this.element.dispatchEvent(event);
    }

    if (scale < 1) {
      const event = new Event('changeOpacity', { bubbles: true });
      event.opacity = Math.max(scale, 0.5);
      this.element.dispatchEvent(event);
    }
  }

  _onPointerMove(previousPointers, currentPointers, onlyAllowVerticalScroll) {
    // Combine next points with previous points
    const currentRect = this.transformElement.getBoundingClientRect();
    // For calculating panning movement
    const prevMidpoint = getMidpoint(previousPointers[0], previousPointers[1]);
    const newMidpoint = getMidpoint(currentPointers[0], currentPointers[1]);
    // Midpoint within the element
    const originX = prevMidpoint.clientX - currentRect.left;
    const originY = prevMidpoint.clientY - currentRect.top;
    // Calculate the desired change in scale
    const prevDistance = getDistance(previousPointers[0], previousPointers[1]);
    const newDistance = getDistance(currentPointers[0], currentPointers[1]);
    const scaleDiff = prevDistance ? newDistance / prevDistance : 1;

    const panX = onlyAllowVerticalScroll
      ? 0
      : newMidpoint.clientX - prevMidpoint.clientX;
    const panY = newMidpoint.clientY - prevMidpoint.clientY;

    const matrix = createMatrix()
      // Translate according to panning.
      .translate(panX, panY)
      // Scale about the origin.
      .translate(originX, originY)
      // Apply current translate
      .translate(this.x, this.y)
      .scale(scaleDiff)
      .translate(-originX, -originY)
      // Apply current scale.
      .scale(this.scale);

    // Convert the transform into basic translate & scale.
    this.setTransform({
      x: matrix.e,
      y: matrix.f,
      scale: matrix.a,
    });
  }
}

export default PinchZoom;
