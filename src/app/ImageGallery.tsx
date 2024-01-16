import React, {
  Fragment,
  useState,
  useEffect,
  useRef,
  createRef,
  KeyboardEventHandler,
} from "react";
import cx from "classnames";

import Slide from "./Slide";
import styles from "./ImageGallery.module.css";

const ImageGallery = ({
  index: initialIndex = 0,
  images = [],
  onClose = () => {},
}: {
  index: number;
  images: string[];
  onClose: () => void;
}) => {
  const imageIndexRef = useRef(initialIndex);
  const [imageIndex, setImageIndex] = useState(imageIndexRef.current);

  console.log({ imageIndex });

  const [opacity, setOpacity] = useState(1);
  const [pinchingInProgress, setPinchingInProgress] = useState(false);

  const rotationInProgress = useRef(false);

  // We use a ref additionally to the state. So that we always get an updated
  // result when called from the IntersectionObserver handler. If we would call
  // loadedImages in the IntersectionObserver handler we would receive an
  // outdated result.
  const loadedImagesRef = useRef(
    new Array(images.length)
      .fill(0)
      // mark current image to be loaded
      .map((item, index) => index === initialIndex),
  );

  const [loadedImages, setLoadedImages] = useState(loadedImagesRef.current);

  const imagesAndVideos = images;
  const slideRefs = useRef(
    imagesAndVideos.map(() => createRef<HTMLDivElement>()),
  );

  const updateImageToLoad = (index: number) => {
    // create new array, otherwise setLoadedImages() will not trigger re-render
    const updatedLoadedImages = [...loadedImagesRef.current];

    // prev image
    if (typeof updatedLoadedImages[index - 1] !== "undefined") {
      updatedLoadedImages[index - 1] = true;
    }

    updatedLoadedImages[index] = true;

    // next image
    if (typeof updatedLoadedImages[index + 1] !== "undefined") {
      updatedLoadedImages[index + 1] = true;
    }

    loadedImagesRef.current = updatedLoadedImages;
    setLoadedImages(loadedImagesRef.current);
  };

  const slideContainerRef = useRef<HTMLDivElement | null>(null);

  const changeImage = (index: number) => {
    if (imageIndexRef.current === index) {
      return;
    }

    imageIndexRef.current = index;
    setImageIndex(index);
  };

  const prevImage = () => {
    if (imageIndexRef.current - 1 === -1) {
      changeImage(imagesAndVideos.length - 1);
    } else {
      changeImage(imageIndexRef.current - 1);
    }
  };

  const nextImage = () => {
    if (imageIndexRef.current + 1 === imagesAndVideos.length) {
      changeImage(0);
    } else {
      changeImage(imageIndexRef.current + 1);
    }
  };

  const close = () => onClose();

  const handlePinchingStarted = () => setPinchingInProgress(true);
  const handlePinchingEnded = () => setPinchingInProgress(false);
  const handleChangeOpacity = (event: any) => setOpacity(event.opacity);
  const handleClose = () => onClose();

  useEffect(() => {
    if (!slideContainerRef.current) {
      return;
    }

    const element = slideContainerRef.current;

    /* istanbul ignore next */
    const observer = new IntersectionObserver(
      (entries) => {
        if (rotationInProgress.current) {
          return;
        }

        entries.forEach((entry) => {
          // used to determine for image being changed
          if (entry.intersectionRatio === 1) {
            changeImage(
              parseInt((entry.target as HTMLElement).dataset.index ?? "", 10),
            );
          }
          // used to determine for image being in the viewport and should be
          // loaded
          if (entry.intersectionRatio > 0) {
            updateImageToLoad(
              parseInt((entry.target as HTMLElement).dataset.index ?? "", 10),
            );
          }
        });
      },
      {
        root: element,
        // having top/bottom margin of 1px fixes an issue, that the
        // IntersectionObserver doesn't kick in, when height is float
        // instead of int (315.5 vs 315).
        rootMargin: "1px 0px",
        threshold: [0.05, 1],
      },
    );

    element.addEventListener("pinchingStarted", handlePinchingStarted);
    element.addEventListener("pinchingEnded", handlePinchingEnded);
    element.addEventListener("changeOpacity", handleChangeOpacity);
    element.addEventListener("close", handleClose);

    slideRefs.current.forEach(({ current }) => {
      if (current) observer.observe(current);
    });

    // eslint-disable-next-line consistent-return
    return () => {
      element.removeEventListener("pinchingStarted", handlePinchingStarted);
      element.removeEventListener("pinchingEnded", handlePinchingEnded);
      element.removeEventListener("changeOpacity", handleChangeOpacity);
      element.removeEventListener("close", handleClose);

      slideRefs.current.forEach(({ current }) => {
        if (current) observer.unobserve(current);
      });
    };
  }, [slideContainerRef.current]);

  const preventEvent = (event: Event) => event.preventDefault();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.keyCode === 37) {
      prevImage();
    } else if (event.keyCode === 39) {
      nextImage();
    } else if (event.keyCode === 27) {
      close();
    }
  };

  /*
    Fixes bug, when rotating the device. Mobile Safari (iOS 14) and Samsung (Android)
    do not support restoring scroll-snap-align scroll position when device is
    rotated (Chrome does, read more: https://web.dev/snap-after-layout/).

    For Samsung browser it should be fixed when Samsung updated to Chromium 81+
    https://en.wikipedia.org/wiki/Samsung_Internet
   */
  const handleOrientationChange = () => {
    // This disables IntersectionObserver check. Otherwise the IntersectionObserver
    // would wrongly detect a change of the current slide once the slides are repainted
    // after an orientation change.
    rotationInProgress.current = true;

    const handleResize = () => {
      if (slideRefs.current?.[imageIndex].current) {
        // Scroll to current slide
        const slide = slideRefs.current[imageIndexRef.current].current;

        if (slide) {
          slide.scrollIntoView({ block: "nearest", inline: "start" });
        }
      }

      // Re-enable IntersectionObserver
      rotationInProgress.current = false;

      window.removeEventListener("resize", handleResize);
    };

    // Wait for the resize event. Only at that moment the new height is actually set.
    window.addEventListener("resize", handleResize);
  };

  useEffect(() => {
    // prevent Mobile Safari from sometimes(TM) capturing the pinch/zoom gesture
    document.addEventListener("gesturestart", preventEvent);

    document.addEventListener("keydown", handleKeyDown);

    window.addEventListener("orientationchange", handleOrientationChange);

    // eslint-disable-next-line consistent-return
    return () => {
      document.removeEventListener("gesturestart", preventEvent);

      document.removeEventListener("keydown", handleKeyDown);

      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (!slideRefs.current?.[imageIndex].current) {
      return;
    }

    const slide = slideRefs.current[imageIndex].current;

    if (slide) {
      slide.scrollIntoView({ block: "nearest", inline: "start" });
    }
  }, [imageIndex]);

  return (
    <div
      className={styles.container}
      style={{ backgroundColor: `rgba(45,47,59,${opacity})` }}
      data-testid="ImageGallery"
    >
      <div
        className={cx(styles.interface, styles.topBar, {
          [styles.disablePointerEvents]: pinchingInProgress,
        })}
      >
        <span>{`${imageIndex + 1} ${imagesAndVideos.length}`}</span>
        <button type="button" onClick={close}>
          close
        </button>
      </div>
      <div className={styles.component}>
        <div
          className={cx(styles.bigImageArea, {
            [styles.oneImage]: imagesAndVideos.length === 1,
          })}
        >
          {imagesAndVideos.length > 1 && (
            <Fragment>
              <button
                type="button"
                className={cx(
                  styles.navigationButton,
                  styles.interface,
                  styles.previous,
                  {
                    [styles.disablePointerEvents]: pinchingInProgress,
                  },
                )}
                onClick={prevImage}
              >
                PREV
              </button>
              <button
                type="button"
                className={cx(
                  styles.navigationButton,
                  styles.interface,
                  styles.next,
                  {
                    [styles.disablePointerEvents]: pinchingInProgress,
                  },
                )}
                onClick={nextImage}
              >
                NEXT
              </button>
            </Fragment>
          )}
          <div className={styles.swipeContainer} ref={slideContainerRef}>
            {imagesAndVideos.map((imageOrVideo, index) => (
              <div
                className={styles.slide}
                ref={slideRefs.current[index]}
                data-index={index}
                key={`slide-${imageOrVideo}`}
              >
                <Slide
                  image={imageOrVideo}
                  loadImage={loadedImages[index]}
                  active={imageIndex === index}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ImageGallery.propTypes = {
//   index: number,
//   images: arrayOf(
//     shape({
//       uri: string.isRequired,
//     }),
//   ),
//   video: shape({
//     id: string.isRequired,
//     previewImage: string.isRequired,
//   }),
//   onImageChange: func,
//   onClose: func,
// };

export default ImageGallery;
