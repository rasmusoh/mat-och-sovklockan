const form = document.forms[0];
const error = document.querySelector('#error');
const babyName = form.elements['babyName'];
const success = document.querySelector('#success');
const detailsLink = document.querySelector('#detailsLink');
success.style.display = 'none';

form.onsubmit = async event => {
    event.preventDefault();
    error.style.display = 'none';
    const response = await fetch('/', {
        method: 'POST',
        body: JSON.stringify({ name: babyName.value }),
        headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
        const body = await response.json();
        success.style.display = '';
        form.style.display = 'none';
        detailsLink.setAttribute('href', body.location);
        detailsLink.innerText = window.location + body.location;
    } else {
        error.style.display = '';
    }
};
