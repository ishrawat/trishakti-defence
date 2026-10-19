import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function RichText({ content, className = "" }: { content: string, className?: string }) {
  if (!content) return null;
  
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Style images to fit the layout nicely
          img: ({ node, ...props }) => <img {...props} className="max-h-64 object-contain my-2 rounded border border-gray-200" alt={props.alt || 'Question Image'} />,
          // Ensure paragraphs don't have weird margins inside our custom layouts
          p: ({ node, ...props }) => <p {...props} className="mb-0" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}