import stripe from "../config/stripe";
import { Request, Response } from "express";
import axios from "axios";
import { createCustomer, createPaymentIntent, createProduct, deleteProduct, retrieveProduct } from "../config/client";

type CustomerParams = {
  name: string;
  email: string;
  payment_method?: string;
  invoice_settings?: {
    default_payment_method: string;
  };
};
export const createPaymentIntents = async (req: Request, res: Response) => {
  const { amount, currency, customerId } = req.body as {
    amount: number;
    currency?: string;
    customerId?: string;
  };

  try {
    const paymentIntent = await createPaymentIntent (
      amount, // Convert to cents
       currency || "usd",
      customerId,
    );

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || "An unknown error occurred." });
  }
};

export const createStripeCustomer = async (req: Request, res: Response) => {
  const { name, email, paymentMethodId } = req.body as {
    name: string;
    email: string;
    paymentMethodId: string | undefined;
  };

  try {
    const obj: CustomerParams = { name: name || "testUSer", email };
    if (paymentMethodId) {
      obj.payment_method = paymentMethodId;
      obj.invoice_settings = {
        default_payment_method: paymentMethodId,
      };
    }
    const customer = await stripe.customers.create(obj);
    res.status(200).json({ customerId: customer.id });
  } catch (error) {
    res.status(500).json({
      error: (error as Error).message || "An unknown error occurred.",
    });
  }
};

export const createProducts = async (req:Request,res:Response) => {
  try {
    const {name} = req.body as {name:string}
    const product= await createProduct( name );
    res.status(200).json({product:product})
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};
export const updateProducts = async ( req:Request,res:Response ) => {
  try {
    const {productId}=req.params
    const updatedProduct = await stripe.products.update(productId,{...req.body});

    console.log("Product updated successfully:", updatedProduct);
    res.status(200).json({ updatedProduct});
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};
export const retrieveProducts=async(req:Request,res:Response)=>{
  try{
  const {productId}=req.params;
  const productDetails=await retrieveProduct(productId)
  res.json(productDetails);}
  catch(error){
    res.status(500).json({ error });
  }
}
export const deleteProducts=async(req:Request,res:Response)=>{
  try{
  const {productId}=req.params;
  const deletedProduct=await deleteProduct(productId)
  res.json(deletedProduct);}
  catch(error){
    res.status(500).json({ error });
  }
}

const createPrice = async (productId: string, amount: number, currency: string = "usd") => {
  try {
    return await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency,
    });
  } catch (error) {
    console.error("Error creating price:", error);
    throw error;
  }
};
export const addCard = async (req: Request, res: Response) => {
  try {
    const { customerId, paymentMethodId } = req.body;

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    res.json({ message: "Card added successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const listCards = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    console.log("customerid->", customerId);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    res.json(paymentMethods.data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const deleteCard = async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.body;

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateDefaultCard = async (req: Request, res: Response) => {
  try {
    const { customerId, paymentMethodId } = req.body;
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    res.json({ success: true, message: "Default card updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createProductAndPrice = async (req: Request, res: Response) => {
  const { name, description, amount, currency, interval } = req.body;

  try {
    // Step 1: Create a product
    const product = await stripe.products.create({
      name: name,
      description: description,
    });

    // Step 2: Create a price for the product
    const price = await stripe.prices.create({
      unit_amount: amount * 100, // Amount in cents (e.g., $10.00 = 1000 cents)
      currency: currency || "usd",
      recurring: { interval: interval || "month" }, // Recurring interval (e.g., month, year)
      product: product.id, // Associate with the product
    });

    res.send({ productId: product.id, priceId: price.id });
  } catch (error) {
    res.status(400).send({ error: { message: (error as Error).message } });
  }
};

export const createInvoiceItem = async (customerId: string, priceId: string, invoiceId: string) => {
  try {
    return await stripe.invoiceItems.create({
      customer: customerId,
      price: priceId,
      invoice: invoiceId,
    });
  } catch (error) {
    console.error("Error creating invoice item:", error);
    throw error;
  }
};

export const createInvoice = async (customerId: string) => {
  try {
    const dueDate = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    return await stripe.invoices.create({ customer: customerId, collection_method: 'send_invoice', due_date: dueDate });
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

export const finalizeInvoice = async (invoiceId: string) => {
  try {
    return await stripe.invoices.finalizeInvoice(invoiceId);
  } catch (error) {
    console.error("Error finalizing invoice:", error);
    throw error;
  }
};

export const invoicePayment = async (req: Request, res: Response) => {
  try {
    const { email, name, amount, description } = req.body;

    const customerResponse = await axios.post("http://localhost:3001/api/payments/create-customer", { name, email });
    if (!customerResponse.data?.customerId) {
      throw new Error("Failed to create Stripe customer.");
    }

    const customerId = customerResponse.data.customerId;
    const product = await createProduct(description);
    const price = await createPrice(product.id, amount);
    const invoice = await createInvoice(customerId);
    await createInvoiceItem(customerId, price.id, invoice.id);
    const finalizedInvoice = await finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(invoice.id);

    res.json({ success: true, invoice: finalizedInvoice });
  } catch (error) {
    console.error("Error processing invoice:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
export const payInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await stripe.invoices.pay(invoiceId);
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
export const voidInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await stripe.invoices.voidInvoice(invoiceId);
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.status !== 'draft') {
      res.status(400).json({
        success: false,
        message: 'You can only delete draft invoices',
      });
    }
    const deletedInvoice = await stripe.invoices.del(invoiceId);
    res.json({ success: true, deletedInvoice });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
export const createPaymentLink = async (req: Request, res: Response) => {
  try {
    const { amount, productName } = req.body
    const product = await createProduct(productName);
    const price = await createPrice(product.id, amount);
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
    });
    res.status(200).json({ success: true, paymentLink: paymentLink.url,linkId: paymentLink.id });
  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
export const getPaymentLinkLineItems=async(req:Request,res:Response)=>{
  try {
    const { linkId } = req.params;
    const lineItems = await stripe.paymentLinks.listLineItems(linkId);
    res.json(lineItems);
  } catch (error) {
    console.error("Error fetching line items:", error);
    res.status(500).json({ error: "Failed to fetch line items" });
  }
}
export const expirePaymentLink = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;

    const expiredLink = await stripe.paymentLinks.update(linkId, {
      active: false,
    });

    res.json({ success: true, expiredLink });
  } catch (error) {
    console.error("Error expiring payment link:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
export const updatePaymentLink = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { metadata, active } = req.body;

    const updatedLink = await stripe.paymentLinks.update(linkId, {
      metadata,
      active,
    });
    res.json(updatedLink);
  } catch (error) {
    res.status(500).json({ error });
  }
};
export const createSubscription=async(req:Request,res:Response)=>{
  try {
    const { email, productName, productPrice, billingInterval, paymentMethodId } = req.body;

    const product = await stripe.products.create({ name: productName });

    const price = await stripe.prices.create({
      unit_amount: productPrice * 100, 
      currency: 'usd',
      recurring: { interval: billingInterval }, 
      product: product.id,
    });

 

    const subscription = await stripe.subscriptions.create({
      customer:"cus_Rr8B8VB5QuGGch",// customer.id,
      items: [{ price: price.id }],
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({ subscriptionId: subscription.id });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
}
export const updateSubscription=async(req:Request,res:Response)=>{
  try
{  const {subscriptionId}=req.params;
  const updateSubscription=await stripe.subscriptions.update(subscriptionId,{metadata:{quantity:2}})
  res.json(updateSubscription);}
  catch(error){
    res.status(500).json({ error });
  }
}
export const retrieveSubscription=async(req:Request,res:Response)=>{
  try{
  const {subscriptionId}=req.params;
  const subscriptionDetails=await stripe.subscriptions.retrieve(subscriptionId)
  res.json(subscriptionDetails);}
  catch(error){
    res.status(500).json({ error });
  }
}
export const listSubscription = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const subscriptionList = await stripe.subscriptions.list({
      status: "all",
      customer: customerId,
      limit: 10,
    });
    res.json(subscriptionList);
  } catch (error) {
    res.status(500).json({ error });
  }
};
export const cancelSubscription=async(req:Request,res:Response)=>{
  try
{  const {subscriptionId}=req.params;
  const cancelSubscription=await stripe.subscriptions.cancel(subscriptionId)
  res.json(cancelSubscription);}
  catch(error){
    res.status(500).json({ error });
  }
}
export const retrieveSubscriptionItems= async (req:Request,res:Response)=> {
  try {
    const {subscriptionId}=req.params;
    const items = await stripe.subscriptionItems.list({
      subscription: subscriptionId, // Subscription ID
      limit: 10, // Number of items to fetch
    });
    console.log("Subscription Items:", items.data);
    res.json( items.data);
  } catch (error) {
    console.error("Error retrieving subscription items:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
export const addSubscriptionItems =async(req:Request,res:Response)=> {
  try {
    const {subscriptionId, priceId}=req.body;
    const item = await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
      quantity: 1,
      proration_behavior: "none", //  No extra charges until the next billing cycle or if we want immediate billing remove this keyxs
    });

    console.log("New Subscription Item Added:", item);
    res.status(200).json({success:true,subscriptionItem:item})
  } catch (error) {
    console.error("Error adding subscription item:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
export const updateSubscriptionItem=async(req:Request,res:Response)=> {
  try {
    const {subscriptionItemId}=req.params;
    const { newPriceId}=req.body;
    const updatedItem = await stripe.subscriptionItems.update(
      subscriptionItemId,
      {
        price: newPriceId,
      }
    );

    console.log("Subscription Item Updated:", updatedItem);
    res.status(200).json({success:true,updatedItem:updatedItem})
  } catch (error) {
    console.error("Error updating subscription item:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}
export const removeSubscriptionItem= async (req:Request,res:Response)=> {
  try {
    const {subscriptionItemId}=req.params;
    const deletedItem = await stripe.subscriptionItems.del(subscriptionItemId);
    console.log("Subscription Item Removed:", deletedItem);
    res.json( deletedItem);
  } catch (error) {
    console.error("Error removing subscription item:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
}

//webhook related events

export const webHook = (req: Request, res: Response): void => {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig) {
    console.error("Stripe signature missing");
    res.status(400).send("Stripe signature missing");
    return; 
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_KEY as string; // Replace with your webhook secret

  let event;

  console.log("event-->", endpointSecret, req.body);

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (error) {
    console.error(
      "Webhook signature verification failed:",
      (error as Error).message
    );
    res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    return; 
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntentSucceeded = event.data.object;
      console.log("Payment Intent succeeded:", paymentIntentSucceeded.id);
      break;

    case "payment_intent.payment_failed":
      const paymentIntentFailed = event.data.object;
      console.log("Payment Intent failed:", paymentIntentFailed.id);
      break;

    case "payment_intent.created":
      const paymentIntentCreated = event.data.object;
      console.log("Payment Intent created:", paymentIntentCreated.id);
      break;

    case "payment_intent.requires_action":
      const paymentIntentRequiresAction = event.data.object;
      console.log(
        "Payment Intent requires action:",
        paymentIntentRequiresAction.id
      );
      break;
    case "invoice.payment_succeeded":
      const invoice = event.data.object;
      console.log("Invoice paid:", invoice.id);
      break;
    case "invoice.payment_failed":
      console.log(
        "Payment failed for subscription:",
        event.data.object.subscription
      );
      break;
    case "customer.subscription.deleted":
      const subscription = event.data.object;
      console.log("Subscription canceled:", subscription.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};