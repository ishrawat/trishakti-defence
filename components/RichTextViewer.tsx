"use client";
import { Viewer } from "react-latex-editor";
import "react-latex-editor/styles";

export default function RichTextViewer({ content, className = "" }: { content: string, className?: string }) {
  if (!content) return null;
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <Viewer content={String(content)} />
    </div>
  );
}