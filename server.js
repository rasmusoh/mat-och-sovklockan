// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');
const short = require('short-uuid');
//console.log(short.generate());
const app = express();
const fs = require('fs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

// init postgres db
const { Pool } = require('pg');
const pool = new Pool({
    user: 'mosk-test',
    host: 'localhost',
    database: 'matochsovklockan',
    password: 'test',
    port: 5432
});
pool.on('error', (err, _) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

const dbScripts = [
    `CREATE TYPE activityType AS ENUM ('sleep', 'eat')`,
    `CREATE TABLE IF NOT EXISTS Baby (
        id SERIAL PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        uri VARCHAR(64) NOT NULL,
        created TIMESTAMP NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS Activity (
         id SERIAL PRIMARY KEY,
         uid uuid NOT NULL,
         type activityType NOT NULL,
         fromTime TIMESTAMP NOT NULL,
         toTime TIMESTAMP NOT NULL,
         baby_id INTEGER REFERENCES Baby NOT NULL);`
];
for (const script of dbScripts) {
    pool.query(script, (err, res) => {
        console.log(err ? err.stack : 'script ran successfully');
    });
}

app.get('/', (_, response) => {
    response.sendFile(`${__dirname}/views/index.html`);
});

app.get('/:baby', (_, response) => {
    response.sendFile(`${__dirname}/views/details.html`);
});

app.post('/', (request, response) => {
    const uri = short.generate();
    pool.query(
        `INSERT INTO Baby (name, uri, created) 
            VALUES ($1, $2, $3)`,
        [cleanseString(request.body.name), uri, new Date()],
        error => {
            if (error) {
                console.log(error);
                response.status(500);
                response.send({ message: 'error!' });
            } else {
                response.status(201);
                response.send({ location: `/${uri}` });
            }
        }
    );
});

app.get(':baby/activities', (request, response) => {
    pool.query(
        `SELECT * 
            FROM Activity 
            INNER JOIN Baby ON Activity.baby_id = Baby.id
            WHERE Baby.uri=$1`,
        [request.params.baby],
        (err, res) => {
            if (res && res.rows) {
                response.send(
                    JSON.stringify(
                        rows.map(x => ({
                            id: x.uid,
                            type: x.type,
                            from: x.fromTime,
                            to: x.toTime
                        }))
                    )
                );
            } else {
                console.log(err);
                response.status(500);
                response.send('error');
            }
        }
    );
});

app.post(':baby/activities', (request, response) => {
    const babyId = request.params.baby;
    console.log(
        `add to activities ${request.body.type}, ${request.body.from},${request.body.to} from baby ${babyId}`
    );

    pool.query(
        `INSERT INTO Activity (uid, type, fromTime, toTime, baby_id) 
            SELECT $1,$2,$3,$4,Baby.uri
            FROM Baby 
            WHERE id=$4`,
        [
            cleanseString(request.body.id),
            cleanseString(request.body.type),
            cleanseString(request.body.from),
            cleanseString(request.body.to),
            babyId
        ],
        error => {
            if (error) {
                console.log(error);
                response.status(500);
                response.send({ message: 'error!' });
            } else {
                response.status(201);
                response.send();
            }
        }
    );
});

app.delete(':baby/activities', (request, response) => {
    console.log(`delete activity ${request.body.id}`);

    const cleansedId = parseInt(request.body.id);
    pool.query(
        `DELETE FROM Activity
            USING Baby
         WHERE 
            Activity.baby_id = Baby.id AND
            Activity.uid=$1 AND
            Baby.uri=$2`,
        [cleansedId, request.params.baby],
        error => {
            if (error) {
                console.log(error);
                response.status(500);
                response.send({ message: 'error!' });
            } else {
                response.send();
            }
        }
    );
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
    return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

var listener = app.listen(process.env.PORT, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});
