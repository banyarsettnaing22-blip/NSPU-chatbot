import os
import json
import pymysql
import chromadb
import docx
from typing import List
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# OpenAI Client Library
from openai import OpenAI

# Local Offline Embedding Library (Multi-lingual model သုံးထားသည်)
from sentence_transformers import SentenceTransformer

# Loaders & Text Splitters
from docx2txt import process as docx_process
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

# --- OPENAI SETUP (Teacher Frame) ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

#-----------------------------------------------------------------------

app = FastAPI(title="NSPU Guide Chatbot Backend (OpenAI + Local Embeddings)")

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
    "password": "root",
    "database": "nspu_db",
    "cursorclass": pymysql.cursors.DictCursor
}

# Multi-lingual Embedding Model (မြန်မာစာ အဓိပ္ပာယ်ကို သေချာနားလည်သည့် Model)
print("💡 Loading Multi-lingual Embedding Model...")
embed_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

# ChromaDB Client နဲ့ Collection ကို Global ထားခြင်း (ဒါဆိုရင် ခဏခဏ အသစ်ပြန်မဆွဲတော့ပါ)
chroma_client = chromadb.PersistentClient(path="./nspu_vector_db")

def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

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

def get_text_embedding(text: str):
    embedding = embed_model.encode(text)
    return embedding.tolist()

# --- TASK 4: ABSA Analysis via OpenAI ---
def analyze_comment_absa(text: str):
    prompt = f"""
    Analyze the school feedback comment. Extract the specific "aspect" (Choose one: Canteen, Teaching, Facility, Environment, Administrative) 
    and "sentiment" (Choose one: Positive, Negative, Neutral).
    Comment: "{text}"
    Respond STRICTLY in JSON format with keys "aspect" and "sentiment". Do not include markdown or backticks.
    Example: {{"aspect": "Canteen", "sentiment": "Negative"}}
    """

    try:
        # OpenAI Chat Completions API Call
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # သို့မဟုတ် teacher ပေးထားသော model name
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI ABSA Error: {e}")
        return {"aspect": "General", "sentiment": "Neutral"}
    
def read_docx_file(file_path):
    doc = docx.Document(file_path)
    full_text = []
    # စာပိုဒ်များကို ဖတ်ခြင်း
    for para in doc.paragraphs:
        if para.text.strip():
            full_text.append(para.text)
    # ဇယား (Tables) ထဲက စာများကိုပါ သေချာဖတ်ခြင်း
    for table in doc.tables:
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_data:
                full_text.append(" | ".join(row_data))
    return "\n".join(full_text)

# --- TASK 2: RAG System (Vector DB) ---
def init_vector_db():
    extracted_text = ""
    
    word_file = "project data (2).docx"
    if os.path.exists(word_file):
        print("💡 Processing Word File with python-docx...")
        extracted_text += read_docx_file(word_file) + "\n\n"
        
    pdf_file = "nspu_guide_info.pdf"
    if os.path.exists(pdf_file):
        print("💡 Processing PDF File...")
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text += t + "\n"

    if extracted_text.strip():
        print("💡 Re-indexing Vector Database...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=600, 
            chunk_overlap=100,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_text(extracted_text)
        
        # Global chroma_client ကိုပဲ သုံးမည်
        try:
            chroma_client.delete_collection(name="nspu_docs")
        except Exception:
            pass
            
        collection = chroma_client.create_collection(name="nspu_docs")
        embeddings = [get_text_embedding(chunk) for chunk in chunks]
        ids = [f"doc_{i}" for i in range(len(chunks))]
        
        collection.add(
            documents=chunks,
            embeddings=embeddings,
            ids=ids
        )
        print("✅ Vector DB Created Successfully!")

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
        # Global အဖြစ် ထားထားသော Collection ကို တိုက်ရိုက်ယူသုံးခြင်း (ခဏခဏ Re-open မလုပ်တော့ပါ)
        collection = chroma_client.get_collection(name="nspu_docs")
        
        query_embedding = get_text_embedding(question)
        
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=10
        )
        
        context_list = results["documents"][0] if results["documents"] else []
        context = "\n\n".join(context_list)
        
        system_prompt = """You are an official information assistant for NSPU Guide.
                Answer the user's question based on the provided context in Myanmar language.
                If the exact wording is slightly different, try to answer based on the closest relevant information in the context.
                If no related information exists at all, say: "ပေးထားသော အချက်အလက်များထဲတွင် ထိုအကြောင်းအရာ မပါဝင်ပါ။" """

        user_content = f"Context:\n{context}\n\nQuestion: {question}"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2
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
    
