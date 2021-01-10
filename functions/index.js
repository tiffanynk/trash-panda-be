const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const firebaseConfig = require('../firebaseConfig');
admin.initializeApp();

const firebase = require('firebase');
const database = admin.firestore();
firebase.initializeApp(firebaseConfig);
const cors = require('cors');
const { ResultStorage } = require('firebase-functions/lib/providers/testLab');
app.use(cors());

app.get('/locations', (request, response) => {
    database.collection('Locations').get()
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

    database.collection('Locations').add(newLocation)
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

app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        username: request.body.username
    };

    database.doc(`users/${newUser.username}`).get()
        .then(document => {
            if(document.exists){
                return response.status(400).json({ username: 'This username is already taken.'})
            } else {
                return firebase
                        .auth()
                        .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            return response.status(201).json({ token })
        })
        .catch(error => {
            console.error(error);
            if(error.code !== null){
                return response.status(400).json({ user: 'This username or email is already in use.' });
            } else {
                return response.status(500).json({ error: error.code });
            }
        });    
})

//turns all of our functions into multiple routes
exports.api = functions.https.onRequest(app);