document.addEventListener('DOMContentLoaded', () => {
  // Function to load images into a specific container from a specific folder
  const loadGallery = (containerId, folderName, totalImages) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    for (let i = 1; i <= totalImages; i++) {
      const img = document.createElement('img');
      img.alt = `${folderName} Image ${i}`;
      
      // Try loading jpg -> png -> gif
      img.src = `${folderName}/${i}.jpg`;
      img.onerror = () => {
        img.src = `${folderName}/${i}.png`;
        img.onerror = () => {
          img.src = `${folderName}/${i}.gif`;
          img.onerror = () => { img.style.display = 'none'; };
        };
      };
      container.appendChild(img);
    }
  };

  // Load your original Gallery
  loadGallery('gallery-container', 'gallery', 50);

  // Load your new Ahmet Museum (adjust the number 20 to however many photos you have)
  loadGallery('ahmet-container', 'ahmet', 20); 
});