import cx from 'classnames';
import React, { createRef, Fragment, useEffect, useRef, useState } from 'react';

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
  const imageIndexRef = useRef(initialIndex);
  const [imageIndex, setImageIndex] = useState(imageIndexRef.current);

  console.log({ imageIndex });

  const [opacity, setOpacity] = useState(1);
  const [pinchingInProgress, setPinchingInProgress] = useState(false);

  const rotationInProgress = useRef(false);

  const imagesAndVideos = images;
  const slideRefs = useRef(
    imagesAndVideos.map(() => createRef<HTMLDivElement>())
  );

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChangeOpacity = (event: any) => setOpacity(event.opacity);
  const handleClose = () => onClose();

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

        entries.forEach((entry) => {
          // used to determine for image being changed
          if (entry.intersectionRatio === 1) {
            changeImage(
              parseInt((entry.target as HTMLElement).dataset.index ?? '', 10)
            );
          }
        });
      },
      {
        root: element,
        // having top/bottom margin of 1px fixes an issue, that the
        // IntersectionObserver doesn't kick in, when height is float
        // instead of int (315.5 vs 315).
        rootMargin: '1px 0px',
        threshold: [0.05, 1],
      }
    );

    element.addEventListener('pinchingStarted', handlePinchingStarted);
    element.addEventListener('pinchingEnded', handlePinchingEnded);
    element.addEventListener('changeOpacity', handleChangeOpacity);
    element.addEventListener('close', handleClose);

    slideRefs.current.forEach(({ current }) => {
      if (current) observer.observe(current);
    });

    // eslint-disable-next-line consistent-return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideContainerRef.current]);

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
          slide.scrollIntoView({ block: 'nearest', inline: 'start' });
        }
      }

      // Re-enable IntersectionObserver
      rotationInProgress.current = false;

      window.removeEventListener('resize', handleResize);
    };

    // Wait for the resize event. Only at that moment the new height is actually set.
    window.addEventListener('resize', handleResize);
  };

  useEffect(() => {
    // prevent Mobile Safari from sometimes(TM) capturing the pinch/zoom gesture
    document.addEventListener('gesturestart', preventEvent);

    document.addEventListener('keydown', handleKeyDown);

    window.addEventListener('orientationchange', handleOrientationChange);

    // eslint-disable-next-line consistent-return
    return () => {
      document.removeEventListener('gesturestart', preventEvent);

      document.removeEventListener('keydown', handleKeyDown);

      window.removeEventListener('orientationchange', handleOrientationChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!slideRefs.current?.[imageIndex].current) {
      return;
    }

    const slide = slideRefs.current[imageIndex].current;

    if (slide) {
      slide.scrollIntoView({ block: 'nearest', inline: 'start' });
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
        <span
          className={styles.counter}
        >{`${imageIndex + 1} / ${imagesAndVideos.length}`}</span>
        <button type="button" className={styles.closeButton} onClick={close}>
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
              <div
                className={cx(
                  styles.navigationButton,
                  styles.interface,
                  styles.previous,
                  {
                    [styles.disablePointerEvents]: pinchingInProgress,
                  }
                )}
                onClick={prevImage}
              >
                <ArrowLeft />
              </div>
              <div
                className={cx(
                  styles.navigationButton,
                  styles.interface,
                  styles.next,
                  {
                    [styles.disablePointerEvents]: pinchingInProgress,
                  }
                )}
                onClick={nextImage}
              >
                <ArrowRight />
              </div>
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
                <Slide image={imageOrVideo} active={imageIndex === index} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
