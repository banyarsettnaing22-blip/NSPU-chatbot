import os
import json
import pymysql
from typing import List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

# Google GenAI SDK အသစ်
from google import genai
from google.genai import types

# Modern LangChain Utilities
from docx2txt import process as docx_process
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma

app = FastAPI(title="NSPU Guide Chatbot Backend (Modern MySQL)")

# --- CONFIGURATION ---
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",  # <--- သင်၏ MySQL Password ထည့်ပါ
    "database": "nspu_db",
    "cursorclass": pymysql.cursors.DictCursor
}

# API Key initialization for modern SDK
GEMINI_API_KEY = "AQ.Ab8RN6LD8_Rf1aCGNoArVB5G_wC0IVumzGjlCopc8V-StQfmRQ"  # <--- သင်၏ Gemini API Key ထည့်ပါ
ai_client = genai.Client(api_key=GEMINI_API_KEY)

# Connection Function
def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

# WebSocket Manager (Real-time Dashboard သို့ Data တွန်းပို့ရန်)
class DashboardConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = DashboardConnectionManager()

class CommentInput(BaseModel):
    user_role: str
    comment_text: str

# --- TASK 4: Gemini API (Modern SDK) သုံးပြီး ABSA လုပ်ခြင်း ---
def analyze_comment_absa(text: str):
    prompt = f"""
    You are an expert school feedback analyst. Analyze this comment: "{text}"
    Extract the "aspect" (Choose one: Canteen, Teaching, Facility, Environment, Administrative)
    and the "sentiment" (Choose one: Positive, Negative, Neutral).
    """
    try:
        # Structured Output ရဖို့အတွက် Response Schema သတ်မှတ်ခြင်း
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "aspect": types.Schema(type=types.Type.STRING),
                        "sentiment": types.Schema(type=types.Type.STRING),
                    },
                    required=["aspect", "sentiment"],
                ),
            ),
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"ABSA Error: {e}")
        return {"aspect": "General", "sentiment": "Neutral"}

# --- TASK 2: RAG System (Manual Extraction & Vector Embeddings) ---
def get_gemini_embedding(texts: List[str]):
    """Gemini Text Embedding API အသစ်ကို လှမ်းခေါ်ခြင်း"""
    try:
        response = ai_client.models.embed_content(
            model="text-embedding-004",
            contents=texts
        )
        # Vector values များကို ထုတ်ယူခြင်း
        return [embedding.values for embedding in response.embeddings]
    except Exception as e:
        print(f"Embedding Error: {e}")
        return []

class CustomGeminiEmbeddings:
    """Chroma Vector Store နှင့် တွဲဖက်သုံးနိုင်ရန် Custom Class ဆောက်ခြင်း"""
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return get_gemini_embedding(texts)
    def embed_query(self, text: str) -> List[float]:
        res = get_gemini_embedding([text])
        return res[0] if res else []

def init_vector_db():
    word_file = "nspu_guide_info.docx"
    if os.path.exists(word_file):
        print("💡 Processing Word File into Vector DB...")
        # docx2txt သုံးပြီး စာသားများတိုက်ရိုက်ထုတ်ယူခြင်း
        text = docx_process(word_file)
        
        # စာသားဖြတ်ခြင်း
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=120)
        chunks = text_splitter.split_text(text)
        
        # Vector Database ထဲသို့ သိမ်းဆည်းခြင်း
        Chroma.from_texts(
            texts=chunks, 
            embedding=CustomGeminiEmbeddings(), 
            persist_directory="./nspu_vector_db"
        )
        print("✅ Vector DB Created Successfully.")
    else:
        print("⚠️ Warning: nspu_guide_info.docx not found. Please add the file.")

# Server စတင်ချိန်တွင် Vector DB တည်ဆောက်မည်
init_vector_db()

# --- TASK 1: API ENDPOINTS ---

@app.post("/api/comments")
async def create_comment(data: CommentInput):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql_comment = "INSERT INTO comments (user_role, comment_text) VALUES (%s, %s)"
            cursor.execute(sql_comment, (data.user_role, data.comment_text))
            comment_id = cursor.lastrowid
            
            analysis = analyze_comment_absa(data.comment_text)
            aspect = analysis.get("aspect", "General")
            sentiment = analysis.get("sentiment", "Neutral")
            
            sql_absa = "INSERT INTO absa_results (comment_id, aspect, sentiment) VALUES (%s, %s, %s)"
            cursor.execute(sql_absa, (comment_id, aspect, sentiment))
            
        connection.commit()
        
        dashboard_payload = {
            "event": "new_feedback_received",
            "data": {
                "id": comment_id,
                "user_role": data.user_role,
                "comment_text": data.comment_text,
                "aspect": aspect,
                "sentiment": sentiment
            }
        }
        await manager.broadcast(dashboard_payload)
        return {"status": "success", "result": dashboard_payload["data"]}
        
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

@app.get("/api/ask")
async def ask_chatbot(question: str = Query(..., description="ကျောင်းအကြောင်းမေးခွန်းများ")):
    if not os.path.exists("./nspu_vector_db"):
        raise HTTPException(status_code=400, detail="Knowledge base is not initialized.")
    try:
        # Chroma ထဲမှ သက်ဆိုင်ရာ စာသားများကို ရှာဖွေခြင်း (Similarity Search)
        db = Chroma(persist_directory="./nspu_vector_db", embedding_function=CustomGeminiEmbeddings())
        docs = db.similarity_search(question, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Gemini သို့ Context နှင့် မေးခွန်းတွဲပို့ပြီး ဖြေခိုင်းခြင်း (RAG Concept)
        prompt = f"""
        You are a helpful assistant for NSPU (National Sport University Guide).
        Answer the student's question based strictly on the following context. Respond in Myanmar language.
        If the answer cannot be found in the context, say honestly that you don't know based on current data.
        
        Context:
        {context}
        
        Question: {question}
        """
        
        response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)