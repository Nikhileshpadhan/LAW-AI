import re
from typing import Optional
from fastapi import UploadFile, HTTPException

try:
    import pymupdf as fitz
except ImportError:
    import fitz

class DocumentParserService:
    @staticmethod
    async def extract_text(
        case_description: Optional[str] = None,
        case_file: Optional[UploadFile] = None,
        max_pages: int = 35
    ) -> str:
        """
        Extracts, combines, and normalizes text from a user-supplied description
        and/or an uploaded document (PDF, TXT).
        """
        extracted_parts = []
        
        # 1. User plain text input
        if case_description and case_description.strip():
            extracted_parts.append(f"=== LAWYER'S SUMMARY & FACTS ===\n{case_description.strip()}")
            
        # 2. Uploaded file parsing
        if case_file and case_file.filename:
            content_type = case_file.content_type or ""
            filename = case_file.filename.lower()
            file_bytes = await case_file.read()
            
            if not file_bytes:
                if not extracted_parts:
                    raise HTTPException(
                        status_code=400, 
                        detail="The uploaded file is empty. Please provide content or a description."
                    )
            elif filename.endswith(".pdf") or "pdf" in content_type:
                try:
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    page_texts = []
                    num_pages = len(doc)
                    pages_to_read = min(num_pages, max_pages)
                    
                    for page_num in range(pages_to_read):
                        page = doc.load_page(page_num)
                        page_texts.append(page.get_text("text"))
                        
                    doc.close()
                    pdf_text = "\n".join(page_texts).strip()
                    
                    if num_pages > max_pages:
                        pdf_text += f"\n\n[Note: Document truncated at {max_pages} pages out of {num_pages} total pages]"
                        
                    extracted_parts.append(f"=== UPLOADED CASE DOCUMENT ({case_file.filename}) ===\n{pdf_text}")
                except Exception as e:
                    raise HTTPException(
                        status_code=422,
                        detail=f"Failed to parse PDF document '{case_file.filename}': {str(e)}"
                    )
            elif filename.endswith(".txt") or "text" in content_type:
                try:
                    txt_content = file_bytes.decode("utf-8", errors="replace").strip()
                    extracted_parts.append(f"=== UPLOADED CASE TEXT ({case_file.filename}) ===\n{txt_content}")
                except Exception as e:
                    raise HTTPException(
                        status_code=422,
                        detail=f"Failed to decode text file '{case_file.filename}': {str(e)}"
                    )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format '{case_file.filename}'. Please upload a PDF or TXT document."
                )
                
        if not extracted_parts:
            raise HTTPException(
                status_code=400,
                detail="Either a case description or a case file (PDF/TXT) must be provided."
            )
            
        combined_text = "\n\n".join(extracted_parts)
        # Clean excessive linebreaks and null characters
        cleaned = re.sub(r'\x00', '', combined_text)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        return cleaned.strip()
