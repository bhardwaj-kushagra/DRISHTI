import { useState } from "react";
import { addComment, getComments } from "../lib/mockApi";

export default function CommentsPanel({ findingId }) {
  const [items, setItems] = useState(getComments(findingId));
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    const updated = addComment({ findingId, author: "Analyst_01", text });
    setItems(updated);
    setText("");
  };

  return (
    <div>
      <h4 className="text-slate-200 font-semibold mb-1">Comments & Assignments</h4>
      <div className="space-y-2 mb-2">
        {items.length === 0 ? <p className="text-xs text-slate-400">No comments yet.</p> :
          items.map(c => (
            <div key={c.id} className="text-xs text-slate-200">
              <span className="text-slate-400">{c.author}</span>: {c.text}
              <span className="text-slate-500"> • {new Date(c.ts).toLocaleString()}</span>
            </div>
          ))
        }
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Add a note or @mention" className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs" />
        <button onClick={submit} className="btn-primary px-3 py-1 text-xs">Add</button>
      </div>
    </div>
  );
}
