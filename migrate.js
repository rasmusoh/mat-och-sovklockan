const fetch = require('node-fetch');

const babyName = 'testBaby';
const fromBaseUrl = 'https://sixth-tugboat.glitch.me';
const toBaseUrl = 'http://localhost:3000';
async function migrate() {
    let res = await fetch(fromBaseUrl + '/activities');
    if (!res.ok) {
        console.log('failed');
        return;
    }
    var activities = await res.json();
    res = await fetch(toBaseUrl, {
        method: 'POST',
        body: JSON.stringify({ name: babyName }),
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        console.log('failed posting baby');
        return;
    }
    const createBody = await res.json();
    const uri = createBody.location;
    console.log('uri: ' + uri);

    for (const activity of activities) {
        activity.type = activity.type === 'ate' ? 'eat' : 'sleep';
        const response = await fetch(`${toBaseUrl}${uri}/activities`, {
            method: 'POST',
            body: JSON.stringify(activity),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            console.log('failed posting activity');
            return;
        }
    }
}
try {
    migrate();
} catch (e) {
    console.log(e);
}
