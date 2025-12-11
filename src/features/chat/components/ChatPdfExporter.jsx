import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { apiClient } from '../../../shared/api/client';

const ChatPdfExporter = ({ sessionId, className, children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const generatePDF = async () => {
    if (!sessionId) {
      console.error("No session ID provided for PDF export");
      return;
    }

    try {
      setIsLoading(true);

      const response = await apiClient.get(`/sessions/${sessionId}/`);
      const chatData = response.data;

      // --- LOGIC: MODEL NAMES & HEADER ---
      const mode = chatData.session?.mode || "direct";
      const modelA = chatData.session?.model_a;
      const modelB = chatData.session?.model_b;

      let headerModelText = "Unknown Model";

      if (mode === "direct") {
        headerModelText = modelA?.display_name || "Unknown Model";
      } else {
        const nameA = modelA?.display_name || "Model A";
        const nameB = modelB?.display_name || "Model B";
        headerModelText = `${nameA} vs ${nameB}`;
      }

      // --- SETUP PDF CONTAINER ---
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.top = "-9999px";
      container.style.left = "0";
      container.style.width = "210mm";
      container.style.padding = "20mm";
      container.style.backgroundColor = "#ffffff";
      container.style.fontFamily = "'Noto Sans', sans-serif";
      container.style.boxSizing = "border-box";

      const INDIC_ARENA_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACx0lEQVR4AexZS3LbMAwF1RmpPUDdHic9Spdd23sne3vdZY8SH6d1D5DYMzGDxzFlRiJIkbJkZSLPYASDj8B7oEzrU9A7/3xcAU+r73fH5bfHw3KhQwYMsEMtdPYKfNJ6rUnfxYgBA2wMlzueLSClIESk4FOw2QJelHpQpHYpxYbAZgv4svm7K7f/flTbvfLZEGR9ObMF+JLdIjYLuEXX3ZqdVgD7OPZzWGjPd8fcIvDdsai/Wtwf2DAvZlEBIF3o0yO2Qlgs4VXGNa2JDbUp8gkKQILRSHuIojY4eIbqkCgAS4gENfJGDjjgFJbKiwJaExQ9nFQh7vu+/4LcGHEtt37oUkQWwOegm6Ta7O/x5+XGhvJPVOy65i66AsfENRuF00iqP0kBEllffBbg68qYsd4rcFx9/XlcLp6NsR8jn4qP5UsQIKTS6rcmqmDEvoC6hBkDLKwT/jLT69UCbGfsdYoX7QkaIue4659DrYOLcf0WsBGwvJorXQtAN1ISNvKP9tVw5FW0BS8CbOSdHS8ClP6liA5T5284MlfLsxZQbv7/Kbf7z/b6xQJiR5PwDHL9c6h1cDGu3wI2ApYXOIKrHa4F2EDykbsBIjBiPzqfMcDCOuEjCXsLQDdMV3j14EfqETAp+Fi+3gJiBYYenwUM3eFY/nkFYh1KHcf9L+7H38xr3GK6Y71W4MjvB2D2OuUaRzzCIU1rl2TIzxJgusQvNnCrBwsV6Dum+Ak47selPMkCsLymS1LGK8ZBvuQn4KGUSQJAnhKWN1RYGgNpGB7hxMgjR2cBInn+gVXCO4KceMkdhzWfTICszzoL8HYe5Pl5kS/xWLHuApqMJkAelEQBOA8B8NpEyIObKAAv8QBoWRfyrUnDBUQB5kfEZO1K4IidIbQnD0dTziwKwBSQxY5Q8S5T8u5gRGFgQhYUMCGeIpVZgNiakQZeAQAA//8xWsSjAAAABklEQVQDACljznAktXVfAAAAAElFTkSuQmCC";

      const sessionTitle = chatData.session?.title || "Untitled Session";
      const dateStr = chatData.session?.created_at ? new Date(chatData.session.created_at).toLocaleDateString() : "-";
      const modeDisplay = mode.charAt(0).toUpperCase() + mode.slice(1);

      let htmlContent = `
        <div style="border-bottom: 2px solid #e6e6e6; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${INDIC_ARENA_LOGO}" width="40" height="40" />
            <h1 style="font-size: 24px; color: #14191e; margin: 0; font-weight: bold;">Indic LLM Arena</h1>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin: 0 0 5px 0; color: #000;">${sessionTitle}</h2>
          <p style="font-size: 12px; color: #666; margin: 0;">
            Models: <strong>${headerModelText}</strong> | Mode: ${modeDisplay} | Date: ${dateStr}
          </p>
        </div>
      `;

      if (chatData?.messages) {
        chatData.messages.forEach(msg => {
          const isUser = msg.role === 'user';
          let label = "Unknown";

          if (isUser) {
            label = "You";
          } else {
            if (mode === 'direct') {
              label = modelA?.display_name || "AI Model";
            } else {
              if (msg.participant === 'a' || msg.participant === 'model_a') {
                label = modelA?.display_name || "Model A";
              } else if (msg.participant === 'b' || msg.participant === 'model_b') {
                label = modelB?.display_name || "Model B";
              } else {
                label = "AI Model";
              }
            }
          }

          const align = isUser ? 'margin-left: auto;' : 'margin-right: auto;';
          const bg = isUser ? '#E6F2FF' : '#F5F5F5';

          // --- LOGIC: PARSE <think> TAGS ---
          const rawContent = msg.content || "";

          // Split content by the think tags, capturing the tags themselves so we don't lose them
          // Regex breakdown: Match <think>... content ...</think> spanning multiple lines
          const parts = rawContent.split(/(<think>[\s\S]*?<\/think>)/g);

          let messageContentHtml = '';

          // Helper to create the div blocks (needed for page breaking logic)
          const createBlocks = (text, isThinking) => {
            const lines = text.split('\n').filter(line => line.trim() !== '');

            // Custom styles for thinking blocks
            const thinkStyles = isThinking
              ? `font-style: italic; background-color: rgba(255, 255, 255, 0.6); padding: 2px 4px; border-radius: 4px; color: #555;`
              : ``;

            return lines.map(line =>
              `<div class="pdf-text-block" style="margin-bottom: 4px; ${thinkStyles}">${line}</div>`
            ).join('');
          };

          parts.forEach(part => {
            if (part.startsWith("<think>")) {
              // This is a thinking block: remove tags and style it
              const content = part.replace(/<\/?think>/g, '');
              messageContentHtml += createBlocks(content, true);
            } else {
              // Normal text
              messageContentHtml += createBlocks(part, false);
            }
          });

          if (!messageContentHtml) {
            messageContentHtml = `<div class="pdf-text-block"></div>`;
          }

          htmlContent += `
            <div style="
              width: fit-content;
              max-width: 75%;
              padding: 12px 16px;
              border-radius: 8px;
              background-color: ${bg};
              margin-bottom: 15px;
              ${align}
            ">
              <div style="font-size: 10px; color: #888; margin-bottom: 4px; font-weight: bold;">${label}</div>
              <div style="font-size: 12px; color: #000; line-height: 1.5; white-space: pre-wrap;">${messageContentHtml}</div>
            </div>
          `;
        });
      }

      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      // --- PAGE BREAK CALCULATIONS ---
      const pdfPageWidthPx = container.offsetWidth;
      const pdfPageHeightPx = (pdfPageWidthPx * 297) / 210;
      const pageTopPaddingPx = (20 * pdfPageWidthPx) / 210;

      const textBlocks = Array.from(container.querySelectorAll('.pdf-text-block'));

      for (const element of textBlocks) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const offsetTop = rect.top - containerRect.top;
        const offsetHeight = rect.height;
        const offsetBottom = offsetTop + offsetHeight;

        const startPage = Math.floor(offsetTop / pdfPageHeightPx);
        const endPage = Math.floor(offsetBottom / pdfPageHeightPx);

        if (startPage !== endPage) {
          const nextPageStartPx = (startPage + 1) * pdfPageHeightPx;
          const shiftAmount = (nextPageStartPx + pageTopPaddingPx) - offsetTop;

          if (shiftAmount > 0) {
            element.style.marginTop = `${shiftAmount}px`;
          }
        }
      }

      // --- GENERATE IMAGE & PDF ---
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgProps = doc.getImageProperties(imgData);
      const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfImgHeight;
      let position = 0;

      doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfImgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfImgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = chatData?.session?.title
        ? `${chatData.session.title.replace(/\s+/g, '_')}.pdf`
        : 'chat_transcript.pdf';
      doc.save(filename);
      document.body.removeChild(container);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to export chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading) generatePDF();
      }}
      disabled={isLoading}
      className={className || "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {children ? children : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isLoading ? "Exporting..." : "Download Chat PDF"}
        </>
      )}
    </button>
  );
};

export default ChatPdfExporter;