import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import ModoNavbar from "./components/ModoNavbar";
import LandingHero from "./components/LandingHero";
import LandingExhibition from "./components/LandingExhibition";
import LandingPrecedentsShowcase from "./components/LandingPrecedentsShowcase";
import LandingFooter from "./components/LandingFooter";
import ChamberHeader from "./components/ChamberHeader";
import ChamberSidebar from "./components/ChamberSidebar";
import ChamberChat from "./components/ChamberChat";
import ReportModal from "./components/ReportModal";
import ChunkModal from "./components/ChunkModal";
import AuthModal from "./components/AuthModal";
import Skiper10 from "./components/ui/skiper-ui/skiper10";
import ScrollRevealWrapper from "./components/ui/ScrollRevealWrapper";
import { LegalApiService } from "./services/api";

export default function App() {
  const [showPreloader, setShowPreloader] = useState(false);
  const [activeView, setActiveView] = useState("landing"); // 'landing' | 'chamber'
  const [isChamberSidebarOpen, setIsChamberSidebarOpen] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 768 : true;
  });
  const [representingSide, setRepresentingSide] = useState("Petitioner / Appellant");
  const [caseContext, setCaseContext] = useState("");
  const [activeFile, setActiveFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statutes, setStatutes] = useState([]);
  const [lastAnalysisResult, setLastAnalysisResult] = useState(null);

  // User Authentication & Consultations
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("current");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome Counsel. I am your Senior Supreme Court Advocate consultant. You may upload a petition/FIR (PDF or TXT) in the left panel, test one of our landmark authorities, or state your legal proposition below.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Precedents pool across conversation
  const [precedentsPool, setPrecedentsPool] = useState({});

  // Modals state
  const [activeReport, setActiveReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [inspectPrecedent, setInspectPrecedent] = useState(null);

  // 1. Non-blocking wake-up ping to backend health check on mount
  useEffect(() => {
    LegalApiService.checkHealth().catch(() => {});

    // Restore cached user
    const savedUser = localStorage.getItem("law_ai_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {}
    }

    // Check for Google OAuth success redirect query param (?auth_success=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("auth_success") === "true") {
      LegalApiService.getMe()
        .then((user) => {
          setCurrentUser(user);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(() => {});
    }
  }, []);

  // 2. Fetch saved consultations when user is authenticated
  useEffect(() => {
    if (currentUser) {
      LegalApiService.getConsultations()
        .then(setConsultations)
        .catch(() => {});
    } else {
      setConsultations([]);
    }
  }, [currentUser]);

  // Send Chat Message
  const handleSendMessage = async (text) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setActiveReport(null); // Invalidate cached report

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await LegalApiService.sendChatMessage({
        message: text,
        representing_side: representingSide,
        case_context: caseContext,
        conversation_history: history,
      });

      // Update precedents pool with real retrieved authorities
      if (res.retrieved_precedents) {
        setPrecedentsPool((prev) => {
          const next = { ...prev };
          res.retrieved_precedents.forEach((p) => {
            const key = `${p.case_name}_${p.year}`;
            if (!next[key] || p.similarity_score > next[key].similarity_score) {
              next[key] = p;
            }
          });
          return next;
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          citations: res.citations || [],
        },
      ]);
    } catch (err) {
      console.error("Chat consultation error:", err);
      const errorMsg =
        err.response?.data?.detail ||
        "The Supreme Court precedent engine is currently processing high-volume requests or timed out. Please retry your instruction.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMsg,
          isError: true,
          retryPrompt: text,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Case File (PDF / TXT)
  const handleUploadFile = async (file) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveFile(file);
    setIsUploading(true);
    setActiveReport(null); // Invalidate cached report

    const formData = new FormData();
    formData.append("case_file", file);
    formData.append("representing_side", representingSide);
    if (caseContext) {
      formData.append("case_description", caseContext);
    }

    try {
      const res = await LegalApiService.analyzeCaseFile(formData);

      if (res.executive_brief) {
        setCaseContext(res.executive_brief.summary_of_facts);
        setStatutes(res.executive_brief.applicable_statutes || []);
      }

      // Save last analysis result so report generation doesn't re-run slow duplicate LLM calls
      setLastAnalysisResult({
        executive_brief: res.executive_brief,
        arguments: res.arguments,
      });

      if (res.arguments) {
        res.arguments.forEach((arg) => {
          if (arg.supporting_precedents) {
            setPrecedentsPool((prev) => {
              const next = { ...prev };
              arg.supporting_precedents.forEach((p) => {
                const key = `${p.case_name}_${p.year}`;
                next[key] = p;
              });
              return next;
            });
          }
        });
      }

      // Render full analysis: executive brief AND all formulated court arguments
      let argumentContent = "";
      if (res.arguments && res.arguments.length > 0) {
        argumentContent =
          "\n\n### Court-Ready Strategic Arguments Formulated:\n\n" +
          res.arguments
            .map(
              (a) =>
                `**Argument #${a.argument_number}: ${a.title}**\n\n` +
                `${a.detailed_reasoning}\n\n` +
                (a.supporting_precedents?.length
                  ? `*Supporting Authorities:* ${a.supporting_precedents
                      .map((p) => `${p.case_name} (${p.year})`)
                      .join("; ")}\n\n`
                  : "") +
                `*Anticipated Objection:* ${a.anticipated_counter_argument}\n\n` +
                `*Strategic Court Rebuttal:* ${a.rebuttal}`
            )
            .join("\n\n---\n\n");
      }

      const assistantMsg =
        `**Case Document Uploaded & Analyzed:** \`${file.name}\`\n\n` +
        `**Executive Factual Summary:**\n${res.executive_brief.summary_of_facts}\n\n` +
        `**Key Legal Questions Formulated:**\n${res.executive_brief.key_legal_issues.map((i) => `• ${i}`).join("\n")}` +
        argumentContent;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMsg,
        },
      ]);
    } catch (err) {
      console.error("Upload error:", err);
      const detail = err.response?.data?.detail || "Failed to analyze document. Please check the file and try again.";
      alert(detail);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setActiveFile(null);
  };

  const handleResetSession = () => {
    if (window.confirm("Start a new consultation session? Current chat and context will be cleared.")) {
      setMessages([
        {
          role: "assistant",
          content:
            "Welcome Counsel. Ready for a new case consultation. State your facts or upload a document to begin.",
        },
      ]);
      setCaseContext("");
      setActiveFile(null);
      setStatutes([]);
      setPrecedentsPool({});
      setActiveReport(null);
      setLastAnalysisResult(null);
      setActiveSessionId("current");
    }
  };

  // Generate Formal Strategy Report (shows loading spinner while generating)
  const handleOpenReportModal = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsReportModalOpen(true);

    if (!activeReport) {
      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const rep = await LegalApiService.generateReport({
          representing_side: representingSide,
          case_context: caseContext,
          conversation_history: history,
          executive_brief: lastAnalysisResult?.executive_brief,
          arguments: lastAnalysisResult?.arguments,
        });

        if (rep) setActiveReport(rep);
      } catch (err) {
        console.error("Report generation error:", err);
        alert("Failed to synthesize report. Please ensure sufficient case facts or chat turns exist.");
        setIsReportModalOpen(false);
      }
    }
  };

  // Quick PDF Export (passes pre-calculated brief & arguments if available)
  const handleQuickExportPdf = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsExportingPdf(true);
    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await LegalApiService.downloadReportPdf({
        representing_side: representingSide,
        case_context: caseContext,
        conversation_history: history,
        executive_brief: activeReport?.executive_brief || lastAnalysisResult?.executive_brief,
        arguments: activeReport?.arguments || lastAnalysisResult?.arguments,
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Failed to generate PDF report.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSelectScenario = (promptText) => {
    setActiveView("chamber");
    handleSendMessage(promptText);
  };

  const handleSelectSavedConsultation = (consultation) => {
    setActiveSessionId(consultation.id);
    setCaseContext(consultation.case_context || "");
    if (consultation.representing_side) {
      setRepresentingSide(consultation.representing_side);
    }
    if (consultation.messages && consultation.messages.length > 0) {
      setMessages(consultation.messages);
    }
    setActiveReport(null);
  };

  const handleDeleteConsultation = async (id) => {
    if (window.confirm("Permanently delete this saved consultation session?")) {
      try {
        await LegalApiService.deleteConsultation(id);
        setConsultations((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error("Delete consultation error:", err);
      }
    }
  };

  const handleLogout = async () => {
    await LegalApiService.logout();
    setCurrentUser(null);
    setConsultations([]);
  };

  return (
    <div
      className={`w-screen bg-black text-white selection:bg-white selection:text-black ${
        activeView === "chamber"
          ? "h-screen overflow-hidden flex flex-col"
          : "min-h-screen flex flex-col"
      }`}
    >
      {/* Skiper10 Double Stairs Intro Preloader */}
      <AnimatePresence mode="wait">
        {showPreloader && (
          <Skiper10 onComplete={() => setShowPreloader(false)} />
        )}
      </AnimatePresence>

      {/* Main Content: Landing Mode OR Chamber Mode */}
      {activeView === "landing" ? (
        <>
          <ModoNavbar
            activeView={activeView}
            setActiveView={setActiveView}
          />
          <main className="flex-1 flex flex-col bg-black">
            {/* Gallery Hero */}
            <ScrollRevealWrapper variant="fade-up" threshold={0.05}>
              <LandingHero
                onEnterChamber={() => setActiveView("chamber")}
                onExploreCorpus={() => {
                  const el = document.getElementById("features") || document.getElementById("architecture");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </ScrollRevealWrapper>

            {/* Features: Building Technology */}
            <ScrollRevealWrapper variant="cinematic" threshold={0.05}>
              <LandingExhibition
                onOpenChamber={() => setActiveView("chamber")}
              />
            </ScrollRevealWrapper>

            {/* Precedent Exhibits Showcase / Tech Stack */}
            <ScrollRevealWrapper variant="card-depth" threshold={0.05}>
              <LandingPrecedentsShowcase
                onSelectScenario={handleSelectScenario}
              />
            </ScrollRevealWrapper>

            {/* Monolithic Colophon Footer */}
            <ScrollRevealWrapper variant="fade-up" threshold={0.05}>
              <LandingFooter
                onEnterChamber={() => setActiveView("chamber")}
              />
            </ScrollRevealWrapper>
          </main>
        </>
      ) : (
        /* Streamlined Minimalist AI Chamber (Center-Focused App Shell) */
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-black text-white">
          <ChamberHeader
            isSidebarOpen={isChamberSidebarOpen}
            onToggleSidebar={() => setIsChamberSidebarOpen((prev) => !prev)}
            onOpenReportModal={handleOpenReportModal}
            onReturnToLanding={() => setActiveView("landing")}
            representingSide={representingSide}
            setRepresentingSide={(side) => {
              setRepresentingSide(side);
              setActiveReport(null);
            }}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />
          <div className="flex-1 flex overflow-hidden min-h-0 w-full h-full relative">
            <ChamberSidebar
              isOpen={isChamberSidebarOpen}
              onToggle={() => setIsChamberSidebarOpen(false)}
              onNewSession={handleResetSession}
              onSelectSession={handleSelectSavedConsultation}
              activeSessionId={activeSessionId}
              onReturnToLanding={() => setActiveView("landing")}
              caseContext={caseContext}
              setCaseContext={(ctx) => {
                setCaseContext(ctx);
                setActiveReport(null);
              }}
              statutes={statutes}
              precedentsPool={precedentsPool}
              onInspectPrecedent={(p) => setInspectPrecedent(p)}
              consultations={consultations}
              onDeleteConsultation={handleDeleteConsultation}
            />
            <ChamberChat
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeFile={activeFile}
              onUploadFile={handleUploadFile}
              onRemoveFile={handleRemoveFile}
              isUploading={isUploading}
              onInspectPrecedent={(p) => setInspectPrecedent(p)}
              onRetry={(prompt) => handleSendMessage(prompt)}
              currentUser={currentUser}
              onRequireAuth={() => setIsAuthModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Full Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={activeReport}
        onDownloadPdf={handleQuickExportPdf}
        isDownloadingPdf={isExportingPdf}
      />

      {/* Precedent Chunk Inspector Modal */}
      <ChunkModal
        isOpen={!!inspectPrecedent}
        onClose={() => setInspectPrecedent(null)}
        precedent={inspectPrecedent}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}
