import React, { useEffect, useRef, useState, memo } from "react";

import PinchZoom from "./pinchzoom";

import styles from "./Slide.module.css";

const Slide = ({ image, active }: { image: string; active: boolean }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);
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
      window.matchMedia("(pointer: coarse)")?.matches &&
      // pinchZoom has not already been initialized
      !pinchZoomRef.current
    ) {
      pinchZoomRef.current = new PinchZoom(ref.current);
    }
  }, [ref.current, active, imageLoaded]);

  return (
    <div ref={ref} className={styles.container}>
      <div className={styles.pinchZoom}>
        <img
          src={image}
          className={styles.image}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
      </div>
    </div>
  );
};

export default memo(Slide);
