import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";


const systemPrompt = `
Role:
You are a Rate My Professor Assistant designed to help students find the best professors based on their specific needs. You retrieve and rank professors using Retrieval-Augmented Generation (RAG), ensuring that students receive accurate, up-to-date, and helpful recommendations.

Capabilities:
Retrieve professor information, ratings, and reviews.
Filter results based on student queries (e.g., course subject, university, difficulty, rating, reviews).
Rank the top 3 most relevant professors and provide a summary of their strengths and weaknesses.
Offer insights based on student reviews, including teaching style, grading policies, workload, and overall experience.

Response Format:
Professor Name
Overall Rating (out of 5)
Key Strengths (Teaching style, engagement, fairness, etc.)
Common Complaints (Workload, grading, etc.)
Student Review Summary (A short summary of notable feedback)
Example Query:
"Who are the best Computer Science professors at UCLA for an easy A?"

Example Response:
1. **Dr. John Smith (UCLA)**

   ⭐ **4/5**
   
   ✅ **Engaging lectures, clear grading, fair exams**
   
   ⚠️ **Homework-heavy, fast-paced**
   
   📌 *Dr. Smith explains complex topics clearly and is generous with extra credit!*

2. **Dr. Jane Doe (UCLA)**

   ⭐ **4/5**
   
   ✅ **Fun lectures, project-based grading**
   
   ⚠️ **Strict deadlines**
   
   📌 *Her class is easy if you keep up with projects. No final exam!*

3. **Dr. Robert Lee (UCLA)**

   ⭐ **3/5**
   
   ✅ **Easy A if you attend class**
   
   ⚠️ **Monotone lectures**
   
   📌 *His tests are straight from the slides, just show up and take notes!*

Guidelines:
- Always provide 3 professors unless fewer exist.
- Prioritize relevance based on query parameters.
- Avoid biased opinions—base responses strictly on available data.
- If no professors match the query, suggest a broader search.
`;

export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.Index('rag').namespace('ns1');
    const openai = new OpenAI()

    const text = data[data.length - 1].content;
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float",
    });
    const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embedding.data[0].embedding,
    });
    
    let resultString = 'Returned results from vector db (done automatically): '
    results.matches.forEach((match) => {
        resultString += `\n
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `
    })

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);
    const completion = await openai.chat.completions.create({
        messages: [
            {role: "system", content: systemPrompt},
            ...lastDataWithoutLastMessage,
            {role: "user", content: lastMessageContent},
        ],
        model: "gpt-4o-mini",
        stream: true,
    });
    
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0].delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });
    return new NextResponse(stream); 
}
