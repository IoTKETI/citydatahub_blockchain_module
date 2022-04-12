import express from 'express';
import controller from './controller'
export default express.Router()
    .post('/init', controller.init)
    .post('/generate', controller.generate)
    .get('/totalSupply', controller.totalSupply)
    .get('/name', controller.name)
    .get('/balanceOf/:userId', controller.balanceOf)
    .get('/availableBalanceOf/:userId', controller.availableBalanceOf)
    .post('/transfer', controller.transfer)
    .post('/performanceTest', controller.performanceTest)
    .post('/approve', controller.approve)
    .post('/allowance', controller.allowance)
    .post('/transferFrom', controller.transferFrom); 