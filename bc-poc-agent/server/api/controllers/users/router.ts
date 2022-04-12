import express from 'express';
import controller from './controller'
export default express.Router()
    .get('/', controller.all)
    .get('/:id', controller.getUserInfoById)
    .post('/login', controller.login)
    .post('/join', controller.join)
    .post('/register', controller.register);