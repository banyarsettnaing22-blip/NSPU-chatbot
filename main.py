import os
import json
import pymysql
import chromadb
from typing import List

# 🔑 .env ဖိုင်ထဲမှ Environment Variables များကို ဖတ်ရန် load_dotenv ကို Import လုပ်ပါ
from dotenv import load_dotenv

# 🔑 .env ဖိုင်ကို Memory ထဲသို့ Load လုပ်ပါ
load_dotenv()

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# OpenAI Official Client Library
from openai import OpenAI

# Local Offline Embedding Library
from sentence_transformers import SentenceTransformer

# Loaders & Text Splitters
from docx2txt import process as docx_process
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI(title="NSPU Guide Chatbot Backend (OpenAI + Local Embeddings)")

# 🔑 CORS Middleware - React Frontend မှ Custom Headers များကို သေချာ ခွင့်ပြုရန်
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# --- CONFIGURATION ---
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "NewPassword123!",  # <--- သင်၏ MySQL Password
    "database": "nspu_db",
    "cursorclass": pymysql.cursors.DictCursor
}

# ⚠️ OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Local Embedding Model (Offline Mode)
print("💡 Loading Local Embedding Model...")
try:
    embed_model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
except Exception:
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")

# MySQL Connection Function
def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

# 🔑 Database မှ Admin Password ကို စစ်ဆေးပေးသည့် Helper Function
def verify_admin_password(input_password: str) -> bool:
    if not input_password:
        return False
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = "SELECT id FROM admin_users WHERE password = %s"
            cursor.execute(sql, (input_password,))
            result = cursor.fetchone()
            return result is not None
    finally:
        connection.close()

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
    user_role: str = "Student"
    comment_text: str

# --- Local Embedding Function ---
def get_text_embedding(text: str):
    embedding = embed_model.encode(text)
    return embedding.tolist()

# --- ABSA Analysis via OpenAI ---
def analyze_comment_absa(text: str):
    prompt = f"""
    Analyze the school feedback comment. Extract the specific "aspect" (Choose one: Canteen, Teaching, Facility, Environment, Administrative) 
    and "sentiment" (Choose one: Positive, Negative, Neutral).
    Comment: "{text}"
    Respond STRICTLY in JSON format with keys "aspect" and "sentiment". Do not include markdown or backticks.
    Example: {{"aspect": "Canteen", "sentiment": "Negative"}}
    """

    try:
        response = openai_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o-mini",
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI ABSA Error: {e}")
        return {"aspect": "General", "sentiment": "Neutral"}

# --- RAG System (Vector DB - Multiple Word & PDF Files Support) ---
def init_vector_db():
    extracted_text = ""
    processed_files_count = 0
    
    # 💡 Folder ထဲရှိ .docx နှင့် .pdf ဖိုင်အားလုံးကို ရှာဖွေဖတ်ရှုခြင်း
    for file in os.listdir("."):
        # Word Files (.docx) ဖတ်ခြင်း (ယာယီဖိုင် ~$ မပါ)
        if file.endswith(".docx") and not file.startswith("~$"):
            print(f"💡 Processing Word File: {file}...")
            try:
                text = docx_process(file)
                if text:
                    extracted_text += f"\n--- Source Document: {file} ---\n" + text + "\n\n"
                    processed_files_count += 1
            except Exception as e:
                print(f"⚠️ Error reading {file}: {e}")
                
        # PDF Files (.pdf) ဖတ်ခြင်း
        elif file.endswith(".pdf"):
            print(f"💡 Processing PDF File: {file}...")
            try:
                reader = PdfReader(file)
                pdf_text = ""
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        pdf_text += t + "\n"
                if pdf_text:
                    extracted_text += f"\n--- Source Document: {file} ---\n" + pdf_text + "\n\n"
                    processed_files_count += 1
            except Exception as e:
                print(f"⚠️ Error reading {file}: {e}")

    if extracted_text.strip():
        print(f"💡 Creating Vector Database from {processed_files_count} file(s) with Local Embeddings...")
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
        print(f"✅ Vector DB Created Successfully! (Total Chunks: {len(chunks)})")
    else:
        print("⚠️ Warning: No .docx or .pdf documents found to build the Vector Database.")

# Server စတင်ချိန်တွင် Vector DB ကို တည်ဆောက်ခြင်း
init_vector_db()

# --- API ENDPOINTS ---

# 1. User Feedback / Comments ထည့်သွင်းသည့် API
@app.post("/api/comments")
@app.post("/api/feedback")
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

# 2. Chatbot မေးခွန်းမေးသည့် API
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
            n_results=10
        )
        
        context_list = results["documents"][0] if results["documents"] else []
        context = "\n\n".join(context_list)
        
        system_prompt = """You are a helpful assistant for NSPU (National Sport University Guide).
Answer the user's question based strictly on the provided context. Respond in Myanmar language.
If the answer cannot be found in the context, say honestly that you don't know based on current data."""

        user_content = f"Context:\n{context}\n\nQuestion: {question}"

        response = openai_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            model="gpt-4o-mini"
        )
        
        return {"answer": response.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. ADMIN: Comments အားလုံးကို ဆွဲထုတ်ပေးမည့် API (Database မှ Password ဖြင့် စစ်ဆေးခြင်း)
@app.get("/api/admin/comments")
async def get_all_comments(x_admin_secret: str = Header(None)):
    if not verify_admin_password(x_admin_secret):
        raise HTTPException(status_code=401, detail="Unauthorized Access")
        
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
                SELECT c.id, c.user_role, c.comment_text, c.created_at, 
                       a.aspect, a.sentiment 
                FROM comments c
                LEFT JOIN absa_results a ON c.id = a.comment_id
                ORDER BY c.created_at DESC
            """
            cursor.execute(sql)
            results = cursor.fetchall()
            return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

# 4. ADMIN: Comment ကို ဖျက်ပေးမည့် API (Database မှ Password ဖြင့် စစ်ဆေးခြင်း)
@app.delete("/api/admin/comments/{comment_id}")
async def delete_comment(comment_id: int, x_admin_secret: str = Header(None)):
    if not verify_admin_password(x_admin_secret):
        raise HTTPException(status_code=401, detail="Unauthorized Access")
        
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM absa_results WHERE comment_id = %s", (comment_id,))
            cursor.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
        connection.commit()
        return {"status": "success", "message": f"Comment {comment_id} deleted."}
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()

# 5. WEBSOCKET Endpoint
@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 💡 SERVER STARTUP
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)