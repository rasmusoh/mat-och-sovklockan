const form = document.forms[0];
const babyName = form.elements['babyName'];
const success = document.querySelector('#success');
const detailsLink = document.querySelector('#detailsLink');
success.style.display = 'none';

form.onsubmit = event => {
    event.preventDefault();

    fetch('/', {
        method: 'POST',
        body: JSON.stringify({ name: babyName.value }),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(response => {
            success.style.display = '';
            form.style.display = 'none';
            detailsLink.setAttribute('href', response.location);
            detailsLink.innerText = window.location + response.location;
        });
};
