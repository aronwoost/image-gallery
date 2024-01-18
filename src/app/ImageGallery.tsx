import cx from 'classnames';
import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import ArrowLeft from './ArrowLeft';
import ArrowRight from './ArrowRight';
import styles from './ImageGallery.module.css';
import Slide from './Slide';

const preventEvent = (event: Event) => event.preventDefault();

const ImageGallery = ({
  index: initialIndex = 0,
  images = [],
  onClose = () => {},
}: {
  index: number;
  images: string[];
  onClose: () => void;
}) => {
  // We maintain two image indexes. "imageIndex" is for displaying purposes,
  // like update the counter and toggle the prev/next button. "imageIndex"
  // updates fast. "activeImageIndex" is used to determine which slide is
  // currently fully visible. This is important, because only then the
  // pinchzoom functionality is activated.
  const [imageIndex, setImageIndex] = useState(initialIndex);
  const [activeImageIndex, setActiveImageIndex] = useState(initialIndex);

  console.log('re-render');

  const [opacity, setOpacity] = useState(1);
  const [pinchingInProgress, setPinchingInProgress] = useState(false);

  const rotationInProgress = useRef(false);

  const slideRefs = useRef(images.map(() => createRef<HTMLDivElement>()));

  const slideContainerRef = useRef<HTMLDivElement | null>(null);

  const prevImage = useCallback(() => {
    if (imageIndex - 1 > -1) {
      setActiveImageIndex(imageIndex - 1);
    }
  }, [imageIndex, setActiveImageIndex]);

  const nextImage = useCallback(() => {
    if (imageIndex + 1 < images.length) {
      setActiveImageIndex(imageIndex + 1);
    }
  }, [imageIndex, images.length, setActiveImageIndex]);

  const handlePinchingStarted = () => setPinchingInProgress(true);
  const handlePinchingEnded = () => setPinchingInProgress(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChangeOpacity = (event: any) => setOpacity(event.opacity);
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!slideContainerRef.current) {
      return;
    }

    const element = slideContainerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (rotationInProgress.current) {
          return;
        }

        entries.forEach(({ target, intersectionRatio }) => {
          if (intersectionRatio === 0) {
            return;
          }

          if (intersectionRatio === 1) {
            const datasetIndex = (target as HTMLElement).dataset.index;
            const index = parseInt(datasetIndex ?? '', 10);

            setActiveImageIndex(index);
            setImageIndex(index);
          }

          if (intersectionRatio > 0.55 && intersectionRatio < 1) {
            const datasetIndex = (target as HTMLElement).dataset.index;
            const index = parseInt(datasetIndex ?? '', 10);

            // In case of no image being fully visible (we are currently
            // scrolling), we set activeImageIndex to -1, so all pinchzoom
            // functionality is reseted/disabled
            setActiveImageIndex(-1);
            setImageIndex(index);
          }
        });
      },
      {
        root: element,
        // having top/bottom margin of 1px fixes an issue, that the
        // IntersectionObserver doesn't kick in, when height is float
        // instead of int (315.5 vs 315).
        rootMargin: '1px 0px',
        threshold: [0.55, 1],
      }
    );

    element.addEventListener('pinchingStarted', handlePinchingStarted);
    element.addEventListener('pinchingEnded', handlePinchingEnded);
    element.addEventListener('changeOpacity', handleChangeOpacity);
    element.addEventListener('close', handleClose);

    slideRefs.current.forEach(({ current }) => {
      if (current) observer.observe(current);
    });

    return () => {
      element.removeEventListener('pinchingStarted', handlePinchingStarted);
      element.removeEventListener('pinchingEnded', handlePinchingEnded);
      element.removeEventListener('changeOpacity', handleChangeOpacity);
      element.removeEventListener('close', handleClose);

      // eslint-disable-next-line react-hooks/exhaustive-deps
      slideRefs.current.forEach(({ current }) => {
        if (current) observer.unobserve(current);
      });
    };
  }, [handleClose]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevImage();
      } else if (event.key === 'ArrowRight') {
        nextImage();
      } else if (event.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose, nextImage, prevImage]
  );

  /*
    Fixes bug, when rotating the device. Mobile Safari (iOS 17, time of writing)
    do not support restoring scroll-snap-align scroll position when device is
    rotated (Chrome does, read more: https://web.dev/snap-after-layout/).
   */
  const handleOrientationChange = useCallback(() => {
    // This disables IntersectionObserver check. Otherwise the IntersectionObserver
    // would wrongly detect a change of the current slide once the slides are repainted
    // after an orientation change.
    rotationInProgress.current = true;

    const handleResize = () => {
      if (slideRefs.current?.[imageIndex].current) {
        // Scroll to current slide
        const slide = slideRefs.current[imageIndex].current;

        if (slide) {
          slide.scrollIntoView({ block: 'nearest', inline: 'start' });
        }
      }

      // Re-enable IntersectionObserver
      rotationInProgress.current = false;

      window.removeEventListener('resize', handleResize);
    };

    // Wait for the resize event. Only at that moment the new height is actually set.
    window.addEventListener('resize', handleResize);
  }, [imageIndex]);

  useEffect(() => {
    // prevent Mobile Safari from sometimes(TM) capturing the pinch/zoom gesture
    document.addEventListener('gesturestart', preventEvent);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      document.removeEventListener('gesturestart', preventEvent);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [imageIndex, handleKeyDown, handleOrientationChange]);

  useEffect(() => {
    if (!slideRefs.current?.[activeImageIndex]?.current) {
      return;
    }

    const slide = slideRefs.current[activeImageIndex]?.current;

    if (slide) {
      slide.scrollIntoView({ block: 'nearest', inline: 'start' });
    }
  }, [activeImageIndex]);

  return (
    <div
      className={styles.container}
      style={{ backgroundColor: `rgba(45,47,59,${opacity})` }}
    >
      <div
        className={cx(styles.interface, {
          [styles.disablePointerEvents]: pinchingInProgress,
        })}
      >
        <div className={styles.topBar}>
          <span
            className={styles.counter}
          >{`${imageIndex + 1} / ${images.length}`}</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
          >
            close
          </button>
        </div>
        <div className={styles.navigationButtons}>
          <div
            className={cx(styles.navigationButton, {
              [styles.disable]: imageIndex - 1 === -1,
              [styles.hide]: images.length === 1,
            })}
            onClick={prevImage}
          >
            <ArrowLeft />
          </div>
          <div
            className={cx(styles.navigationButton, {
              [styles.disable]: imageIndex + 1 === images.length,
              [styles.hide]: images.length === 1,
            })}
            onClick={nextImage}
          >
            <ArrowRight />
          </div>
        </div>
        {/* Empty div so that the above one is centered in flex */}
        <div></div>
      </div>
      <div className={styles.swipeContainer} ref={slideContainerRef}>
        {images.map((image, index) => (
          <div
            className={styles.slide}
            ref={slideRefs.current[index]}
            data-index={index}
            key={image}
          >
            <Slide image={image} active={activeImageIndex === index} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
