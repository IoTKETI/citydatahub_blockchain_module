import express from 'express';
import controller from './controller'
export default express.Router()
    .get('/block/:number', controller.getBlockByNumber)
    .get('/transaction/:id', controller.getTransactionById)
    .get('/chainInfo', controller.getChainInfo)
    .get('/channels', controller.getChannels);
    