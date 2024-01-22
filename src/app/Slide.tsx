import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { Image } from './image.type';
import PinchZoom from './pinchzoom';
import styles from './Slide.module.css';

const Slide = ({ image, active }: { image: Image; active: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pinchZoomRef = useRef<any>();

  useEffect(() => {
    if (
      // ref is ready
      ref.current &&
      // slide is active (= it's in the users viewport)
      active &&
      // image is loaded
      imageLoaded &&
      // device has PointerEvent support
      window.PointerEvent &&
      // device is a touch device
      window.matchMedia('(pointer: coarse)')?.matches &&
      // pinchZoom has not already been initialized
      !pinchZoomRef.current
    ) {
      pinchZoomRef.current = new PinchZoom(ref.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current, active, imageLoaded]);

  useEffect(() => {
    if (pinchZoomRef.current && !active) {
      pinchZoomRef.current.reset();
    }
  }, [active]);

  const handleOrientationChange = useCallback(() => {
    if (pinchZoomRef.current) {
      pinchZoomRef.current.reset();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [handleOrientationChange]);

  return (
    <div ref={ref} className={styles.container}>
      <div className={styles.pinchZoom}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          className={styles.image}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          alt={image.alt}
        />
      </div>
    </div>
  );
};

export default memo(Slide);
