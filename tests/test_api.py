import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["total_vectors"] == 76802
    assert data["legal_bert_status"] == "loaded"

def test_direct_search_precedents(client):
    response = client.post(
        "/api/v1/search-precedents",
        data={
            "query": "anticipatory bail under section 438 CrPC in economic offences",
            "top_k": 3
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] == 3
    assert len(data["results"]) == 3
    assert "Dhanraj Aswani" in data["results"][0]["case_title"] or "Dhanraj" in str(data["results"])

def test_analyze_case_text(client):
    response = client.post(
        "/api/v1/analyze-case",
        data={
            "case_description": "Petitioner seeks anticipatory bail under Section 438 CrPC in an FIR alleging commercial fraud under Section 420 IPC.",
            "representing_side": "Petitioner / Appellant"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["representing_side"] == "Petitioner / Appellant"
    assert "executive_brief" in data
    assert len(data["arguments"]) > 0
    assert data["retrieved_precedents_count"] > 0

def test_analyze_case_file_upload(client):
    file_content = b"IN THE SUPREME COURT OF INDIA\nPETITION FOR SPECIAL LEAVE TO APPEAL\nFacts regarding quashing under Section 482 CrPC for civil transactions."
    response = client.post(
        "/api/v1/analyze-case",
        data={"representing_side": "Respondent / Defense"},
        files={"case_file": ("test_petition.txt", file_content, "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["representing_side"] == "Respondent / Defense"
    assert len(data["arguments"]) > 0

def test_chat_endpoint(client):
    response = client.post(
        "/api/v1/chat",
        json={
            "message": "Can Section 482 CrPC be invoked to quash an FIR where civil remedies exist?",
            "representing_side": "Petitioner / Appellant",
            "case_context": "Commercial contract dispute with arbitration clause."
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 50
    assert data["representing_side"] == "Petitioner / Appellant"
    assert len(data["retrieved_precedents"]) > 0

def test_generate_report_and_pdf_export(client):
    req_data = {
        "title": "SUPREME COURT STRATEGY REPORT - TEST",
        "representing_side": "Petitioner / Appellant",
        "case_context": "Bail petition under Section 438 CrPC regarding commercial transaction disputes."
    }
    
    # Test JSON report generation
    rep_resp = client.post("/api/v1/generate-report", json=req_data)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert "report_id" in rep_data
    assert "html_content" in rep_data
    assert "markdown_content" in rep_data
    assert len(rep_data["arguments"]) > 0
    assert len(rep_data["table_of_authorities"]) > 0

    # Test PDF export
    pdf_resp = client.post("/api/v1/export-report-pdf", json=req_data)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 500  # valid PDF bytes generated

    # Test HTML export
    html_resp = client.post("/api/v1/export-report-html", json=req_data)
    assert html_resp.status_code == 200
    assert "text/html" in html_resp.headers["content-type"]

