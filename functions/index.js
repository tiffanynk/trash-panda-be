const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.getLocations = functions.https.onRequest((request, response) => {
    admin.firestore().collection('Locations').get()
        .then(data => {
            let locations = []
            data.forEach(document => {
                locations.push(document.data())
            })
            return response.json(locations)
        })
        .catch(error => console.error(error))
})