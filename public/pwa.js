const addToHomescreen = document.querySelector('#addToHomescreen');

document
    .querySelector('#manifest-link')
    .setAttribute(
        'href',
        `/manifest.webmanifest?start_url=${encodeURIComponent(
            window.location.pathname
        )}`
    );

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
    console.log("we're a PWA!");
    addToHomescreen.style.display = '';
    deferredPrompt = e;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/serviceWorker.js').then(
            function(registration) {
                // Registration was successful
                console.log(
                    'ServiceWorker registration successful with scope: ',
                    registration.scope
                );
            },
            function(err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err);
            }
        );
    });
}

addToHomescreen.onclick = e => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(result => {
        if (result.outcome === 'accepted') {
            addToHomescreen.style.display = 'none';
        }
    });
};
