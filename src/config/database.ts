import mongoose from "mongoose";
import config from ".";

const connectDB = async () => {
  try {
    console.log(config.database_url);
    await mongoose.connect(config.database_url as string);
    console.log("MongoDB Connected Successfully ✔");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌", error);
    process.exit(1);
  }
};

export default connectDB;
