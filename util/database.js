import mongodb from 'mongodb'
const MongoClient = mongodb.MongoClient

let _db

export const mongoConnect = callback => {
    MongoClient.connect('mongodb+srv://Chandu21:Chandu21@cluster0.0sbmxs4.mongodb.net/shop?retryWrites=true&w=majority')
        .then(client => {
            console.log('Connected to Database')
            _db = client.db() 
            callback()
        })
        .catch(err => console.log(err))
}

export const getDb = () => {
    if(_db) {
        return _db
    }
    throw "No Database Found!!"
}

