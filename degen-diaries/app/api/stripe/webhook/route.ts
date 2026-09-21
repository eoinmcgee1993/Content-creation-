import Stripe from "stripe";
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||"");
export async function POST(request:Request){
 const signature=request.headers.get("stripe-signature");
 if(!signature||!process.env.STRIPE_WEBHOOK_SECRET)return new Response("Webhook not configured",{status:503});
 const payload=await request.text();
 try{const event=stripe.webhooks.constructEvent(payload,signature,process.env.STRIPE_WEBHOOK_SECRET); switch(event.type){case "checkout.session.completed":case "customer.subscription.updated":case "customer.subscription.deleted":case "invoice.paid":case "invoice.payment_failed":break;} return Response.json({received:true});}catch{return new Response("Invalid signature",{status:400})}
}