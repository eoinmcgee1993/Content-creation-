import Stripe from "stripe";
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||"");
export async function POST(request:Request){
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_PRICE_ID)return Response.json({error:"Stripe is not configured yet."},{status:503});
 const body=await request.json().catch(()=>({}));
 const base=process.env.NEXT_PUBLIC_APP_URL||"";
 const session=await stripe.checkout.sessions.create({mode:"subscription",line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],customer_email:typeof body.email==="string"?body.email:undefined,success_url:base+"/?checkout=success",cancel_url:base+"/?checkout=cancelled"});
 return Response.json({url:session.url});
}