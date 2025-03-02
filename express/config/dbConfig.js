import mongoose from "mongoose";

export async function dbConnect() {
    try{
        const connect = await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log(`MongoDB Connected: ${connect.connection.host}`);
        
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}