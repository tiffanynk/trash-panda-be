const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/locations', (request, response) => {
    admin.firestore().collection('Locations').get()
        .then(data => {
            let locations = []
            data.forEach(document => {
                locations.push({
                    locationId: document.id,
                    ...document.data()
                })
            })
            return response.json(locations)
        })
        .catch(error => console.error(error))
})

app.post('/location', (request, response) => {
    const newLocation = {
        lat: request.body.lat,
        lng: request.body.lng,
        name: request.body.name,
        trash: request.body.trash,
        recycling: request.body.recycling
    }

    admin.firestore().collection('Locations').add(newLocation)
        .then(document => {
            let createdLocation = newLocation;
            createdLocation.locationId = document.id;
            response.json(createdLocation)
        })
        .catch(error => {
            response.status(500).json({ error: 'Something went wrong!' });
            console.error(error);
    })
})

//turns all of our functions into multiple routes
exports.api = functions.https.onRequest(app);