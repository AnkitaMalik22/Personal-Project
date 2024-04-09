const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const connectToMongoDB = require("./config/db");
const errorMiddleware = require("./middlewares/error");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const cloudinary=require("cloudinary")
const Stripe = require("stripe");

const stripe=Stripe(process.env.Stripe_Key)
// ======================================================= APP CONFIG ===================================================

const app = express();
const PORT = process.env.PORT || 3000;


// Connect to MongoDB
connectToMongoDB();


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// ======================================================= MIDDLEWARES ===================================================
app.use(fileUpload(
  {
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
    createParentPath: true,

  }
));
app.use(cors({
  origin: ['http://localhost:3000', 'https://65a11283c51a3ba9c2cdb954--mellifluous-conkies-ba7b88.netlify.app/','https://deploy-preview-8--mellifluous-conkies-ba7b88.netlify.app','https://skillaccessclient.netlify.app','https://skillaccessprod.netlify.app'],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ======================================================= ROUTES =======================================================

const collegeRoutes = require("./routes/college/collegeRoutes.js");
const assessmentsRoutes = require('./routes/college/assessmentsRoutes.js');
const studentRoutes = require("./routes/student/studentRoutes.js");
const companyRoutes = require("./routes/company/companyRoutes.js");
const adminRoutes = require("./routes/admin/adminTestRoutes.js");

const studentDummyRoutes = require("./routes/student/studentDummyRoutes.js");
const collegeTeamRoutes = require("./routes/college/teamRoutes.js");
const qbRoutes = require("./routes/college/qbRoutes.js");

// routes
app.use("/api/college", collegeRoutes );
app.use("/api/college/teams", collegeTeamRoutes);
app.use("/api/assessments", assessmentsRoutes);
app.use("/api/student",studentRoutes );
app.use("/api/studentDummy", studentDummyRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qb", qbRoutes);


app.post("/create-checkout-session", async (req, res) => {
  const { products, customerName, customerAddress } = req.body;

  // Debugging: Print out request body
  console.log("Request Body:", req.body);

  const customerEmail = customerName.toLowerCase().replace(/\s+/g, '') + '@example.com';

  const currency = "inr"; // Example: Get currency from your data or logic
  let addressCollectionOptions = {
    billing_address_collection: 'required', // Default to required
    shipping_address_collection: {
      allowed_countries: ['IN'], // Default to IN addresses
    },
  };

  // Debugging: Print out currency and customer address
  console.log("Currency:", currency);
  console.log("Customer Country:", customerAddress ? customerAddress.country : "Unknown");

  if (currency !== "inr" && customerAddress && customerAddress.country !== "IN") {
    // For non-INR transactions and non-Indian addresses, set billing/shipping address outside India
    addressCollectionOptions = {
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // Example: List of countries outside India
      },
    };
  }

  // Debugging: Print out addressCollectionOptions
  console.log("Address Collection Options:", addressCollectionOptions);

  const lineItems = products.map((product) => ({
    price_data: {
      currency: currency,
      product_data: {
        name: product.dish,
      },
      unit_amount: product.price * 100,
    },
    quantity: product.qnty,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:3000/collage/accounting",
    cancel_url: "http://localhost:3000/collage/dashboard",
    customer_email: customerEmail,
    ...addressCollectionOptions, // Spread the address collection options
  });

  res.json({ id: session.id });
});




app.get("/", (req, res) => {
  res.send("API is running");
});



// ======================================================= ERROR MIDDLEWARE =======================================================

app.use(errorMiddleware);

// ======================================================= SERVER ===================================================================

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

// ======================================= HANDLE UNHANDLED PROMISE REJECTION =======================================================

// Unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});
