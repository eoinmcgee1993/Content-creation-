import { db } from "../../../db";
import { issues, stories } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";
export async function GET(){const rows=await db.select().from(issues).orderBy(desc(issues.editionDate));return Response.json(rows)}
export async function POST(req:Request){const body=await req.json();if(!body.issueNumber||!body.editionDate)return Response.json({error:"issueNumber and editionDate required"},{status:400});const [issue]=await db.insert(issues).values({issueNumber:body.issueNumber,editionDate:new Date(body.editionDate),edition:body.edition??"Tuesday",status:"draft"}).returning();return Response.json(issue,{status:201})}