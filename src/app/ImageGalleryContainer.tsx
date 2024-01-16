"use client";

import ImageGallery from "./ImageGallery";
import styles from "./ImageGalleryContainer.module.css";

const IMAGES = [
  "./image02.jpg",
  "./image03.jpg",
  "./image04.jpg",
  "./image05.jpg",
  "./image06.jpg",
];

const ImageGalleryContainer = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className={styles.container}>
      <p>hello</p>
      <ImageGallery index={0} images={IMAGES} onClose={onClose} />
    </div>
  );
};

export default ImageGalleryContainer;
