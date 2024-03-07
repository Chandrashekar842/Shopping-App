import { Product } from "../models/product.js";
import { Order } from "../models/order.js";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import stripePackage from "stripe";

const stripe = stripePackage(
  "sk_test_51OpER1SCu3zlpeytPtDkxw4zPGlmayHEwoIDbRelMoXagZy6bKy2rcvwGBCBFZ4LIyN6blW7plMOLf5NiGJaXpT000v7paIv9N"
);

const ITEMS_PER_PAGE = 3;

export const displayProducts = (req, res, next) => {
  // Product.find().then((products) => {
  //   res.render("shop/product-list", {
  //     prods: products,
  //     pageTitle: "Products",
  //     path: "/products",
  //     isAuthenticated: req.session.isLoggedIn,
  //   });
  // });
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products list",
        path: "/product-list",
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    });
};
// };

export const moreProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        isAuthenticated: req.session.isLoggedIn,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    });
};

export const getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then((product) => {
    res.render("shop/product-detail", {
      prod: product,
      pageTitle: product.title,
      path: "/products",
      isAuthenticated: req.session.isLoggedIn,
    });
    console.log(product);
  });
};

export const postCart = (req, res, next) => {
  const prodId = req.body.productId;
  return Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

export const getCart = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.map((product) => {
        let cost = product.quantity * product.productId.price;
        total = total + cost;
      });
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        total: total,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

export const postDeleteCartProduct = (req, res, next) => {
  const productId = req.body.productId;

  req.user
    .removeFromCart(productId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => console.log(err));
};

export const postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return {
          product: { ...item.productId._doc },
          quantity: item.quantity,
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => console.log(err));
};

export const getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

export const getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order Found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthoriazed"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        ' inline; filename=" ' + invoiceName + ' " '
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
      });

      pdfDoc.text("------------------------------------");

      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.product.price * prod.quantity;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              prod.product.price +
              " Rs."
          );
      });
      pdfDoc.text("Total Price: " + totalPrice + " Rs");

      pdfDoc.end();
    })
    .catch((err) => {
      next(err);
    });
};

export const getCheckOut = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.map((product) => {
        let cost = product.quantity * product.productId.price;
        total = total + cost;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        // line_items: products.map(p => {
        //   return {
        //     price: p.productId,
        //     quantity: p.quantity
        //   }
        // }),
        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "inr",
              product_data: {
                name: p.productId.title,
              },
              unit_amount: p.productId.price * 100,
            },
            quantity: p.quantity
          };
        }),
        success_url: req.protocol + "://" + req.get("host") + "/checkout/success",
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/chekcOut ",
        pageTitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: session.id,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

export const getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return {
          product: { ...item.productId._doc },
          quantity: item.quantity,
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => console.log(err));
};
