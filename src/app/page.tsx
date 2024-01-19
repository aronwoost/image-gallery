'use client';

import './global.css';

import { useState } from 'react';

import ImageGallery from './ImageGallery';
import styles from './page.module.css';

const IMAGES = [
  './image02.jpg',
  './image03.jpg',
  './image04.jpg',
  './image05.jpg',
  './image06.jpg',
];

export default function Home() {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [displayedImageIndex, setDisplayedImageIndex] = useState(-1);

  return (
    <main className={styles.container}>
      <h1>Image Gallery</h1>
      <div className={styles.buttons}>
        <button
          className={styles.button}
          type="button"
          onClick={() => setGalleryOpen(true)}
        >
          Open Gallery
        </button>
        {displayedImageIndex !== -1 && (
          <p className={styles.imageIndex}>
            Last displayed image index: {displayedImageIndex}
          </p>
        )}
      </div>
      {galleryOpen && (
        <ImageGallery
          index={0}
          images={IMAGES}
          onClose={() => setGalleryOpen(false)}
          onImageChange={(index) => setDisplayedImageIndex(index)}
        />
      )}
      <p>
        This Image Gallery is optimized both for desktop and mobile (try all the
        gestures you know from your mobile device), has no external dependencies
        (small file size), uses modern CSS/JS (very performant) and has
        generally little code (less code = less to maintain).
      </p>
      <h3>Features:</h3>
      <ul>
        <li>swipe-left/swipe-right to navigate</li>
        <li>pinch-zoom</li>
        <li>swipe-up/swipe-down to close</li>
        <li>pinch-small to close</li>
        <li>double-tab to zoom</li>
        <li>key navigation</li>
      </ul>
      <footer>
        Check sourcecode on{' '}
        <a href="https://github.com/aronwoost/image-gallery" target="blank">
          Github
        </a>
      </footer>
    </main>
  );
}
