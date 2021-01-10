const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const firebaseConfig = require('./firebaseConfig');
admin.initializeApp();
const firebase = require('firebase');
const database = admin.firestore();
firebase.initializeApp(firebaseConfig);
const cors = require('cors');
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

    database.collection('Locations')
        .add(newLocation)
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

const isEmail = email => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)){
        return true
    } else {
        return false
    }
}

const isBlank = string => {
    return (!string || /^\s*$/.test(string));
}

app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        username: request.body.username
    };

    let errors = {};

    if(isBlank(newUser.email)){
        errors.email = 'Please enter an email address.'
    } else if(!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email address.'
    }
    
    if(isBlank(newUser.password)){
        errors.password = 'Please enter a password'
    }

    if(isBlank(newUser.username)){
        errors.username = 'Please enter a username'
    }

    if(Object.keys(errors).length > 0){
        return response.status(400).json(errors)
    }

    let token;
    let userId;
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
            userId = data.user.uid
            return data.user.getIdToken()
        })
        .then(userToken => {
            token = userToken
            const userCredentials = {
                username: newUser.username,
                email: newUser.email,
                totalPoints: 0,
                userId
            }
            database.doc(`/users/${newUser.username}`)
                .set(userCredentials)
            return response.status(201).json({user: {email: userCredentials.email}, token})
        })
        .catch(error => {
            console.error(error);
            if(error.code === 'auth/email-already-in-use'){
                return response.status(400).json({ user: 'This email is already in use.' });
            } else {
                return response.status(500).json({ error: error.code });
            }
        });    
})


app.post('/login', (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    }

    let errors = {};

    if(isBlank(user.email)){
        errors.email = 'Please enter your email address.'
    }

    if(isBlank(user.password)){
        errors.password = 'Please enter your password.'
    }

    if(Object.keys(errors).length > 0){
        return response.status(400).json(errors)
    }

    firebase.auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            response.json({user: {email: user.email}, token })
        })
        .catch(error => {
            console.error(error)
            if(error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'){
                return response.status(403).json({ status: 'Wrong credentials. Please try again.'})
            } else {
                return response.status(500).json({ error: error.code })
            }
        })

})
//turns all of our functions into multiple routes
exports.api = functions.https.onRequest(app);