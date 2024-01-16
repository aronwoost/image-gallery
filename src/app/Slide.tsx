import React, { useEffect, useRef, useState, memo } from "react";

import PinchZoom from "./pinchzoom";

import styles from "./Slide.module.css";

const Slide = ({ image, loadImage, active }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const ref = useRef();
  const pinchZoomRef = useRef();

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
        {loadImage && (
          <img
            src={image}
            className={styles.image}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
    </div>
  );
};

// Slide.propTypes = {
//   image: shape({
//     uri: string.isRequired,
//     provisionalBase64Image: string,
//   }).isRequired,
//   loadImage: bool,
//   active: bool,
//   videoId: string,
// };

export default memo(Slide);
