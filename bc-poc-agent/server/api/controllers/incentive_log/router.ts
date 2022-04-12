import express from 'express';
import controller from './controller'
export default express.Router()
    .post('/transfer', controller.putIncentiveWithHistory)        
    .post('/query/user', controller.getIncentiveHistoryByUser)
    .get('/query', controller.getIncentiveAllHistory)