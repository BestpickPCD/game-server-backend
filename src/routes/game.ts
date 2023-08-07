import { 
    getGameVendors
  } from "../controllers/gameController/index.ts";
  import express from "express"; 
  
  const router = express.Router();
   
  router.get("/game-list/:vendors", getGameVendors);
  
  export default router;
  