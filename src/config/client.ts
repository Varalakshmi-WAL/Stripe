import stripe from "./stripe";
export const createCustomer = async (name: string, email: string,options?:{phone?:string,description?:string,paymentMethod?:string}) => {
    return await stripe.customers.create({ name, email,...options  });
  };

export const createPaymentIntent = async (amount: number, currency = "usd", customerId?: string,options?:{paymentMethod?:string,description?:string}) => {
    return await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      ...options
    });
  };
  export const createProduct = async (name: string,options?:{active?:boolean,description?:string}) => {
    return await stripe.products.create({ name,...options });
  };
  export const updateProduct=async(productId:string,options?:{name?:string,active?:boolean,description?:string})=>{
    return await stripe.products.update(productId,{...options})
  }
  export const retrieveProduct=async(productId:string)=>{
    return await stripe.products.retrieve(productId)
  }
  export const deleteProduct=async(productId:string)=>{
    return await stripe.products.del(productId);
  }
  export const createPrice=async(currency:string,unit_amount:number,productId:string)=>{
    return await stripe.prices.create({currency,unit_amount,product:productId})
  }
  export const addCardToCustomer=async(customerId:string,paymentMethodId:string)=>{
    return  await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }
  export const addDefaultCardToCustomer=async(customerId:string,paymentMethodId:string)=>{
    return await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }
  export const listCards=async(customerId:string)=>{
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
  }
  export const deleteCard=async(paymentMethodId:string)=>{
    return await stripe.paymentMethods.detach(paymentMethodId);
  }
 export const createInvoiceItem=async(customerId: string, priceId: string, invoiceId: string)=>{
    return await stripe.invoiceItems.create({
        customer: customerId,
        price: priceId,
        invoice: invoiceId,
      });
 }
 export const createInvoice = async (customerId: string,dueDate?:number) => {
    return await stripe.invoices.create({ customer: customerId, collection_method: 'send_invoice', due_date: dueDate || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 });
  };
  export const finalizeInvoice=async(invoiceId:string)=>{
    return await stripe.invoices.finalizeInvoice(invoiceId);
  }
  export const sendInvoice=async(invoiceId:string)=>{
    return await stripe.invoices.sendInvoice(invoiceId);
  }
  export const payInvoice=async(invoiceId:string)=>{
    return await stripe.invoices.pay(invoiceId);
  }
  export const voidInvoice=async(invoiceId:string)=>{
    return await stripe.invoices.voidInvoice(invoiceId);
  }
  export const retrieveInvoice=async(invoiceId:string)=>{
    return await stripe.invoices.retrieve(invoiceId);
  }
  export const deletedInvoice=async(invoiceId:string)=>{
    const invoice = await retrieveInvoice(invoiceId);
    if (invoice.status !== 'draft') {
     return  'You can only delete draft invoices'
    }
    return await stripe.invoices.del(invoiceId);
  }
  export const createPaymentLink=async(priceId:string,quantity:number)=>{
    return await stripe.paymentLinks.create({
        line_items:[
            {
                price:priceId,
                quantity:quantity
            }
        ]
    })
  }
  export const getPaymentLinkLineItems=async(linkId:string)=>{
    return await stripe.paymentLinks.listLineItems(linkId);
  }
  export const expirePaymentLink=async(linkId:string)=>{
    return await stripe.paymentLinks.update(linkId, {
        active: false,
      });
  }
  export const updatePaymentLink=async(linkId:string,metadata:Record<string, string>,active:boolean)=>{
    return await stripe.paymentLinks.update(linkId,{metadata,active})
  }
  export const createSubscription=async(priceId:string,customerId:string)=>{
    return await stripe.subscriptions.create({
        customer:customerId,
        items:[{price:priceId}],
        expand:['latest_invoice.payment_intent']
    })
  }
  export const updateSubscription=async(subscriptionId:string,metadata:Record<string,string>)=>{
    return await stripe.subscriptions.update(subscriptionId,metadata);
  }
  export const retrieveSubscription=async(subscriptionId:string)=>{
    return await stripe.subscriptions.retrieve(subscriptionId);
  }
  export const listSubscriptions=async(subscriptionId:string)=>{
    return await stripe.subscriptions.list();
  }
  export const cancelSubscription=async(subscriptionId:string)=>{
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  export const addSubscriptionItems=async(subscriptionId:string,priceId:string)=>{
    return await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
     // proration_behavior: "none", //  No extra charges until the next billing cycle or if we want immediate billing remove this keyxs
    });
  }
  export const updateSubscriptionItem=async(subscriptionItemId:string,priceId:string)=>{
    return  await stripe.subscriptionItems.update(
      subscriptionItemId,
      {
        price: priceId,
      }
    );
  }
  export const removeSubscriptionItem=async(subscriptionItemId:string)=>{
    return await stripe.subscriptionItems.del(subscriptionItemId);
  }
  export const retrieveSubscriptionItems=async(subscriptionId:string)=>{
    return await stripe.subscriptionItems.list({
      subscription: subscriptionId
    });
  }