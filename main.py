import os
import json
import pymysql
import chromadb
from typing import List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware  # 🔑 CORS Import ထည့်သွင်းထားသည်
from pydantic import BaseModel

# Groq Official Client Library
from groq import Groq

# Local Offline Embedding Library
from sentence_transformers import SentenceTransformer

# Loaders & Text Splitters
from docx2txt import process as docx_process
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI(title="NSPU Guide Chatbot Backend (Groq + Local Embeddings)")

# 🔑 CORS Middleware - React Frontend (http://localhost:5173) မှ လာသော Request များကို ခွင့်ပြုရန်
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",  # <--- သင်၏ MySQL Password ထည့်ပါ
    "database": "nspu_db",
    "cursorclass": pymysql.cursors.DictCursor
}

# ⚠️ Groq API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY)

# Local Embedding Model (Offline Mode)
print("💡 Loading Local Embedding Model...")
try:
    embed_model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
except Exception:
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# MySQL Connection Function
def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

# WebSocket Manager
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

# --- Local Embedding Function ---
def get_text_embedding(text: str):
    embedding = embed_model.encode(text)
    return embedding.tolist()

# --- TASK 4: ABSA Analysis via Groq ---
def analyze_comment_absa(text: str):
    prompt = f"""
    Analyze the school feedback comment. Extract the specific "aspect" (Choose one: Canteen, Teaching, Facility, Environment, Administrative) 
    and "sentiment" (Choose one: Positive, Negative, Neutral).
    Comment: "{text}"
    Respond STRICTLY in JSON format with keys "aspect" and "sentiment". Do not include markdown or backticks.
    Example: {{"aspect": "Canteen", "sentiment": "Negative"}}
    """

    try:
        response = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Groq ABSA Error: {e}")
        return {"aspect": "General", "sentiment": "Neutral"}

# --- TASK 2: RAG System (Vector DB) ---
def init_vector_db():
    extracted_text = ""
    
    word_file = "nspu_guide_info.docx"
    if os.path.exists(word_file):
        print("💡 Processing Word File...")
        extracted_text += docx_process(word_file) + "\n\n"
        
    pdf_file = "nspu_guide_info.pdf"
    if os.path.exists(pdf_file):
        print("💡 Processing PDF File...")
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"

    if extracted_text.strip():
        print("💡 Creating Vector Database with Local Embeddings...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = text_splitter.split_text(extracted_text)
        
        chroma_client = chromadb.PersistentClient(path="./nspu_vector_db")
        
        try:
            chroma_client.delete_collection(name="nspu_docs")
        except Exception:
            pass
            
        collection = chroma_client.create_collection(name="nspu_docs")
        
        embeddings = []
        for chunk in chunks:
            emb = get_text_embedding(chunk)
            embeddings.append(emb)

        ids = [f"doc_{i}" for i in range(len(chunks))]
        
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=ids
        )
        print("✅ Vector DB Created Successfully!")
    else:
        print("⚠️ Warning: Neither nspu_guide_info.docx nor nspu_guide_info.pdf was found.")

init_vector_db()

# --- API ENDPOINTS ---

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
        chroma_client = chromadb.PersistentClient(path="./nspu_vector_db")
        collection = chroma_client.get_collection(name="nspu_docs")
        
        query_embedding = get_text_embedding(question)
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        
        context_list = results["documents"][0] if results["documents"] else []
        context = "\n\n".join(context_list)
        
        system_prompt = """You are a helpful assistant for NSPU (National Sport University Guide).
Answer the user's question based strictly on the provided context. Respond in Myanmar language.
If the answer cannot be found in the context, say honestly that you don't know based on current data."""

        user_content = f"Context:\n{context}\n\nQuestion: {question}"

        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            model="llama-3.1-8b-instant"
        )
        
        return {"answer": response.choices[0].message.content}

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