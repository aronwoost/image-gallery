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
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <main>
      <div className={styles.buttons}>
        <button
          type="button"
          onClick={() => {
            setImageIndex(0);
            setGalleryOpen(true);
          }}
        >
          Open Gallery
        </button>
        <button
          type="button"
          onClick={() => {
            setImageIndex(2);
            setGalleryOpen(true);
          }}
        >
          Open Gallery with third image
        </button>
      </div>
      {galleryOpen && (
        <ImageGallery
          index={imageIndex}
          images={IMAGES}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </main>
  );
}
