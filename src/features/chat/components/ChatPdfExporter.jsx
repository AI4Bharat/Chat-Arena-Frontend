import React, { useState } from 'react';
import { jsPDF } from "jspdf";
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

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxLineWidth = 140;
      const lineHeight = 7;
      let yPos = 20;

      const INDIC_ARENA_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACx0lEQVR4AexZS3LbMAwF1RmpPUDdHic9Spdd23sne3vdZY8SH6d1D5DYMzGDxzFlRiJIkbJkZSLPYASDj8B7oEzrU9A7/3xcAU+r73fH5bfHw3KhQwYMsEMtdPYKfNJ6rUnfxYgBA2wMlzueLSClIESk4FOw2QJelHpQpHYpxYbAZgv4svm7K7f/flTbvfLZEGR9ObMF+JLdIjYLuEXX3ZqdVgD7OPZzWGjPd8fcIvDdsai/Wtwf2DAvZlEBIF3o0yO2Qlgs4VXGNa2JDbUp8gkKQILRSHuIojY4eIbqkCgAS4gENfJGDjjgFJbKiwJaExQ9nFQh7vu+/4LcGHEtt37oUkQWwOegm6Ta7O/x5+XGhvJPVOy65i66AsfENRuF00iqP0kBEllffBbg68qYsd4rcFx9/XlcLp6NsR8jn4qP5UsQIKTS6rcmqmDEvoC6hBkDLKwT/jLT69UCbGfsdYoX7QkaIue4659DrYOLcf0WsBGwvJorXQtAN1ISNvKP9tVw5FW0BS8CbOSdHS8ClP6liA5T5284MlfLsxZQbv7/Kbf7z/b6xQJiR5PwDHL9c6h1cDGu3wI2ApYXOIKrHa4F2EDykbsBIjBiPzqfMcDCOuEjCXsLQDdMV3j14EfqETAp+Fi+3gJiBYYenwUM3eFY/nkFYh1KHcf9L+7H38xr3GK6Y71W4MjvB2D2OuUaRzzCIU1rl2TIzxJgusQvNnCrBwsV6Dum+Ak47selPMkCsLymS1LGK8ZBvuQn4KGUSQJAnhKWN1RYGgNpGB7hxMgjR2cBInn+gVXCO4KceMkdhzWfTICszzoL8HYe5Pl5kS/xWLHuApqMJkAelEQBOA8B8NpEyIObKAAv8QBoWRfyrUnDBUQB5kfEZO1K4IidIbQnD0dTziwKwBSQxY5Q8S5T8u5gRGFgQhYUMCGeIpVZgNiakQZeAQAA//8xWsSjAAAABklEQVQDACljznAktXVfAAAAAElFTkSuQmCC"

      const logoSize = 10; 
      doc.addImage(
      INDIC_ARENA_LOGO,  
      "PNG",             
      margin,            
      15,                
      logoSize,          
      logoSize           
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 25, 30); 
      doc.text("Indic LLM Arena", margin + 15, 22);

      doc.setDrawColor(230, 230, 230);
      doc.line(margin, 30, pageWidth - margin, 30);

      yPos = 45;
      if (chatData?.session) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(chatData.session.title || "Untitled Session", margin, yPos);
        
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const modelName = chatData.session.model_a?.display_name || "Unknown Model";
        const dateStr = chatData.session.created_at ? new Date(chatData.session.created_at).toLocaleDateString() : "Unknown Date";
        doc.text(`Model: ${modelName} | Date: ${dateStr}`, margin, yPos);
      }
      
      yPos += 15; 

      if (chatData?.messages) {
        chatData.messages.forEach((msg) => {
          const isUser = msg.role === "user";
          const content = msg.content || "";

          doc.setFontSize(11);
          
          const textLines = doc.splitTextToSize(content, maxLineWidth);
          const bubbleHeight = (textLines.length * lineHeight) + 10;

          if (yPos + bubbleHeight > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          if (isUser) {
            const bubbleX = pageWidth - margin - maxLineWidth;
            doc.setFillColor(230, 242, 255); 
            doc.setDrawColor(230, 242, 255);
            doc.roundedRect(bubbleX - 5, yPos - 5, maxLineWidth + 5, bubbleHeight, 3, 3, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.text(textLines, bubbleX, yPos + 2);
            
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("You", bubbleX, yPos - 7);
          } else {
            const bubbleX = margin;
            doc.setFillColor(245, 245, 245); 
            doc.setDrawColor(245, 245, 245);
            doc.roundedRect(bubbleX - 5, yPos - 5, maxLineWidth + 5, bubbleHeight, 3, 3, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.text(textLines, bubbleX, yPos + 2);

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("AI Model", bubbleX, yPos - 7);
          }
          yPos += bubbleHeight + 15;
        });
      }

      const filename = chatData?.session?.title 
        ? `${chatData.session.title.replace(/\s+/g, '_')}.pdf` 
        : 'chat_transcript.pdf';
      doc.save(filename);

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
        if (!isLoading) {
          generatePDF();
        }
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