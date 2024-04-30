const Stripe = require("stripe");
const College = require("../../../models/college/collegeModel");
const Payment = require("../../../models/college/account/paymentModel");

const stripe=Stripe(process.env.STRIPE_SECRET_KEY);


const makePayment =  async (req, res) => {
    const { products, customerName, customerAddress } = req.body;
    const collegeId = req.user._id;

    console.log("Request Body:", customerName, customerAddress, products, collegeId);
    const college = await College.findById(collegeId);

    if (!college) {
      return res.status(400).json({
        success: false,
        message: "College not found",
      });
    }
  
    // Debugging: Print out request body
   // console.log("Request Body:",process.env.STRIPE_SECRET_KEY);
  
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
                name: product.name,
            },
            unit_amount: product.price * 100,
        },
        quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems, // Add line_items property
        mode: "payment",
        success_url: "https://skillaccess.vercel.app/collage/accounting",
        cancel_url: "https://skillaccess.vercel.app/collage/dashboard",
        customer_email: customerEmail,
        ...addressCollectionOptions, // Spread the address collection options
    });


  
    const paymentDate = new Date();
    const description = req.body.description;
    const planDuration = req.body.duration;
    const mode  = "card";
    const status ="Active";
    const amount = req.body.price ;

  

    
const subscription = await Payment.create({
    userId: collegeId,
    paymentDate,
    description,
    planDuration,
    mode,
    status,
    amount,
    subscription: "Active",
    enrollmentDate: new Date(),
    transactionID: session.id,
    paymentMethod: "Stripe",
    //invoice: invoice,
    cardDetails: {
        brand: "Visa",
        last4: "4242",
        },
    products : products,
    });

    college.subscription = subscription._id;
    college.payments.push(subscription._id);
   // college.planEndDate = new Date() * 1 + 30 * 24 * 60 * 60 * 1000;
    await college.save();



  
  
    res.json({ id: session.id });
  }




const getAllPayments = async (req, res) => {
    const collegeId = req.user._id;
    const college = await College.findById(collegeId);
  
    if (!college) {
      return res.status(400).json({
        success: false,
        message: "College not found",
      });
    }
  
    const payments = await Payment.find({ userId: collegeId }).sort({ createdAt: -1 });

    console.log("Payments:", payments);


    //const subscriptions = await Pa.find({ userId: collegeId });
  
    res.status(200).json({
        success: true,
        payments,
        });
  };





  module.exports = {
    makePayment,
    getAllPayments
  };






