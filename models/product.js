import mongoose from 'mongoose'

const Schema = mongoose.Schema

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    }, 
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

export const Product =  mongoose.model('Product', productSchema)


// import mongodb from 'mongodb'
// import { getDb } from '../util/database.js'

// export class Product {
//     constructor(title, imageUrl, price, description, id, userId) {
//         this.title = title,
//         this.imageUrl = imageUrl,
//         this.price = price,
//         this.description = description
//         this._id = id ? id : null
//         this.userId = userId
//     }

//     save() {
//         const db = getDb()
//         let dbOp
//         if (this._id) {
//             dbOp = db.collection('products').updateOne({ _id: new mongodb.ObjectId(this._id) }, { $set: this })
//         } else {
//             dbOp = db.collection('products').insertOne(this)
//         }
//         return dbOp
//             .then(result => {
//                 console.log('Product Updated')
//             })
//             .catch(err => console.log(err))
//     }

//     static fetchAll() {
//         const db = getDb()
//         return db.collection('products')
//             .find()
//             .toArray()
//             .then(products => {
//                 return products
//             })
//             .catch(err => console.log(err))
//     }

//     static fetchProduct(id) {
//         const db = getDb()
//         return db.collection('products')
//             .find({ _id: new mongodb.ObjectId(id) })
//             .next()
//             .then(product => {
//                 return product
//             })
//             .catch(err => console.log(err))
//     }

//     static deleteById(prodId) {
//         const db = getDb()
//         return db.collection('products')
//             .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//             .then(() => {
//                 console.log('Product Deleted')
//             })
//             .catch(err => console.log(err))
//     }
// }

