from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from langchain.chains import RetrievalQA
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_community.vectorstores import Chroma
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
import logging
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)  # This will allow the frontend to make requests to your API

def initialize_llm():
    # Replace this with your actual LLM initialization logic
    llm = ChatGroq(
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile"
    )
    return llm

def create_vector_db():
    loader = DirectoryLoader("data/", glob='*.pdf', loader_cls=PyPDFLoader)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)
    embeddings = HuggingFaceBgeEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
    vector_db = Chroma.from_documents(texts, embeddings, persist_directory='./chroma_db')
    vector_db.persist()

    print("ChromaDB created and data saved")

    return vector_db

def setup_qa_chain(vector_db, llm):
    retriever = vector_db.as_retriever()
    prompt_templates = """ You are a compassionate mental health chatbot. Respond thoughtfully to the following question:
        {context}
        User: {question}
        Chatbot: """
    PROMPT = PromptTemplate(template=prompt_templates, input_variables=['context', 'question'])

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        chain_type_kwargs={"prompt": PROMPT}
    )
    return qa_chain

@app.route('/chat', methods=['POST'])
def chat():
    query = request.json.get('query')
    if not query:
        return jsonify({"error": "No query provided"}), 400

    print("Initializing Chatbot...")
    llm = initialize_llm()

    db_path = "./chroma_db"
    if not os.path.exists(db_path):
        vector_db = create_vector_db()
    else:
        embeddings = HuggingFaceBgeEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
        vector_db = Chroma(persist_directory=db_path, embedding_function=embeddings)

    qa_chain = setup_qa_chain(vector_db, llm)

    response = qa_chain.run(query)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
