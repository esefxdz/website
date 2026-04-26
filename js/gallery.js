document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.querySelector('.lightbox-close');

  // Close lightbox when clicking the X
  if (closeBtn) {
    closeBtn.onclick = () => {
      lightbox.style.display = "none";
      lightboxImg.src = ""; // Clear source to stop GIFs
    }
  }

  // Close lightbox when clicking outside the image
  if (lightbox) {
    lightbox.onclick = (e) => {
      if (e.target !== lightboxImg && e.target !== closeBtn) {
        lightbox.style.display = "none";
        lightboxImg.src = ""; // Clear source to stop GIFs
      }
    }
  }

  // Function to load images into a specific container from a specific folder
  const loadGallery = (containerId, folderName, totalImages) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    for (let i = 1; i <= totalImages; i++) {
      const img = document.createElement('img');
      img.alt = `${folderName} Image ${i}`;
      
      // Load the thumbnail instead of the full image
      img.src = `${folderName}/thumbnails/${i}.jpg`;
      
      // If thumbnail fails to load, it means the image doesn't exist at all
      img.onerror = () => { img.style.display = 'none'; };

      // Open lightbox on click
      img.onclick = () => {
        lightbox.style.display = "block";
        lightboxImg.src = ""; // Clear previous image
        
        // Try loading original full quality image: jpg -> png -> gif
        const tryLoad = (extensions) => {
            if (extensions.length === 0) return; // All failed
            const testExt = extensions.shift();
            
            const tempImg = new Image();
            tempImg.onload = () => {
                lightboxImg.src = tempImg.src; // Success! Show it.
            };
            tempImg.onerror = () => {
                tryLoad(extensions); // Failed, try next extension
            };
            tempImg.src = `${folderName}/${i}.${testExt}`;
        };
        
        // Start trying to find the full image
        tryLoad(['jpg', 'png', 'gif']);
      };

      container.appendChild(img);
    }
  };

  // Load your original Gallery
  loadGallery('gallery-container', 'gallery', 50);

  // Load your new Ahmet Museum (adjust the number 20 to however many photos you have)
  loadGallery('ahmet-container', 'ahmet', 20); 
});