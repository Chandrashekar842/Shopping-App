import mongoose from 'mongoose'

const Schema = mongoose.Schema

const orderSchema = new Schema({
    products: [{
        product: { type: Object, required: true},
        quantity: { type: Number, required: true}
    }],
    user: {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        email: { type: String, required: true }
    }
})

export const Order = mongoose.model('Order', orderSchema)

