import { Router ,raw }  from "express";
import {addCard, addSubscriptionItems, cancelSubscription,createPaymentIntents,createPaymentLink,createProductAndPrice,createProducts,createStripeCustomer, createSubscription, deleteCard, deleteInvoice, deleteProducts, expirePaymentLink, getPaymentLinkLineItems, invoicePayment, listCards, listSubscription, payInvoice, removeSubscriptionItem, retrieveProducts, retrieveSubscription, retrieveSubscriptionItems, updateDefaultCard, updatePaymentLink, updateProducts, updateSubscription, updateSubscriptionItem, voidInvoice, webHook} from '../controllers/paymentController';

const router = Router();

router.post("/add-card", addCard);
router.post("/delete-card", deleteCard);
router.get("/list-cards/:customerId", listCards);
router.put("/update-card", updateDefaultCard);
router.post("/create-subscription", createSubscription);
router.post("/create-product-price", createProductAndPrice);
router.post("/webhook", raw({ type: "application/json" }), webHook);
router.post("/create-payment-intent", createPaymentIntents);
router.post("/create-customer", createStripeCustomer);
router.post("/create-product", createProducts);
router.put("/update-product/:productId", updateProducts);
router.get("/get-product/:productId", retrieveProducts);
router.delete("/delete-product/:productId", deleteProducts);
router.post('/create-invoice',invoicePayment);
router.post('/void-invoice',voidInvoice);
router.post('/pay-invoice/:invoiceId',payInvoice);
router.delete('/delete-invoice/:invoiceId',deleteInvoice);
router.post('/payment-links',createPaymentLink);
router.get('/payment-link-line-items/:linkId',getPaymentLinkLineItems);
router.put("/update-payment-link/:linkId", updatePaymentLink);
router.delete("/expire-payment-link/:linkId", expirePaymentLink);
router.post('/subscription',createSubscription);
router.put('/subscription/:subscriptionId',updateSubscription);
router.get('/subscription/:subscriptionId',retrieveSubscription);
router.get('/subscription',listSubscription);
router.delete('/subscription/:subscriptionId',cancelSubscription);
router.post('/subscription-item',addSubscriptionItems);
router.get('/subscription-item/:subscriptionItemId',retrieveSubscriptionItems);
router.put('/subscription-item/:subscriptionItemId',updateSubscriptionItem);
router.delete('/subscription-item/:subscriptionItemId',removeSubscriptionItem);

module.exports = router;
