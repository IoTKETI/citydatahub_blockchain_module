import express from 'express';
import controller from './controller'
export default express.Router()
    .post('/add', controller.addDevice)
    .post('/register', controller.putDevice)
    .get('/:deviceId', controller.getDeviceById);
    