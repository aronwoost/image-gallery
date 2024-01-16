"use client";

import { useState } from "react";
import ImageGalleryContainer from "./ImageGalleryContainer";

export default function Home() {
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <main>
      <div>
        <button type="button" onClick={() => setGalleryOpen(true)}>
          Open Gallery
        </button>
      </div>
      {galleryOpen && <ImageGalleryContainer />}
    </main>
  );
}
