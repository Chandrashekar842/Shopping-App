import express from 'express'
import { getAddProduct, postAddProduct, productsForAdmin, getEditProduct, postEditProduct, deleteProduct} from '../controllers/admin.js'
import { protectRoute } from '../middleware/is-Auth.js'
import { check } from 'express-validator'

const adminrouter = express.Router()

adminrouter.get('/add-product',protectRoute, getAddProduct)

adminrouter.post('/add-product',
        [
            check('title')
                .isString()
                .isLength({min: 3})
                .trim(),
            check('price')
                .isNumeric(),
            check('description')
                .isLength({min: 8, max: 400})
                .trim()
        ],protectRoute, postAddProduct)

adminrouter.get('/products', protectRoute, productsForAdmin)

adminrouter.get('/edit-product/:productId', protectRoute, getEditProduct)

adminrouter.post('/edit-product',
        [
            check('title')
                .isAlphanumeric()
                .isLength({min: 3})
                .trim(),
            check('price')
                .isNumeric(),
            check('description')
                .isLength({min: 8, max: 400})
                .trim()
        ],protectRoute, postEditProduct)

adminrouter.post('/delete-product/:productId', protectRoute, deleteProduct)

export default adminrouter; 