import express from 'express'
import { check, body } from "express-validator";

import { getLogin, postLogin, postLogOut, getSignUp, postSignUp, getReset, postReset, getNewPassword, postNewPassword } from '../controllers/auth.js'
import { User } from '../models/user.js';

const authrouter = express.Router()

authrouter.get('/login', getLogin)

authrouter.post('/login', postLogin)

authrouter.post('/logout', postLogOut)

authrouter.get('/signup', getSignUp)

authrouter.post('/signup', 
        [
            check('email')
                .isEmail()
                .withMessage('Enter a valid email!')
                .normalizeEmail()
                .custom((value, {req}) => {
                    return User.findOne({email: value})
                        .then(userDoc => {
                            if(userDoc) {
                                return Promise.reject(
                                    'E-mail exists already, please pick a different one'
                                )
                            }
                        })
                }),
            body('password', 'Please enter a password with only letters and numbers and atleast 5 characters')
                .isLength({min: 5})
                .isAlphanumeric()
                .trim(),
            body('confirmpassword').trim().custom((value, {req}) => {
                if(value !== req.body.password) {
                    throw new Error('Passwords are not matched!')
                }
                return true
            })
        ],
        postSignUp)

authrouter.get('/reset', getReset)

authrouter.post('/reset', postReset)

authrouter.get('/reset/:token', getNewPassword)

authrouter.post('/new-password', postNewPassword)

export default authrouter