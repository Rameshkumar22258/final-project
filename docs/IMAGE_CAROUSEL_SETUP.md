# Image Carousel Setup Instructions

## Image Location
Place your 4 images in the `frontend/public/` folder. The images will be accessible via `/image-name.jpg` in the React app.

## Update Image Paths
In `frontend/src/pages/Dashboard.js`, update the `carouselImages` array with your actual image filenames:

```javascript
const carouselImages = [
  { src: '/your-image-1.jpg', alt: 'Description 1' },
  { src: '/your-image-2.jpg', alt: 'Description 2' },
  { src: '/your-image-3.jpg', alt: 'Description 3' },
  { src: '/your-image-4.jpg', alt: 'Description 4' }
];
```

## Features
- ✅ Automatic horizontal scrolling (one image at a time)
- ✅ Manual navigation with arrow buttons
- ✅ Dot indicators for current image
- ✅ Auto-scroll pauses when user manually navigates
- ✅ Responsive design for mobile devices

## Current Setup
The carousel is configured to:
- Auto-scroll every 4 seconds
- Show one image at a time
- Resume auto-scroll after 10 seconds of manual inactivity
