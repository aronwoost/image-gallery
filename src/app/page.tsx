'use client';

import './global.css';

import { useState } from 'react';

import ImageGallery from './ImageGallery';
import styles from './page.module.css';
import type { Image } from './types';

const IMAGES: Image[] = [
  {
    src: './image02.jpg',
    alt: 'Lake District National Park, Buttermere, https://www.lakedistrict.gov.uk/learning/freephotos',
  },
  {
    src: './image03.jpg',
    alt: 'Lake District National Park, Buttermere, https://www.lakedistrict.gov.uk/learning/freephotos',
  },
  {
    src: './image04.jpg',
    alt: 'Lake District National Park, Buttermere, https://www.lakedistrict.gov.uk/learning/freephotos',
  },
  {
    src: './image05.jpg',
    alt: 'Lake District National Park, Buttermere, https://www.lakedistrict.gov.uk/learning/freephotos',
  },
  {
    src: './image06.jpg',
    alt: 'Lake District National Park, Buttermere, https://www.lakedistrict.gov.uk/learning/freephotos',
  },
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
      <h3>Highlights:</h3>
      <ul>
        <li>
          Optimized for desktop and mobile (try all the gestures you know from
          your mobile device)
        </li>
        <li>No external dependencies (small file size)</li>
        <li>Uses modern JS/CSS (very performant)</li>
      </ul>
      <h3>Features:</h3>
      <ul>
        <li>swipe-left/swipe-right to navigate</li>
        <li>pinch-zoom</li>
        <li>swipe-up/swipe-down to close</li>
        <li>pinch-small to close</li>
        <li>double-tab to zoom</li>
        <li>key navigation</li>
      </ul>
      <footer className={styles.footer}>
        © 2024. Check sourcecode on{' '}
        <a href="https://github.com/aronwoost/image-gallery" target="blank">
          Github
        </a>
        .
      </footer>
    </main>
  );
}
