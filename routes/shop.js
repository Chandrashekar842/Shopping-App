import express from "express";
import {
  displayProducts,
  moreProducts,
  getProduct,
  postCart,
  getCart,
  postDeleteCartProduct,
  postOrder,
  getOrders,
  getInvoice,
  getCheckOut,
  getCheckoutSuccess
} from "../controllers/shop.js";
import { protectRoute } from "../middleware/is-Auth.js";

const shoprouter = express.Router();

shoprouter.get("/", moreProducts);

shoprouter.get("/products", displayProducts);

shoprouter.get("/products/:productId", getProduct);

shoprouter.get("/cart", protectRoute, getCart);

shoprouter.post("/cart", protectRoute, postCart);

shoprouter.post("/delete-cart-item", protectRoute, postDeleteCartProduct);

shoprouter.get("/orders", protectRoute, getOrders);

shoprouter.get("/orders/:orderId", protectRoute, getInvoice);

shoprouter.get('/checkout', protectRoute, getCheckOut)

shoprouter.get('/checkout/sucess', getCheckoutSuccess)

shoprouter.get('/checkout/cancel', getCheckOut)

export default shoprouter;
