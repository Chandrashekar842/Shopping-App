import { User } from "../models/user.js"
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { validationResult } from "express-validator"

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "info.easybuycart@gmail.com",
        pass: "xtsy rsax aoln ywfp"
    },
});

export const getLogin = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validateError: []
    })
}

export const postLogin = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            isAuthenticated: req.session.isLoggedIn,
            oldInput: {
                email: email,
                password: password
            },
            validateError: errors.array()
        })
    }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    isAuthenticated: req.session.isLoggedIn,
                    errorMessage: 'Invalid email',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validateError: []
                })
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true
                        req.session.user = user
                        return req.session.save((err) => {
                            console.log(err)
                            res.redirect('/')
                        })
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid password',
                        isAuthenticated: req.session.isLoggedIn,
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validateError: []
                    })
                })
        })
        .catch(err => console.log(err))
}

export const postLogOut = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/login')
    })
}

export const getSignUp = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmpassword: ''
        },
        validateError: []
    })
}

export const postSignUp = (req, res, next) => {
    const { email, password } = req.body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'SignUp',
            errorMessage: errors.array()[0].msg,
            isAuthenticated: req.session.isLoggedIn,
            oldInput: {
                email: email,
                password: password,
                confirmpassword: req.body.confirmpassword,
            },
            validateError: errors.array()
        })
    }
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            })
            return user.save()
        })
        .then(() => {
            res.redirect('/login')
            return transporter.sendMail({
                from: 'info.easybuycart@gmail.com', // sender address
                to: email, // list of receivers
                subject: "SignUp Confirmation ✔", // Subject line
                html: "<b>You Successfully signed In. Happy Shopping</b>", // html body
            });
        })
        .catch(err => console.log(err))
}

export const getReset = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message
    })
}

export const postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No Account with the email found!')
                    return res.redirect('/reset')
                }
                user.resetToken = token
                user.resetTokenExpiration = Date.now() + 3600000
                return user.save()
            })
            .then(result => {
                res.redirect('/')
                transporter.sendMail({
                    from: 'info.easybuycart@gmail.com', // sender address
                    to: req.body.email, // list of receivers
                    subject: "Password Reset", // Subject line
                    html: `
                        <h3>You requested a password reset</h3>
                        <h4>Click this <a href='http://localhost:3000/reset/${token}'>link</a> to set a new password</h4>
                    `
                });
            })
            .catch(err => console.log(err))
    })
}

export const getNewPassword = (req, res, next) => {
    const token = req.params.token
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error')
            if (message.length > 0) {
                message = message[0]
            } else {
                message = null
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Update Password',
                userId: user._id.toString(),
                errorMessage: message,
                isAuthenticated: req.session.isLoggedIn,
                passwordToken: token
            })
        })
        .catch(err => console.log(err))
}

export const postNewPassword = (req, res, next) => {
    const newPassword = req.body.password
    const userId = req.body.userId
    const passwordToken = req.body.passwordToken
    let resetUser

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            console.log(user)
            resetUser = user
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword
            resetUser.resetToken = undefined
            resetUser.resetTokenExpiration = undefined
            return resetUser.save()
        })
        .then(result => {
            console.log(result)
            res.redirect('/')
        })
        .catch(err => console.log(err))
}