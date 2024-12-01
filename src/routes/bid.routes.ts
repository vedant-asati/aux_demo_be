import { Router } from 'express';
import { createBid } from '../controllers/bid.controller';

const router = Router();

router.post('/', createBid);
router.get('/', (req,res)=>{
    res.send(200);

});

export default router;