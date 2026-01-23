import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ImageCarousel.css';

const ImageCarousel = ({ images, autoScrollInterval = 4000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollContainerRef = useRef(null);
  const autoScrollTimerRef = useRef(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScrolling && images.length > 0) {
      autoScrollTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, autoScrollInterval);

      return () => {
        if (autoScrollTimerRef.current) {
          clearInterval(autoScrollTimerRef.current);
        }
      };
    }
  }, [isAutoScrolling, images.length, autoScrollInterval]);

  // Scroll to current image
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = currentIndex * scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  const goToPrevious = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index) => {
    setIsAutoScrolling(false);
    setCurrentIndex(index);
  };

  // Resume auto-scroll after manual interaction
  useEffect(() => {
    if (!isAutoScrolling) {
      const timer = setTimeout(() => {
        setIsAutoScrolling(true);
      }, 10000); // Resume auto-scroll after 10 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [isAutoScrolling, currentIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="image-carousel-container">
      <div className="image-carousel-wrapper">
        <button 
          className="carousel-arrow carousel-arrow-left" 
          onClick={goToPrevious}
          aria-label="Previous image"
        >
          <FaChevronLeft />
        </button>

        <div className="image-carousel" ref={scrollContainerRef}>
          {images.map((image, index) => (
            <div key={index} className="carousel-slide">
              <img 
                src={image.src} 
                alt={image.alt || `Image ${index + 1}`}
                className="carousel-image"
              />
            </div>
          ))}
        </div>

        <button 
          className="carousel-arrow carousel-arrow-right" 
          onClick={goToNext}
          aria-label="Next image"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="carousel-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
