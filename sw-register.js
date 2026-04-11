if ('serviceWorker' in navigator && window.location.pathname.startsWith('/books/')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('The Computist Reader: Service Worker registered');
      })
      .catch(error => {
        console.log('The Computist Reader: Service Worker registration failed', error);
      });
  });
}