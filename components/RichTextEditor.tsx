"use client";
import { Editor } from "react-latex-editor";
import "react-latex-editor/styles";

export default function RichTextEditor({ value, onChange, placeholder = "Write question or equation..." }: { value: string, onChange: (html: string) => void, placeholder?: string }) {
  return (
    <div className="border border-gray-300 rounded overflow-hidden bg-white">
      <Editor 
        initialContent={value || "<p></p>"} 
        onChange={onChange} 
        placeholder={placeholder} 
        minHeight="120px"
      />
    </div>
  );
}